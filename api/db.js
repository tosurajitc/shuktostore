/**
 * db.js — PostgreSQL connection + schema migration
 * Runs migrations on startup; idempotent (CREATE TABLE IF NOT EXISTS).
 */
'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

/* ── Schema ──────────────────────────────────────────────────── */
const MIGRATION = `
  CREATE TABLE IF NOT EXISTS admins (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username   TEXT UNIQUE NOT NULL,
    pw_hash    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    admin_id   UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS books (
    id              TEXT PRIMARY KEY,
    slug            TEXT UNIQUE NOT NULL,
    data            JSONB NOT NULL DEFAULT '{}',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS settings (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    data            JSONB NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS homepage (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    data            JSONB NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS newsletter_signups (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        TEXT UNIQUE NOT NULL,
    signed_up_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS buyers (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                TEXT NOT NULL,
    name                 TEXT,
    phone                TEXT,
    book_slug            TEXT NOT NULL,
    razorpay_payment_id  TEXT UNIQUE,
    razorpay_link_id     TEXT,
    amount_paise         INTEGER,
    currency             TEXT DEFAULT 'INR',
    purchased_at         TIMESTAMPTZ DEFAULT now(),
    email_sent           BOOLEAN DEFAULT false,
    marketing_opt_in     BOOLEAN DEFAULT false
  );
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(MIGRATION);
    console.log('[db] Migration complete.');
  } finally {
    client.release();
  }
}

/* ── One-time data patches ───────────────────────────────────── */
async function patchData() {
  const client = await pool.connect();
  try {
    // Patch razorpay URLs that are still placeholders — only overwrite if
    // the stored value starts with the sentinel prefix.
    const patches = [
      { id: 'one-person-company', razorpay: 'https://rzp.io/rzp/rzpzqaSc' },
    ];

    // Keep the kids handbook's persisted theme and title aligned with its page.
    await client.query(
      `UPDATE books
       SET data = jsonb_set(
         jsonb_set(
           jsonb_set(
             jsonb_set(data, '{title}', '"AI Handbook for Kids"'::jsonb, true),
             '{accent}', '"#E8541A"'::jsonb, true
           ),
           '{accentHi}', '"#F07040"'::jsonb, true
         ),
         '{heroBg}', '"#1A1412"'::jsonb, true
       ), updated_at = now()
       WHERE id = 'ai-handbook-for-kids'
         AND (data->>'accent' = '#B8874B' OR data->>'title' = 'Ai handbook for kids')`
    );
    for (const p of patches) {
      await client.query(
        `UPDATE books
         SET data = jsonb_set(data, '{razorpay}', $1::jsonb, true),
             updated_at = now()
         WHERE id = $2
           AND (data->>'razorpay') LIKE 'RAZORPAY_%'`,
        [JSON.stringify(p.razorpay), p.id]
      );
    }
    console.log('[db] Data patches applied.');
  } catch (err) {
    console.error('[db] patchData error:', err.message);
  } finally {
    client.release();
  }
}

/* ── Seed admin from env ─────────────────────────────────────── */
async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.warn('[db] ADMIN_PASSWORD not set — skipping admin seed.');
    return;
  }

  const existing = await pool.query(
    'SELECT id FROM admins WHERE username = $1',
    [username]
  );

  if (existing.rowCount > 0) {
    console.log('[db] Admin user already exists — skipping seed.');
    return;
  }

  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    'INSERT INTO admins (username, pw_hash) VALUES ($1, $2)',
    [username, hash]
  );
  console.log(`[db] Admin user "${username}" created.`);
}

/* ── Expired session cleanup (runs once at startup) ─────────── */
async function cleanSessions() {
  await pool.query('DELETE FROM sessions WHERE expires_at < now()');
}

module.exports = { pool, migrate, seedAdmin, cleanSessions, patchData };
