(() => {
  document.querySelectorAll('[data-play-inline]').forEach(button => {
    const video = button.parentElement.querySelector('video');
    button.addEventListener('click', async () => {
      try { await video.play(); button.hidden = true; }
      catch (_) { button.textContent = 'Retry Smart Bridge video'; }
    });
    video.addEventListener('play', () => { button.hidden = true; });
    video.addEventListener('ended', () => { button.hidden = false; button.textContent = 'Replay Smart Bridge · 1:03'; });
  });
  const menu = document.querySelector('#mobile-nav');
  const toggle = document.querySelector('.menu-toggle');
  function closeMenu(restore = false) {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    if (restore) toggle.focus();
  }
  toggle?.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu && !menu.hidden) closeMenu(true);
  });
  window.matchMedia('(min-width:1001px)').addEventListener('change', e => {
    if (e.matches) closeMenu();
  });
  document.querySelectorAll('[data-journey]').forEach(journey => {
    const tabs = [...journey.querySelectorAll('[role=tab]')];
    const panels = [...journey.querySelectorAll('[role=tabpanel]')];
    let current = 0;
    function show(index, focus = false) {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === current));
        tab.tabIndex = i === current ? 0 : -1;
        panels[i].hidden = i !== current;
        if (i !== current) {
          panels[i].querySelectorAll('.demo-player').forEach(player => { player.replaceChildren(); player.hidden = true; });
          panels[i].querySelectorAll('[data-load-demo]').forEach(button => button.hidden = false);
        }
      });
      journey.querySelector('.next-stage').innerHTML = current === tabs.length - 1 ? 'Back to start <span aria-hidden="true">↺</span>' : 'Next step <span aria-hidden="true">→</span>';
      if (focus) tabs[current].focus();
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => show(i));
      tab.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        show(e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : current + (e.key === 'ArrowRight' ? 1 : -1), true);
      });
    });
    journey.querySelector('.next-stage').addEventListener('click', () => show(current + 1));
  });
})();
