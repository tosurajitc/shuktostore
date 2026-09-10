/**
 * download.js — Cloudflare R2 signed URL route
 *
 * GET /api/download/:slug
 *   → looks up the R2 file key for this book slug
 *   → generates a pre-signed S3-compatible URL (expires in 1 hour)
 *   → redirects the browser to it — file downloads directly from R2
 *
 * The signed URL expires after 1 hour — sharing it is useless after that.
 * The actual PDF never passes through our server — R2 serves it directly.
 */
'use strict';

const router = require('express').Router();
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { pool } = require('./db');

/* ── R2 client (S3-compatible) ───────────────────────────────── */
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET      = process.env.R2_BUCKET_NAME || 'shukto-pdfs';
const EXPIRES_SEC = 60 * 60; // 1 hour

/* ── R2 file key map — slug → filename in R2 bucket ─────────── */
const R2_FILE_MAP = {
  'one-person-company':   'The One Person Company.pdf',
  'money-sorted':         'Money_Sorted.pdf',
  'ai-with-sayuj':        'AI_Handbook_for_Kids.pdf',
  'ai-handbook-for-kids': 'AI_Handbook_for_Kids.pdf',
  // AI Agency Ops Pack — delivered as a ZIP containing all 4 HTML templates
  'ai-agency-ops-pack':               'AI_Agency_Ops_Pack.zip',
  // Individual templates (sold separately)
  'onboarding-template':              'AI_Agency_Ops_Pack.zip',
  'prompt-library-template':          'AI_Agency_Ops_Pack.zip',
  'automation-tracker-template':      'AI_Agency_Ops_Pack.zip',
  'project-dashboard-template':       'AI_Agency_Ops_Pack.zip',
};

/* ── GET /api/download/:slug ─────────────────────────────────── */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  /* Check if slug is valid — look up in DB first, then fallback to map */
  let fileKey = R2_FILE_MAP[slug];

  if (!fileKey) {
    /* Try to find r2FileKey stored in book data */
    try {
      const result = await pool.query(
        "SELECT data->>'r2FileKey' AS file_key FROM books WHERE slug = $1 OR id = $1",
        [slug]
      );
      if (result.rowCount > 0 && result.rows[0].file_key) {
        fileKey = result.rows[0].file_key;
      }
    } catch (err) {
      console.error('[download] DB lookup error:', err.message);
    }
  }

  if (!fileKey) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key:    fileKey,
    });

    const signedUrl = await getSignedUrl(r2, command, { expiresIn: EXPIRES_SEC });

    /* Return URL as JSON — frontend sets it on the <a> tag directly */
    return res.json({ url: signedUrl, filename: fileKey });

  } catch (err) {
    console.error('[download] R2 signed URL error:', err.message);
    return res.status(500).json({ error: 'Could not generate download link. Please try again.' });
  }
});

module.exports = router;
