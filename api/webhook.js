/**
 * webhook.js — Razorpay webhook handler
 *
 * Handles POST /api/webhook/razorpay
 *
 * Razorpay sends a signed POST request for every payment_link.paid event.
 * This handler:
 *   1. Verifies the HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET
 *   2. Extracts buyer details from the payload
 *   3. Maps the Razorpay Payment Link ID to a book slug via the books table
 *   4. Inserts a row into the buyers table (idempotent — ignores duplicate payment IDs)
 *   5. Optionally sends a confirmation email via Resend (if RESEND_API_KEY is set)
 */
'use strict';

const crypto = require('crypto');
const router = require('express').Router();
const { pool } = require('./db');

/* ── Signature verification ──────────────────────────────────── */
function verifySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature check');
    return true; // allow in dev without secret set
  }
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
}

/* ── Slug lookup: try books table first, fall back to env map ─── */
async function slugForLinkId(linkId) {
  if (!linkId) return null;
  try {
    // Each book's data JSONB may store the razorpay link ID — check all books
    const result = await pool.query('SELECT slug, data FROM books');
    for (const row of result.rows) {
      const rzp = row.data?.razorpay || '';
      // Razorpay link URLs look like: https://rzp.io/l/linkId or https://rzp.io/rzp1/linkId
      if (rzp.includes(linkId)) return row.slug;
    }
  } catch (err) {
    console.error('[webhook] slug lookup error:', err.message);
  }
  return null;
}

/* ── Send confirmation email via Resend (optional) ───────────── */
async function sendConfirmationEmail(buyer) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Resend not configured — skip silently

  const fromDomain = process.env.RESEND_FROM || 'hello@shukto.in';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Shukto Press <${fromDomain}>`,
        to: [buyer.email],
        subject: `Your eBook is ready — ${buyer.book_slug}`,
        html: `
          <p>Hi ${buyer.name || 'there'},</p>
          <p>Thanks for your purchase! Your copy of <strong>${buyer.book_slug}</strong> is ready.</p>
          <p>Visit your thank-you page to download it:</p>
          <p><a href="https://shukto.in/books/${buyer.book_slug}/thank-you.html">Download your eBook →</a></p>
          <p style="color:#888;font-size:12px;">Shukto Press · shukto.in</p>
        `,
      }),
    });

    if (res.ok) {
      await pool.query(
        'UPDATE buyers SET email_sent = true WHERE razorpay_payment_id = $1',
        [buyer.razorpay_payment_id]
      );
      console.log(`[webhook] Confirmation email sent to ${buyer.email}`);
    } else {
      const body = await res.text();
      console.error(`[webhook] Resend error ${res.status}:`, body);
    }
  } catch (err) {
    console.error('[webhook] sendConfirmationEmail error:', err.message);
  }
}

/* ── POST /api/webhook/razorpay ──────────────────────────────── */
router.post(
  '/razorpay',
  // Raw body needed for HMAC verification — parse before json middleware runs
  require('express').raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody  = req.body; // Buffer (express.raw)
    const signature = req.headers['x-razorpay-signature'] || '';

    if (!verifySignature(rawBody, signature)) {
      console.warn('[webhook] Invalid signature — rejecting request');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    // Only handle payment_link.paid
    if (payload.event !== 'payment_link.paid') {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const entity  = payload.payload?.payment_link?.entity || {};
    const payment = payload.payload?.payment?.entity || {};

    const linkId    = entity.id;
    const paymentId = payment.id;
    const email     = payment.email || entity.customer_details?.contact_email || '';
    const name      = payment.contact || entity.customer_details?.name || '';
    const phone     = payment.contact_number || entity.customer_details?.contact_number || null;
    const amount    = payment.amount ?? entity.amount ?? null;   // in paise
    const currency  = payment.currency || entity.currency || 'INR';

    if (!email) {
      console.warn('[webhook] No email in payload — storing without email (using payment_id as placeholder)');
    }

    const bookSlug = await slugForLinkId(linkId) || 'unknown';

    const buyer = {
      email:               email || `unknown-${paymentId}@noreply`,
      name:                name || null,
      phone:               phone || null,
      book_slug:           bookSlug,
      razorpay_payment_id: paymentId || null,
      razorpay_link_id:    linkId || null,
      amount_paise:        typeof amount === 'number' ? amount : null,
      currency,
    };

    try {
      await pool.query(
        `INSERT INTO buyers
           (email, name, phone, book_slug, razorpay_payment_id, razorpay_link_id, amount_paise, currency)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (razorpay_payment_id) DO NOTHING`,
        [buyer.email, buyer.name, buyer.phone, buyer.book_slug,
         buyer.razorpay_payment_id, buyer.razorpay_link_id,
         buyer.amount_paise, buyer.currency]
      );
      console.log(`[webhook] Buyer saved: ${buyer.email} → ${bookSlug} (${paymentId})`);
    } catch (err) {
      console.error('[webhook] DB insert error:', err.message);
      return res.status(500).json({ error: 'DB error' });
    }

    // Fire-and-forget confirmation email
    sendConfirmationEmail(buyer);

    return res.status(200).json({ ok: true });
  }
);

module.exports = router;
