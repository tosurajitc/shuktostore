/**
 * seed.js — One-time data seed from shukto-press-data.json into PostgreSQL.
 * Called automatically on server boot if books table is empty.
 * Safe to run multiple times — skips if data already exists.
 */
'use strict';

const path = require('path');
const fs   = require('fs');
const { pool } = require('./db');

async function seedData() {
  // Load the JSON export file
  const jsonPath = path.join(__dirname, '..', 'shukto-press-data.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('[seed] shukto-press-data.json not found — skipping seed.');
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error('[seed] Failed to parse shukto-press-data.json:', err.message);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed books
    if (data.books && data.books.length) {
      for (let i = 0; i < data.books.length; i++) {
        const book = data.books[i];
        const id   = book.id || book.slug;
        const slug = book.slug || book.id;
        await client.query(
          `INSERT INTO books (id, slug, data, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [id, slug, JSON.stringify(book), i]
        );
      }
      console.log(`[seed] Inserted ${data.books.length} books.`);
    }

    // Seed settings (only if not already set)
    if (data.settings) {
      await client.query(
        `INSERT INTO settings (id, data)
         VALUES (1, $1)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(data.settings)]
      );
      console.log('[seed] Settings inserted.');
    }

    // Seed homepage (only if not already set)
    if (data.homepage) {
      await client.query(
        `INSERT INTO homepage (id, data)
         VALUES (1, $1)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(data.homepage)]
      );
      console.log('[seed] Homepage data inserted.');
    }

    await client.query('COMMIT');
    console.log('[seed] Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[seed] Seed failed, rolled back:', err.message);
  } finally {
    client.release();
  }
}

module.exports = { seedData };
