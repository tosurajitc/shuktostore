/**
 * data.js — Public read + admin write routes for books, settings, homepage.
 *
 * Public (no auth):
 *   GET  /api/books                  → all books ordered by sort_order
 *   GET  /api/settings               → publisher settings
 *   GET  /api/homepage               → homepage copy
 *
 * Admin (requires valid session cookie):
 *   POST /api/books                  → upsert a single book  { book: {...} }
 *   POST /api/books/write-files      → write index.html + thank-you.html for a book { slug, salesHtml, thanksHtml }
 *   DELETE /api/books/:id            → delete a book from DB
 *   DELETE /api/books/:id/files      → delete books/<slug>/ folder from disk
 *   POST /api/settings               → save settings         { settings: {...} }
 *   POST /api/homepage               → save homepage data    { homepage: {...} }
 *   POST /api/books/reorder          → save sort order       { ids: [...] }
 */
'use strict';

const path   = require('path');
const fs     = require('fs');
const https  = require('https');
const router   = require('express').Router();
const { pool } = require('./db');

const BOOKS_DIR = path.join(__dirname, '..', 'books');

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

/* ════════════════════════════════════════════════════════════════
   PUBLIC READ ROUTES
════════════════════════════════════════════════════════════════ */

/* GET /api/geo — returns { country: 'IN' } (ISO 3166-1 alpha-2).
   Checks Cloudflare CF-IPCountry header first (available on Railway +
   Cloudflare proxy), then falls back to ip-api.com.                 */
router.get('/geo', (req, res) => {
  // Cloudflare sets this header automatically when proxied
  const cfCountry = req.headers['cf-ipcountry'];
  if (cfCountry && cfCountry !== 'XX') {
    return res.json({ country: cfCountry.toUpperCase() });
  }

  // Fallback: free ip-api.com (no key required, 45 req/min)
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0].trim();

  // For local dev (loopback IPs) just return IN so prices look normal
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) {
    return res.json({ country: 'IN' });
  }

  const url = `https://ip-api.com/json/${ip}?fields=countryCode`;
  https.get(url, apiRes => {
    let body = '';
    apiRes.on('data', chunk => { body += chunk; });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        res.json({ country: (parsed.countryCode || 'IN').toUpperCase() });
      } catch {
        res.json({ country: 'IN' });
      }
    });
  }).on('error', () => {
    res.json({ country: 'IN' });
  });
});

/* GET /api/books */
router.get('/books', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT data FROM books ORDER BY sort_order ASC, created_at ASC'
    );
    const books = result.rows.map(r => r.data);
    res.json(books);
  } catch (err) {
    console.error('[data] GET /books error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* GET /api/settings */
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM settings WHERE id = 1');
    res.json(result.rows[0]?.data || {});
  } catch (err) {
    console.error('[data] GET /settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* GET /api/homepage */
router.get('/homepage', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM homepage WHERE id = 1');
    res.json(result.rows[0]?.data || {});
  } catch (err) {
    console.error('[data] GET /homepage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ════════════════════════════════════════════════════════════════
   ADMIN WRITE ROUTES  (all require valid session cookie)
════════════════════════════════════════════════════════════════ */

/* POST /api/books — upsert a single book */
router.post('/books', requireSession, async (req, res) => {
  const { book } = req.body || {};
  if (!book || !book.id) return res.status(400).json({ error: 'book.id required' });

  const slug = book.slug || book.id;
  try {
    // Get current max sort_order for new books
    const maxResult = await pool.query('SELECT MAX(sort_order) as max FROM books');
    const currentSort = await pool.query('SELECT sort_order FROM books WHERE id = $1', [book.id]);
    const sortOrder = currentSort.rowCount > 0
      ? currentSort.rows[0].sort_order
      : (maxResult.rows[0].max ?? -1) + 1;

    await pool.query(
      `INSERT INTO books (id, slug, data, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET slug = $2, data = $3, updated_at = now()`,
      [book.id, slug, JSON.stringify(book), sortOrder]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] POST /books error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/books/write-files — write index.html + thank-you.html to disk */
router.post('/books/write-files', requireSession, async (req, res) => {
  const { slug, salesHtml, thanksHtml } = req.body || {};
  if (!slug || !salesHtml || !thanksHtml) {
    return res.status(400).json({ error: 'slug, salesHtml and thanksHtml required' });
  }
  // Sanitise slug — only allow URL-safe chars
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Invalid slug' });
  }
  try {
    const dir = path.join(BOOKS_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'),     salesHtml,  'utf8');
    fs.writeFileSync(path.join(dir, 'thank-you.html'), thanksHtml, 'utf8');
    console.log(`[data] write-files: wrote books/${slug}/`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] POST /books/write-files error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE /api/books/:id */
router.delete('/books/:id', requireSession, async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] DELETE /books error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE /api/books/:id/files — delete books/<slug>/ folder from disk */
router.delete('/books/:id/files', requireSession, async (req, res) => {
  const id = req.params.id;
  // Sanitise — only allow URL-safe chars
  if (!/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const dir = path.join(BOOKS_DIR, id);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`[data] delete-files: removed books/${id}/`);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] DELETE /books/:id/files error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/books/reorder — { ids: ['slug1','slug2',...] } */
router.post('/books/reorder', requireSession, async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
  try {
    for (let i = 0; i < ids.length; i++) {
      await pool.query(
        'UPDATE books SET sort_order = $1 WHERE id = $2',
        [i, ids[i]]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] POST /books/reorder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/newsletter — public email signup */
router.post('/newsletter', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  try {
    await pool.query(
      `INSERT INTO newsletter_signups (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] POST /newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* GET /api/newsletter — list signups for admins */
router.get('/newsletter', requireSession, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, signed_up_at
       FROM newsletter_signups
       ORDER BY signed_up_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[data] GET /newsletter error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ════════════════════════════════════════════════════════════════
   BUYERS ROUTES  (all require valid session cookie)
════════════════════════════════════════════════════════════════ */

/* GET /api/buyers — list all buyers, newest first */
router.get('/buyers', requireSession, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, phone, book_slug, razorpay_payment_id,
              amount_paise, currency, purchased_at, email_sent
       FROM buyers
       ORDER BY purchased_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[data] GET /buyers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* GET /api/buyers/stats — per-book counts + total revenue */
router.get('/buyers/stats', requireSession, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT book_slug,
              COUNT(*)            AS buyer_count,
              SUM(amount_paise)   AS total_paise
       FROM buyers
       GROUP BY book_slug
       ORDER BY buyer_count DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[data] GET /buyers/stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/settings */
router.post('/settings', requireSession, async (req, res) => {
  const { settings } = req.body || {};
  if (!settings) return res.status(400).json({ error: 'settings required' });
  try {
    await pool.query(
      `INSERT INTO settings (id, data)
       VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [JSON.stringify(settings)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] POST /settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/homepage */
router.post('/homepage', requireSession, async (req, res) => {
  const { homepage } = req.body || {};
  if (!homepage) return res.status(400).json({ error: 'homepage required' });
  try {
    await pool.query(
      `INSERT INTO homepage (id, data)
       VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [JSON.stringify(homepage)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[data] POST /homepage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
