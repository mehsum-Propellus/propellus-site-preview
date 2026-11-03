/* =========================================================
   Propellus — Shared chrome (nav + footer + scroll behaviour)
   Usage:
     <div data-nav data-active="home"></div>
     <div data-footer></div>
     <script src="chrome.js" defer></script>
   ========================================================= */
(function () {
  const NAV_LINKS = [
    { id: 'agents',   label: 'For travel agents', href: 'agents.html' },
    { id: 'ota',      label: 'For OTAs',          href: 'ota.html' },
    { id: 'how',      label: 'How it works',      href: 'how-it-works.html' },
    { id: 'security', label: 'Security',          href: 'security.html' },
    { id: 'contact',  label: 'Contact',           href: 'contact.html' },
  ];

  const FOOTER_COLS = [
    { title: 'Product', links: [
      { label: 'For OTAs', href: 'ota.html' },
      { label: 'For travel agents', href: 'agents.html' },
      { label: 'How it works', href: 'how-it-works.html' },
      { label: 'Security', href: 'security.html' },
    ]},
    { title: 'Company', links: [
      { label: 'Visa processing partners', href: 'fulfillment-partners.html' },
      { label: 'About', href: 'about.html' },
      { label: 'Team', href: 'team.html' },
      { label: 'Investors', href: 'investors.html' },
      { label: 'Contact', href: 'contact.html' },
    ]},
    { title: 'Legal', links: [
      { label: 'Privacy Policy', href: 'privacy.html' },
      { label: 'Terms of Service', href: 'terms.html' },
    ]},
  ];

  // Propellus turbine logo — actual brand mark
  const LOGO_IMG = `<img src="propellus-logo.png" alt="" width="26" height="26" style="display:block;width:26px;height:26px;object-fit:contain;"/>`;

  function buildNav(activeId) {
    const linksHTML = NAV_LINKS.map(l =>
      `<a class="nav-link ${l.id === activeId ? 'active' : ''}" href="${l.href}">${l.label}</a>`
    ).join('');
    const mobileLinksHTML = NAV_LINKS.map(l => `<a class="${l.id === activeId ? 'active' : ''}" href="${l.href}">${l.label}</a>`).join('');

    return `
      <nav class="nav" id="propNav">
        <div class="nav-inner">
          <a class="nav-logo" href="index.html" aria-label="Propellus home">
            <span class="mark">${LOGO_IMG}</span>
            <span>Propellus</span>
          </a>
          <div class="nav-links">${linksHTML}</div>
          <div class="nav-cta">
            <a class="btn btn-primary" href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ3NCzTpHEEtc9OefEvR3i6__vm9Zs5VV-y-fjjq22vqnooq_DUZYmfWS2QKIi_3C-TGcryx02sL" target="_blank" rel="noopener">Book a demo</a>
          </div>
          <button class="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobileOverlay" id="navBurger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </nav>

      <div class="mobile-overlay" id="mobileOverlay" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="mobile-overlay-top">
          <a class="nav-logo" href="index.html">
            <span class="mark">${LOGO_IMG}</span>
            <span>Propellus</span>
          </a>
          <button class="nav-burger" aria-label="Close menu" id="navClose">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="mobile-links">${mobileLinksHTML}</div>
        <div class="mobile-cta">
          <a class="btn btn-primary" href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ3NCzTpHEEtc9OefEvR3i6__vm9Zs5VV-y-fjjq22vqnooq_DUZYmfWS2QKIi_3C-TGcryx02sL" target="_blank" rel="noopener">Book a demo</a>
        </div>
      </div>
    `;
  }

  function buildFooter() {
    const colsHTML = FOOTER_COLS.map(c => `
      <div class="footer-col${c.title === 'Legal' ? ' legal' : ''}">
        <h5>${c.title}</h5>
        <ul>${c.links.map(l => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}</ul>
      </div>
    `).join('');

    return `
      <footer class="footer">
        <div class="container">
          <div class="footer-top">
            <div class="footer-brand">
              <a class="nav-logo" href="index.html">
                <span class="mark">${LOGO_IMG}</span>
                <span>Propellus</span>
              </a>
              <p class="tagline">The AI infrastructure layer for global visa processing.</p>
            </div>
            ${colsHTML}
          </div>
          <p class="footer-support">Support: <a href="mailto:support@propellus.co">support@propellus.co</a></p>
          <div class="footer-bottom"><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · © 2026 Propellus Pte. Ltd.<span class="fb-loc"> · Singapore</span></div>
        </div>
      </footer>
    `;
  }

  function init() {
    document.querySelectorAll('[data-nav]').forEach(el => {
      const active = el.getAttribute('data-active') || '';
      el.outerHTML = buildNav(active);
    });
    document.querySelectorAll('[data-footer]').forEach(el => {
      el.outerHTML = buildFooter();
    });

    // Scroll behaviour on nav
    const nav = document.getElementById('propNav');
    if (nav) {
      const update = () => {
        if (window.scrollY > 8) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
    }

    // Mobile menu (S10)
    const burger = document.getElementById('navBurger');
    const closeBtn = document.getElementById('navClose');
    const overlay = document.getElementById('mobileOverlay');
    const openMenu = () => { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; burger.setAttribute('aria-expanded','true'); const f = overlay.querySelector('.mobile-links a'); if (f) f.focus(); };
    const closeMenu = (restore) => { if (!overlay.classList.contains('open')) return; overlay.classList.remove('open'); document.body.style.overflow = ''; burger.setAttribute('aria-expanded','false'); if (restore) burger.focus(); };
    if (burger && overlay) {
      burger.addEventListener('click', openMenu);
      if (closeBtn) closeBtn.addEventListener('click', () => closeMenu(true));
      overlay.querySelectorAll('.mobile-links a, .mobile-cta a').forEach(a => a.addEventListener('click', () => closeMenu(false)));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(true); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
