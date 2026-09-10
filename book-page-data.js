/**
 * SHUKTO PRESS — book-page-data.js
 * Runtime patcher for individual book sales pages.
 * Reads the book's stored data from localStorage (sp_books) and live-patches:
 *   - Hero cover image (swaps gradient placeholder for real cover)
 *   - Price text (all [data-sp-price] elements)
 *   - Author name, bio, avatar initial / photo
 *   - Razorpay payment links (all [data-sp-razorpay] href attributes)
 *   - Bento "What's Inside" grid  [data-sp-bento]
 *   - Stat strip                  [data-sp-stats]
 *   - "For you if" list           [data-sp-for-list]
 *   - "Not for you if" list       [data-sp-not-for-list]
 *   - FAQ accordion               [data-sp-faq-list]
 *   - Pricing features list       [data-sp-pricing-features]
 *   - "What readers say" cards    [data-sp-testimonials]
 *   - "Where to Start" steps      [data-sp-start-steps]
 *   - "You might also like" grid  [data-sp-also-like]
 *
 * Each sales page must include:
 *   <body data-sp-slug="one-person-company">
 * and tag patchable elements with data-sp-* attributes (see below).
 *
 * Loaded after main.js on every book sales/thank-you page.
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Observe a newly injected element for scroll-reveal */
  function observe(el) {
    if (window._spRevealObserver) window._spRevealObserver.observe(el);
  }

  /* ── Geo: detect visitor country, cache in sessionStorage ───── */
  async function fetchCountry() {
    const cached = sessionStorage.getItem('sp_country');
    if (cached) return cached;
    try {
      const res = await fetch('/api/geo');
      if (!res.ok) throw new Error(res.status);
      const { country } = await res.json();
      const code = (country || 'IN').toUpperCase();
      sessionStorage.setItem('sp_country', code);
      return code;
    } catch {
      return 'IN';
    }
  }

  /* ── Convert INR price string to USD if outside India ─────────
     book.price is stored as a plain number string, e.g. "99".
     USD = INR × 0.1, rounded to 2 decimal places.               */
  function localisePrice(rawPrice, country) {
    if (country === 'IN') return { text: '₹' + rawPrice, isUsd: false };
    const inr = parseFloat(rawPrice);
    if (isNaN(inr)) return { text: rawPrice, isUsd: false };
    const usd = (inr * 0.1).toFixed(2);
    return { text: '$' + usd, isUsd: true };
  }

  /* ── Fetch books from API, fall back to localStorage ─────────── */
  async function fetchBooks() {
    try {
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error(res.status);
      const books = await res.json();
      // Keep localStorage in sync for admin preview
      localStorage.setItem('sp_books', JSON.stringify(books));
      return books;
    } catch (e) {
      // Fallback: localStorage (local dev / offline)
      try { return JSON.parse(localStorage.getItem('sp_books') || '[]'); } catch { return []; }
    }
  }

  /* ── Fetch bundles from API, fall back to localStorage ───────── */
  async function fetchBundles() {
    try {
      const res = await fetch('/api/bundles');
      if (!res.ok) throw new Error(res.status);
      const bundles = await res.json();
      localStorage.setItem('sp_bundles', JSON.stringify(bundles));
      return bundles;
    } catch (e) {
      try { return JSON.parse(localStorage.getItem('sp_bundles') || '[]'); } catch { return []; }
    }
  }

  function applyBookData(books, country) {
    /* Determine which book this page belongs to. */
    const slug      = document.body.dataset.spSlug;
    const slugAlias = document.body.dataset.spSlugAlias || '';
    if (!slug) return;

    const book = books.find(b =>
      (b.slug === slug)      || (b.id === slug) ||
      (b.slug === slugAlias) || (b.id === slugAlias)
    );
    if (!book) return;
    document.body.dataset.spProductType = book.productType || 'book';

    /* Resolve accent color for dynamic renders */
    const accent = book.accent || '#E8541A';

    /* ── Page <title> ──────────────────────────────────────────── */
    if (book.title) {
      const titleEl = document.querySelector('[data-sp-page-title]');
      if (titleEl) titleEl.textContent = book.title + ' — Shukto Press';
    }

    /* ── Hero / section background colours ─────────────────────── */
    if (book.heroBg) {
      document.querySelectorAll('[data-sp-hero-bg]').forEach(el => {
        el.style.background = book.heroBg;
      });
      document.querySelectorAll('[data-sp-promise-bg]').forEach(el => {
        el.style.background = book.heroBg;
      });
      document.querySelectorAll('[data-sp-cta-bg]').forEach(el => {
        el.style.background = book.heroBg;
      });
    }

    /* ── Title (all elements) ───────────────────────────────────── */
    if (book.title) {
      document.querySelectorAll('[data-sp-title]').forEach(el => {
        el.textContent = book.title;
      });
    }

    /* ── Subtitle ───────────────────────────────────────────────── */
    if (book.subtitle) {
      document.querySelectorAll('[data-sp-subtitle]').forEach(el => {
        el.textContent = book.subtitle;
      });
    }

    /* ── Audience line ──────────────────────────────────────────── */
    if (book.audienceLine) {
      document.querySelectorAll('[data-sp-audience-line]').forEach(el => {
        el.textContent = book.audienceLine;
      });
    }

    /* ── Pull quote ─────────────────────────────────────────────── */
    if (book.pullQuote) {
      document.querySelectorAll('[data-sp-pull-quote]').forEach(el => {
        el.textContent = book.pullQuote;
      });
    }

    /* ── Promise eyebrow label ──────────────────────────────────── */
    if (book.promiseEyebrow) {
      document.querySelectorAll('[data-sp-promise-eyebrow]').forEach(el => {
        el.textContent = book.promiseEyebrow;
      });
    }

    /* ── Promise heading + body ─────────────────────────────────── */
    if (book.promiseHeading) {
      document.querySelectorAll('[data-sp-promise-heading]').forEach(el => {
        el.textContent = book.promiseHeading;
      });
    }
    if (book.promiseBody) {
      document.querySelectorAll('[data-sp-promise-body]').forEach(el => {
        el.textContent = book.promiseBody;
      });
    }

    /* ── Promise framework cards (3 cards: icon, title, body) ───── */
    if (book.promiseCards && Array.isArray(book.promiseCards)) {
      book.promiseCards.forEach((card, i) => {
        const n = i + 1;
        if (card.icon) {
          document.querySelectorAll(`[data-sp-promise-card-icon-${n}]`).forEach(el => {
            el.textContent = card.icon;
          });
        }
        if (card.title) {
          document.querySelectorAll(`[data-sp-promise-card-title-${n}]`).forEach(el => {
            el.textContent = card.title;
          });
        }
        if (card.body) {
          document.querySelectorAll(`[data-sp-promise-card-body-${n}]`).forEach(el => {
            el.textContent = card.body;
          });
        }
      });
    }

    /* ── Gap section (heading + two body paragraphs) ────────────── */
    if (book.gapHeading) {
      document.querySelectorAll('[data-sp-gap-heading]').forEach(el => {
        el.textContent = book.gapHeading;
      });
    }
    if (book.gapBody1) {
      document.querySelectorAll('[data-sp-gap-body-1]').forEach(el => {
        el.textContent = book.gapBody1;
      });
    }
    if (book.gapBody2) {
      document.querySelectorAll('[data-sp-gap-body-2]').forEach(el => {
        el.textContent = book.gapBody2;
      });
    }

    /* ── CTA heading + body ─────────────────────────────────────── */
    if (book.ctaHeading) {
      document.querySelectorAll('[data-sp-cta-heading]').forEach(el => {
        el.textContent = book.ctaHeading;
      });
    }
    if (book.ctaBody) {
      /* ctaBody may contain a price span — rebuild to preserve it */
      document.querySelectorAll('[data-sp-cta-body]').forEach(el => {
        /* Keep any child [data-sp-price] spans intact */
        const priceSpan = el.querySelector('[data-sp-price]');
        if (priceSpan) {
          el.childNodes.forEach(n => { if (n !== priceSpan) n.remove && n.remove(); });
          el.insertBefore(document.createTextNode(book.ctaBody + ' '), priceSpan);
        } else {
          el.textContent = book.ctaBody;
        }
      });
    }

    /* ── Positioning (description paragraph) ───────────────────── */
    if (book.positioning) {
      document.querySelectorAll('[data-sp-positioning]').forEach(el => {
        el.textContent = book.positioning;
      });
    }

    /* ── Price ─────────────────────────────────────────────────── */
    if (book.price) {
      const priceStr = localisePrice(book.price, country);
      document.querySelectorAll('[data-sp-price]').forEach(el => {
        el.textContent = priceStr.text;
      });
      /* Also patch the CTA button text that contains the price inline */
      document.querySelectorAll('[data-sp-price-btn]').forEach(el => {
        const label = el.dataset.spPriceBtn || 'Get this eBook';
        el.textContent = label + ' — ' + priceStr.text + ' →';
      });
    }

    /* ── Payment link — Razorpay (India) or intlPayment (non-India) */
    const paymentUrl = (country !== 'IN' && book.intlPayment)
      ? book.intlPayment
      : (book.razorpay && !book.razorpay.startsWith('RAZORPAY_') ? book.razorpay : null);
    if (paymentUrl) {
      document.querySelectorAll('[data-sp-razorpay]').forEach(el => {
        el.href = paymentUrl;
      });
    }

    /* ── Download link (thank-you pages) ───────────────────────── */
    if (book.download && !book.download.startsWith('EBOOK_')) {
      document.querySelectorAll('[data-sp-download]').forEach(el => {
        el.href = book.download;
      });
    }

    /* ── Cover image ───────────────────────────────────────────── */
    if (book.cover) {
      document.querySelectorAll('[data-sp-cover]').forEach(el => {
        if (el.tagName === 'IMG') {
          el.src   = book.cover;
          el.style.display = 'block';
          /* Hide sibling placeholder if present */
          const placeholder = el.parentElement && el.parentElement.querySelector('[data-sp-cover-placeholder]');
          if (placeholder) placeholder.style.display = 'none';
        } else {
          /* Replace gradient placeholder div with a real <img> */
          const img = document.createElement('img');
          img.src = book.cover;
          img.alt = esc(book.title) + ' cover';
          img.style.cssText = el.style.cssText;
          /* Let the image determine its own height so the full cover shows
             without cropping (placeholder div had a fixed height). */
          img.style.height = 'auto';
          img.style.objectFit = 'contain';

          /* Preserve classes that control size/rotation */
          img.className = el.className;
          /* Copy data-tilt and data-base-rotation for the tilt effect */
          if (el.dataset.tilt !== undefined) img.dataset.tilt = '';
          if (el.dataset.baseRotation) img.dataset.baseRotation = el.dataset.baseRotation;
          el.replaceWith(img);
          /* Re-init tilt if main.js exposes the initialiser */
          if (window._spInitTilt) window._spInitTilt(img);
        }
      });
    }

    /* ── Author section ────────────────────────────────────────── */
    const authorName    = book.authorBioName || book.author || '';
    const authorBio     = book.authorBio     || '';
    const authorInitial = book.authorInitial || (authorName[0] || 'A').toUpperCase();
    const authorPhoto   = book.authorPhoto   || null;

    if (authorName) {
      document.querySelectorAll('[data-sp-author-name]').forEach(el => { el.textContent = authorName; });
    }
    if (authorBio) {
      document.querySelectorAll('[data-sp-author-bio]').forEach(el => { el.textContent = authorBio; });
    }

    /* Avatar: photo takes priority over initial */
    document.querySelectorAll('[data-sp-author-avatar]').forEach(el => {
      if (authorPhoto) {
        /* Replace the avatar div with an <img> circle */
        const img = document.createElement('img');
        img.src = authorPhoto;
        img.alt = authorName + ' photo';
        img.style.cssText = 'width:90px;height:90px;border-radius:50%;object-fit:cover;flex-shrink:0;';
        img.className = el.className;
        el.replaceWith(img);
      } else {
        /* Update the initial text */
        el.textContent = authorInitial;
      }
    });

    /* ── Bento "What's Inside" grid ────────────────────────────── */
    if (book.insideItems && book.insideItems.length) {
      document.querySelectorAll('[data-sp-bento]').forEach(container => {
        container.innerHTML = book.insideItems.map((item, i) => {
          const isFirst = i === 0;
          const delay   = i > 0 ? ` reveal-delay-${Math.min(i, 4)}` : '';
          const spanCls = isFirst ? 'span-3 row-2' : 'span-3';
          const firstStyle = isFirst
            ? `background:linear-gradient(145deg,${accent}22,${accent}11 60%,transparent);border-color:${accent}33;`
            : '';
          return `<div class="bento-cell ${spanCls} reveal${delay}" style="${firstStyle}">` +
            `<div class="bento-icon" style="background:${accent}18;">${esc(item.icon || '📌')}</div>` +
            `<div class="bento-cell-title">${esc(item.title)}</div>` +
            `<div class="bento-cell-body">${esc(item.body)}</div>` +
            `</div>`;
        }).join('');
        container.querySelectorAll('.reveal').forEach(observe);
      });
    }

    /* ── Stat strip ────────────────────────────────────────────── */
    if (book.stats && book.stats.length) {
      document.querySelectorAll('[data-sp-stats]').forEach(container => {
        container.innerHTML = book.stats.map((s, i) => {
          const delay = i > 0 ? ` reveal-delay-${i}` : '';
          const numStyle = i === 0 ? `style="color:${accent};"` : '';
          return `<div class="stat-item reveal${delay}">` +
            `<span class="stat-number" ${numStyle}>${esc(s.num)}</span>` +
            `<span class="stat-label">${esc(s.label)}</span>` +
            `</div>`;
        }).join('');
        container.querySelectorAll('.reveal').forEach(observe);
      });
    }

    /* ── "For you if…" list ────────────────────────────────────── */
    if (book.forItems && book.forItems.length) {
      document.querySelectorAll('[data-sp-for-list]').forEach(container => {
        container.innerHTML = book.forItems.map(item =>
          `<li><span class="check">✓</span> ${esc(item)}</li>`
        ).join('');
      });
    }

    /* ── "Not for you if…" list ────────────────────────────────── */
    if (book.notForItems && book.notForItems.length) {
      document.querySelectorAll('[data-sp-not-for-list]').forEach(container => {
        container.innerHTML = book.notForItems.map(item =>
          `<li><span class="cross">✕</span> ${esc(item)}</li>`
        ).join('');
      });
    }

    /* ── FAQ accordion ─────────────────────────────────────────── */
    if (book.faqItems && book.faqItems.length) {
      document.querySelectorAll('[data-sp-faq-list]').forEach(container => {
        container.innerHTML = book.faqItems.map((item, i) => {
          const delay = i > 0 ? ` reveal-delay-${Math.min(i, 4)}` : '';
          return `<div class="faq-item reveal${delay}" style="--accent:${accent};">` +
            `<button class="faq-trigger" aria-expanded="false">${esc(item.q)}` +
            `<span class="faq-icon" aria-hidden="true">+</span></button>` +
            `<div class="faq-body" role="region">` +
            `<div class="faq-body-inner">${esc(item.a)}</div>` +
            `</div></div>`;
        }).join('');
        /* Re-bind accordion behaviour from main.js if available */
        if (window._spInitAccordion) {
          container.querySelectorAll('.faq-item').forEach(window._spInitAccordion);
        } else {
          /* Inline fallback: mirrors main.js one-open accordion logic */
          const newItems = container.querySelectorAll('.faq-item');
          newItems.forEach(item => {
            const trigger = item.querySelector('.faq-trigger');
            if (!trigger) return;
            trigger.addEventListener('click', () => {
              const isOpen = item.classList.contains('open');
              newItems.forEach(i => {
                i.classList.remove('open');
                const t = i.querySelector('.faq-trigger');
                if (t) t.setAttribute('aria-expanded', 'false');
              });
              if (!isOpen) {
                item.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
              }
            });
          });
        }
        container.querySelectorAll('.reveal').forEach(observe);
      });
    } else {
      /* No FAQ items — hide the entire section so it takes no space */
      document.querySelectorAll('[data-sp-faq-list]').forEach(container => {
        const section = container.closest('section');
        if (section) section.style.display = 'none';
      });
    }

    /* ── Pricing features list ─────────────────────────────────── */
    if (book.pricingFeatures && book.pricingFeatures.length) {
      document.querySelectorAll('[data-sp-pricing-features]').forEach(container => {
        container.innerHTML = book.pricingFeatures.map(f =>
          `<li><span class="pricing-check" style="background:${accent};">✓</span> ${esc(f)}</li>`
        ).join('');
      });
    }

    /* ── "What readers say" testimonials ───────────────────────── */
    if (book.bookTestimonials && book.bookTestimonials.length) {
      document.querySelectorAll('[data-sp-testimonials]').forEach(container => {
        container.innerHTML = book.bookTestimonials.map((t, i) => {
          const delay = i > 0 ? ` reveal-delay-${Math.min(i, 4)}` : '';
          const initial = esc((t.avatarInitial || (t.name ? t.name[0] : 'R')).toUpperCase());
          const quoteText = t.quote
            ? esc(t.quote)
            : '[TESTIMONIAL PLACEHOLDER — replace with real quote]';
          return `<div class="quote-card reveal${delay}">` +
            `<span class="quote-mark" style="color:${accent};">"</span>` +
            `<p class="quote-text">${quoteText}</p>` +
            `<div class="quote-author">` +
            `<div class="quote-avatar" style="background:${accent};">${initial}</div>` +
            `<div><div class="quote-meta-name">${esc(t.name || 'Reader Name')}</div>` +
            `<div class="quote-meta-role">${esc(t.role || '')}</div></div>` +
            `</div></div>`;
        }).join('');
        container.querySelectorAll('.reveal').forEach(observe);
      });
    }

    /* ── "Where to Start" steps (thank-you pages) ──────────────── */
    if (book.startSteps && book.startSteps.length) {
      document.querySelectorAll('[data-sp-start-steps]').forEach(container => {
        container.innerHTML = book.startSteps.map((s, i) =>
          `<div class="step-item">` +
          `<div class="step-num">${i + 1}</div>` +
          `<div class="step-text">` +
          `<div class="step-title">${esc(s.title)}</div>` +
          `<p style="font-size:0.9375rem;color:var(--text-secondary);">${esc(s.body)}</p>` +
          `</div></div>`
        ).join('');
      });
    }

    /* ── Bundle offer section ──────────────────────────────────── */
    /* Rendered into any [data-sp-bundle] element present on the page.
       Populated later by applyBundleData() which receives the bundles array. */

    /* ── "You might also like" grid ────────────────────────────── */
    document.querySelectorAll('[data-sp-also-like]').forEach(container => {
      /* All products (books + templates) live under /books/<slug>/ */
      const others = books.filter(b => b.slug !== slug && b.title);
      if (!others.length) return;
      /* Shuffle and pick up to 3 */
      const shuffled = others.slice().sort(() => Math.random() - 0.5).slice(0, 3);
      container.innerHTML = shuffled.map((b, i) => {
        const delay = i > 0 ? ` reveal-delay-${i}` : '';
        const cardBg = b.heroBg || '#0A0E13';
        const cardAccent = b.accent || '#E8541A';
        /* All products live one level up relative to any book/template page */
        const href = `../${b.slug}/index.html`;
        const coverInner = b.cover
          ? `<img src="${b.cover}" alt="${esc(b.title)}" style="width:100%;height:100%;object-fit:cover;"/>`
          : `<div style="font-family:var(--font-display);font-size:1.25rem;font-weight:800;color:white;line-height:1.15;">${esc(b.title)}</div>`;
        return `<a href="${href}" style="background:white;border-radius:var(--radius-xl);overflow:hidden;border:1px solid var(--divider);display:flex;flex-direction:column;transition:transform var(--duration-base) var(--ease-out),box-shadow var(--duration-base) var(--ease-out);text-decoration:none;" class="reveal${delay}">` +
          `<div style="height:180px;background:${cardBg};display:flex;align-items:flex-end;padding:1.5rem;">${coverInner}</div>` +
          `<div style="padding:1.25rem;">` +
          `<span style="font-size:0.75rem;font-weight:600;color:${cardAccent};background:${cardAccent}1a;padding:0.25rem 0.75rem;border-radius:9999px;">${esc(b.category || 'eBook')}</span>` +
          `<p style="font-size:0.875rem;color:var(--text-secondary);margin-top:0.75rem;line-height:1.5;">${esc(b.positioning || b.subtitle || '')}</p>` +
          `</div></a>`;
      }).join('');
      container.querySelectorAll('.reveal').forEach(observe);
    });
  }

  /* ── Bundle rendering ──────────────────────────────────────── */
  function applyBundleData(books, bundles) {
    const slug = document.body.dataset.spSlug;
    if (!slug || !bundles || !bundles.length) return;

    /* Find bundles that include this book */
    const relevantBundles = bundles.filter(b =>
      b.bookSlugs && b.bookSlugs.includes(slug)
    );
    if (!relevantBundles.length) return;

    document.querySelectorAll('[data-sp-bundle]').forEach(container => {
      container.innerHTML = relevantBundles.map(bundle => {
        /* Resolve titles for all other books in the bundle */
        const otherBooks = (bundle.bookSlugs || [])
          .filter(s => s !== slug)
          .map(s => {
            const b = books.find(x => x.slug === s || x.id === s);
            return b ? b.title : s;
          });

        const hasRazorpay = bundle.razorpay && !bundle.razorpay.startsWith('BUNDLE_');
        const btnHref = hasRazorpay ? esc(bundle.razorpay) : '#';
        const crossedPrice = bundle.originalPrice
          ? `<span style="text-decoration:line-through;opacity:0.45;margin-left:0.5rem;font-size:0.9375rem;">${esc(bundle.originalPrice)}</span>`
          : '';

        return `<div style="background:linear-gradient(135deg,var(--paper-warm),var(--paper));border:1.5px solid var(--divider);border-radius:var(--radius-xl);padding:2rem;display:flex;flex-direction:column;gap:1.25rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
            <span style="font-size:1.375rem;">🎁</span>
            <span style="font-family:var(--font-display);font-size:1.125rem;font-weight:800;letter-spacing:-0.02em;color:var(--ink);">${esc(bundle.title)}</span>
            ${bundle.badge ? `<span style="font-size:0.6875rem;font-weight:700;padding:3px 10px;border-radius:9999px;background:rgba(47,174,157,0.12);color:#2FAE9D;letter-spacing:0.04em;">${esc(bundle.badge)}</span>` : ''}
          </div>
          ${bundle.description ? `<p style="font-size:0.9375rem;color:var(--text-secondary);line-height:1.65;margin:0;">${esc(bundle.description)}</p>` : ''}
          ${otherBooks.length ? `<div style="font-size:0.875rem;color:var(--text-secondary);">Also includes: <strong style="color:var(--ink);">${otherBooks.map(esc).join(', ')}</strong></div>` : ''}
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
            <span style="font-family:var(--font-display);font-size:1.75rem;font-weight:800;color:var(--ink);">${esc(bundle.bundlePrice)}${crossedPrice}</span>
            <a href="${btnHref}" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.875rem 1.75rem;border-radius:9999px;background:var(--ink);color:white;font-weight:700;font-size:1rem;text-decoration:none;transition:opacity 150ms;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
              Get the bundle →
            </a>
          </div>
          <p style="font-size:0.75rem;color:var(--text-muted);margin:0;">Secure payment via Razorpay · 30-day refund guarantee</p>
        </div>`;
      }).join('');
      container.querySelectorAll('.reveal').forEach(el => {
        if (window._spRevealObserver) window._spRevealObserver.observe(el);
      });
    });
  }

  async function init() {
    const [books, bundles, country] = await Promise.all([fetchBooks(), fetchBundles(), fetchCountry()]);
    applyBookData(books, country);
    applyBundleData(books, bundles);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window._spApplyBookData = function () {
    try {
      const books   = JSON.parse(localStorage.getItem('sp_books')   || '[]');
      const bundles = JSON.parse(localStorage.getItem('sp_bundles') || '[]');
      const country = sessionStorage.getItem('sp_country') || 'IN';
      applyBookData(books, country);
      applyBundleData(books, bundles);
    } catch {
      applyBookData([], 'IN');
    }
  };
})();
