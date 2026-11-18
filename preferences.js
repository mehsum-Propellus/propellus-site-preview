/* Optional services are loaded only after a visitor chooses them. */
(() => {
  const key = 'propellus-site-preferences-v1';
  let choices = { analytics: false, forms: false };
  let hasSavedChoice = false;
  let analyticsLoaded = false;
  let formLoaded = false;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === 'object') { hasSavedChoice = true; choices = { analytics: saved.analytics === true, forms: saved.forms === true }; }
  } catch (_) { /* Essential-only defaults when storage is unavailable. */ }
  window.gtag = () => {};
  const liveDomain = ['propellus.ai', 'www.propellus.ai'].includes(location.hostname);
  function loadServices() {
    if (choices.analytics && liveDomain && !analyticsLoaded) {
      analyticsLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-D3T185H9VM';
      document.head.append(script);
      window.gtag('js', new Date());
      window.gtag('config', 'G-D3T185H9VM');
    }
    const frame = document.querySelector('.hs-form-frame');
    if (choices.forms && frame && !formLoaded) {
      formLoaded = true;
      frame.hidden = false;
      frame.classList.add('form-pending');
      document.querySelector('.form-permission').hidden = true;
      const status = document.createElement('div');
      status.className = 'form-load-status';
      status.setAttribute('role', 'status');
      status.innerHTML = '<p>Loading the enquiry form…</p><a href="mailto:support@propellus.co">Prefer email? Contact our team</a>';
      frame.before(status);
      let loaded = false;
      let timer;
      function formReady() {
        if (loaded) return;
        loaded = true;
        clearTimeout(timer);
        status.remove();
        frame.classList.remove('form-pending');
        window.removeEventListener('message', onFormMessage);
        window.removeEventListener('hs-form-event:on-ready', onModernFormReady);
      }
      function onFormMessage(event) {
        let hostname;
        try { hostname = new URL(event.origin).hostname; } catch (_) { return; }
        const fromHubSpot = /(^|\.)(hsforms\.com|hsforms\.net|hubspot\.com)$/.test(hostname);
        if (fromHubSpot && event.data?.type === 'hsFormCallback' && event.data.eventName === 'onFormReady') formReady();
      }
      function onModernFormReady(event) {
        if (event.detail?.formId === frame.dataset.formId) formReady();
      }
      window.addEventListener('hs-form-event:on-ready', onModernFormReady);
      window.addEventListener('message', onFormMessage);
      function unavailable() {
        if (loaded) return;
        status.querySelector('p').textContent = 'The enquiry form is taking longer to load. You can email our team or use Book a demo to choose a time.';
      }
      timer = setTimeout(unavailable, 12000);
      const script = document.createElement('script');
      script.defer = true;
      script.src = 'https://js-na2.hsforms.net/forms/embed/246643126.js';
      script.addEventListener('error', unavailable, { once: true });
      document.head.append(script);
    }
  }
  function save(next) {
    choices = next;
    hasSavedChoice = true;
    document.querySelector('.cookie-banner')?.remove();
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) { /* Choice applies to this page. */ }
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'cookie-dialog';
  dialog.setAttribute('aria-labelledby', 'cookie-title');
  dialog.innerHTML = `<form method="dialog"><h2 id="cookie-title">Cookie settings</h2><p>Optional services stay off until you choose them. Your preference is saved on this device.</p><div class="cookie-choice"><strong>Essential</strong><span>Remembers these choices. Always on.</span></div><label class="cookie-choice"><span><strong>Analytics</strong><span>Help us understand visits to the live website through Google Analytics.</span></span><input type="checkbox" name="analytics"></label><label class="cookie-choice"><span><strong>Enquiry form</strong><span>Allow the HubSpot form and its cookies on the Contact page.</span></span><input type="checkbox" name="forms"></label><p class="note">You can remove previously stored third-party cookies in your browser settings. <a href="privacy.html#cookies">Read our cookie information</a>.</p><div class="actions"><button class="button" type="button" data-save-preferences>Save choices</button><button class="text-button" type="button" data-essential-only>Essential only</button><button class="text-button" value="cancel">Cancel</button></div></form>`;
  document.body.append(dialog);
  function open(event) {
    event.preventDefault();
    dialog.querySelector('[name=analytics]').checked = choices.analytics;
    dialog.querySelector('[name=forms]').checked = choices.forms;
    dialog.showModal();
  }
  document.querySelectorAll('[data-cookie-settings]').forEach(link => link.addEventListener('click', open));
  function apply(next) {
    save(next);
    dialog.close();
    // Reload removes any previously loaded optional third-party scripts.
    location.reload();
  }
  dialog.querySelector('[data-save-preferences]').addEventListener('click', () => apply({ analytics: dialog.querySelector('[name=analytics]').checked, forms: dialog.querySelector('[name=forms]').checked }));
  dialog.querySelector('[data-essential-only]').addEventListener('click', () => apply({ analytics: false, forms: false }));
  document.querySelector('[data-load-form]')?.addEventListener('click', () => {
    save({ ...choices, forms: true });
    loadServices();
  });
  if (!hasSavedChoice) {
    const banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-label', 'Cookie choices');
    banner.innerHTML = `<h2>Your cookie choices</h2><p>Optional analytics help us understand which pages and campaigns are useful. They stay off unless you choose them.</p><div class="actions"><button class="text-button" type="button" data-banner-essential>Essential only</button><button class="button" type="button" data-banner-settings>Choose settings</button></div>`;
    document.body.append(banner);
    banner.querySelector('[data-banner-essential]').addEventListener('click', () => apply({analytics: false, forms: false}));
    banner.querySelector('[data-banner-settings]').addEventListener('click', open);
  }
  loadServices();
})();
