// Blind pairwise website survey. Static page; answers go to a Google Form (config.js) and stay
// in localStorage until sent. No names, emails or IP-derived data are collected by this page.
(async () => {
  const C = Object.assign({ formAction: '', entry: '', perVoter: 4, minSeconds: 15, attentionCheck: true }, window.VOTE_CONFIG || {});
  const KEY = 'kx-vote-v1';
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage blocked: answers live in memory only */ } },
  };
  const $ = (id) => document.getElementById(id);

  const T = {
    en: {
      brand: 'Website opinion survey', other: 'हिन्दी',
      title: 'Which version of the website works better?',
      intro1: 'You will see two versions of the same website. Each website was made for a specific group of people. Look at both, then tell us which would work better for those people.',
      intro2: 'About 5 minutes. Anonymous: we never ask your name or contact details. There are no right answers and you will not hurt anyone’s feelings, so please be honest. The businesses are fictional.',
      ageQ: 'Your age', ages: ['Prefer not to say', 'Under 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65+'],
      regionQ: 'Country or state you live in (optional)',
      langsQ: 'Which languages can you read comfortably?',
      designerQ: 'Do you work or study in design, marketing or software?', yes: 'Yes', no: 'No',
      consent: 'I agree that my anonymous answers are used for research on website design.',
      begin: 'Start', needConsent: 'Please tick the agreement box to start.',
      progress: 'Pair {i} of {n}', langNote: 'Website language: {l}', builtFor: '{t}. Made for: {a}',
      viewDesk: 'Show desktop view', viewPhone: 'Show phone view', verA: 'Version A', verB: 'Version B',
      waitBoth: 'Please open and look at both versions first.',
      waitTime: 'You can answer in {s} s — take a good look at both versions.',
      whichQ: 'Which version would work better for these people?',
      choices: { left: 'Version A works better', tie: 'About the same', right: 'Version B works better', skip: 'I can’t judge this one (e.g. I can’t read the language)' },
      fitQ: 'Are you one of the people this website is for?', fit: { yes: 'Yes', partly: 'Partly', no: 'No' },
      reasonsQ: 'Why that version? (optional, pick any)',
      reasons: { read: 'Easier to read', next: 'Clearer what to do next', trust: 'More trustworthy', looks: 'Looks better', fits: 'Fits these people better', honest: 'Feels more honest', phone: 'Works better on my phone' },
      commentQ: 'Anything else? (optional)',
      next: 'Save and continue', finish: 'Save and finish',
      thanks: 'Thank you!', thanks2: 'Your answers help us learn what makes websites work for real people. Please share this link with friends and family of all ages.',
      sent: 'All your answers have been sent.', pending: '{n} answer(s) still sending — keep this page open with the internet on.',
      localOnly: 'Answers are saved on this device only. Use “Download my answers” and send the file to the person who shared this survey.',
      more: 'Do more pairs', download: 'Download my answers', allDone: 'You have seen every pair. Thank you!',
    },
    hi: {
      brand: 'वेबसाइट राय सर्वे', other: 'English',
      title: 'वेबसाइट का कौन-सा रूप बेहतर काम करता है?',
      intro1: 'आपको एक ही वेबसाइट के दो रूप दिखेंगे। हर वेबसाइट किसी खास तरह के लोगों के लिए बनी है। दोनों को देखिए, फिर बताइए कि उन लोगों के लिए कौन-सा बेहतर काम करेगा।',
      intro2: 'लगभग 5 मिनट। आपका नाम या नंबर कभी नहीं पूछा जाएगा। कोई सही-गलत जवाब नहीं है और किसी को बुरा नहीं लगेगा, इसलिए ईमानदारी से बताइए। ये सभी बिज़नेस काल्पनिक हैं।',
      ageQ: 'आपकी उम्र', ages: ['नहीं बताना', '18 से कम', '18–24', '25–34', '35–44', '45–54', '55–64', '65+'],
      regionQ: 'आप किस देश या राज्य में रहते हैं (वैकल्पिक)',
      langsQ: 'आप कौन-सी भाषाएँ आराम से पढ़ लेते हैं?',
      designerQ: 'क्या आप डिज़ाइन, मार्केटिंग या सॉफ़्टवेयर में काम या पढ़ाई करते हैं?', yes: 'हाँ', no: 'नहीं',
      consent: 'मैं सहमत हूँ कि मेरे जवाब (बिना नाम के) वेबसाइट डिज़ाइन की रिसर्च में इस्तेमाल हों।',
      begin: 'शुरू करें', needConsent: 'शुरू करने के लिए सहमति वाला बॉक्स चुनें।',
      progress: 'जोड़ी {i} / {n}', langNote: 'वेबसाइट की भाषा: {l}', builtFor: '{t}. किसके लिए: {a}',
      viewDesk: 'डेस्कटॉप व्यू दिखाएँ', viewPhone: 'फ़ोन व्यू दिखाएँ', verA: 'रूप A', verB: 'रूप B',
      waitBoth: 'पहले दोनों रूप खोलकर देखिए।',
      waitTime: '{s} सेकंड में जवाब दे सकेंगे — दोनों रूप ध्यान से देखिए।',
      whichQ: 'इन लोगों के लिए कौन-सा रूप बेहतर काम करेगा?',
      choices: { left: 'रूप A बेहतर', tie: 'लगभग एक जैसे', right: 'रूप B बेहतर', skip: 'मैं इसे नहीं आँक सकता/सकती (जैसे भाषा नहीं पढ़ पाता/पाती)' },
      fitQ: 'क्या आप उन लोगों में से हैं जिनके लिए यह वेबसाइट बनी है?', fit: { yes: 'हाँ', partly: 'कुछ हद तक', no: 'नहीं' },
      reasonsQ: 'यही रूप क्यों? (वैकल्पिक, जितने चाहें)',
      reasons: { read: 'पढ़ने में आसान', next: 'आगे क्या करना है, साफ़ है', trust: 'ज़्यादा भरोसेमंद', looks: 'देखने में बेहतर', fits: 'इन लोगों के लिए सही', honest: 'ज़्यादा ईमानदार लगता है', phone: 'मेरे फ़ोन पर बेहतर चलता है' },
      commentQ: 'कुछ और कहना है? (वैकल्पिक)',
      next: 'सेव करें और आगे बढ़ें', finish: 'सेव करें और ख़त्म करें',
      thanks: 'धन्यवाद!', thanks2: 'आपके जवाबों से हमें समझ आता है कि असली लोगों के लिए वेबसाइट कैसे बेहतर बने। यह लिंक हर उम्र के दोस्तों और परिवार के साथ शेयर कीजिए।',
      sent: 'आपके सारे जवाब भेज दिए गए।', pending: '{n} जवाब भेजने बाकी हैं — इंटरनेट चालू रखकर यह पेज खुला रखें।',
      localOnly: 'जवाब सिर्फ़ इस डिवाइस पर सेव हैं। “मेरे जवाब डाउनलोड करें” दबाकर फ़ाइल उसे भेजें जिसने यह सर्वे शेयर किया।',
      more: 'और जोड़ियाँ करें', download: 'मेरे जवाब डाउनलोड करें', allDone: 'आपने सारी जोड़ियाँ देख लीं। धन्यवाद!',
    },
  };
  const LANGS = [['en', 'English'], ['hi', 'हिन्दी Hindi'], ['mr', 'मराठी Marathi'], ['ta', 'तमिल Tamil'], ['ar', 'العربية Arabic'], ['de', 'Deutsch German'], ['ja', '日本語 Japanese'], ['es', 'Español Spanish']];

  const rand = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).slice(0, 12);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (s, o) => s.replace(/\{(\w)\}/g, (_, k) => o[k]);

  const S = store.get() || { voter: rand(), ui: (navigator.language || '').startsWith('hi') ? 'hi' : 'en', profile: null, plan: [], idx: 0, seen: [], answers: [], queue: [] };
  const save = () => store.set(S);
  const t = () => T[S.ui];

  let pairs = [];
  try { pairs = await (await fetch('pairs.json', { cache: 'no-store' })).json(); } catch { /* shown below */ }

  // ---------- language and static text ----------
  const paintText = () => {
    document.documentElement.lang = S.ui;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t]; });
    $('langBtn').textContent = t().other;
    $('langBtn').setAttribute('lang', S.ui === 'en' ? 'hi' : 'en');
    const age = $('age'); const cur = age.value;
    age.innerHTML = t().ages.map((a, i) => `<option value="${i}">${a}</option>`).join(''); age.value = cur || '0';
    const langsOn = [...$('langs').querySelectorAll('input:checked')].map((i) => i.value);
    const designerOn = ($('designer').querySelector('input:checked') || {}).value;
    $('langs').innerHTML = LANGS.map(([c, n]) => `<label class="opt"><input type="checkbox" value="${c}"${langsOn.includes(c) ? ' checked' : ''}> <span>${n}</span></label>`).join('');
    $('designer').innerHTML = ['yes', 'no'].map((v) => `<label class="opt"><input type="radio" name="designer" value="${v}"${designerOn === v ? ' checked' : ''}> <span>${t()[v]}</span></label>`).join('');
    if (!$('vote').hidden) renderPair(false);
    if (!$('done').hidden) paintSendState();
  };
  $('langBtn').onclick = () => { S.ui = S.ui === 'en' ? 'hi' : 'en'; save(); paintText(); };

  // ---------- start ----------
  const buildPlan = (first) => {
    const unseen = shuffle(pairs.filter((p) => !S.seen.includes(p.brief)));
    const plan = unseen.slice(0, C.perVoter).map((p) => {
      const [l, r] = shuffle(Object.keys(p.options));
      return { brief: p.brief, left: l, right: r, check: false };
    });
    if (first && C.attentionCheck && plan.length >= 2) {
      const p = pairs[Math.floor(Math.random() * pairs.length)];
      const o = shuffle(Object.keys(p.options))[0];
      plan.splice(1 + Math.floor(Math.random() * (plan.length - 1)), 0, { brief: p.brief, left: o, right: o, check: true });
    }
    return plan;
  };
  $('begin').onclick = () => {
    if (!$('consent').checked) { $('startMsg').textContent = t().needConsent; return; }
    if (!pairs.length) { $('startMsg').textContent = 'pairs.json could not be loaded.'; return; }
    S.profile = {
      age: Number($('age').value) === 0 ? '' : T.en.ages[Number($('age').value)],
      region: $('region').value.trim().slice(0, 40),
      langs: [...$('langs').querySelectorAll('input:checked')].map((i) => i.value),
      designer: ($('designer').querySelector('input:checked') || {}).value || '',
    };
    S.plan = buildPlan(true); S.idx = 0; save();
    $('start').hidden = true; $('vote').hidden = false; renderPair(true);
  };

  // ---------- pair ----------
  const narrow = matchMedia('(max-width: 899px)');
  let desktop = false; let shownAt = 0; let viewedB = false; let choice = null; let timer = 0;
  const fit = (frame) => {
    const ifr = frame.querySelector('iframe');
    if (!ifr || !frame.clientWidth) return;
    const w = desktop ? 1280 : 390;
    const scale = Math.min(1, frame.clientWidth / w);
    ifr.style.width = w + 'px';
    ifr.style.height = frame.clientHeight / scale + 'px';
    ifr.style.transform = `scale(${scale})`;
    ifr.style.left = Math.max(0, (frame.clientWidth - w * scale) / 2) + 'px';
  };
  new ResizeObserver(() => { fit($('fA')); fit($('fB')); }).observe(document.body);
  const showTab = (b) => {
    if (!narrow.matches) { $('paneA').hidden = false; $('paneB').hidden = false; return; }
    $('paneA').hidden = b; $('paneB').hidden = !b;
    $('tabA').setAttribute('aria-pressed', String(!b)); $('tabB').setAttribute('aria-pressed', String(b));
    if (b) viewedB = true;
    fit($('fA')); fit($('fB'));
  };
  $('tabA').onclick = () => showTab(false);
  $('tabB').onclick = () => showTab(true);
  narrow.addEventListener('change', () => showTab(false));
  $('view').onclick = () => { desktop = !desktop; $('view').setAttribute('aria-pressed', String(desktop)); $('view').textContent = desktop ? t().viewPhone : t().viewDesk; fit($('fA')); fit($('fB')); };

  const canAnswer = () => (narrow.matches ? viewedB : true) && Date.now() - shownAt >= C.minSeconds * 1000;
  const tick = () => {
    const left = Math.ceil((C.minSeconds * 1000 - (Date.now() - shownAt)) / 1000);
    const ok = canAnswer();
    $('wait').textContent = ok ? '' : (narrow.matches && !viewedB ? t().waitBoth : fmt(t().waitTime, { s: Math.max(left, 0) }));
    $('choices').querySelectorAll('button').forEach((b) => { b.disabled = !ok; });
    if (ok) clearInterval(timer);
  };

  function renderPair(fresh) {
    const item = S.plan[S.idx];
    const pair = pairs.find((p) => p.brief === item.brief);
    $('progress').textContent = fmt(t().progress, { i: S.idx + 1, n: S.plan.length });
    $('langNote').textContent = fmt(t().langNote, { l: pair.language });
    $('audience').textContent = fmt(t().builtFor, { t: pair.title, a: pair.audience });
    $('hA').textContent = t().verA; $('hB').textContent = t().verB;
    $('tabA').textContent = t().verA; $('tabB').textContent = t().verB;
    $('view').textContent = desktop ? t().viewPhone : t().viewDesk;
    $('choices').innerHTML = ['left', 'tie', 'right', 'skip'].map((c) => `<button type="button" data-c="${c}" aria-pressed="${choice === c}">${t().choices[c]}</button>`).join('');
    $('fit').innerHTML = ['yes', 'partly', 'no'].map((v) => `<label class="opt"><input type="radio" name="fit" value="${v}"> <span>${t().fit[v]}</span></label>`).join('');
    $('reasons').innerHTML = Object.entries(t().reasons).map(([k, v]) => `<label class="opt"><input type="checkbox" value="${k}"> <span>${v}</span></label>`).join('');
    $('next').textContent = S.idx === S.plan.length - 1 ? t().finish : t().next;
    $('choices').querySelectorAll('button').forEach((b) => { b.onclick = () => pick(b.dataset.c); });
    if (fresh) {
      choice = null; viewedB = false; shownAt = Date.now();
      $('comment').value = ''; $('details').hidden = true; $('next').disabled = true;
      for (const [id, opt] of [['fA', item.left], ['fB', item.right]]) {
        const ifr = document.createElement('iframe');
        ifr.title = id === 'fA' ? t().verA : t().verB;
        ifr.src = pair.options[opt];
        $(id).replaceChildren(ifr);
      }
      showTab(false);
      requestAnimationFrame(() => { fit($('fA')); fit($('fB')); });
      clearInterval(timer); timer = setInterval(tick, 500);
      window.scrollTo(0, 0);
    }
    tick();
  }

  function pick(c) {
    if (!canAnswer()) return;
    choice = c;
    $('choices').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === c)));
    $('details').hidden = false;
    $('reasonsBox').hidden = !(c === 'left' || c === 'right');
    $('next').disabled = false;
  }

  $('next').onclick = () => {
    if (!choice) return;
    const item = S.plan[S.idx];
    const ans = {
      v: 1, voter: S.voter, at: new Date().toISOString(), ui: S.ui,
      device: innerWidth < 600 ? 'phone' : innerWidth < 1024 ? 'tablet' : 'desktop', view: desktop ? 'desktop' : 'phone',
      profile: S.profile, brief: item.brief, left: item.left, right: item.right, check: item.check,
      choice, winner: choice === 'left' ? item.left : choice === 'right' ? item.right : null,
      fit: ($('fit').querySelector('input:checked') || {}).value || '',
      reasons: choice === 'left' || choice === 'right' ? [...$('reasons').querySelectorAll('input:checked')].map((i) => i.value) : [],
      comment: $('comment').value.trim().slice(0, 1000), dwellMs: Date.now() - shownAt, position: S.idx,
    };
    S.answers.push(ans); S.queue.push(ans);
    if (!item.check && !S.seen.includes(item.brief)) S.seen.push(item.brief);
    S.idx++; save(); send();
    if (S.idx < S.plan.length) renderPair(true);
    else { clearInterval(timer); $('vote').hidden = true; $('done').hidden = false; paintSendState(); }
  };

  // ---------- sending ----------
  let sending = false;
  async function send() {
    if (sending || !C.formAction || !C.entry) { paintSendState(); return; }
    sending = true;
    while (S.queue.length) {
      try {
        await fetch(C.formAction, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ [`entry.${C.entry}`]: JSON.stringify(S.queue[0]) }) });
        S.queue.shift(); save();
      } catch { break; }
    }
    sending = false; paintSendState();
    if (S.queue.length) setTimeout(send, 15000);
  }
  function paintSendState() {
    if ($('done').hidden) return;
    $('sendState').textContent = !C.formAction ? t().localOnly : S.queue.length ? fmt(t().pending, { n: S.queue.length }) : t().sent;
    const left = pairs.filter((p) => !S.seen.includes(p.brief)).length;
    $('more').hidden = left === 0;
    if (left === 0) $('sendState').textContent += ' ' + t().allDone;
  }
  $('more').onclick = () => { S.plan = buildPlan(false); S.idx = 0; save(); if (!S.plan.length) return; $('done').hidden = true; $('vote').hidden = false; renderPair(true); };
  $('download').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ voter: S.voter, answers: S.answers }, null, 2)], { type: 'application/json' }));
    a.download = `survey-${S.voter}.json`;
    a.click();
  };

  // ---------- resume ----------
  paintText();
  if (S.profile && S.idx < S.plan.length) { $('start').hidden = true; $('vote').hidden = false; renderPair(true); }
  else if (S.profile && S.plan.length) { $('start').hidden = true; $('done').hidden = false; paintSendState(); }
  send();
})();
