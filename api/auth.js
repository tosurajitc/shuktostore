/**
 * auth.js — Login / logout / session-check routes
 *
 * POST /api/auth/login   { username, password }  → sets sp_session cookie
 * POST /api/auth/logout                          → clears cookie
 * GET  /api/auth/check                           → 200 OK | 401
 */
'use strict';

const router     = require('express').Router();
const bcrypt     = require('bcrypt');
const crypto     = require('crypto');
const { pool }   = require('./db');

const SESSION_DAYS = 7;

/* ── Helpers ─────────────────────────────────────────────────── */
function cookieOpts(maxAge) {
  return {
    httpOnly: true,                        // not accessible from JS
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,                                // milliseconds
    path: '/',
  };
}

function randomToken() {
  return crypto.randomBytes(48).toString('hex');
}

/* ── POST /api/auth/login ────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, pw_hash FROM admins WHERE username = $1',
      [username.trim().toLowerCase()]
    );

    if (result.rowCount === 0) {
      // Constant-time response to prevent username enumeration
      await bcrypt.compare('dummy', '$2b$12$invalidhashpadding000000000000000000000000000000000000');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.pw_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Create session
    const token     = randomToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO sessions (token, admin_id, expires_at) VALUES ($1, $2, $3)',
      [token, admin.id, expiresAt]
    );

    res.cookie('sp_session', token, cookieOpts(SESSION_DAYS * 24 * 60 * 60 * 1000));
    return res.json({ ok: true });

  } catch (err) {
    console.error('[auth] login error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

/* ── POST /api/auth/logout ───────────────────────────────────── */
router.post('/logout', async (req, res) => {
  const token = req.cookies?.sp_session;
  if (token) {
    try {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    } catch (_) { /* ignore */ }
  }
  res.clearCookie('sp_session', { path: '/' });
  return res.json({ ok: true });
});

/* ── GET /api/auth/check ─────────────────────────────────────── */
router.get('/check', async (req, res) => {
  const token = req.cookies?.sp_session;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const result = await pool.query(
      'SELECT admin_id FROM sessions WHERE token = $1 AND expires_at > now()',
      [token]
    );
    if (result.rowCount === 0) {
      res.clearCookie('sp_session', { path: '/' });
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true });
  } catch (err) {
    console.error('[auth] check error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
