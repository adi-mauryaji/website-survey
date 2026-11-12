/* Abgleich landing page
   1. The reconciliation sheet: draws connectors between bank rows and the
      open invoices they were matched to, then plays the reveal once.
   2. The price calculator. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- 1. Reconciliation sheet ---------- */

  var sheet = document.querySelector('[data-sheet]');
  if (sheet) initSheet(sheet);

  function initSheet(sheet) {
    var grid = sheet.querySelector('.sheet-grid');
    var svg = sheet.querySelector('svg.links');
    var bankPanel = sheet.querySelector('.ledger-bank');
    var openPanel = sheet.querySelector('.ledger-open');
    var bankRows = Array.prototype.slice.call(bankPanel.querySelectorAll('.row'));
    var wide = window.matchMedia('(min-width: 56.25rem)');
    var links = [];

    bankRows.forEach(function (row) {
      var id = row.getAttribute('data-match');
      var target = id ? openPanel.querySelector('[data-id="' + id + '"]') : null;
      if (!target) return;

      var flag = row.classList.contains('is-flag');
      var g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'link' + (flag ? ' is-flag' : ''));

      var trace = document.createElementNS(SVG_NS, 'path');
      trace.setAttribute('class', 'trace');
      trace.setAttribute('pathLength', '1');
      g.appendChild(trace);

      var dash = null;
      if (flag) {
        dash = document.createElementNS(SVG_NS, 'path');
        dash.setAttribute('class', 'dash');
        g.appendChild(dash);
      }

      var start = document.createElementNS(SVG_NS, 'circle');
      start.setAttribute('class', 'start');
      start.setAttribute('r', '3.5');
      var end = document.createElementNS(SVG_NS, 'circle');
      end.setAttribute('class', 'end');
      end.setAttribute('r', '3.5');
      g.appendChild(start);
      g.appendChild(end);

      svg.appendChild(g);
      links.push({ row: row, target: target, g: g, trace: trace, dash: dash, start: start, end: end });
    });

    function linkFor(row) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].row === row) return links[i];
      }
      return null;
    }

    function centreY(el, top) {
      var r = el.getBoundingClientRect();
      return r.top + r.height / 2 - top;
    }

    function layout() {
      var isWide = wide.matches && links.length > 0;
      grid.classList.toggle('has-links', isWide);
      svg.style.display = isWide ? '' : 'none';
      if (!isWide) return;

      var box = grid.getBoundingClientRect();
      var x1 = bankPanel.getBoundingClientRect().right - box.left;
      var x2 = openPanel.getBoundingClientRect().left - box.left;
      var k = (x2 - x1) * 0.6;
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);

      links.forEach(function (l) {
        var y1 = centreY(l.row.querySelector('.r-amount'), box.top);
        var y2 = centreY(l.target.querySelector('.r-amount'), box.top);
        var d = 'M' + x1 + ' ' + y1 +
          ' C' + (x1 + k) + ' ' + y1 + ' ' + (x2 - k) + ' ' + y2 + ' ' + x2 + ' ' + y2;
        l.trace.setAttribute('d', d);
        if (l.dash) l.dash.setAttribute('d', d);
        l.start.setAttribute('cx', x1);
        l.start.setAttribute('cy', y1);
        l.end.setAttribute('cx', x2);
        l.end.setAttribute('cy', y2);
      });
    }

    function markDone(row) {
      var link = linkFor(row);
      row.classList.add('done');
      if (link) {
        link.target.classList.add('done');
        link.g.classList.add('on', 'drawn');
      }
    }

    function finish() {
      bankRows.forEach(markDone);
    }

    var played = false;
    function play() {
      if (played) return;
      played = true;
      var first = 300;
      var interval = 360;
      var draw = 450;
      bankRows.forEach(function (row, i) {
        window.setTimeout(function () {
          var link = linkFor(row);
          if (link && wide.matches) {
            link.g.classList.add('on');
            window.setTimeout(function () { markDone(row); }, draw);
          } else {
            markDone(row);
          }
        }, first + i * interval);
      });
    }

    var scheduled = false;
    function scheduleLayout() {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        layout();
      });
    }

    layout();
    if ('ResizeObserver' in window) {
      new ResizeObserver(scheduleLayout).observe(grid);
    } else {
      window.addEventListener('resize', scheduleLayout);
    }
    if (wide.addEventListener) wide.addEventListener('change', scheduleLayout);

    var fontsReady = document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();

    var canAnimate = !reduceMotion.matches && 'IntersectionObserver' in window;
    if (!canAnimate) {
      finish();
      fontsReady.then(layout);
      return;
    }

    // Hide the marks until the sheet is on screen, then reconcile once.
    sheet.classList.add('is-armed');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        fontsReady.then(function () {
          layout();
          play();
        });
      });
    }, { threshold: 0.3 });
    io.observe(sheet);

    // If the visitor switches motion off mid-way, show the result at once.
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener('change', function (e) {
        if (e.matches) finish();
      });
    }
  }

  /* ---------- 2. Price calculator ---------- */

  var calc = document.querySelector('.calc');
  if (calc) initCalc(calc);

  function initCalc(form) {
    var BASE = 290;
    var INCLUDED = 5;
    var PER_USER = 40;
    var MIN = 1;
    var MAX = 999;

    var input = form.querySelector('#users');
    var extraRow = form.querySelector('[data-extra-row]');
    var extraLabel = form.querySelector('[data-extra-label]');
    var extraSum = form.querySelector('[data-extra-sum]');
    var total = form.querySelector('[data-total]');
    var euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

    function parse(value) {
      var n = parseInt(value, 10);
      if (isNaN(n)) return null;
      return Math.min(MAX, Math.max(MIN, n));
    }

    function render(n) {
      var extra = Math.max(0, n - INCLUDED);
      extraRow.hidden = extra === 0;
      extraLabel.textContent = (extra === 1 ? '1 weiterer Nutzer' : extra + ' weitere Nutzer') +
        ' × ' + euro.format(PER_USER);
      extraSum.textContent = euro.format(extra * PER_USER);
      total.textContent = euro.format(BASE + extra * PER_USER);
    }

    input.addEventListener('input', function () {
      var n = parse(input.value);
      if (n !== null) render(n);
    });

    input.addEventListener('change', function () {
      var n = parse(input.value);
      if (n === null) n = MIN;
      input.value = n;
      render(n);
    });

    Array.prototype.forEach.call(form.querySelectorAll('[data-step]'), function (btn) {
      btn.addEventListener('click', function () {
        var current = parse(input.value);
        if (current === null) current = MIN;
        var n = Math.min(MAX, Math.max(MIN, current + Number(btn.getAttribute('data-step'))));
        input.value = n;
        render(n);
      });
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); });

    render(parse(input.value) || MIN);
  }
})();
