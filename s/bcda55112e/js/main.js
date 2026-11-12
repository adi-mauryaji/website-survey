/* Dr. Meera Kulkarni · site behaviour
   Small, dependency-free progressive enhancement. The page works without it. */
(function () {
  'use strict';

  /* ---------- Header: hairline once the page scrolls ---------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- Breathing light: pause / resume ---------- */
  var breath = document.querySelector('[data-breath]');
  var breathBtn = document.querySelector('[data-breath-toggle]');
  if (breath && breathBtn) {
    breathBtn.addEventListener('click', function () {
      var paused = breath.classList.toggle('is-paused');
      breathBtn.setAttribute('aria-pressed', String(paused));
      breathBtn.textContent = paused ? 'Resume' : 'Pause';
    });
  }

  /* ---------- Booking form ---------- */
  var form = document.querySelector('[data-booking-form]');
  if (!form) return;

  var thanks = document.querySelector('[data-thanks]');
  var thanksTitle = document.querySelector('[data-thanks-title]');
  var status = form.querySelector('[data-form-status]');
  var submitBtn = form.querySelector('[data-submit]');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = [
    {
      field: form.elements.name,
      error: 'f-name-error',
      check: function (el) { return el.value.trim() ? '' : 'Please tell me what to call you.'; }
    },
    {
      field: form.elements.email,
      error: 'f-email-error',
      check: function (el) {
        var v = el.value.trim();
        if (!v) return 'Please add an email address so I can reply.';
        if (!EMAIL_RE.test(v)) return 'That email doesn’t look quite right. Could you check it?';
        return '';
      }
    },
    {
      field: form.elements.phone,
      error: 'f-phone-error',
      check: function (el) {
        var v = el.value.trim();
        var prefersPhone = form.elements.contact_preference.value === 'Phone call';
        if (!v && prefersPhone) return 'Please add a phone number, as you’d like a call.';
        if (v && v.replace(/\D/g, '').length < 10) return 'Please check the number. It looks a little short.';
        return '';
      }
    },
    {
      field: form.elements.adult,
      error: 'f-adult-error',
      check: function (el) { return el.checked ? '' : 'I work with adults, so please confirm you’re 18 or older.'; }
    },
    {
      field: form.elements.not_emergency,
      error: 'f-emergency-error',
      check: function (el) { return el.checked ? '' : 'Please confirm you’ve read this. It’s important for your safety.'; }
    }
  ];

  function showError(rule, message) {
    var errEl = document.getElementById(rule.error);
    if (message) {
      errEl.textContent = message;
      errEl.hidden = false;
      rule.field.setAttribute('aria-invalid', 'true');
    } else {
      errEl.textContent = '';
      errEl.hidden = true;
      rule.field.removeAttribute('aria-invalid');
    }
  }

  function validate(rule) {
    var message = rule.check(rule.field);
    showError(rule, message);
    return !message;
  }

  // Re-check a field once the person has moved on (never while they're still typing for the first time)
  rules.forEach(function (rule) {
    var evt = rule.field.type === 'checkbox' ? 'change' : 'blur';
    rule.field.addEventListener(evt, function () {
      if (rule.field.type === 'checkbox' || rule.field.value.trim() || rule.field.hasAttribute('aria-invalid')) {
        validate(rule);
      }
    });
    if (rule.field.type !== 'checkbox') {
      rule.field.addEventListener('input', function () {
        if (rule.field.hasAttribute('aria-invalid')) validate(rule);
      });
    }
  });
  // Phone becomes required when "Phone call" is chosen
  Array.prototype.forEach.call(form.elements.contact_preference, function (radio) {
    radio.addEventListener('change', function () {
      var phoneRule = rules[2];
      if (phoneRule.field.hasAttribute('aria-invalid')) validate(phoneRule);
    });
  });

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', !!isError);
  }

  function showThanks(name) {
    var first = (name || '').trim().split(/\s+/)[0];
    thanksTitle.textContent = first
      ? 'Thank you, ' + first + '. Your request is with me.'
      : 'Thank you. Your request is with me.';
    form.hidden = true;
    thanks.hidden = false;
    thanksTitle.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');

    var firstInvalid = null;
    var invalidCount = 0;
    rules.forEach(function (rule) {
      if (!validate(rule)) {
        invalidCount++;
        if (!firstInvalid) firstInvalid = rule.field;
      }
    });
    if (firstInvalid) {
      setStatus(invalidCount === 1 ? 'One thing needs a look before sending.' : 'A few things need a look before sending.', true);
      firstInvalid.focus();
      return;
    }

    // Spam trap filled in: quietly pretend all is well.
    if (form.elements._gotcha && form.elements._gotcha.value) {
      showThanks('');
      return;
    }

    var endpoint = form.getAttribute('action') || '';
    var name = form.elements.name.value;

    if (!/^https?:\/\//i.test(endpoint)) {
      // Preview mode: no form service connected yet (see the comment above the form in index.html).
      if (window.console) console.warn('Booking form is in preview mode: set the form action to a form service URL to receive requests.');
      showThanks(name);
      return;
    }

    submitBtn.disabled = true;
    setStatus('Sending…');

    // Send multi-choice answers as one readable line each (e.g. "Mornings, Evenings")
    var data = new FormData(form);
    ['language', 'availability'].forEach(function (key) {
      var values = data.getAll(key);
      data.delete(key);
      data.set(key, values.length ? values.join(', ') : 'Not specified');
    });

    fetch(endpoint, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        form.reset();
        showThanks(name);
      })
      .catch(function () {
        setStatus('Sorry, your request couldn’t be sent just now. Please check your connection and try again in a moment.', true);
      })
      .then(function () {
        submitBtn.disabled = false;
        if (status.textContent === 'Sending…') setStatus('');
      });
  });
})();
