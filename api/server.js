/**
 * server.js — Shukto Press main Express server
 *
 * Replaces `serve .` — serves the static site AND adds:
 *   - Auth API  (/api/auth/*)
 *   - Protected /admin route (requires valid session cookie)
 *   - Public /login route
 */
'use strict';

const path        = require('path');
const express     = require('express');
const cookieParser = require('cookie-parser');
const { migrate, seedAdmin, cleanSessions, pool } = require('./db');
const { seedData } = require('./seed');
const authRouter     = require('./auth');
const dataRouter     = require('./data');
const downloadRouter = require('./download');
const webhookRouter  = require('./webhook');

const app  = express();
const ROOT = path.join(__dirname, '..'); // project root (where index.html lives)

/* ── Middleware ──────────────────────────────────────────────── */
app.use(express.json({ limit: '50mb' }));   // large base64 images in book data
app.use(cookieParser());

/* ── Razorpay Webhook (raw body — must come BEFORE express.json parses it) ── */
app.use('/api/webhook', webhookRouter);

/* ── Auth API ────────────────────────────────────────────────── */
app.use('/api/auth', authRouter);

/* ── Data API ────────────────────────────────────────────────── */
app.use('/api', dataRouter);

/* ── Download API (R2 signed URLs) ──────────────────────────── */
app.use('/api/download', downloadRouter);

/* ── Session guard middleware ────────────────────────────────── */
async function requireSession(req, res, next) {
  const token = req.cookies?.sp_session;
  if (!token) return res.redirect('/login');

  try {
    const result = await pool.query(
      'SELECT admin_id FROM sessions WHERE token = $1 AND expires_at > now()',
      [token]
    );
    if (result.rowCount === 0) {
      res.clearCookie('sp_session', { path: '/' });
      return res.redirect('/login');
    }
    next();
  } catch (err) {
    console.error('[server] session check error:', err);
    return res.redirect('/login');
  }
}

/* ── Protected /admin route ──────────────────────────────────── */
app.get('/admin', requireSession, (req, res) => {
  res.sendFile(path.join(ROOT, 'admin.html'));
});

/* ── Public /login route ─────────────────────────────────────── */
app.get('/login', (req, res) => {
  res.sendFile(path.join(ROOT, 'login.html'));
});

/* ── Static assets ───────────────────────────────────────────── */
// Serve everything EXCEPT admin.html directly (it's behind /admin guard above)
app.use(express.static(ROOT, {
  index: 'index.html',
  // Block direct access to admin.html by filename
  setHeaders(res, filePath) {
    if (path.basename(filePath) === 'admin.html') {
      res.status(403).end('Forbidden');
    }
  }
}));

/* ── SPA fallback — serve index.html for unknown paths ──────── */
app.use((req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

/* ── Boot ────────────────────────────────────────────────────── */
async function boot() {
  try {
    await migrate();
    await seedAdmin();
    await seedData();
    await cleanSessions();
  } catch (err) {
    console.error('[server] boot error:', err);
    process.exit(1);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[server] Shukto Press running on port ${PORT}`);
  });
}

boot();
