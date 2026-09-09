/**
 * preview.js — Book preview image routes (Cloudflare R2)
 *
 * POST /api/books/:slug/preview-images
 *   Body: { images: [{ index: 1, data: 'data:image/jpeg;base64,...', ext: 'jpg' }, ...] }
 *   → uploads up to 6 images to R2 at previews/<slug>/p1.jpg … p6.jpg
 *   → saves the public URLs array back into the book's DB record
 *   → returns { ok: true, urls: [...] }
 *
 * DELETE /api/books/:slug/preview-images
 *   → deletes all previews/<slug>/p*.jpg objects from R2
 *   → clears book.previewImages in DB
 *   → returns { ok: true }
 *
 * Images are stored with public-read ACL so the modal can load them
 * directly from R2's CDN without hitting the server.
 * Env vars required (shared with download.js):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *   R2_PUBLIC_URL   e.g. https://pub-<hash>.r2.dev
 */
'use strict';

const router = require('express').Router();
const { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { pool } = require('./db');

/* ── R2 client (S3-compatible, shared config) ────────────────── */
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET     = process.env.R2_BUCKET_NAME || 'shukto-pdfs';
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const MAX_IMAGES = 6;

/* ── Session guard (inline — avoids circular require) ────────── */
async function requireSession(req, res, next) {
  const token = req.cookies?.sp_session;
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    const result = await pool.query(
      'SELECT admin_id FROM sessions WHERE token = $1 AND expires_at > now()',
      [token]
    );
    if (result.rowCount === 0) return res.status(401).json({ error: 'Unauthorised' });
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

/* ── Slug validator ──────────────────────────────────────────── */
function validSlug(s) { return /^[a-z0-9-]+$/.test(s); }

/* ── POST /api/books/:slug/preview-images ────────────────────── */
router.post('/:slug/preview-images', requireSession, async (req, res) => {
  const { slug } = req.params;
  if (!validSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });
  if (!PUBLIC_URL)      return res.status(500).json({ error: 'R2_PUBLIC_URL env var not set' });

  const { images } = req.body || {};
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'images array required' });
  }
  if (images.length > MAX_IMAGES) {
    return res.status(400).json({ error: `Maximum ${MAX_IMAGES} preview images allowed` });
  }

  const uploadedUrls = [];

  for (const img of images) {
    const idx = parseInt(img.index, 10);
    if (!idx || idx < 1 || idx > MAX_IMAGES) continue;

    // Strip the data URL header: "data:image/jpeg;base64,..."
    const match = (img.data || '').match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) continue;

    const contentType = match[1];                     // e.g. image/jpeg
    const buffer      = Buffer.from(match[2], 'base64');
    const ext         = (img.ext || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
    const key         = `previews/${slug}/p${idx}.${ext}`;

    try {
      await r2.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
      }));
      uploadedUrls.push({ index: idx, url: `${PUBLIC_URL}/${key}` });
    } catch (err) {
      console.error(`[preview] R2 upload error for ${key}:`, err.message);
      return res.status(500).json({ error: `Upload failed for image ${idx}` });
    }
  }

  // Sort by index and save URLs to the book record in the DB
  uploadedUrls.sort((a, b) => a.index - b.index);
  const urls = uploadedUrls.map(u => u.url);

  try {
    await pool.query(
      `UPDATE books
       SET data = jsonb_set(data, '{previewImages}', $1::jsonb, true),
           updated_at = now()
       WHERE slug = $2 OR id = $2`,
      [JSON.stringify(urls), slug]
    );
  } catch (err) {
    console.error('[preview] DB update error:', err.message);
    // Images uploaded to R2 successfully — don't fail the whole request
  }

  res.json({ ok: true, urls });
});

/* ── DELETE /api/books/:slug/preview-images ──────────────────── */
router.delete('/:slug/preview-images', requireSession, async (req, res) => {
  const { slug } = req.params;
  if (!validSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });

  try {
    // List all objects under previews/<slug>/
    const listed = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `previews/${slug}/`,
    }));

    if (listed.Contents && listed.Contents.length > 0) {
      await r2.send(new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: listed.Contents.map(o => ({ Key: o.Key })),
          Quiet:   true,
        },
      }));
    }
  } catch (err) {
    console.error('[preview] R2 delete error:', err.message);
    return res.status(500).json({ error: 'R2 delete failed' });
  }

  // Clear URLs from DB
  try {
    await pool.query(
      `UPDATE books
       SET data = data - 'previewImages',
           updated_at = now()
       WHERE slug = $1 OR id = $1`,
      [slug]
    );
  } catch (err) {
    console.error('[preview] DB clear error:', err.message);
  }

  res.json({ ok: true });
});

module.exports = router;
