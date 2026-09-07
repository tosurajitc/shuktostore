# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack & Serving

Pure static site — **no build step, no package manager, no bundler**. Open `index.html` directly in a browser or serve with any static file server (e.g. `npx serve .`). There are no lint, test, or compile commands.

## Architecture

- **`styles.css`** is the only stylesheet. Every design token lives here as a CSS custom property. Hardcoded colors in individual pages always come from named tokens defined in this file — never invent magic numbers.
- **`main.js`** runs first on every page (nav, reveal, tilt, accordion, marquee). It exposes `window._spRevealObserver` so that dynamically injected HTML can be observed for scroll reveals.
- **`site-data.js`** (homepage only) and **`book-page-data.js`** (every book page) patch the live DOM from `localStorage`. They expose `window._spApplyAll` / `window._spApplyBookData` so `admin.html` can trigger a live re-render without reloading.
- **`admin.html`** is a standalone SPA that reads/writes the same `localStorage` keys; it does NOT share CSS or JS with the rest of the site.

## Data / localStorage Keys

| Key | Shape | Consumer |
|---|---|---|
| `sp_settings` | `{ publisher, email, tagline }` | `site-data.js`, every footer |
| `sp_homepage` | `{ heroLabel, aboutHeading, aboutSubtitle, trustItems[], testimonials[], heroBgImage }` | `site-data.js` |
| `sp_books` | `[{ slug, title, price, cover, razorpay, download, author, authorBio, … }]` | `site-data.js`, `book-page-data.js` |

## Data-attribute Patching System

Book pages are patched at runtime by `book-page-data.js` via `data-sp-*` attributes — **not** by static text. The attributes that drive patching are:

| Attribute | Effect |
|---|---|
| `<body data-sp-slug="slug">` | **Required** — identifies which book's data to apply |
| `data-sp-price` | Replaced with `book.price` text |
| `data-sp-price-btn` | Button text becomes `"<label> — <price> →"` |
| `data-sp-razorpay` | `href` replaced with Razorpay URL (skipped if still a placeholder string) |
| `data-sp-download` | `href` replaced with PDF URL (skipped if still a placeholder string) |
| `data-sp-cover` | Gradient-placeholder `<div>` swapped for a real `<img>`, preserving `data-tilt` and `data-base-rotation` |
| `data-sp-author-name/bio/avatar` | Author section patched |

When adding markup to a book page, **tag patchable elements with these attributes** instead of hardcoding values.

## Book Page Conventions

- Every sales page lives at `books/<slug>/index.html`; thank-you page at `books/<slug>/thank-you.html`.
- `../../styles.css` is the correct relative path from any book page.
- Each book page has its own `<style>` block immediately after the `styles.css` link that declares accent overrides via `:root { --accent: ...; --accent-hi: ...; }` and book-specific utility classes (`.accent-b1`, `.b1-btn-primary`, etc.). Tokens for each book are already in `styles.css` (`--b1-*`, `--b2-*`, `--b3-*`).
- Cover placeholders: the hero mockup uses a gradient `<div>` with `data-sp-cover` — leave the `<img>` commented out until a real cover image is provided, per the README pattern.
- Tilt effect: cover elements must carry `data-tilt` and `data-base-rotation="<degrees>"` for `main.js` to animate them.
- Script load order on book pages: `main.js` → `book-page-data.js`. The order matters because `book-page-data.js` may call `window._spInitTilt` from `main.js`.

## Placeholder Strings

Do not remove or rename these sentinel strings — `book-page-data.js` checks for them to avoid patching with unset values:

- `RAZORPAY_PAYMENT_LINK_<SLUG>` — skipped if `book.razorpay` starts with `"RAZORPAY_"`
- `EBOOK_DOWNLOAD_LINK_<SLUG>` — skipped if `book.download` starts with `"EBOOK_"`

## Scroll Reveal

Add `class="reveal"` to any element that should fade/slide in on scroll. Add `reveal-delay-1` through `reveal-delay-4` for staggered siblings. After dynamically injecting HTML containing `.reveal` elements, call `window._spRevealObserver.observe(el)` on each new element.
