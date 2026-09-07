# AGENTS.md — Ask Mode

This file provides documentation context for agents answering questions about this repository.

## Counterintuitive Structure

- The "live" content seen in the browser (trust items, testimonials, book prices, cover images) comes from `localStorage`, not from the HTML source. The HTML is only the skeleton/fallback. The authoritative data lives in `admin.html` → `localStorage` → runtime DOM patching.
- `site-data.js` and `book-page-data.js` are **not** build-time templating — they patch the DOM at page load time in the user's browser.
- `admin.html` is a fully self-contained dark-themed SPA that shares no CSS or JS with the rest of the site, despite being in the same root directory.

## Where to Find Things

- All design tokens (colors, spacing, type scale, shadows) → [`styles.css`](styles.css)
- Per-book accent colors → `:root` block inside each `books/<slug>/index.html`'s `<style>` block, and also as `--bN-*` variables in `styles.css`
- `localStorage` key schemas → top of [`site-data.js`](site-data.js) (comment block) and [`book-page-data.js`](book-page-data.js)
- Pre-launch checklist → [`README.md`](README.md)
- Instructions for a 4th book → [`ADD-A-BOOK.md`](ADD-A-BOOK.md)
