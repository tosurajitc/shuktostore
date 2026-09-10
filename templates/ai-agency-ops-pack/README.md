# AI Agency Operations Pack — Master README

> **For the site owner / admin.** This document covers three things:
> 1. How the templates reach buyers after payment
> 2. How to edit the pack from the Admin panel
> 3. Per-template usage guides

---

## 1. How Template Delivery Works (End-to-End)

### The complete purchase-to-download flow

```
Buyer clicks "Get the Pack" on the sales page
        ↓
Razorpay payment link (one for the full pack, or one per individual template)
        ↓
Payment succeeds → Razorpay fires a webhook to:
  POST https://yourdomain.com/api/webhook/razorpay
        ↓
webhook.js records buyer (email, name, payment ID, book_slug) in the DB
webhook.js optionally sends a confirmation email via Resend
        ↓
Razorpay redirects buyer to:
  https://yourdomain.com/books/ai-agency-ops-pack/thank-you.html
        ↓
thank-you.html calls:
  GET /api/download/ai-agency-ops-pack
        ↓
download.js looks up "AI_Agency_Ops_Pack.zip" in the R2_FILE_MAP
download.js generates a 1-hour pre-signed URL from Cloudflare R2
        ↓
Buyer's browser downloads the ZIP from R2 directly
```

### What you need to set up before going live

| Step | What to do | Where |
|------|-----------|-------|
| 1 | Create a ZIP file containing all 4 HTML templates | Your computer |
| 2 | Name it exactly **`AI_Agency_Ops_Pack.zip`** | ZIP filename must match `R2_FILE_MAP` in `api/download.js` |
| 3 | Upload the ZIP to your **Cloudflare R2 bucket** (`shukto-pdfs`) | R2 dashboard → Upload object |
| 4 | Create a **Razorpay Payment Link** for the pack at ₹399 | Razorpay dashboard |
| 5 | Set the Razorpay **success redirect URL** to: `https://yourdomain.com/books/ai-agency-ops-pack/thank-you.html` | Razorpay link settings |
| 6 | Copy the Razorpay link URL (e.g. `https://rzp.io/l/xxx`) | — |
| 7 | Paste it into the Admin panel under the pack's **Razorpay Link** field | Admin → Edit Book → Step 4 |
| 8 | Set up the **Razorpay webhook** (see below) | Razorpay dashboard → Webhooks |

### Individual template delivery (if selling separately)

Each individual template also needs its own Razorpay Payment Link. Since each slug maps to the same ZIP (`AI_Agency_Ops_Pack.zip`) in `download.js`, buyers of individual templates also receive the full ZIP — this is intentional. You can change each individual template's `R2_FILE_MAP` entry to a different file if you want to deliver single-template ZIPs.

Slugs for individual templates:
| Template | Slug |
|----------|------|
| Client Onboarding Brief | `onboarding-template` |
| Prompt Library | `prompt-library-template` |
| Automation Tracker | `automation-tracker-template` |
| Project Dashboard | `project-dashboard-template` |

### Razorpay webhook setup

1. Go to **Razorpay Dashboard → Settings → Webhooks → Add New Webhook**
2. Set the **Webhook URL** to: `https://yourdomain.com/api/webhook/razorpay`
3. Select the event: **`payment_link.paid`**
4. Set a **Webhook Secret** and copy it
5. Add the secret to your environment variables as `RAZORPAY_WEBHOOK_SECRET`

> The webhook fires once for every successful payment. It records the buyer in the database and optionally sends them a confirmation email (requires `RESEND_API_KEY` env var).

### Environment variables required

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=shukto-pdfs

# Razorpay webhook
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email (optional — skip if you want manual delivery only)
RESEND_API_KEY=your_resend_key
RESEND_FROM=hello@yourdomain.com

