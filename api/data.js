/**
 * data.js — Public read + admin write routes for books, settings, homepage.
 *
 * Public (no auth):
 *   GET  /api/books           → all books ordered by sort_order
 *   GET  /api/settings        → publisher settings
 *   GET  /api/homepage        → homepage copy
 *
 * Admin (requires valid session cookie):
 *   POST /api/books           → upsert a single book  { book: {...} }
 *   DELETE /api/books/:id     → delete a book
 *   POST /api/settings        → save settings         { settings: {...} }
 *   POST /api/homepage        → save homepage data    { homepage: {...} }
 *   POST /api/books/reorder   → save sort order       { ids: [...] }
 */
'use strict';

const router   = require('express').Router();
const { pool } = require('./db');

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
