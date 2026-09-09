/**
 * SHUKTO PRESS — site-data.js
 * Loads homepage content from the API (/api/books, /api/settings, /api/homepage)
 * and renders it live. Falls back to localStorage for local development.
 *
 * Included in index.html only.
 */

(function () {
  'use strict';

  /* ── Fetch helpers ───────────────────────────────────────────── */
  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  /* ── localStorage fallback (local dev only) ──────────────────── */
  function loadLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; }
  }

  /* ── Default content (matches hard-coded index.html) ──────────── */
  const DEFAULTS = {
    navLinkBooks: 'Books',
    navLinkAbout: 'About',
    navCta: 'Browse Books →',
    heroLabel:    'Shukto Press — Practical Books',
    heroTitle:    'Books that actually change how you work.',
    heroSub:      'No hype. No filler. Practical, framework-driven guides on AI, money, and the future of solo work — written to be re-read.',
    heroPrimary:  'Browse the catalog →',
    heroGhost:    'About Shukto Press',
    catalogHeading:  'The full catalog',
    catalogSubtitle: 'Each tackles a topic that deserved a better treatment than it was getting.',
    aboutHeading: 'Why Shukto exists',
    aboutSubtitle: 'Most \u201cknowledge\u201d online is either too shallow to use or too bloated to finish. Shukto sits right in between: short enough to read in a weekend, sharp enough to actually change something.',
    testimonialsHeading: 'What readers say',
    footerBottomTagline: 'Practical books for practical people.',
    marqueeItems: [
      '📚 Practical frameworks, not fluff',
      '💡 Built for non-technical readers',
      '🔄 Written to be re-read',
      '📊 Real worksheets inside',
      '🚫 No get-rich promises',
      '✅ Written by practitioners',
      '🤖 Honest about AI limits',
      '💰 Built for irregular income',
      '🧒 Kid-to-kid writing, not adult-to-kid'
    ],
    trustItems: [
      {
        icon: '',
        title: 'Built by practitioners, not content farms',
        body: 'Every book is written, tested, and edited by an expert with real-world experience—never assembled by an agency chasing algorithmic volume.'
      },
      {
        icon: '',
        title: 'Rigorously verified data',
        body: 'Nothing is published on a hunch. Every framework, statistic, and strategic insight is meticulously checked against credible sources before a book goes out.'
      },
      {
        icon: '',
        title: 'One problem, deeply solved',
        body: 'Each book isolates a single, high-stakes operational problem and goes incredibly deep, rather than skimming the surface of twenty separate topics.'
      }
    ],
    testimonials: [
      { quote: '', name: 'Reader Name', role: 'Role / Context — The One-Person Company', avatarInitial: 'A', avatarColor: '#E8541A' },
      { quote: '', name: 'Reader Name', role: 'Role / Context — Money, Sorted',          avatarInitial: 'B', avatarColor: '#DD7C3F' },
      { quote: '', name: 'Reader Name', role: 'Role / Context — AI with Sayuj',           avatarInitial: 'C', avatarColor: '#2FAE9D' }
    ]
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function applyAll(settings, hp, books) {
    settings = settings || {};
    hp       = hp       || {};
    books    = books    || [];

    /* ── Email ───────────────────────────────────────────────── */
    const email = settings.email || 'shuktoai@gmail.com';
    document.querySelectorAll('[data-sp="contact-email"]').forEach(el => {
      el.textContent = email;
      if (el.tagName === 'A') el.href = 'mailto:' + email;
    });

    /* ── Publisher name ──────────────────────────────────────── */
    const pub = settings.publisher || 'Shukto Press';
    document.querySelectorAll('[data-sp="publisher"]').forEach(el => { el.textContent = pub; });

    /* ── Tagline ─────────────────────────────────────────────── */
    const tagline = settings.tagline || 'Practical, non-hyped eBooks on AI, money, and the future of work. Written by Shukto.';
    document.querySelectorAll('[data-sp="tagline"]').forEach(el => { el.textContent = tagline; });

    /* ── Nav links ───────────────────────────────────────────── */
    const navBooks = document.getElementById('sp-nav-link-books');
    if (navBooks) navBooks.textContent = settings.navLinkBooks || DEFAULTS.navLinkBooks;
    const navAbout = document.getElementById('sp-nav-link-about');
    if (navAbout) navAbout.textContent = settings.navLinkAbout || DEFAULTS.navLinkAbout;
    const navCta = document.getElementById('sp-nav-cta');
    if (navCta) navCta.textContent = settings.navCta || DEFAULTS.navCta;

    /* ── Footer bottom tagline ───────────────────────────────── */
    const ftEl = document.getElementById('sp-footer-bottom-tagline');
    if (ftEl) ftEl.textContent = settings.footerBottomTagline || DEFAULTS.footerBottomTagline;

    /* ── Hero label ──────────────────────────────────────────── */
    const hlEl = document.getElementById('sp-hero-label-text');
    if (hlEl) hlEl.textContent = hp.heroLabel || DEFAULTS.heroLabel;

    /* ── Hero title, subtitle, CTAs ──────────────────────────── */
    const htEl = document.getElementById('sp-hero-title');
    if (htEl && hp.heroTitle) htEl.innerHTML = hp.heroTitle;
    const hsEl = document.getElementById('sp-hero-sub');
    if (hsEl && hp.heroSub) hsEl.textContent = hp.heroSub;
    const hpEl = document.getElementById('sp-hero-cta-primary');
    if (hpEl && hp.heroPrimary) hpEl.textContent = hp.heroPrimary;
    const hgEl = document.getElementById('sp-hero-cta-ghost');
    if (hgEl && hp.heroGhost) hgEl.textContent = hp.heroGhost;

    /* ── Catalog heading + subtitle ──────────────────────────── */
    const chEl = document.getElementById('sp-catalog-heading');
    if (chEl) chEl.textContent = hp.catalogHeading || DEFAULTS.catalogHeading;

    /* ── Testimonials heading ────────────────────────────────── */
    const thEl = document.getElementById('sp-testimonials-heading');
    if (thEl) thEl.textContent = hp.testimonialsHeading || DEFAULTS.testimonialsHeading;

    /* ── About heading + subtitle ────────────────────────────── */
    const ahEl = document.getElementById('sp-about-heading');
    const asEl = document.getElementById('sp-about-subtitle');
    if (ahEl) ahEl.textContent = hp.aboutHeading || DEFAULTS.aboutHeading;
    if (asEl) asEl.textContent = hp.aboutSubtitle || DEFAULTS.aboutSubtitle;

    /* ── Marquee ─────────────────────────────────────────────── */
    const marqueeItems = (hp.marqueeItems && hp.marqueeItems.length) ? hp.marqueeItems : DEFAULTS.marqueeItems;
    const marqueeTrack = document.getElementById('sp-marquee-track');
    if (marqueeTrack) {
      const html = [...marqueeItems, ...marqueeItems]
        .map(text => `<div class="marquee-item">${esc(text)}</div>`)
        .join('');
      marqueeTrack.innerHTML = html;
    }

    /* ── Trust items ─────────────────────────────────────────── */
    const trustItems = (hp.trustItems && hp.trustItems.length) ? hp.trustItems : DEFAULTS.trustItems;
    const trustGrid = document.getElementById('sp-trust-grid');
    if (trustGrid) {
      trustGrid.innerHTML = trustItems.map((item, i) => `
        <div class="trust-item reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}">
          <div class="trust-body">
            <h3 class="trust-title">${esc(item.title)}</h3>
            <p class="trust-desc">${esc(item.body)}</p>
          </div>
        </div>`).join('');
      if (window._spRevealObserver) {
        trustGrid.querySelectorAll('.reveal').forEach(el => window._spRevealObserver.observe(el));
      }
    }

    /* ── Testimonials ────────────────────────────────────────── */
    const testimonials = (hp.testimonials && hp.testimonials.length) ? hp.testimonials : DEFAULTS.testimonials;
    const testGrid = document.getElementById('sp-testimonials-grid');
    if (testGrid) {
      testGrid.innerHTML = testimonials.map((t, i) => {
        const isEmpty = !t.quote || t.quote.trim() === '';
        return `
          <div class="quote-card reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}">
            <span class="quote-mark" style="color:${esc(t.avatarColor || '#E8541A')};">"</span>
            <p class="quote-text">${isEmpty ? '[TESTIMONIAL PLACEHOLDER — replace with real quote]' : esc(t.quote)}</p>
            <div class="quote-author">
              <div class="quote-avatar" style="background:${esc(t.avatarColor || '#E8541A')};">${esc(t.avatarInitial || '?')}</div>
              <div>
                <div class="quote-meta-name">${esc(t.name || 'Reader Name')}</div>
                <div class="quote-meta-role">${esc(t.role || '')}</div>
              </div>
            </div>
          </div>`;
      }).join('');
      if (window._spRevealObserver) {
        testGrid.querySelectorAll('.reveal').forEach(el => window._spRevealObserver.observe(el));
      }
    }

    /* ── Hero cover stack ────────────────────────────────────── */
    const heroStack = document.getElementById('sp-hero-cover-stack');
    if (heroStack) {
      const stackBooks = books.length ? books.slice(-3) : [];
      const fallbackGrads = [
        'linear-gradient(135deg,#0A0E13 0%,#1E2940 50%,#12181F 100%)',
        'linear-gradient(135deg,#1E3630 0%,#2A4F48 50%,#0F2A26 100%)',
        'linear-gradient(135deg,#0A2A28 0%,#1B5E57 50%,#0E3A35 100%)'
      ];
      const posClass = ['b1', 'b2', 'b3'];
      heroStack.innerHTML = '';
      stackBooks.forEach((book, i) => {
        const div = document.createElement('div');
        div.className = 'stack-book ' + posClass[i];
        div.style.borderRadius = 'var(--radius-lg)';
        div.style.boxShadow = 'var(--shadow-float)';
        div.style.overflow = 'hidden';
        if (book.cover) {
          const img = document.createElement('img');
          img.src = book.cover;
          img.alt = book.title || '';
          img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
          div.appendChild(img);
        } else {
          div.style.background = fallbackGrads[i] || fallbackGrads[0];
        }
        heroStack.appendChild(div);
      });
    }

    /* ── Catalog grid ────────────────────────────────────────── */
    const catalogGrid = document.getElementById('sp-catalog-grid');
    const catalogSubtitle = document.getElementById('sp-catalog-subtitle');
    if (catalogGrid) {
      const accentPalette = [
        { solid: '#E8541A', bg: 'rgba(232,84,26,0.12)', text: '#B83E10', grad: 'linear-gradient(135deg,#0A0E13 0%,#1E2940 50%,#12181F 100%)' },
        { solid: '#DD7C3F', bg: 'rgba(221,124,63,0.12)',  text: '#9A4B15', grad: 'linear-gradient(135deg,#1E3630 0%,#2A4F48 50%,#0F2A26 100%)' },
        { solid: '#2FAE9D', bg: 'rgba(47,174,157,0.12)',  text: '#1a7a6e', grad: 'linear-gradient(135deg,#0A2A28 0%,#1B5E57 50%,#0E3A35 100%)' },
        { solid: '#7C6AF5', bg: 'rgba(124,106,245,0.12)', text: '#4B3CBF', grad: 'linear-gradient(135deg,#1A1240 0%,#2E2470 50%,#110E30 100%)' },
        { solid: '#E05C8A', bg: 'rgba(224,92,138,0.12)',  text: '#A02050', grad: 'linear-gradient(135deg,#2A0A18 0%,#5A1535 50%,#200812 100%)' },
      ];

      function fmtPrice(raw) {
        const stripped = String(raw || '').replace(/^[\s$£€₹₩¥]+/, '').trim();
        return stripped ? '₹' + stripped : '';
      }

      function makeCard(book, i) {
        const ac = accentPalette[i % accentPalette.length];
        const slug        = book.slug || book.id || '';
        const title       = esc(book.title || 'Untitled');
        const tag         = esc(book.tag || book.genre || '');
        const desc        = esc(book.desc || book.description || '');
        const price       = fmtPrice(book.price);
        const accentSolid = book.accentSolid || ac.solid;
        const tagBg       = book.tagBg  || ac.bg;
        const tagText     = book.tagColor || ac.text;
        const grad        = book.coverPh || ac.grad;

        const coverInner = book.cover
          ? `<img src="${book.cover}" alt="${title} cover">`
          : `<div style="background:${grad};"></div>`;

        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <button class="home-book-card book-modal-trigger"
                  data-book="${slug}"
                  style="height:100%;width:100%;text-align:left;background:none;border:none;padding:0;cursor:pointer;"
                  aria-label="Preview ${title}">
            <div class="home-book-card-cover">
              ${coverInner}
            </div>
            <div class="home-book-card-body">
              ${tag ? `<span class="book-card-tag" style="background:${tagBg};color:${tagText};margin-bottom:0.75rem;">${tag}</span>` : ''}
              <h3 class="book-card-title">${title}</h3>
              ${desc ? `<p class="book-card-desc">${desc}</p>` : ''}
              <div class="book-card-footer">
                <span class="book-card-price" style="color:${accentSolid};">${price}</span>
                <span class="book-card-cta" style="background:${accentSolid};">Preview →</span>
              </div>
            </div>
          </button>`;
        wrap.querySelector('.book-modal-trigger').addEventListener('click', function () {
          if (window._spOpenBookModal) window._spOpenBookModal(this.dataset.book);
        });
        return wrap;
      }

      catalogGrid.innerHTML = '';
      if (books.length) {
        const grid = document.createElement('div');
        grid.className = 'catalog-uniform-grid';
        books.forEach((book, i) => {
          const cell = document.createElement('div');
          cell.className = `reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}`;
          cell.appendChild(makeCard(book, i));
          grid.appendChild(cell);
          if (window._spRevealObserver) window._spRevealObserver.observe(cell);
        });
        catalogGrid.appendChild(grid);
      }

      if (catalogSubtitle) {
        const tail = hp.catalogSubtitle || DEFAULTS.catalogSubtitle;
        if (books.length) {
          const n = books.length;
          catalogSubtitle.textContent = `${n} book${n === 1 ? '' : 's'}. ${tail}`;
        } else {
          catalogSubtitle.textContent = tail;
        }
      }
    }

    /* ── Footer books nav ────────────────────────────────────── */
    const footerBooksNav = document.getElementById('sp-footer-books-nav');
    if (footerBooksNav && books.length) {
      footerBooksNav.innerHTML = books.map(b => {
        const slug  = b.slug || b.id || '';
        const title = esc(b.title || slug);
        return `<a href="books/${slug}/index.html">${title}</a>`;
      }).join('');
    }

    /* ── Footer copyright year ───────────────────────────────── */
    document.querySelectorAll('[data-sp="year"]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ── Main: fetch from API, fall back to localStorage ─────────── */
  async function init() {
    // Try API first (production)
    const [books, settings, homepage] = await Promise.all([
      fetchJSON('/api/books'),
      fetchJSON('/api/settings'),
      fetchJSON('/api/homepage'),
    ]);

    // If API returned data, use it
    if (books !== null || settings !== null || homepage !== null) {
      applyAll(settings || {}, homepage || {}, books || []);
      // Also keep localStorage in sync for admin preview
      if (books)    localStorage.setItem('sp_books',    JSON.stringify(books));
      if (settings) localStorage.setItem('sp_settings', JSON.stringify(settings));
      if (homepage) localStorage.setItem('sp_homepage', JSON.stringify(homepage));
    } else {
      // Fallback: localStorage (local dev / offline)
      applyAll(
        loadLocal('sp_settings', {}),
        loadLocal('sp_homepage', {}),
        loadLocal('sp_books',    [])
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Expose for admin preview */
  window._spApplyAll = function () {
    applyAll(
      loadLocal('sp_settings', {}),
      loadLocal('sp_homepage', {}),
      loadLocal('sp_books',    [])
    );
  };
})();
