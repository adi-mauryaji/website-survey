/* Basma Dental Clinic — small progressive enhancements. The page works without this file. */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'ar').slice(0, 2) === 'en' ? 'en' : 'ar';
  var meta = document.querySelector('meta[name="clinic-whatsapp"]');
  var WA_NUMBER = meta ? meta.content.replace(/\D/g, '') : '';

  var T = {
    ar: {
      openNow: 'مفتوح الآن',
      closedNow: 'مغلق الآن',
      untilClose: 'حتى ٩ مساءً',
      opensToday: 'نفتح اليوم ١٠ صباحاً',
      opensTomorrow: 'نفتح غداً ١٠ صباحاً',
      opensSaturday: 'نفتح السبت ١٠ صباحاً',
      messageAnytime: 'ويمكنك مراسلتنا على واتساب في أي وقت',
      today: 'اليوم',
      greeting: 'مرحباً عيادة بسمة، أود حجز موعد.',
      name: 'الاسم',
      patient: 'صاحب الموعد',
      service: 'الخدمة',
      day: 'اليوم المناسب',
      time: 'الوقت المناسب'
    },
    en: {
      openNow: 'Open now',
      closedNow: 'Closed now',
      untilClose: 'until 9 pm',
      opensToday: 'opens today at 10 am',
      opensTomorrow: 'opens tomorrow at 10 am',
      opensSaturday: 'opens Saturday at 10 am',
      messageAnytime: 'you can still message us on WhatsApp',
      today: 'Today',
      greeting: 'Hello Basma Dental Clinic, I would like to book an appointment.',
      name: 'Name',
      patient: 'Appointment for',
      service: 'Service',
      day: 'Preferred day',
      time: 'Preferred time'
    }
  }[lang];

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
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
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) setOpen(false);
    });
  }

  /* ---------- Language switch keeps the current section ---------- */
  document.querySelectorAll('[data-lang-switch]').forEach(function (link) {
    link.addEventListener('click', function () {
      var base = link.getAttribute('href').split('#')[0];
      if (location.hash) link.setAttribute('href', base + location.hash);
    });
  });

  /* ---------- Open / closed status (clinic time = Africa/Cairo) ---------- */
  // Hours: Saturday–Thursday 10:00–21:00. Friday closed. Day index: Sun=0 … Sat=6.
  var OPEN_MIN = 10 * 60;
  var CLOSE_MIN = 21 * 60;
  var FRIDAY = 5;
  var THURSDAY = 4;

  function cairoNow() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23'
    }).formatToParts(new Date());
    var get = function (type) {
      for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
      return '';
    };
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[get('weekday')], minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  }

  function renderStatus() {
    var now;
    try {
      now = cairoNow();
    } catch (err) {
      return; // Keep the static hours text.
    }
    if (typeof now.day !== 'number' || isNaN(now.minutes)) return;

    var isOpen = now.day !== FRIDAY && now.minutes >= OPEN_MIN && now.minutes < CLOSE_MIN;
    var detail;
    if (isOpen) {
      detail = T.untilClose;
    } else if (now.day !== FRIDAY && now.minutes < OPEN_MIN) {
      detail = T.opensToday;
    } else if (now.day === FRIDAY || now.day === THURSDAY) {
      detail = T.opensSaturday;
    } else {
      detail = T.opensTomorrow;
    }
    if (!isOpen) detail += ' — ' + T.messageAnytime;

    document.querySelectorAll('[data-open-status]').forEach(function (el) {
      var text = el.querySelector('.status-text');
      if (!text) return;
      var strong = document.createElement('strong');
      strong.textContent = isOpen ? T.openNow : T.closedNow;
      text.textContent = '';
      text.appendChild(strong);
      text.appendChild(document.createTextNode(' · ' + detail));
      el.classList.toggle('is-open', isOpen);
    });

    document.querySelectorAll('.hours tr[data-day]').forEach(function (row) {
      var isToday = Number(row.getAttribute('data-day')) === now.day;
      row.classList.toggle('is-today', isToday);
      var badge = row.querySelector('.today-badge');
      if (isToday && !badge) {
        badge = document.createElement('span');
        badge.className = 'today-badge';
        badge.textContent = T.today;
        row.querySelector('th').appendChild(badge);
      } else if (!isToday && badge) {
        badge.remove();
      }
    });
  }

  renderStatus();
  setInterval(renderStatus, 60 * 1000);

  /* ---------- WhatsApp booking-message builder ---------- */
  var form = document.getElementById('book-form');
  var preview = document.getElementById('wa-preview');
  var send = document.getElementById('wa-send');

  if (form && preview && send && WA_NUMBER) {
    var selectedText = function (select) {
      return select.options[select.selectedIndex].text.trim();
    };

    var compose = function () {
      var lines = [T.greeting];
      var name = form.elements.name.value.trim();
      if (name) lines.push(T.name + ': ' + name);
      var patient = form.querySelector('input[name="patient"]:checked');
      if (patient) lines.push(T.patient + ': ' + patient.getAttribute('data-msg'));
      lines.push(T.service + ': ' + selectedText(form.elements.service));
      lines.push(T.day + ': ' + selectedText(form.elements.day));
      lines.push(T.time + ': ' + selectedText(form.elements.time));
      return lines.join('\n');
    };

    var update = function () {
      var message = compose();
      preview.textContent = message;
      send.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
    };

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    // Pressing Enter in the name field should not leave the page; it just refreshes the preview.
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      update();
    });
    update();
  }
})();
