/* Review interactions. Recordings load only on an explicit Play action. */
(() => {
  // This measures the click only; it does not claim a WhatsApp conversation or CRM lead.
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof window.gtag === 'function') window.gtag('event', 'whatsapp_opened', {
        page_source: link.dataset.contactSource,
        cta_location: link.closest('.closing') ? 'closing' : link.closest('.hero') ? 'hero' : 'contact'
      });
    });
  });
  document.querySelectorAll('[data-demo-browser]').forEach(browser => {
    const tabs = [...browser.querySelectorAll('.demo-choice')];
    const panels = [...browser.querySelectorAll(':scope > .demo-pane')];
    function show(index, focus = false) {
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
        if (i !== index) {
          panels[i].querySelectorAll('video').forEach(video => video.pause());
          // Stop a hidden recording rather than leave it playing offscreen.
          panels[i].querySelectorAll('.demo-player').forEach(player => {
            player.replaceChildren(); player.hidden = true;
          });
          panels[i].querySelectorAll('[data-load-demo]').forEach(button => button.hidden = false);
        }
      });
      if (focus) tabs[index].focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => show(index));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        show(event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
      });
    });
  });
  // On phones, readable captions sit below the small landscape player.
  document.querySelectorAll('video:has(track[kind="captions"])').forEach(video => {
    const caption = document.createElement('p');
    caption.className = 'video-mobile-caption';
    caption.hidden = true;
    video.insertAdjacentElement('afterend', caption);
    const phone = window.matchMedia('(max-width:600px)');
    let fullScreen = false;
    function updateCaption() {
      const track = video.textTracks[0];
      const text = track?.activeCues ? [...track.activeCues].map(cue => cue.text).join(' ') : '';
      caption.textContent = text;
      caption.hidden = !phone.matches || fullScreen || !text;
    }
    function configureCaptions() {
      const track = video.textTracks[0];
      if (track) track.mode = phone.matches && !fullScreen ? 'hidden' : 'showing';
      updateCaption();
    }
    const track = video.textTracks[0];
    track?.addEventListener('cuechange', updateCaption);
    video.addEventListener('timeupdate', updateCaption);
    video.addEventListener('loadedmetadata', configureCaptions);
    phone.addEventListener('change', configureCaptions);
    document.addEventListener('fullscreenchange', () => {
      fullScreen = document.fullscreenElement === video;
      configureCaptions();
    });
    video.addEventListener('webkitbeginfullscreen', () => { fullScreen = true; configureCaptions(); });
    video.addEventListener('webkitendfullscreen', () => { fullScreen = false; configureCaptions(); });
    configureCaptions();
  });

  // Chapters seek within the same full recording; no alternate media is loaded.
  document.querySelectorAll('[data-video-chapter]').forEach(button => {
    button.addEventListener('click', () => {
      const figure = button.closest('figure');
      const video = figure?.querySelector('video');
      if (!video) return;
      const seek = () => {
        if (video.closest('[hidden]')) return;
        video.scrollIntoView({block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
        video.currentTime = Math.min(Number(button.dataset.videoChapter), video.duration || Infinity);
        video.play().catch(() => {
          const status = figure.querySelector('.chapter-status');
          if (status) status.textContent = 'Chapter selected. Press Play in the video to continue.';
        });
      };
      if (video.readyState >= 1) seek();
      else {
        video.addEventListener('loadedmetadata', seek, {once: true});
        video.load();
      }
    });
  });
  // External Supademo playback stays withheld; cleaned website recordings are used.
  // A native dialog keeps product detail readable without leaving the page.
  const screenDialog = document.createElement('dialog');
  screenDialog.className = 'screen-dialog';
  screenDialog.setAttribute('aria-labelledby', 'screen-dialog-title');
  screenDialog.innerHTML = `<div class="screen-dialog-head"><h2 id="screen-dialog-title">Product screen</h2><div class="screen-dialog-actions"><button type="button" data-screen-zoom aria-pressed="false">Zoom in</button><button type="button" data-screen-close>Close</button></div></div><div class="screen-scroll"><img alt=""></div>`;
  document.body.append(screenDialog);
  let screenTrigger;
  const screenScroller = screenDialog.querySelector('.screen-scroll');
  const zoomButton = screenDialog.querySelector('[data-screen-zoom]');
  document.querySelectorAll('[data-enlarge-screen]').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.querySelector('img');
      screenTrigger = button;
      const enlarged = screenDialog.querySelector('img');
      enlarged.src = source.src; enlarged.alt = source.alt;
      screenDialog.querySelector('h2').textContent = source.alt;
      screenScroller.classList.remove('is-zoomed');
      zoomButton.textContent = 'Zoom in'; zoomButton.setAttribute('aria-pressed', 'false');
      screenDialog.showModal();
      screenScroller.scrollTo(0, 0);
    });
  });
  zoomButton.addEventListener('click', () => {
    const zoomed = screenScroller.classList.toggle('is-zoomed');
    zoomButton.textContent = zoomed ? 'Fit screen' : 'Zoom in';
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    // Use a predictable 2.5x view instead of jumping to the source's pixel width.
    screenScroller.scrollTo({left: zoomed ? (screenScroller.scrollWidth - screenScroller.clientWidth) / 2 : 0, top: 0});
  });
  screenDialog.querySelector('[data-screen-close]').addEventListener('click', () => screenDialog.close());
  screenDialog.addEventListener('click', event => { if (event.target === screenDialog) screenDialog.close(); });
  screenDialog.addEventListener('close', () => screenTrigger?.focus());

  // Only retain campaign attribution after the visitor opts into analytics.
  const consentKey = 'propellus-site-preferences-v1';
  const attributionKey = 'propellus-campaign-v1';
  const names = ['utm_source', 'utm_medium', 'utm_campaign'];
  let consent = false;
  try { consent = JSON.parse(localStorage.getItem(consentKey) || '{}').analytics === true; } catch (_) {}
  if (!consent) {
    try { sessionStorage.removeItem(attributionKey); } catch (_) {}
    return;
  }
  const query = new URLSearchParams(location.search);
  const incoming = {};
  names.forEach(key => {
    const value = query.get(key);
    if (value && value.length <= 120 && /^[a-zA-Z0-9_. -]+$/.test(value)) incoming[key] = value;
  });
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(attributionKey) || '{}'); } catch (_) {}
  if (Object.keys(incoming).length) {
    saved = { first: saved.first || incoming, last: incoming };
    try { sessionStorage.setItem(attributionKey, JSON.stringify(saved)); } catch (_) {}
  }
  const campaign = saved.last || {};
  document.querySelectorAll('a[href]').forEach(link => {
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if (!['https:', 'http:'].includes(url.protocol)) return;
    const booking = url.hostname === 'meetings-na2.hubspot.com';
    const internalPage = url.origin === location.origin && /(?:\.html|\/)$/i.test(url.pathname);
    if (!booking && !internalPage) return;
    names.forEach(key => {
      const value = campaign[key];
      if (typeof value === 'string' && value.length <= 120 && /^[a-zA-Z0-9_. -]+$/.test(value)) url.searchParams.set(key, value);
    });
    link.href = url.href;
  });
})();
