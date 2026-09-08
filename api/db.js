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

module.exports = { pool, migrate, seedAdmin, cleanSessions };
