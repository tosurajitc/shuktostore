/**
 * SHUKTO PRESS — Shared JavaScript
 * Handles: nav scroll, scroll reveals, accordion FAQ,
 *           marquee, parallax tilt on mockup covers.
 */

/* ── NAV SCROLL BLUR ────────────────────────────────────────── */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const sentinel = document.getElementById('nav-sentinel');

  function updateNav() {
    const threshold = sentinel ? sentinel.getBoundingClientRect().bottom : 40;
    nav.classList.toggle('scrolled', threshold < 0 || window.scrollY > 40);
  }

  if (sentinel && window.IntersectionObserver) {
    const io = new IntersectionObserver(([e]) => {
      nav.classList.toggle('scrolled', !e.isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);
  } else {
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }
})();

/* ── SCROLL REVEAL ──────────────────────────────────────────── */
(function initReveal() {
  if (!window.IntersectionObserver) return;
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => io.observe(el));
  // Expose for site-data.js to observe dynamically injected elements
  window._spRevealObserver = io;
})();

/* ── FAQ ACCORDION ──────────────────────────────────────────── */
(function initAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all (one-open policy)
      items.forEach(i => {
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
})();

/* ── MOCKUP PARALLAX TILT ───────────────────────────────────── */
(function initTilt() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const targets = document.querySelectorAll('[data-tilt]');
  targets.forEach(el => {
    const wrap = el.closest('.hero-visual') || el.parentElement;
    if (!wrap) return;

    wrap.addEventListener('mousemove', e => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const baseRot = parseFloat(el.dataset.baseRotation || '0');
      el.style.transform = `rotate(${baseRot + dx * 4}deg) translateY(${-dy * 8}px)`;
    });

    wrap.addEventListener('mouseleave', () => {
      const baseRot = parseFloat(el.dataset.baseRotation || '0');
      el.style.transform = `rotate(${baseRot}deg) translateY(0)`;
    });
  });
})();

/* ── COVER STACK PARALLAX ───────────────────────────────────── */
(function initCoverStack() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  const stack = document.querySelector('.cover-stack');
  if (!stack) return;

  stack.addEventListener('mousemove', e => {
    const rect = stack.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const b1 = stack.querySelector('.b1');
    const b2 = stack.querySelector('.b2');
    const b3 = stack.querySelector('.b3');
    if (b1) b1.style.transform = `rotate(-6deg) translate(${dx * -8}px, ${dy * -4}px)`;
    if (b2) b2.style.transform = `rotate(2deg) translate(${dx * 4}px, ${dy * -10}px)`;
    if (b3) b3.style.transform = `rotate(8deg) translate(${dx * 10}px, ${dy * 4}px)`;
  });

  stack.addEventListener('mouseleave', () => {
    const b1 = stack.querySelector('.b1');
    const b2 = stack.querySelector('.b2');
    const b3 = stack.querySelector('.b3');
    if (b1) b1.style.transform = 'rotate(-6deg)';
    if (b2) b2.style.transform = 'rotate(2deg)';
    if (b3) b3.style.transform = 'rotate(8deg)';
  });
})();

/* ── NAV DATA (settings from localStorage) ──────────────────── */
(function initNavData() {
  try {
    var settings = JSON.parse(localStorage.getItem('sp_settings') || 'null') || {};
  } catch (e) {
    var settings = {};
  }

  /* Publisher name → all [data-sp="publisher"] elements */
  var pub = settings.publisher || '';
  if (pub) {
    document.querySelectorAll('[data-sp="publisher"]').forEach(function (el) {
      el.textContent = pub;
    });
  }

  /* Nav link labels */
  var booksEl = document.getElementById('sp-nav-link-books');
  if (booksEl && settings.navLinkBooks) booksEl.textContent = settings.navLinkBooks;
  var templatesEl = document.getElementById('sp-nav-link-templates');
  if (templatesEl && settings.navLinkTemplates) templatesEl.textContent = settings.navLinkTemplates;
  var aboutEl = document.getElementById('sp-nav-link-about');
  if (aboutEl && settings.navLinkAbout) aboutEl.textContent = settings.navLinkAbout;

  /* Main CTA text (homepage "Browse Books →") */
  var ctaEl = document.getElementById('sp-nav-cta');
  if (ctaEl && settings.navCta) ctaEl.textContent = settings.navCta;
})();

/* ── MOBILE NAV TOGGLE ──────────────────────────────────────── */
(function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
})();
