# Shukto Press — eBook Website

A complete, production-ready static website for Shukto Press — built with plain HTML, a shared CSS design system, and vanilla JS.

## File structure

```
/
├── index.html                          ← Homepage
├── styles.css                          ← Shared design system (all tokens here)
├── main.js                             ← Shared JS (nav, reveals, accordion, marquee, tilt)
├── assets/
│   └── covers/
│       ├── one-person-company.jpg      ← Add real cover image here
│       ├── money-sorted.jpg            ← Add real cover image here
│       └── ai-handbook-for-kids.jpg           ← Add real cover image here
└── books/
    ├── one-person-company/
    │   ├── index.html                  ← Sales page
    │   └── thank-you.html             ← Post-purchase page
    ├── money-sorted/
    │   ├── index.html
    │   └── thank-you.html
    └── ai-handbook-for-kids/
        ├── index.html
        └── thank-you.html
```

## Before going live — manual editing required

### 1. Razorpay Payment Links
In each sales page and thank-you page, replace these placeholder strings with your actual Razorpay Payment Link URLs:

| Placeholder | File(s) |
|-------------|---------|
| `RAZORPAY_PAYMENT_LINK_ONE_PERSON_COMPANY` | `books/one-person-company/index.html` |
| `RAZORPAY_PAYMENT_LINK_MONEY_SORTED` | `books/money-sorted/index.html` |
| `RAZORPAY_PAYMENT_LINK_AI_HANDBOOK_FOR_KIDS` | `books/ai-handbook-for-kids/index.html` |

In the Razorpay dashboard for each link, set the **Success redirect URL** to:
- `https://yourdomain.com/books/one-person-company/thank-you.html`
- `https://yourdomain.com/books/money-sorted/thank-you.html`
- `https://yourdomain.com/books/ai-handbook-for-kids/thank-you.html`

### 2. PDF Download Links
In each thank-you page, replace these with your actual hosted PDF URLs:

| Placeholder | File |
|-------------|------|
| `EBOOK_DOWNLOAD_LINK_ONE_PERSON_COMPANY` | `books/one-person-company/thank-you.html` |
| `EBOOK_DOWNLOAD_LINK_MONEY_SORTED` | `books/money-sorted/thank-you.html` |
| `EBOOK_DOWNLOAD_LINK_AI_HANDBOOK_FOR_KIDS` | `books/ai-handbook-for-kids/thank-you.html` |

### 3. Prices
Replace all `$XX` instances with actual prices. They appear in:
- Each sales page (hero, pricing card, final CTA)
- Homepage catalog cards
- Nav CTAs

You can do a global find-and-replace: `$XX` → `$19` (or whatever price you set).

### 4. Book cover images
Place the actual cover JPGs at:
- `assets/covers/one-person-company.jpg`
- `assets/covers/money-sorted.jpg`
- `assets/covers/ai-handbook-for-kids.jpg`

Then in each sales page hero and thank-you download card, uncomment the `<img>` tag and delete the placeholder `<div>` beneath it. The comment looks like:
```html
<!-- <img src="../../assets/covers/one-person-company.jpg" alt="..." class="mockup-cover" ...> -->
```

Do the same in `index.html` for the homepage cover stack and book cards.

### 5. Testimonials
Replace all instances of:
```
[TESTIMONIAL PLACEHOLDER — replace with real quote]
```
...with real reader quotes. Update the name and role fields in the `.quote-meta-name` and `.quote-meta-role` spans below each quote. Update the avatar initials in `.quote-avatar`.

### 6. Contact email
Replace `hello@shuktopress.com` with your actual email address. It appears in the footer and FAQ sections.

---

## Adding a fourth book
See `ADD-A-BOOK.md` for the full guide — what to supply and exactly how to create the sales page and thank-you page from the existing template.
