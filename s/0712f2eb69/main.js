/* Khali Sadak: Monsoon Static drop page */
(() => {
  "use strict";

  // Paste your email provider's form endpoint here (Formspree, Buttondown, Mailchimp...).
  // While it is empty, sign-ups are only confirmed on screen and nothing is sent.
  const SIGNUP_ENDPOINT = "";

  const DROP_AT = Date.UTC(2027, 0, 16, 14, 30, 0); // 16 Jan 2027, 8 PM IST (UTC+5:30)

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ------------------------------------------------------------
     1. Headline: each line fills the window width using the
        font's width axis, so MONSOON and STATIC end flush.
  ------------------------------------------------------------ */
  const title = document.querySelector("[data-fit]");
  const lines = title ? [...title.querySelectorAll(".title__line")] : [];

  function fitTitle() {
    if (!title) return;
    const avail = title.clientWidth;
    const vh = window.innerHeight;
    // the whole hero (bar, glass, sign-up) should fit the first screen when it can
    const hero = title.closest(".hero");
    const glassEl = title.closest(".glass");
    const lh = parseFloat(getComputedStyle(title).lineHeight) / parseFloat(getComputedStyle(title).fontSize) || 0.8;
    const chrome = hero && glassEl ? hero.offsetHeight - title.offsetHeight : 0;
    const budget = Math.max(vh - chrome - 8, vh * 0.34);
    const maxByHeight = budget / (lines.length * (lh + 0.06));
    let fs = Math.min(maxByHeight, 640);

    const widthAt = (el, stretch, size) => {
      el.style.fontSize = size + "px";
      el.style.setProperty("--ws", stretch + "%");
      return el.getBoundingClientRect().width;
    };

    for (const el of lines) { el.style.letterSpacing = ""; el.style.marginRight = ""; }

    // shrink until the widest line fits at the narrowest width
    for (const el of lines) {
      const w = widthAt(el, 75, fs);
      if (w > avail) fs = fs * (avail / w);
    }
    fs = Math.floor(fs * 0.995);
    title.style.setProperty("--fs", fs + "px");

    // then open each line up with the width axis until it fills
    for (const el of lines) {
      let lo = 75, hi = 125;
      if (widthAt(el, hi, fs) <= avail) {
        lo = hi;
      } else {
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (widthAt(el, mid, fs) <= avail) lo = mid; else hi = mid;
        }
      }
      el.style.fontSize = "";
      el.style.setProperty("--ws", lo.toFixed(2) + "%");
      // whatever the width axis can't cover becomes letter-spacing
      const w = el.getBoundingClientRect().width;
      const gap = avail - w;
      const n = el.textContent.trim().length;
      el.style.letterSpacing = gap > 2 && n > 1 ? (gap / (n - 1)).toFixed(2) + "px" : "";
      if (gap > 2 && n > 1) el.style.marginRight = -(gap / (n - 1)).toFixed(2) + "px";
      else el.style.marginRight = "";
    }
  }

  /* ------------------------------------------------------------
     2. The fogged window. A canvas of static sits over the
        headline. It wipes clear on load, visitors can wipe it,
        rain runs down it, and it slowly steams up again.
  ------------------------------------------------------------ */
  const glass = document.querySelector("[data-glass]");
  const canvas = glass && glass.querySelector("canvas.fog");
  const fog = canvas ? createFog(glass, canvas) : null;

  function createFog(glass, canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const S = 4;            // mask is 1/4 resolution, smoothed when drawn
    const CAP = 0.93;       // fog never gets fully opaque
    const HALF_LIFE = 9;    // seconds for a wiped patch to steam half way back

    let W = 0, H = 0, mw = 0, mh = 0;
    let mask = new Float32Array(0);
    const mcan = document.createElement("canvas");
    const mctx = mcan.getContext("2d");
    let mimg = null;

    // static grain tiles, cycled every few frames
    const tiles = [];
    const TILE = 96, BLOCK = 2;
    for (let t = 0; t < 6; t++) {
      const c = document.createElement("canvas");
      c.width = c.height = TILE * BLOCK;
      const g = c.getContext("2d");
      const img = g.createImageData(TILE * BLOCK, TILE * BLOCK);
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const r = Math.random();
          let R, G, B, A;
          if (r < 0.16) { R = 30; G = 36; B = 50; A = 110 + Math.random() * 90; }        // dark speck
          else if (r < 0.5) { R = 255; G = 255; B = 255; A = 70 + Math.random() * 120; } // bright speck
          else { const v = 180 + Math.random() * 50; R = v; G = v + 8; B = v + 20; A = 40 + Math.random() * 60; }
          for (let by = 0; by < BLOCK; by++) {
            for (let bx = 0; bx < BLOCK; bx++) {
              const i = ((y * BLOCK + by) * TILE * BLOCK + (x * BLOCK + bx)) * 4;
              img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = B; img.data[i + 3] = A;
            }
          }
        }
      }
      g.putImageData(img, 0, 0);
      tiles.push(ctx.createPattern(c, "repeat"));
    }

    function resize() {
      const r = glass.getBoundingClientRect();
      const nW = Math.max(1, Math.round(r.width));
      const nH = Math.max(1, Math.round(r.height));
      if (nW === W && nH === H) return;
      const nmw = Math.ceil(nW / S), nmh = Math.ceil(nH / S);
      const next = new Float32Array(nmw * nmh).fill(CAP);
      if (mask.length) {
        for (let y = 0; y < nmh; y++) {
          const oy = Math.min(mh - 1, Math.floor((y / nmh) * mh));
          for (let x = 0; x < nmw; x++) {
            const ox = Math.min(mw - 1, Math.floor((x / nmw) * mw));
            next[y * nmw + x] = mask[oy * mw + ox];
          }
        }
      }
      W = nW; H = nH; mw = nmw; mh = nmh; mask = next;
      canvas.width = W; canvas.height = H;
      mcan.width = mw; mcan.height = mh;
      mimg = mctx.createImageData(mw, mh);
    }

    // clear a soft round patch (x, y, r in CSS px)
    function stamp(x, y, r, strength) {
      const mx = x / S, my = y / S, mr = Math.max(0.8, r / S);
      const x0 = Math.max(0, Math.floor(mx - mr)), x1 = Math.min(mw - 1, Math.ceil(mx + mr));
      const y0 = Math.max(0, Math.floor(my - mr)), y1 = Math.min(mh - 1, Math.ceil(my + mr));
      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const dx = xx + 0.5 - mx, dy = yy + 0.5 - my;
          const d = Math.sqrt(dx * dx + dy * dy) / mr;
          if (d < 1) {
            const f = 1 - d * d;
            const i = yy * mw + xx;
            mask[i] *= 1 - strength * f * f;
          }
        }
      }
    }
    function stroke(x0, y0, x1, y1, r, strength) {
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(dist / (r * 0.3)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, strength);
      }
    }

    // a few old drip trails so the glass looks lived-in on first paint
    function seedTrails() {
      const n = Math.round(W / 140) + 3;
      for (let k = 0; k < n; k++) {
        let x = Math.random() * W;
        let y = Math.random() * H * 0.5;
        const r = 2 + Math.random() * 2;
        while (y < H) {
          x += (Math.random() - 0.5) * 1.6;
          y += 3;
          stamp(x, y, r, 0.55);
        }
      }
    }

    /* drops running down the glass */
    const drops = [];
    function addDrop(x, y, r) {
      if (drops.length > 26) return;
      drops.push({
        x, y,
        r: r || 2 + Math.random() * 2.6,
        v: 0,
        hold: 0.2 + Math.random() * 1.4,
        wob: Math.random() * 6.28,
      });
    }
    function updateDrops(dt) {
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (d.hold > 0) {
          d.hold -= dt;
          stamp(d.x, d.y, d.r * 1.3, 0.25 * dt * 10);
          continue;
        }
        // stick-slip: drops on glass run, pause, run again
        d.v = Math.min(d.v + 420 * dt * (d.r / 4), 60 + d.r * 40);
        const prevX = d.x, prevY = d.y;
        d.wob += dt * 3;
        d.y += d.v * dt;
        d.x += Math.sin(d.wob) * 0.25;
        stroke(prevX, prevY, d.x, d.y, d.r * 1.15, 0.5);
        if (Math.random() < dt * 0.7) { d.hold = 0.1 + Math.random() * 0.6; d.v = 0; }
        if (d.y - d.r > H) drops.splice(i, 1);
      }
    }
    function drawDrops() {
      for (const d of drops) {
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r * 0.9, d.r * 1.1, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(10, 20, 60, 0.35)";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(d.x - d.r * 0.15, d.y - d.r * 0.2, d.r * 0.7, d.r * 0.85, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.35, d.y - d.r * 0.45, Math.max(0.8, d.r * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fill();
      }
    }

    let frame = 0;
    function render() {
      const data = mimg.data;
      for (let i = 0, j = 3; i < mask.length; i++, j += 4) data[j] = mask[i] * 255;
      mctx.putImageData(mimg, 0, 0);

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(196, 207, 222, 0.66)";
      ctx.fillRect(0, 0, W, H);

      const tile = tiles[Math.floor(frame / 3) % tiles.length];
      const ox = (Math.random() * 190) | 0, oy = (Math.random() * 190) | 0;
      ctx.save();
      ctx.translate(-ox, -oy);
      ctx.fillStyle = tile;
      ctx.fillRect(0, 0, W + ox, H + oy);
      ctx.restore();

      ctx.globalCompositeOperation = "destination-in";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(mcan, 0, 0, W, H);

      ctx.globalCompositeOperation = "source-over";
      drawDrops();
      frame++;
    }

    /* the opening wipe: a palm swipe along each headline line */
    let intro = null;
    function buildIntro() {
      const g = glass.getBoundingClientRect();
      const pts = [];
      const rects = lines.map((l) => l.getBoundingClientRect());
      const r = Math.max(26, (rects[0] ? rects[0].height : H / 2) * 0.46);
      rects.forEach((rc, i) => {
        const cy = rc.top - g.top + rc.height * 0.52;
        const left = -r * 0.5, right = W + r * 0.5;
        if (i % 2 === 0) { pts.push([left, cy + r * 0.25], [right, cy - r * 0.15]); }
        else { pts.push([right, cy - r * 0.1], [left, cy + r * 0.2]); }
      });
      const segs = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        segs.push({ a: pts[i - 1], b: pts[i], len, at: total });
        total += len;
      }
      return { segs, total, r, t: 0, dur: 1.5, last: pts[0] };
    }
    function pointAt(path, dist) {
      for (const s of path.segs) {
        if (dist <= s.at + s.len) {
          const t = (dist - s.at) / s.len;
          return [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
        }
      }
      const s = path.segs[path.segs.length - 1];
      return s.b.slice();
    }
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function stepIntro(dt) {
      if (!intro) return;
      intro.t = Math.min(intro.dur, intro.t + dt);
      const p = pointAt(intro, ease(intro.t / intro.dur) * intro.total);
      // wobble the hand a little so it doesn't look ruled
      const wob = Math.sin(intro.t * 18) * intro.r * 0.08;
      stroke(intro.last[0], intro.last[1], p[0], p[1] + wob, intro.r, 0.85);
      if (Math.random() < 0.35) addDrop(p[0] + (Math.random() - 0.5) * intro.r, p[1] + intro.r * 0.85, 2.5 + Math.random() * 2);
      intro.last = [p[0], p[1] + wob];
      if (intro.t >= intro.dur) intro = null;
    }

    /* pointer wiping */
    let last = null;
    let down = false;
    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const brush = () => clamp(Math.min(W, H) * 0.075, 22, 64);
    function wipeTo(e) {
      const p = local(e);
      if (last) stroke(last[0], last[1], p[0], p[1], brush(), 0.7);
      else stamp(p[0], p[1], brush(), 0.7);
      if (Math.random() < 0.06) addDrop(p[0] + (Math.random() - 0.5) * brush(), p[1] + brush() * 0.8);
      last = p;
      dismissHint();
      requestDraw();
    }
    canvas.addEventListener("pointerdown", (e) => { down = true; last = local(e); wipeTo(e); });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" || down) wipeTo(e);
    });
    const end = () => { down = false; last = null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("pointerleave", end);

    /* loop */
    let running = false, raf = 0, prev = 0, visible = true, drawQueued = false, ready = false;
    let dropClock = 0;

    function tick(now) {
      const dt = Math.min(0.05, (now - prev) / 1000 || 0.016);
      prev = now;
      const k = 1 - Math.pow(0.5, dt / HALF_LIFE);
      for (let i = 0; i < mask.length; i++) mask[i] += (CAP - mask[i]) * k;
      stepIntro(dt);
      dropClock -= dt;
      if (dropClock <= 0) {
        addDrop(Math.random() * W, Math.random() * H * 0.45);
        dropClock = 0.5 + Math.random() * 1.3;
      }
      updateDrops(dt);
      render();
      raf = running ? requestAnimationFrame(tick) : 0;
    }
    function start() {
      if (!ready || running || reduceMotion.matches || !visible || document.hidden) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function requestDraw() {
      if (!ready || running || drawQueued) return;
      drawQueued = true;
      requestAnimationFrame(() => { drawQueued = false; render(); });
    }

    function init() {
      ready = true;
      resize();
      seedTrails();
      if (reduceMotion.matches) {
        // no animation: show the glass already wiped across the headline
        const path = buildIntro();
        let lastP = path.segs[0].a;
        for (let d = 0; d <= path.total; d += path.r * 0.25) {
          const p = pointAt(path, d);
          stroke(lastP[0], lastP[1], p[0], p[1], path.r, 0.85);
          lastP = p;
        }
        render();
      } else {
        intro = buildIntro();
        start();
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(glass);
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    reduceMotion.addEventListener?.("change", () => {
      if (!ready) return;
      if (reduceMotion.matches) { stop(); render(); } else start();
    });

    return {
      init,
      resize() { if (!ready) return; resize(); if (!running) render(); },
    };
  }

  /* hint copy matches the device */
  const hint = document.querySelector("[data-hint]");
  if (hint) {
    hint.textContent = finePointer.matches
      ? "Fogged up? Run your cursor across the glass to wipe it."
      : "Fogged up? Swipe sideways across the glass to wipe it.";
  }
  let hintDone = false;
  function dismissHint() {
    if (hintDone || !hint) return;
    hintDone = true;
    if (!reduceMotion.matches) hint.textContent = "It steams up again. Keep wiping.";
  }

  /* boot the hero once fonts are in, so measurements are right */
  let lastWidth = window.innerWidth;
  let booted = false;
  const boot = () => {
    if (booted) return;
    booted = true;
    fitTitle();
    if (fog) fog.init();
    // if the font was slow and we measured a fallback, measure again once it lands
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener("loadingdone", () => { fitTitle(); if (fog) fog.resize(); });
    }
  };
  if (document.fonts && document.fonts.load) {
    Promise.race([
      document.fonts.load('800 100px "Anek Latin"', "MONSOON STATIC"),
      new Promise((r) => setTimeout(r, 2500)),
    ]).then(boot, boot);
  } else {
    boot();
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // mobile browsers fire resize when the URL bar slides; only refit on width changes
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        fitTitle();
      }
      if (fog) fog.resize();
    }, 120);
  });

  /* ------------------------------------------------------------
     3. Countdown on the LED board
  ------------------------------------------------------------ */
  const countEl = document.querySelector("[data-countdown]");
  const countSr = document.querySelector("[data-countdown-sr]");
  const pad = (n) => String(n).padStart(2, "0");
  function updateCount() {
    if (!countEl) return;
    const diff = DROP_AT - Date.now();
    if (diff <= 0) {
      countEl.textContent = "Live now";
      if (countSr) countSr.textContent = "Monsoon Static is live now.";
      return false;
    }
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    countEl.textContent = `${d}d ${pad(h)}:${pad(m)}:${pad(s % 60)}`;
    return true;
  }
  if (updateCount() && countSr) {
    const days = Math.ceil((DROP_AT - Date.now()) / 86400000);
    countSr.textContent = `Drops on 16 January 2027 at 8 PM India time, ${days} ${days === 1 ? "day" : "days"} from now.`;
  }
  const countTimer = setInterval(() => { if (updateCount() === false) clearInterval(countTimer); }, 1000);

  /* ------------------------------------------------------------
     4. Drop alert sign-up
  ------------------------------------------------------------ */
  const forms = [...document.querySelectorAll("[data-signup]")];
  const DEFAULT_MSG = "One email the day before, one when it goes live. Nothing else.";
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showError(form, text) {
    const input = form.querySelector("input");
    const msg = form.querySelector(".signup__msg");
    input.setAttribute("aria-invalid", "true");
    msg.classList.add("is-error");
    msg.textContent = text;
    input.focus();
  }
  function clearError(form) {
    const input = form.querySelector("input");
    const msg = form.querySelector(".signup__msg");
    if (input.getAttribute("aria-invalid") !== "true") return;
    input.removeAttribute("aria-invalid");
    msg.classList.remove("is-error");
    msg.textContent = DEFAULT_MSG;
  }
  function markDone(email, focusForm) {
    for (const form of forms) {
      const msg = form.querySelector(".signup__msg");
      form.classList.add("is-done");
      msg.classList.remove("is-error");
      msg.textContent = `You're on the list. We'll email ${email} the day before and again at 8 PM on 16 January.`;
      msg.setAttribute("tabindex", "-1");
      if (form === focusForm) msg.focus();
    }
  }

  for (const form of forms) {
    const input = form.querySelector("input");
    const btn = form.querySelector("button");
    input.addEventListener("input", () => clearError(form));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email) return showError(form, "Type your email to get the drop alert.");
      if (!email.includes("@")) return showError(form, "That email is missing an @. Check it and try again.");
      if (!EMAIL_RE.test(email)) return showError(form, "That email looks incomplete. Check the part after the @.");

      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Adding you…";
      try {
        if (SIGNUP_ENDPOINT) {
          const res = await fetch(SIGNUP_ENDPOINT, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          if (!res.ok) throw new Error(String(res.status));
        } else {
          await new Promise((r) => setTimeout(r, 450));
        }
        markDone(email, form);
      } catch (err) {
        showError(form, "We couldn't add you just now. Check your connection and try again.");
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  /* ------------------------------------------------------------
     5. Calendar file for the drop
  ------------------------------------------------------------ */
  const icsBtn = document.querySelector("[data-ics]");
  if (icsBtn) {
    icsBtn.addEventListener("click", () => {
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Khali Sadak//Monsoon Static//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:monsoon-static-20270116@khalisadak",
        "DTSTAMP:" + stamp,
        "DTSTART:20270116T143000Z",
        "DTEND:20270116T153000Z",
        "SUMMARY:Monsoon Static drop by Khali Sadak",
        "DESCRIPTION:Six pieces go live at 8 PM IST on the Khali Sadak website. Small batches\\, so be early. Instagram: @khalisadak.studio",
        "LOCATION:Khali Sadak website",
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Monsoon Static drops in 15 minutes",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "monsoon-static-drop.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      icsBtn.textContent = "Calendar file downloaded. Open it to save the reminder.";
    });
  }

  /* ------------------------------------------------------------
     6. Clothes on the line swing when you touch them,
        and when the line moves under them.
  ------------------------------------------------------------ */
  const hangers = [...document.querySelectorAll("[data-swing]")].map((el, i) => ({
    el, a: 0, v: 0, k: 1 + (i % 3) * 0.12,
  }));
  if (hangers.length) {
    const K = 46, C = 2.4;
    let swinging = false, prevT = 0;
    const loop = (now) => {
      const dt = Math.min(0.04, (now - prevT) / 1000 || 0.016);
      prevT = now;
      let energy = 0;
      for (const h of hangers) {
        h.v += (-K * h.k * h.a - C * h.v) * dt;
        h.a = clamp(h.a + h.v * dt, -24, 24);
        energy += Math.abs(h.a) + Math.abs(h.v) * 0.1;
        h.el.style.setProperty("--r", h.a.toFixed(2) + "deg");
      }
      if (energy > 0.05) requestAnimationFrame(loop);
      else {
        swinging = false;
        for (const h of hangers) { h.a = 0; h.v = 0; h.el.style.setProperty("--r", "0deg"); }
      }
    };
    const kick = (h, amount) => {
      if (reduceMotion.matches) return;
      h.v += amount;
      if (!swinging) { swinging = true; prevT = performance.now(); requestAnimationFrame(loop); }
    };

    for (const h of hangers) {
      h.el.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;
        kick(h, (e.movementX >= 0 ? 1 : -1) * 55);
      });
      h.el.addEventListener("pointerdown", () => kick(h, (Math.random() < 0.5 ? -1 : 1) * 80));
    }

    // dragging the line sideways (mobile) swings everything the other way
    const scroller = document.querySelector(".line__scroller");
    if (scroller) {
      let lastX = scroller.scrollLeft;
      scroller.addEventListener("scroll", () => {
        const dx = scroller.scrollLeft - lastX;
        lastX = scroller.scrollLeft;
        for (const h of hangers) kick(h, clamp(-dx * 0.9, -30, 30));
      }, { passive: true });
    }
  }
})();