# Database
DATABASE_URL=postgresql://...
```

### Testing delivery before going live

1. Open `thank-you.html` in your browser directly (file://)
2. The page will call `/api/download/ai-agency-ops-pack` — this will fail locally unless the server is running
3. To test end-to-end: deploy to Railway, complete a ₹1 test payment, verify the ZIP downloads

---

## 2. How to Edit the Pack from the Admin Panel

### Accessing the admin panel

1. Navigate to `https://yourdomain.com/admin.html`
2. Log in with your admin credentials (set via `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars)

### Finding the AI Agency Ops Pack entry

1. Click **"Books"** in the left sidebar — you'll see all books and templates listed
2. Find **"AI Agency Operations Pack"** in the list
3. Click the **"Edit"** button on its row

This opens the 5-step edit form pre-filled with the current data.

### What you can edit, step by step

#### Step 1 — Basic Info
| Field | What it controls |
|-------|-----------------|
| Product Type | Set to **Template** for this pack |
| Title | The pack title shown everywhere |
| Subtitle | Shown under the title in the hero |
| Slug | URL path: `books/ai-agency-ops-pack/` — **do not change** |
| Author | Attribution shown on the sales page |
| Category | Shown in the hero eyebrow badge |
| Accent Color | Purple `#7C3AED` — the brand colour for this pack |
| Hero Background | Dark purple `#0D0826` |
| Cover Image | Upload a cover image here (JPG) — appears in the hero mockup and catalog |

#### Step 2 — Content (Sales Page)
| Field | What it controls |
|-------|-----------------|
| Positioning Paragraph | The 2–3 sentence description in the hero |
| Pull Quote | The large blockquote in the problem section |
| Promise Heading | Dark band headline |
| Promise Body | Dark band supporting paragraph |
| What's Inside items | Bento grid cells — icon + title + 1-sentence description |
| For / Not-For lists | The audience fit section |
| Author Name / Bio / Photo | Author card on the sales page |

#### Step 3 — Social Proof & CTA
| Field | What it controls |
|-------|-----------------|
| Testimonials | Quote cards in the "What readers say" section |
| Start Steps | 4 steps on the thank-you page ("How to use your templates") |
| CTA Heading | Final CTA section headline |
| CTA Body | Final CTA section subtitle |

#### Step 4 — Links & Price
| Field | What it controls |
|-------|-----------------|
| Price | Displayed price (e.g. `₹399`) |
| Pricing Features | Bullet list in the pricing card |
| Razorpay Payment Link URL | The payment URL buyers are sent to — **paste your actual Razorpay link here** |
| International Payment Link | Shown to non-India buyers instead of Razorpay (Stripe / Gumroad / etc.) |
| PDF Download Link URL | **Leave blank** — download is handled via the R2 API, not a hardcoded URL |

> ⚠️ **Important:** The "PDF Download Link URL" field in admin is for books with a static PDF link. The ops pack uses the R2 signed URL system instead. Leave this field blank — the download is served by `/api/download/ai-agency-ops-pack`.

#### Step 5 — Review & Save
- Review the summary panel
- Click **"Save & Generate Files"** — this saves to the database AND rewrites the `index.html` and `thank-you.html` files on disk
- The pack's sales page at `books/ai-agency-ops-pack/index.html` is immediately updated

### Updating the pack's stat strip

The 4 stats (4 templates, 7 pages, 0 tools needed, ∞ reuses) are set in `shukto-press-data.json` under `stats[]` and can also be edited via the admin's **"What's Inside" bento items** section (which maps to the bento grid, not the stat strip directly). To change the stat strip numbers, either:
- Edit `shukto-press-data.json` directly under `"id": "ai-agency-ops-pack"` → `"stats"` array, or
- Edit `books/ai-agency-ops-pack/index.html` directly in the stat strip section

### Updating the pricing for individual templates

The individual template pricing cards (₹149 each) are **hardcoded in the sales page** (`books/ai-agency-ops-pack/index.html`) because each individual template has its own Razorpay link. To update them:
1. Open `books/ai-agency-ops-pack/index.html`
2. Find the `<!-- Individual Template 1 -->` comments in the pricing section
3. Update the price text and `href` on each `.pricing-card-sm` card

---

## 3. Template-by-Template Usage Guide

Each template also has an **in-file guide** — click the coloured bar at the top of each template HTML file to expand it.

### Template 01 — Client Onboarding Brief
**File:** `templates/01-client-onboarding.html`  
**Format:** Portrait A4, 2 pages  
**Colour:** Purple

**Use it when:** Starting every new client engagement.

**Workflow:**
1. Duplicate the file → rename to `onboarding-ClientName-2025.html`
2. Fill in all dashed fields using your discovery call notes
3. Complete Sections 01–06 before the first paid work session
4. Print to PDF → send to client for signature
5. Archive the signed PDF; keep the HTML for future reference

**Field guide:**

| Section | Contents | Fill this when |
|---------|----------|---------------|
| 01 — Client Info | Name, contact, email, phone, website, timezone | Kickoff call |
| 02 — Business Snapshot | What they do, customer, team size, tech stack | Discovery call |
| 03 — Goals & KPIs | Primary goal, success metrics, timeline, budget | Discovery call |
| 04 — Scope of Work | Deliverables table with owner and due dates | After scoping |
| 05 — Onboarding Checklist | 8 tasks to tick off during onboarding week | Ongoing |
| 06 — Risks & Notes | Blockers, out-of-scope items, dependencies | Before sending |
| 07 — Signatures | Agency + client sign-off | Before work begins |

---

### Template 02 — Prompt Library
**File:** `templates/02-prompt-library.html`  
**Format:** Portrait A4, 2 pages  
**Colour:** Teal/Green

**Use it when:** Recording a new high-performing prompt, or doing a monthly library review.

**Workflow:**
1. Keep **one master file** — this is agency-wide, not per-client
2. Add new entries to the index table (Page 1) first
3. Add the detail card (Page 2) — duplicate an existing card block and fill it in
4. Update the summary stats at the top of Page 1
5. Print to PDF monthly as an archived snapshot

**Prompt card fields:**

| Field | What to write | Notes |
|-------|--------------|-------|
| Prompt ID | P-001, P-002… | Sequential, never reuse |
| Category tag | Sales / Content / Ops / Ads / Support | Consistent labels |
| Prompt Text | Full prompt with `[PLACEHOLDERS]` | Exactly as used |
| Variables | List every `[BRACKET]` placeholder | Makes handoff easy |
| Recommended Model | GPT-4o / Claude 3.5 / etc. | Update if model changes |
| Quality Rating | ⭐–⭐⭐⭐⭐⭐ | Based on 10+ real uses |
| Limitations | Known failure modes | Be honest |

---

### Template 03 — Automation Tracker
**File:** `templates/03-automation-tracker.html`  
**Format:** Landscape A4, 1 page  
**Colour:** Blue

**Use it when:** Deploying a new automation, doing a monthly ops review, or preparing an ROI report for a client.

**Workflow:**
1. Keep **one master file** covering all automations across all clients
2. Add a new row whenever an automation is deployed or planned
3. Update status pills after each deployment or change
4. Recalculate the ROI summary section at the bottom monthly
5. Print landscape A4 — in Chrome's print dialog: **Orientation → Landscape**

**Column guide:**

| Column | What to enter |
|--------|--------------|
| ID | A-001, A-002… (sequential) |
| Automation Name | 3–5 word description |
| Client | Client name or "Internal" |
| Category | Sales / Content / Ops / Finance / Support / Reporting |
| Tool / Stack | e.g. "Make + GPT-4o" |
| Status | Live / In Build / Planned / Paused / Error |
| Complexity | 1–5 filled dots (edit the HTML: `class="dot filled"` per filled dot) |
| Time Saved | Estimated hrs/month |
| Monthly Cost | Total tool + API cost |
| Go-Live Date | Month + Year (or target) |
| Owner | First name or initials |

**ROI calculation:**
- Time Recovered = sum of all "Time Saved" values
- Cost = sum of all "Monthly Cost" values  
- Value Generated = Total hours × your hourly rate
- ROI % = (Value − Cost) ÷ Cost × 100

---

### Template 04 — Project Dashboard
**File:** `templates/04-project-dashboard.html`  
**Format:** Portrait A4, 2 pages  
**Colour:** Amber/Gold

**Use it when:** Sending weekly or bi-weekly project updates to clients. Safe to share directly.

**Workflow:**
1. Duplicate the file at the start of each reporting period → rename `dashboard-ClientName-Week3.html`
2. Update the KPI strip (progress %, days, budget, blockers) first
3. Update deliverable status pills and notes
4. Advance milestone dots: `m-done` (completed) → `m-active` (current) → `m-future` (upcoming)
5. Replace Section 05 actions entirely — only show this week's items
6. Print to PDF → email to client or share in Slack/Notion

**Milestone dot colours:**
```html
<div class="milestone-dot m-done"></div>    <!-- green — completed -->
<div class="milestone-dot m-active"></div>  <!-- amber — current milestone -->
<div class="milestone-dot m-future"></div>  <!-- grey — upcoming -->
```

**Status pill classes:**
```html
<span class="pill pill-green">On Track</span>
<span class="pill pill-amber">At Risk</span>
<span class="pill pill-red">Delayed</span>
<span class="pill pill-blue">In Progress</span>
<span class="pill pill-gray">Upcoming</span>
```

---

## 4. File Structure Reference

```
books/ai-agency-ops-pack/
├── index.html              ← Sales page (pack + individual templates)
├── thank-you.html          ← Post-purchase download page
├── README.md               ← This file
└── templates/
    ├── 01-client-onboarding.html
    ├── 02-prompt-library.html
    ├── 03-automation-tracker.html
    └── 04-project-dashboard.html
```

The ZIP delivered to buyers (`AI_Agency_Ops_Pack.zip`) should contain the 4 HTML files from the `templates/` folder. Package them as:
```
AI_Agency_Ops_Pack/
├── 01-client-onboarding.html
├── 02-prompt-library.html
├── 03-automation-tracker.html
└── 04-project-dashboard.html
```

---

## 5. Quick Checklist Before Going Live

- [ ] ZIP file created: `AI_Agency_Ops_Pack.zip` (containing all 4 HTML templates)
- [ ] ZIP uploaded to R2 bucket (`shukto-pdfs`) with the exact filename above
- [ ] Razorpay Payment Link created for the pack at ₹399
- [ ] Razorpay success redirect URL set to `…/books/ai-agency-ops-pack/thank-you.html`
- [ ] Razorpay link URL pasted into admin panel → AI Agency Ops Pack → Step 4
- [ ] Razorpay webhook set up pointing to `/api/webhook/razorpay`
- [ ] `RAZORPAY_WEBHOOK_SECRET` env var set
- [ ] (Optional) Individual template Razorpay links created and added to `index.html`
- [ ] Test purchase completed and ZIP downloaded successfully

---

*AI Agency Operations Pack · Shukto Press · shuktoai@gmail.com*
