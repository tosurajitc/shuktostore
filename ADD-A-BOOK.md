# Shukto Press — Adding a Fourth Book

## What you need to supply

Copy the following data for the new book and fill in every field:

```
TITLE:              "Book Title"
SUBTITLE:           "The subtitle shown in the hero"
SLUG:               "book-slug"               ← used in the URL: /books/book-slug/
AUTHOR:             "Author Name"
CATEGORY_LABEL:     "Category · eBook"        ← shown in the hero eyebrow
ACCENT_COLOR:       "#XXXXXX"                 ← primary brand color for this book
ACCENT_HI:          "#XXXXXX"                 ← lighter variant
HERO_BG_COLOR:      "#XXXXXX"                 ← hero section background (usually dark)
BLOB_1_COLOR:       "rgba(r,g,b,0.5)"         ← animated gradient blob 1
BLOB_2_COLOR:       "rgba(r,g,b,0.3)"         ← animated gradient blob 2
COVER_GRADIENT:     "linear-gradient(145deg, #AABBCC, #DDEEFF)"
COVER_IMAGE_PATH:   "assets/covers/book-slug.jpg"   ← add image to this folder
BASE_ROTATION:      "−3"                      ← degrees the cover tilts in the hero (e.g. -3, 2)
PRICE:              "$XX"
RAZORPAY_LINK:      "https://rzp.io/..."      ← Razorpay Payment Link URL
DOWNLOAD_LINK:      "https://..."             ← Hosted PDF URL for the thank-you page

POSITIONING_PARAGRAPH:
  One paragraph (~3–4 sentences) describing what the book is, who it's for,
  and what makes it different.

WHAT_IS_INSIDE:    (8–10 bullet points, each with:)
  - ICON:     emoji
  - TITLE:    short title (4–6 words)
  - BODY:     one sentence description

AUDIENCE_FOR:      (5–6 bullet points of who IS the right reader)
AUDIENCE_NOT_FOR:  (4–5 bullet points of who is NOT the right reader)

AUTHOR_BIO:        2–3 paragraph author bio

PROBLEM_PULL_QUOTE: One vivid sentence in the voice of a frustrated reader or the author,
                    used as a large pull-quote in the problem section.

PROMISE_HEADING:   One punchy sentence for the dark "promise" band (e.g. "By the last page, ...")
PROMISE_BODY:      1–2 sentences expanding on it.

STATS:             4 numbers to show in the stat strip:
  - NUMBER_1 / LABEL_1
  - NUMBER_2 / LABEL_2
  - NUMBER_3 / LABEL_3
  - NUMBER_4 / LABEL_4

FAQ:               4–6 questions and answers

FINAL_CTA_HEADING: Short headline for the bottom CTA section
FINAL_CTA_BODY:    1 sentence subtitle

WHAT_TO_OPEN_FIRST: (4 steps for the thank-you page, each with:)
  - STEP_TITLE: e.g. "Chapter 1 — Title"
  - STEP_BODY:  1 sentence instruction
```

---

## How to create the pages

### 1. Create the folder structure

```
books/
  book-slug/
    index.html        ← sales page
    thank-you.html    ← post-purchase page
```

### 2. Copy the template

Copy `books/one-person-company/index.html` → `books/book-slug/index.html`.

Then do a find-and-replace for the following strings:

| Find | Replace with |
|------|-------------|
| `#B8874B` | your ACCENT_COLOR |
| `#D4A868` | your ACCENT_HI |
| `var(--b1-bg)` | your HERO_BG_COLOR or a new CSS var |
| `The One-Person Company` | your TITLE |
| `How AI Agents Are Creating the Business of the Future` | your SUBTITLE |
| `Business &amp; AI` | your CATEGORY_LABEL |
| `RAZORPAY_PAYMENT_LINK_ONE_PERSON_COMPANY` | your RAZORPAY_LINK |
| `../../assets/covers/one-person-company.jpg` | your COVER_IMAGE_PATH |
| `one-person-company/index.html` links | `book-slug/index.html` |

### 3. Update the content blocks

Replace these sections with your new data (each section is clearly commented):
- **Hero** — title, subtitle, positioning paragraph, cover rotation
- **Problem pull-quote** — replace the blockquote text
- **Promise band** — heading + body paragraph + three promise cards
- **Bento grid** — replace all 8–10 cells with your "what's inside" points
- **Stat strip** — replace 4 stat numbers and labels
- **Who is it for** — replace the for/not-for lists
- **Author card** — replace bio and avatar initial
- **FAQ** — replace all questions and answers
- **Final CTA** — heading + body

### 4. Create the thank-you page

Copy `books/one-person-company/thank-you.html` → `books/book-slug/thank-you.html`.

Find-and-replace the same color and title strings as above, plus:
- `EBOOK_DOWNLOAD_LINK_ONE_PERSON_COMPANY` → your DOWNLOAD_LINK
- The "where to start" step list → your WHAT_TO_OPEN_FIRST steps

### 5. Add the cover image

Place your book cover image (JPG, ~600×800px) at `assets/covers/book-slug.jpg`.
Uncomment the `<img>` tag in the hero mockup and thank-you download card, and remove the placeholder `<div>`.

### 6. Update the homepage

In `index.html`, add a new book card to the catalog grid.
Copy one of the existing `<div class="reveal ...">` blocks from the `catalog-book-stack` area,
update the cover background, title, tag color, description, price, and CTA link.

### 7. Update footer nav links (in all pages)

Add `<a href="books/book-slug/index.html">Your Book Title</a>` to the footer nav in all existing pages.

---

## Razorpay redirect setup

In the Razorpay dashboard, when creating the Payment Link for the new book:
- Set the **Success redirect URL** to: `https://yourdomain.com/books/book-slug/thank-you.html`

---

That's it. No new markup patterns needed. Just data → templates.
