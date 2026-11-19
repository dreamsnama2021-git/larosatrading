// Contact page enquiry form -> Web3Forms (https://web3forms.com), settings in form-config.js.
//
// Protection layers (Web3Forms' free plan only accepts submissions sent from the browser):
//  - Web3Forms' own server-side spam filter on every submission
//  - hidden "botcheck" field (honeypot): bots fill it, Web3Forms drops those submissions
//  - time trap: forms sent less than 3 seconds after the page opened are ignored (typical of bots)
//  - per-browser limit: at most 3 enquiries per 10 minutes
//  - every field checked (required, length, email/phone format); line breaks stripped from
//    single-line fields so nothing can be smuggled into email headers
//  - optional hCaptcha (useHcaptcha in form-config.js + switched on in the Web3Forms dashboard)
(function () {
  var form = document.getElementById('lrContactForm');
  if (!form) return;
  var cfg = window.LR_FORM_CONFIG || {};
  var KEY = String(cfg.web3formsAccessKey || '').trim();
  var FALLBACK = cfg.fallbackEmail || 'info@larosatrading.com';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var LIMIT = 3, WINDOW_MS = 10 * 60 * 1000, MIN_FILL_MS = 3000;
  var openedAt = Date.now();

  var FIELDS = {
    name: { el: form.querySelector('[name="name"]'), label: 'First Name', required: true, min: 2, max: 80 },
    email: { el: form.querySelector('[name="email"]'), label: 'Email Address', required: true, max: 120 },
    phone: { el: form.querySelector('[name="phone"]'), label: 'Phone Number', max: 20 },
    message: { el: form.querySelector('[name="message"]'), label: 'Message', max: 180 },
  };
  var submitBtn = form.querySelector('[type="submit"]');
  var btnText = submitBtn ? submitBtn.textContent : '';
  var msg = form.querySelector('.lr-cf-msg');
  var count = document.getElementById('lrCfCount');

  // ---- styles for field errors ----
  var css = document.createElement('style');
  css.textContent =
    '.lr-cf-error{ display:block; color:#e51919; font-size:12px; line-height:1.4; margin-top:6px; }' +
    '.lr-cf-captcha{ margin-bottom:20px; }';
  document.head.appendChild(css);

  // ---- honeypot (Web3Forms reads "botcheck") ----
  var hp = document.createElement('input');
  hp.type = 'checkbox'; hp.name = 'botcheck'; hp.tabIndex = -1; hp.autocomplete = 'off';
  hp.className = 'lr-cf-hp'; hp.setAttribute('aria-hidden', 'true'); hp.style.display = 'none';
  form.appendChild(hp);

  function say(kind, text) { msg.className = 'lr-cf-msg ' + kind; msg.textContent = text; }
  function clearMsg() { msg.className = 'lr-cf-msg'; msg.textContent = ''; }

  // ---- optional hCaptcha ----
  if (KEY && cfg.useHcaptcha && submitBtn) {
    var cap = document.createElement('div');
    cap.className = 'h-captcha lr-cf-captcha';
    cap.setAttribute('data-captcha', 'true');
    submitBtn.parentNode.insertBefore(cap, submitBtn);
    var s = document.createElement('script');
    s.src = 'https://web3forms.com/client/script.js'; s.async = true; s.defer = true;
    document.body.appendChild(s);
  }

  // ---- character counter ----
  if (FIELDS.message.el && count) {
    FIELDS.message.el.addEventListener('input', function () { count.textContent = this.value.length; });
  }

  // ---- validation ----
  var EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
  var PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
  function oneLine(v) { return String(v || '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim(); }

  function fieldError(f, text) {
    var wrap = f.el.parentNode;
    var e = wrap.querySelector('.lr-cf-error');
    if (!text) { if (e) e.remove(); f.el.classList.remove('lr-cf-invalid'); f.el.removeAttribute('aria-invalid'); return; }
    if (!e) { e = document.createElement('span'); e.className = 'lr-cf-error'; wrap.appendChild(e); }
    e.textContent = text;
    f.el.classList.add('lr-cf-invalid'); f.el.setAttribute('aria-invalid', 'true');
  }
  function check(name) {
    var f = FIELDS[name];
    if (!f.el) return '';
    var v = name === 'message' ? String(f.el.value || '').trim() : oneLine(f.el.value);
    var err = '';
    if (!v) { if (f.required) err = f.label + ' is required.'; }
    else if (f.min && v.length < f.min) err = f.label + ' is too short.';
    else if (v.length > f.max) err = f.label + ' is too long (max ' + f.max + ' characters).';
    else if (name === 'email' && !EMAIL_RE.test(v)) err = 'Please enter a valid email address.';
    else if (name === 'phone' && !PHONE_RE.test(v)) err = 'Please enter a valid phone number.';
    else if (/<\s*\/?\s*(script|iframe|object|embed|style)\b/i.test(v)) err = 'Please remove code or HTML tags.';
    fieldError(f, err);
    return err;
  }
  Object.keys(FIELDS).forEach(function (n) {
    if (!FIELDS[n].el) return;
    FIELDS[n].el.addEventListener('blur', function () { if (this.value) check(n); });
    FIELDS[n].el.addEventListener('input', function () { if (this.classList.contains('lr-cf-invalid')) check(n); });
  });

  // ---- per-browser rate limit ----
  function recent() {
    try {
      return JSON.parse(localStorage.getItem('lr-enquiries') || '[]').filter(function (t) { return Date.now() - t < WINDOW_MS; });
    } catch (e) { return []; }
  }
  function remember() {
    try { var r = recent(); r.push(Date.now()); localStorage.setItem('lr-enquiries', JSON.stringify(r)); } catch (e) { /* ignore */ }
  }

  function setBusy(b) {
    if (!submitBtn) return;
    submitBtn.disabled = b;
    submitBtn.textContent = b ? 'Sending…' : btnText;
  }
  function resetForm() { form.reset(); if (count) count.textContent = '0'; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMsg();

    var firstBad = null;
    Object.keys(FIELDS).forEach(function (n) { if (check(n) && !firstBad) firstBad = FIELDS[n].el; });
    if (firstBad) { say('err', 'Please correct the highlighted fields.'); firstBad.focus(); return; }

    var data = {
      name: oneLine(FIELDS.name.el.value),
      email: oneLine(FIELDS.email.el.value),
      phone: oneLine(FIELDS.phone.el.value),
      message: String(FIELDS.message.el.value).trim(),
    };

    // bots: honeypot ticked or form sent instantly -> pretend success, send nothing
    if (hp.checked || Date.now() - openedAt < MIN_FILL_MS) {
      say('ok', 'Thank you! Your message has been sent. Our team will respond shortly.');
      resetForm();
      return;
    }
    if (recent().length >= LIMIT) {
      say('err', 'You have sent several messages in a short time. Please wait a few minutes, or call us on +971 4 3960 911.');
      return;
    }

    if (!KEY) {
      // not set up yet: don't lose the enquiry, hand it to the visitor's email app
      say('err', 'Online form is not set up yet. Opening your email app so you can send the message directly…');
      var body = 'Name: ' + data.name + '\nEmail: ' + data.email + '\nPhone: ' + data.phone + '\n\n' + data.message;
      window.location.href = 'mailto:' + FALLBACK + '?subject=' + encodeURIComponent('Website enquiry from ' + data.name) +
        '&body=' + encodeURIComponent(body);
      return;
    }

    var fd = new FormData();
    fd.append('access_key', KEY);
    fd.append('subject', (cfg.siteName || 'Website') + ' – New enquiry from ' + data.name);
    fd.append('from_name', cfg.siteName || 'Website');
    fd.append('name', data.name);
    fd.append('email', data.email);
    fd.append('phone', data.phone);
    fd.append('message', data.message);
    fd.append('page', location.pathname);
    fd.append('botcheck', '');
    if (cfg.useHcaptcha) {
      var token = form.querySelector('[name="h-captcha-response"]');
      if (!token || !token.value) { say('err', 'Please complete the captcha check.'); return; }
      fd.append('h-captcha-response', token.value);
    }

    setBusy(true);
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;
    fetch(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: fd, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; }); })
      .then(function (res) {
        if (res.json && res.json.success) {
          remember();
          say('ok', 'Thank you! Your message has been sent. Our team will respond shortly.');
          resetForm();
          if (window.hcaptcha && cfg.useHcaptcha) try { window.hcaptcha.reset(); } catch (x) { /* ignore */ }
        } else if (res.status === 429) {
          say('err', 'Too many messages right now. Please try again in a few minutes.');
        } else {
          say('err', 'Sorry, your message could not be sent. Please try again, or email ' + FALLBACK + '.');
          if (window.console) console.warn('Enquiry form error:', res.status, res.json && (res.json.message || (res.json.body && res.json.body.message)));
        }
      })
      .catch(function () {
        say('err', 'Network problem – your message was not sent. Please check your connection and try again.');
      })
      .then(function () { if (timer) clearTimeout(timer); setBusy(false); });
  });
})();
