# AGENTS.md — Agent (Coding) Mode

This file provides coding-specific guidance for agents working in this repository.

## No Build Pipeline

There is no `npm install`, no linter, no formatter, no test runner. Validate changes by opening the HTML file in a browser. There is nothing to run in the terminal to check correctness.

## Editing Patterns

- **Adding content to a book sales page**: Tag new patchable elements with `data-sp-*` attributes (see root AGENTS.md). Hardcoded values in those elements are only fallbacks shown before `book-page-data.js` runs.
- **Adding a new book**: Follow `ADD-A-BOOK.md` exactly. The slug used in the folder name, `<body data-sp-slug>`, `data-book-cover`, `data-stack-cover`, and `data-book-price` attributes must all match.
- **Adding a CSS class**: Define it in `styles.css` using existing tokens, or in the book page's own `<style>` block if book-specific. Never hardcode hex colors — always reference `--bN-accent`, `--bN-bg`, etc.
- **Dynamically rendered elements** (trust grid, testimonials): These are wiped and re-rendered entirely by `site-data.js` on every load. Edits to those DOM nodes in `index.html` are overwritten unless `localStorage` is empty. To make permanent changes, update the `DEFAULTS` object in `site-data.js`.
- **`admin.html`** has its own inline CSS (no `styles.css` link) and its own inline JS. Do not add `<link rel="stylesheet" href="styles.css">` to it.

## Cover Image Swap Pattern

When a real cover image becomes available, the pattern is:
1. Uncomment the `<img>` tag in the hero and thank-you page.
2. Delete the sibling gradient-placeholder `<div>`.
3. Ensure the `<img>` carries `data-sp-cover`, `data-tilt`, and `data-base-rotation`.

Do not do this partially — if the `<img>` and the placeholder `<div>` coexist, `book-page-data.js` will attempt to replace the `<div>` and the `<img>` will be a duplicate.
