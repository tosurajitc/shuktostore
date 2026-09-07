# AGENTS.md — Plan Mode

This file provides architectural context for agents planning changes in this repository.

## Architectural Constraints

- **`main.js` must run before `book-page-data.js`** on every book page. `book-page-data.js` calls `window._spInitTilt` (exposed by `main.js`) after swapping in a real cover image. Reversing or combining them will silently break the tilt effect on cover images added via admin.
- **`site-data.js` completely replaces the trust grid and testimonials grid** via `innerHTML` every page load. Any plan to add persistent DOM nodes inside `#sp-trust-grid` or `#sp-testimonials-grid` in `index.html` will not survive — the content must be baked into `DEFAULTS` in `site-data.js` or stored in `localStorage`.
- **`window._spRevealObserver` coupling**: `main.js` initialises the IntersectionObserver and stores it globally. `site-data.js` and `book-page-data.js` both depend on this global to register dynamically injected elements. Any plan that changes the initialisation timing of `main.js` will break scroll reveals for injected content.
- **No shared state between admin and front-end** except `localStorage`. The admin never imports scripts from the site and the site never imports scripts from the admin. They communicate only through three `localStorage` keys: `sp_settings`, `sp_homepage`, `sp_books`.
- **Placeholder guard in `book-page-data.js`**: The Razorpay and download link patching is intentionally skipped if the stored value still starts with the sentinel string. Any plan to pre-populate these fields must use actual URLs, not modified sentinel strings.
- **Cover swap is a one-way DOM mutation**: `book-page-data.js` calls `el.replaceWith(img)` — the placeholder `<div>` is destroyed. There is no mechanism to restore it if the cover URL 404s on the first load. Design plans that need a fallback must handle `img.onerror` on the created element.
