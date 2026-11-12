/* Basma Dental Clinic: open-now status, today's row, WhatsApp message builder. */
(function () {
  'use strict';

  var PHONE = '200000000000'; // +20 000 000 0000, digits only for wa.me
  var OPEN_MIN = 10 * 60;     // 10:00
  var CLOSE_MIN = 21 * 60;    // 21:00
  var FRIDAY = 6;             // week index, Saturday = 0

  var lang = document.documentElement.lang === 'en' ? 'en' : 'ar';

  var T = {
    ar: {
      open: 'مفتوح الآن حتى ٩\u00a0مساءً',
      laterToday: 'مغلق الآن. نفتح اليوم الساعة ١٠\u00a0صباحاً',
      tomorrow: 'مغلق الآن. نفتح غداً الساعة ١٠\u00a0صباحاً',
      tomorrowSat: 'الجمعة إجازة. نفتح غداً السبت الساعة ١٠\u00a0صباحاً',
      saturday: 'مغلق الآن. نفتح السبت الساعة ١٠\u00a0صباحاً',
      todayTag: 'اليوم',
      greeting: 'مرحباً، أود حجز موعد في عيادة بسمة لطب الأسنان.',
      name: 'الاسم',
      adults: 'الكبار',
      kids: 'الأطفال',
      service: 'الخدمة',
      doctor: 'الطبيب',
      when: 'الموعد المناسب',
      sep: '، ',
      num: function (n) { return Number(n).toLocaleString('ar-EG'); }
    },
    en: {
      open: 'Open now until 9\u00a0pm',
      laterToday: 'Closed now. Opens today at 10\u00a0am',
      tomorrow: 'Closed now. Opens tomorrow at 10\u00a0am',
      tomorrowSat: 'Closed on Fridays. Opens tomorrow, Saturday, at 10\u00a0am',
      saturday: 'Closed now. Opens Saturday at 10\u00a0am',
      todayTag: 'Today',
      greeting: 'Hello, I would like to book an appointment at Basma Dental Clinic.',
      name: 'Name',
      adults: 'Adults',
      kids: 'Children',
      service: 'Service',
      doctor: 'Dentist',
      when: 'Preferred time',
      sep: ', ',
      num: function (n) { return String(n); }
    }
  }[lang];

  /* ---------- Cairo clock ---------- */
  function cairoNow() {
    var map = { Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 };
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Cairo',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: map[o.weekday], minutes: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: (d.getDay() + 1) % 7, minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function statusFor(now) {
    var workday = now.day !== FRIDAY;
    if (workday && now.minutes >= OPEN_MIN && now.minutes < CLOSE_MIN) return { state: 'open', text: T.open };
    if (workday && now.minutes < OPEN_MIN) return { state: 'closed', text: T.laterToday };
    if (now.day === FRIDAY) return { state: 'closed', text: T.tomorrowSat };
    if ((now.day + 1) % 7 === FRIDAY) return { state: 'closed', text: T.saturday };
    return { state: 'closed', text: T.tomorrow };
  }

  function renderClock() {
    var now = cairoNow();
    var s = statusFor(now);
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.textContent = s.text;
      el.setAttribute('data-state', s.state);
      el.hidden = false;
    });

    var row = document.querySelector('.week tr[data-day="' + now.day + '"]');
    if (row && !row.classList.contains('is-today')) {
      document.querySelectorAll('.week .is-today').forEach(function (r) {
        r.classList.remove('is-today');
        var tag = r.querySelector('.today-tag');
        if (tag) tag.remove();
      });
      row.classList.add('is-today');
      var tag = document.createElement('span');
      tag.className = 'today-tag';
      tag.textContent = T.todayTag;
      row.querySelector('th').appendChild(tag);
    }
  }

  renderClock();
  setInterval(renderClock, 60 * 1000);

  /* ---------- WhatsApp message builder ---------- */
  var form = document.getElementById('composer');
  if (!form) return;

  var preview = document.getElementById('preview');
  var send = document.getElementById('send');

  function selectedText(select) {
    return select.options[select.selectedIndex].text;
  }
  function checkedRadio(name) {
    return form.querySelector('input[name="' + name + '"]:checked');
  }
  function radioText(input) {
    return input.nextElementSibling.textContent.trim();
  }

  function buildMessage() {
    var lines = [T.greeting];

    var name = form.elements.name.value.trim();
    if (name) lines.push(T.name + ': ' + name);

    var adults = parseInt(form.elements.adults.value, 10);
    var kids = parseInt(form.elements.kids.value, 10);
    var people = [];
    if (adults > 0) people.push(T.adults + ': ' + T.num(adults));
    if (kids > 0) people.push(T.kids + ': ' + T.num(kids));
    if (people.length) lines.push(people.join(T.sep));

    lines.push(T.service + ': ' + selectedText(form.elements.service));

    if (form.elements.doctor.value !== 'any') {
      lines.push(T.doctor + ': ' + selectedText(form.elements.doctor));
    }

    var day = checkedRadio('day');
    var time = checkedRadio('time');
    if (day.value !== 'any' || time.value !== 'any') {
      lines.push(T.when + ': ' + radioText(day) + T.sep + radioText(time));
    }

    return lines.join('\n');
  }

  function update() {
    var msg = buildMessage();
    preview.textContent = msg;
    send.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  // "Book with Dr. ..." links preselect the dentist (and service) in the builder.
  var title = document.getElementById('composer-title');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-pick-doctor]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      form.elements.doctor.value = link.getAttribute('data-pick-doctor');
      var svc = link.getAttribute('data-pick-service');
      if (svc) form.elements.service.value = svc;
      update();
      // Take the visitor to the message builder, with the dentist already chosen.
      title.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      title.focus({ preventScroll: true });
    });
  });

  update();
})();
