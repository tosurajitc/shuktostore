/**
 * SHUKTO PRESS — site-data.js
 * Loads editable homepage content from localStorage and renders it live.
 * Included in index.html only. Admin writes to the same keys.
 *
 * Keys used:
 *   sp_settings       — { publisher, email, tagline, navCta, navLinkBooks, navLinkAbout, footerBottomTagline }
 *   sp_homepage       — { heroLabel, heroTitle, heroSub, heroPrimary, heroGhost,
 *                         catalogHeading, catalogSubtitle,
 *                         aboutHeading, aboutSubtitle,
 *                         testimonialsHeading, trustItems[], testimonials[],
 *                         marqueeItems[] }
 *   sp_books          — book catalog (for cover images & prices)
 */

(function () {
  'use strict';

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; }
  }

  /* ── Default content (matches what is hard-coded in index.html) ──── */
  const DEFAULTS = {
    /* Nav */
    navLinkBooks: 'Books',
    navLinkAbout: 'About',
    navCta: 'Browse Books →',
    /* Hero */
    heroLabel:    'Shukto Press — Practical Books',
    heroTitle:    'Books that actually change how you work.',
    heroSub:      'No hype. No filler. Practical, framework-driven guides on AI, money, and the future of solo work — written to be re-read.',
    heroPrimary:  'Browse the catalog →',
    heroGhost:    'About Shukto Press',
    /* Catalog */
    catalogHeading:  'The full catalog',
    catalogSubtitle: 'Each tackles a topic that deserved a better treatment than it was getting.',
    /* About */
    aboutHeading: 'The Shukto Press promise',
    aboutSubtitle: 'Every book we publish passes the same test: could this have been a blog post? If yes, we don\'t publish it.',
    /* Testimonials */
    testimonialsHeading: 'What readers say',
    /* Footer */
    footerBottomTagline: 'Practical books for practical people.',
    /* Marquee */
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
      { icon: '🎯', title: 'Frameworks, not vibes', body: 'Every idea is turned into something you can apply — a matrix, a checklist, a blueprint, a step-by-step plan. No vague encouragement.' },
      { icon: '🔍', title: 'Honest about limits',   body: 'We tell you what AI can\'t do yet. We tell you what financial advice doesn\'t apply to irregular earners. We don\'t oversell.' },
      { icon: '📖', title: 'Written to be re-read', body: 'Dense in the right ways. Reference-grade appendices. Chapters you\'ll return to when you hit a new problem six months later.' }
    ],
    testimonials: [
      { quote: '', name: 'Reader Name', role: 'Role / Context — The One-Person Company', avatarInitial: 'A', avatarColor: '#B8874B' },
      { quote: '', name: 'Reader Name', role: 'Role / Context — Money, Sorted',          avatarInitial: 'B', avatarColor: '#DD7C3F' },
      { quote: '', name: 'Reader Name', role: 'Role / Context — AI with Sayuj',           avatarInitial: 'C', avatarColor: '#2FAE9D' }
    ]
  };

  function applyAll() {
    const settings = load('sp_settings', {});
    const hp       = load('sp_homepage', {});
    const books    = load('sp_books',    []);

    /* ── Site-wide: email ───────────────────────────────────────── */
    const email = settings.email || 'shuktoai@gmail.com';
    document.querySelectorAll('[data-sp="contact-email"]').forEach(el => {
      el.textContent = email;
      if (el.tagName === 'A') el.href = 'mailto:' + email;
    });

    /* ── Publisher name ─────────────────────────────────────────── */
    const pub = settings.publisher || 'Shukto Press';
    document.querySelectorAll('[data-sp="publisher"]').forEach(el => { el.textContent = pub; });

    /* ── Tagline ────────────────────────────────────────────────── */
    const tagline = settings.tagline || 'Practical, non-hyped eBooks on AI, money, and the future of work. Written by Shukto.';
    document.querySelectorAll('[data-sp="tagline"]').forEach(el => { el.textContent = tagline; });

    /* ── Nav links ──────────────────────────────────────────────── */
    const navBooks = document.getElementById('sp-nav-link-books');
    if (navBooks) navBooks.textContent = settings.navLinkBooks || DEFAULTS.navLinkBooks;
    const navAbout = document.getElementById('sp-nav-link-about');
    if (navAbout) navAbout.textContent = settings.navLinkAbout || DEFAULTS.navLinkAbout;
    const navCta = document.getElementById('sp-nav-cta');
    if (navCta) navCta.textContent = settings.navCta || DEFAULTS.navCta;

    /* ── Footer bottom tagline ──────────────────────────────────── */
    const ftEl = document.getElementById('sp-footer-bottom-tagline');
    if (ftEl) ftEl.textContent = settings.footerBottomTagline || DEFAULTS.footerBottomTagline;

    /* ── Hero label ─────────────────────────────────────────────── */
    const hlEl = document.getElementById('sp-hero-label-text');
    if (hlEl) hlEl.textContent = hp.heroLabel || DEFAULTS.heroLabel;

    /* ── Hero title, subtitle, CTAs ─────────────────────────────── */
    const htEl = document.getElementById('sp-hero-title');
    if (htEl && hp.heroTitle) htEl.textContent = hp.heroTitle;
    const hsEl = document.getElementById('sp-hero-sub');
    if (hsEl && hp.heroSub) hsEl.textContent = hp.heroSub;
    const hpEl = document.getElementById('sp-hero-cta-primary');
    if (hpEl && hp.heroPrimary) hpEl.textContent = hp.heroPrimary;
    const hgEl = document.getElementById('sp-hero-cta-ghost');
    if (hgEl && hp.heroGhost) hgEl.textContent = hp.heroGhost;

    /* ── Catalog heading + subtitle ─────────────────────────────── */
    const chEl = document.getElementById('sp-catalog-heading');
    if (chEl) chEl.textContent = hp.catalogHeading || DEFAULTS.catalogHeading;

    /* ── Testimonials heading ───────────────────────────────────── */
    const thEl = document.getElementById('sp-testimonials-heading');
    if (thEl) thEl.textContent = hp.testimonialsHeading || DEFAULTS.testimonialsHeading;

    /* ── About heading + subtitle ───────────────────────────────── */
    const ahEl = document.getElementById('sp-about-heading');
    const asEl = document.getElementById('sp-about-subtitle');
    if (ahEl) ahEl.textContent = hp.aboutHeading || DEFAULTS.aboutHeading;
    if (asEl) asEl.textContent = hp.aboutSubtitle || DEFAULTS.aboutSubtitle;

    /* ── Marquee ────────────────────────────────────────────────── */
    const marqueeItems = (hp.marqueeItems && hp.marqueeItems.length) ? hp.marqueeItems : DEFAULTS.marqueeItems;
    const marqueeTrack = document.getElementById('sp-marquee-track');
    if (marqueeTrack) {
      /* Duplicate the set once for a seamless CSS loop */
      const html = [...marqueeItems, ...marqueeItems]
        .map(text => `<div class="marquee-item">${esc(text)}</div>`)
        .join('');
      marqueeTrack.innerHTML = html;
    }

    /* ── Trust items ────────────────────────────────────────────── */
    const trustItems = (hp.trustItems && hp.trustItems.length) ? hp.trustItems : DEFAULTS.trustItems;
    const trustGrid = document.getElementById('sp-trust-grid');
    if (trustGrid) {
      trustGrid.innerHTML = trustItems.map((item, i) => `
        <div class="trust-item reveal${i > 0 ? ' reveal-delay-' + i : ''}">
          <span class="trust-icon">${esc(item.icon)}</span>
          <h3 class="trust-title">${esc(item.title)}</h3>
          <p class="trust-desc">${esc(item.body)}</p>
        </div>`).join('');
      // Re-run reveal observer for new elements
      if (window._spRevealObserver) {
        trustGrid.querySelectorAll('.reveal').forEach(el => window._spRevealObserver.observe(el));
      }
    }

    /* ── Testimonials ───────────────────────────────────────────── */
    const testimonials = (hp.testimonials && hp.testimonials.length) ? hp.testimonials : DEFAULTS.testimonials;
    const testGrid = document.getElementById('sp-testimonials-grid');
    if (testGrid) {
      testGrid.innerHTML = testimonials.map((t, i) => {
        const isEmpty = !t.quote || t.quote.trim() === '';
        return `
          <div class="quote-card reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}">
            <span class="quote-mark" style="color:${esc(t.avatarColor || '#B8874B')};">"</span>
            <p class="quote-text">${isEmpty ? '[TESTIMONIAL PLACEHOLDER — replace with real quote]' : esc(t.quote)}</p>
            <div class="quote-author">
              <div class="quote-avatar" style="background:${esc(t.avatarColor || '#B8874B')};">${esc(t.avatarInitial || '?')}</div>
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

    /* ── Hero cover stack — last 3 books, cover-only, no text ──── */
    const heroStack = document.getElementById('sp-hero-cover-stack');
    if (heroStack) {
      const stackBooks = books.length ? books.slice(-3) : [];
      // Fallback gradients for when no cover image is set
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

    /* ── Catalog — bento for first 3, overflow grid for the rest ── */
    const catalogGrid = document.getElementById('sp-catalog-grid');
    const catalogSubtitle = document.getElementById('sp-catalog-subtitle');
    if (catalogGrid) {
      const accentPalette = [
        { solid: '#B8874B', bg: 'rgba(184,135,75,0.12)', text: '#8A6030', grad: 'linear-gradient(135deg,#0A0E13 0%,#1E2940 50%,#12181F 100%)' },
        { solid: '#DD7C3F', bg: 'rgba(221,124,63,0.12)',  text: '#9A4B15', grad: 'linear-gradient(135deg,#1E3630 0%,#2A4F48 50%,#0F2A26 100%)' },
        { solid: '#2FAE9D', bg: 'rgba(47,174,157,0.12)',  text: '#1a7a6e', grad: 'linear-gradient(135deg,#0A2A28 0%,#1B5E57 50%,#0E3A35 100%)' },
        { solid: '#7C6AF5', bg: 'rgba(124,106,245,0.12)', text: '#4B3CBF', grad: 'linear-gradient(135deg,#1A1240 0%,#2E2470 50%,#110E30 100%)' },
        { solid: '#E05C8A', bg: 'rgba(224,92,138,0.12)',  text: '#A02050', grad: 'linear-gradient(135deg,#2A0A18 0%,#5A1535 50%,#200812 100%)' },
      ];

      /* Normalise price — strip any existing currency symbol, always prefix ₹ */
      function fmtPrice(raw) {
        const stripped = String(raw || '').replace(/^[\s$£€₹₩¥]+/, '').trim();
        return stripped ? '₹' + stripped : '';
      }

      /* Build a single card element — cover sized by aspect-ratio CSS */
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
      const displayBooks = books.length ? books : [];

      /* ── Uniform grid — all books equal columns ─────────────── */
      if (displayBooks.length) {
        const grid = document.createElement('div');
        grid.className = 'catalog-uniform-grid';
        displayBooks.forEach((book, i) => {
          const cell = document.createElement('div');
          cell.className = `reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 4) : ''}`;
          cell.appendChild(makeCard(book, i));
          grid.appendChild(cell);
          if (window._spRevealObserver) window._spRevealObserver.observe(cell);
        });
        catalogGrid.appendChild(grid);
      }

      // Update subtitle with book count + editable tail
      if (catalogSubtitle) {
        const tail = hp.catalogSubtitle || DEFAULTS.catalogSubtitle;
        if (displayBooks.length) {
          const n = displayBooks.length;
          catalogSubtitle.textContent = `${n} book${n === 1 ? '' : 's'}. ${tail}`;
        } else {
          catalogSubtitle.textContent = tail;
        }
      }
    }

    /* ── Footer books nav ───────────────────────────────────────── */
    const footerBooksNav = document.getElementById('sp-footer-books-nav');
    if (footerBooksNav && books.length) {
      footerBooksNav.innerHTML = books.map(b => {
        const slug  = b.slug || b.id || '';
        const title = esc(b.title || slug);
        return `<a href="books/${slug}/index.html">${title}</a>`;
      }).join('');
    }

    /* ── Footer copyright year ──────────────────────────────────── */
    document.querySelectorAll('[data-sp="year"]').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }

  /* Expose for admin preview */
  window._spApplyAll = applyAll;
})();
