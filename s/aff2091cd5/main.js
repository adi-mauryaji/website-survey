/* KHALI SADAK — Monsoon Static landing page. No dependencies. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG
     ------------------------------------------------------------------ */
  // 16 January 2027, 8:00 PM IST (UTC+5:30) = 14:30 UTC
  var DROP_AT = Date.UTC(2027, 0, 16, 14, 30, 0);

  // PLACEHOLDER: paste the form endpoint of your email tool here
  // (e.g. a free-tier Formspree / Buttondown / Google Apps Script URL).
  // It receives a POST with JSON: { email, source, page }.
  // While empty, the form runs in DEMO MODE: it validates and shows the
  // success state but does NOT store or send the email anywhere.
  var SIGNUP_ENDPOINT = '';

  // PLACEHOLDER: shop / collection URL. Once the drop is live (after DROP_AT)
  // the countdown turns into a "Shop the drop" button pointing here.
  var SHOP_URL = '';

  var root = document.documentElement;
  root.classList.add('js'); // scroll-reveal styles only apply once this script is running
  var motionOn = root.dataset.motion !== 'off';
  var motionListeners = [];

  /* ------------------------------------------------------------------
     Motion toggle (also respects OS "reduce motion" via the inline head script)
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('[data-motion-toggle]');
  function applyMotion(on, save) {
    motionOn = on;
    root.dataset.motion = on ? 'on' : 'off';
    if (toggle) toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (save) { try { localStorage.setItem('ks-motion', on ? 'on' : 'off'); } catch (e) {} }
    motionListeners.forEach(function (fn) { fn(on); });
  }
  if (toggle) {
    toggle.setAttribute('aria-pressed', motionOn ? 'true' : 'false');
    toggle.addEventListener('click', function () { applyMotion(!motionOn, true); });
  }

  /* ------------------------------------------------------------------
     Grain texture: generated once, reused by CSS everywhere (--noise)
     ------------------------------------------------------------------ */
  (function makeNoise() {
    try {
      var s = 160, c = document.createElement('canvas');
      c.width = c.height = s;
      var x = c.getContext('2d'), d = x.createImageData(s, s), p = d.data;
      for (var i = 0; i < p.length; i += 4) {
        var v = Math.random() * 255 | 0;
        p[i] = p[i + 1] = p[i + 2] = v;
        p[i + 3] = 255;
      }
      x.putImageData(d, 0, 0);
      root.style.setProperty('--noise', 'url(' + c.toDataURL('image/png') + ')');
    } catch (e) { /* no texture is fine */ }
  })();

  /* ------------------------------------------------------------------
     Hero: live TV static + monsoon rain on a low-res canvas
     ------------------------------------------------------------------ */
  var hero = document.querySelector('.hero');
  var cv = hero && hero.querySelector('.hero__static');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d', { alpha: false });
    var W = 0, H = 0, img, buf, drops = [];
    var heroVisible = true, raf = 0, last = 0, roll = 0, interference = 0;

    var sizeCanvas = function () {
      var r = hero.getBoundingClientRect();
      var scale = r.width < 700 ? 0.5 : 0.33;
      W = Math.max(2, Math.round(r.width * scale));
      H = Math.max(2, Math.round(r.height * scale));
      cv.width = W; cv.height = H;
      img = ctx.createImageData(W, H);
      buf = new Uint32Array(img.data.buffer);
      var n = Math.round(W * H / 900);
      drops = [];
      for (var i = 0; i < n; i++) drops.push(newDrop(true));
    };
    var newDrop = function (anywhere) {
      return {
        x: Math.random() * (W + H * 0.3),
        y: anywhere ? Math.random() * H : -20 - Math.random() * 40,
        len: 6 + Math.random() * 16,
        v: 4 + Math.random() * 6,
        a: 0.15 + Math.random() * 0.4
      };
    };

    var draw = function () {
      var bandY = roll % (H * 1.6) - H * 0.3;
      var bandH = H * 0.18;
      var amp = 34 + interference * 90;
      var i = 0;
      for (var y = 0; y < H; y++) {
        var dy = Math.abs(y - bandY);
        var boost = dy < bandH ? (1 - dy / bandH) * 46 : 0;
        for (var x = 0; x < W; x++, i++) {
          var r = Math.random();
          var v = (r * r * amp + boost * Math.random()) | 0;
          if (v > 255) v = 255;
          buf[i] = 0xff000000 | (v << 16) | (v << 8) | v;
        }
      }
      ctx.putImageData(img, 0, 0);

      // signal tear: occasional yellow bar
      if (Math.random() < 0.05 + interference * 0.3) {
        ctx.fillStyle = 'rgba(255,214,10,' + (0.25 + Math.random() * 0.4).toFixed(2) + ')';
        ctx.fillRect(0, Math.random() * H | 0, W, 1 + Math.random() * 3 | 0);
      }

      // rain, slanting with the wind
      ctx.lineWidth = 1;
      for (var k = 0; k < drops.length; k++) {
        var d = drops[k];
        ctx.strokeStyle = 'rgba(243,239,228,' + d.a + ')';
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.3, d.y + d.len);
        ctx.stroke();
        d.y += d.v; d.x -= d.v * 0.3;
        if (d.y > H || d.x < -20) drops[k] = newDrop(false);
      }
    };

    var loop = function (t) {
      raf = requestAnimationFrame(loop);
      if (t - last < 40) return; // ~25fps: film-ish, battery-friendly
      last = t;
      roll += H * 0.012;
      interference *= 0.92;
      draw();
    };
    var start = function () {
      if (!raf && motionOn && heroVisible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    var stop = function () { cancelAnimationFrame(raf); raf = 0; };

    sizeCanvas();
    draw(); // always paint one frame, even with motion off
    start();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sizeCanvas(); draw(); }, 150);
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroVisible = es[0].isIntersecting;
        heroVisible ? start() : stop();
      }).observe(hero);
    }
    motionListeners.push(function (on) { on ? start() : stop(); });

    // Moving across the screen messes with the signal
    var hotT;
    hero.addEventListener('pointermove', function (e) {
      if (!motionOn) return;
      interference = Math.min(1, interference + (e.pointerType === 'mouse' ? 0.04 : 0.1));
      if (interference > 0.6) {
        hero.classList.add('is-hot');
        clearTimeout(hotT);
        hotT = setTimeout(function () { hero.classList.remove('is-hot'); }, 400);
      }
    }, { passive: true });

    // OSD signal meter flicker
    var sig = hero.querySelector('[data-signal]');
    if (sig) {
      setInterval(function () {
        if (!motionOn || !heroVisible) return;
        var n = Math.max(1, Math.min(5, Math.round(2 + Math.random() * 2 - interference * 2)));
        sig.style.setProperty('--lvl', n);
      }, 700);
    }
  }

  /* ------------------------------------------------------------------
     Headline scramble-in (visual only; real text is in an sr-only span)
     ------------------------------------------------------------------ */
  var GLYPHS = 'ABCDEFGHKMNOSTUVXZ#$%&';
  function scramble(el, duration) {
    var final = el.textContent, start = null;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / duration), out = '';
      for (var i = 0; i < final.length; i++) {
        out += (i / final.length < p * 1.15 - 0.15) ? final[i] : GLYPHS[Math.random() * GLYPHS.length | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }
  if (motionOn) {
    document.querySelectorAll('[data-scramble]').forEach(function (el, i) {
      setTimeout(function () { scramble(el, 900); }, 120 + i * 220);
    });
  }

  /* ------------------------------------------------------------------
     Countdown
     ------------------------------------------------------------------ */
  var cdWrap = document.querySelector('[data-countdown]');
  var stickyTime = document.querySelector('[data-sticky-time]');
  if (cdWrap) {
    var units = {};
    cdWrap.querySelectorAll('[data-unit]').forEach(function (el) { units[el.dataset.unit] = el; });
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    var set = function (el, val) {
      if (el.textContent === val) return;
      el.textContent = val;
      if (motionOn) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    };
    var tick = function () {
      var diff = DROP_AT - Date.now();
      if (diff <= 0) {
        cdWrap.querySelector('.countdown__grid').hidden = true;
        var live = cdWrap.querySelector('.countdown__live');
        live.hidden = false;
        if (SHOP_URL) {
          var shop = document.createElement('a');
          shop.className = 'btn';
          shop.href = SHOP_URL;
          shop.textContent = 'Shop the drop →';
          live.after(shop);
        }
        var tag = document.querySelector('.hero .tag');
        if (tag) tag.textContent = 'Live now';
        var heroLabel = document.querySelector('label[for="email-hero"]');
        if (heroLabel) heroLabel.textContent = 'Get alerts for the next drop';
        if (stickyTime) stickyTime.textContent = 'LIVE';
        return;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
          m = Math.floor(s % 3600 / 60), sec = s % 60;
      set(units.d, pad(d)); set(units.h, pad(h)); set(units.m, pad(m)); set(units.s, pad(sec));
      if (stickyTime) stickyTime.textContent = d + 'D ' + pad(h) + 'H';
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
  }

  /* ------------------------------------------------------------------
     Email signup (both forms share one handler)
     ------------------------------------------------------------------ */
  var forms = Array.prototype.slice.call(document.querySelectorAll('[data-signup]'));
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setStatus(form, msg, kind) {
    var st = form.querySelector('.signup__status');
    st.textContent = msg;
    st.classList.toggle('is-error', kind === 'error');
    st.classList.toggle('is-ok', kind === 'ok');
  }

  function celebrate(fromEl) {
    if (!motionOn) return;
    var flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 600);

    if (!fromEl.animate) return;
    var r = fromEl.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var marks = ['✶', '⚡', '✶', '●', '✶', 'KS'];
    for (var i = 0; i < 18; i++) {
      var s = document.createElement('span');
      s.className = 'spark';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = marks[i % marks.length];
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      s.style.color = i % 2 ? '#ffd60a' : '#f3efe4';
      document.body.appendChild(s);
      var ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 180;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.4) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + Math.cos(ang) * dist + 'px), calc(-50% + ' + (Math.sin(ang) * dist + 60) + 'px)) scale(1.2) rotate(' + (Math.random() * 360 - 180) + 'deg)', opacity: 0 }
      ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
        .onfinish = (function (el) { return function () { el.remove(); }; })(s);
    }
  }

  function markAllDone(email) {
    forms.forEach(function (f) {
      f.classList.add('is-done');
      var st = f.querySelector('.signup__status');
      st.textContent = '';
      st.classList.remove('is-error');
      st.classList.add('is-ok');
      var big = document.createElement('strong');
      big.className = 'ok-title';
      big.textContent = 'You’re tuned in.';
      var line = document.createElement('span');
      line.className = 'ok-line';
      var em = document.createElement('span');
      em.className = 'ok-email';
      em.textContent = email;
      line.append('We’ll email ', em, ' when Monsoon Static drops. Till then: ');
      var ig = document.createElement('a');
      ig.href = 'https://www.instagram.com/khalisadak.studio/';
      ig.target = '_blank';
      ig.rel = 'noopener';
      ig.textContent = '@khalisadak.studio';
      line.append(ig, '.');
      st.append(big, ' ', line);
    });
    var st = document.querySelector('[data-sticky-cta]');
    if (st) st.classList.remove('is-shown');
  }

  forms.forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button[type="submit"]');
    var btnHTML = btn.innerHTML;

    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') {
        input.removeAttribute('aria-invalid');
        setStatus(form, '', null);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      if (!email) {
        input.setAttribute('aria-invalid', 'true');
        setStatus(form, 'Type your email first.', 'error');
        input.focus();
        return;
      }
      if (!EMAIL_RE.test(email)) {
        input.setAttribute('aria-invalid', 'true');
        setStatus(form, 'That email doesn’t look right. Check for typos?', 'error');
        input.focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Sending…';
      setStatus(form, '', null);

      var send = SIGNUP_ENDPOINT
        ? fetch(SIGNUP_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email: email, source: 'monsoon-static-landing', page: location.href })
          }).then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); })
        : new Promise(function (resolve) {
            if (window.console) console.info('[KHALI SADAK] Demo mode: SIGNUP_ENDPOINT is empty, so this email was not sent or saved.');
            setTimeout(resolve, 650);
          });

      send.then(function () {
        celebrate(btn);
        markAllDone(email);
      }).catch(function () {
        btn.disabled = false;
        btn.innerHTML = btnHTML;
        setStatus(form, 'Signal dropped, that didn’t go through. Try again in a sec.', 'error');
      });
    });
  });

  /* ------------------------------------------------------------------
     Calendar file (.ics)
     ------------------------------------------------------------------ */
  var icsBtn = document.querySelector('[data-ics]');
  if (icsBtn) {
    icsBtn.addEventListener('click', function () {
      var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KHALI SADAK//Monsoon Static//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:monsoon-static-20270116@khalisadak',
        'DTSTAMP:' + stamp,
        'DTSTART:20270116T143000Z',
        'DTEND:20270116T153000Z',
        'SUMMARY:KHALI SADAK — Monsoon Static drop',
        'DESCRIPTION:6 pieces\\, small batch. Live on the KHALI SADAK website at 8 PM IST. Instagram: @khalisadak.studio',
        'LOCATION:KHALI SADAK website',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Monsoon Static drops in 15 minutes',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'khali-sadak-monsoon-static.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveals + "tune in" product cards
     ------------------------------------------------------------------ */
  var reveals = document.querySelectorAll('.reveal');
  var cards = document.querySelectorAll('[data-tune]');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });

    // Cards come into focus as they pass through the middle of the screen
    var to = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('is-tuned', e.isIntersecting); });
    }, { rootMargin: '-38% 0px -38% 0px' });
    cards.forEach(function (c) { to.observe(c); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Desktop: cards tilt toward the cursor
  cards.forEach(function (card) {
    var screen = card.querySelector('.card__screen');
    card.addEventListener('pointermove', function (e) {
      if (!motionOn || e.pointerType !== 'mouse') return;
      var r = screen.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (px * 12).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });

  /* ------------------------------------------------------------------
     Sticky mobile CTA: shows once the hero form is gone, hides at the main form
     ------------------------------------------------------------------ */
  var sticky = document.querySelector('[data-sticky-cta]');
  var heroForm = document.querySelector('.hero [data-signup]');
  var alerts = document.getElementById('alerts');
  if (sticky && heroForm && alerts && 'IntersectionObserver' in window) {
    var heroFormVisible = true, alertsVisible = false;
    var update = function () {
      var done = heroForm.classList.contains('is-done');
      sticky.classList.toggle('is-shown', !heroFormVisible && !alertsVisible && !done);
    };
    new IntersectionObserver(function (es) { heroFormVisible = es[0].isIntersecting; update(); }).observe(heroForm);
    new IntersectionObserver(function (es) { alertsVisible = es[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(alerts);
    sticky.addEventListener('click', function () {
      setTimeout(function () { var i = document.getElementById('email-main'); if (i) i.focus({ preventScroll: true }); }, motionOn ? 600 : 0);
    });
  }

  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
