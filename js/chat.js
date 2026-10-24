/* Site chat: the visitor leaves their details first, then asks questions and the assistant answers.
   Typed questions and photos/videos go to Gemini (js/gemini.js) when CONFIG.geminiKey or geminiProxy is set;
   quick-reply chips and the fallback use the instant answers in lang/chat-en.js and lang/chat-ar.js.
   Details are sent to CONFIG.leadEndpoint (if set) and fired as a "lead" event on document. */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG, $ = DC.$, $$ = DC.$$, t = DC.t, html = DC.html;
  var USER_KEY = 'dc_chat_user';
  var st = { user: null, pending: null, nextIds: [], opened: false, busy: false, hist: [], file: null, ctrl: null };
  var AI_NEXT = ['book', 'offers', 'contact'];
  var el = {};

  /* ---------- matching (works for Arabic and English) ---------- */
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  function stripAr(w) { return w.replace(/^[وبلفك]?(ال)?/, ''); }
  function keyHit(key, text, words) {
    if (key.indexOf(' ') > -1) return (' ' + text + ' ').indexOf(' ' + key) > -1;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w === key) return true;
      if (key.length > 3 && w.indexOf(key) === 0) return true;
      if (DC.lang === 'ar' && key.length >= 3 && stripAr(w).indexOf(key) === 0) return true;
    }
    return false;
  }
  function kb() { return window.I18N.chat[DC.lang] || window.I18N.chat.en; }
  function entry(id) { var e = kb().entries; for (var i = 0; i < e.length; i++) if (e[i].id === id) return e[i]; return null; }
  function findAnswer(q) {
    var text = norm(q), words = text.split(' '), best = null, bestScore = 0;
    kb().entries.forEach(function (e) {
      var score = 0;
      e.k.forEach(function (k) { var nk = norm(k); if (nk && keyHit(nk, text, words)) score += nk.length; });
      if (score > bestScore) { best = e; bestScore = score; }
    });
    return best;
  }

  /* ---------- rendering ---------- */
  function scrollDown() { el.log.scrollTop = el.log.scrollHeight; }
  function mediaEl(media) {
    var el = document.createElement(media.kind === 'video' ? 'video' : 'img');
    el.className = 'msg-media'; el.src = media.url;
    if (media.kind === 'video') { el.controls = true; el.muted = true; el.playsInline = true; el.preload = 'metadata'; } else el.alt = '';
    return el;
  }
  function addMsg(who, text, actions, media) {
    var m = document.createElement('div'); m.className = 'msg ' + who;
    if (media) m.appendChild(mediaEl(media));
    var b = document.createElement('div'); b.className = 'bubble'; b.textContent = text; m.appendChild(b);
    if (!text) b.hidden = true;
    if (actions && actions.length) {
      var row = document.createElement('div'); row.className = 'msg-act';
      actions.forEach(function (a) { row.appendChild(a); }); m.appendChild(row);
    }
    el.log.appendChild(m); scrollDown();
    document.dispatchEvent(new CustomEvent('chatmessage', { detail: { from: who, text: text, user: st.user } }));
    return m;
  }
  function link(label, href, ext, cls) {
    var a = document.createElement('a'); a.className = 'chat-link' + (cls ? ' ' + cls : ''); a.textContent = label; a.href = href;
    if (ext) { a.target = '_blank'; a.rel = 'noopener'; }
    if (href === '#book') a.addEventListener('click', function () { if (innerWidth <= 560) close(); });
    return a;
  }
  function actionsFor(act) {
    var out = [];
    if (act === 'book') out.push(link(t('chatActBook'), '#book'));
    if (act === 'directions') out.push(link(t('directions'), 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.mapsQuery), true));
    if (act === 'call') {
      out.push(link(t('chatActCall') + ' ' + CONFIG.phone, 'tel:' + CONFIG.phone.replace(/[^\d+]/g, '')));
      if (CONFIG.whatsapp) out.push(link('WhatsApp', 'https://wa.me/' + CONFIG.whatsapp, true, 'wa'));
    }
    return out;
  }
  function setChips(ids) {
    st.nextIds = ids || [];
    el.chips.innerHTML = '';
    st.nextIds.forEach(function (id) {
      var e = entry(id); if (!e || !e.t) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip-q'; b.textContent = e.t;
      b.addEventListener('click', function () { ask(e.t, e); });
      el.chips.appendChild(b);
    });
  }
  function typing(on) {
    var old = $('.msg.typing', el.log); if (old) old.remove();
    if (!on) return;
    var m = document.createElement('div'); m.className = 'msg bot typing';
    m.innerHTML = '<div class="bubble"><i></i><i></i><i></i></div>'; el.log.appendChild(m); scrollDown();
  }

  /* ---------- conversation ---------- */
  function localAnswer(text, forced) {
    var e = forced || findAnswer(text), cfg = kb();
    if (e) { addMsg('bot', e.a, actionsFor(e.act)); setChips(e.next); }
    else { addMsg('bot', cfg.fallback, actionsFor('call')); setChips(cfg.fallbackNext); }
  }
  function done() { st.busy = false; el.send.disabled = false; if (el.input) el.input.focus({ preventScroll: true }); }

  /* ---------- Gemini ---------- */
  function clean(txt) {      // strip markdown the model may still add + the action tag
    return String(txt).replace(/\[\[[a-z]*\]?\]?\s*$/i, '').replace(/\[\[[^\]]*\]\]/g, '')
      .replace(/\*\*/g, '').replace(/^\s*[*•]\s+/gm, '- ').replace(/^#+\s*/gm, '').trim();
  }
  function tagOf(txt) { var m = /\[\[(book|call|directions)\]\]/i.exec(txt); return m ? m[1].toLowerCase() : null; }
  function trimHist() {
    // keep media only in the most recent message that has it (keeps requests small and fast)
    var last = -1, i;
    for (i = st.hist.length - 1; i >= 0; i--) if (st.hist[i].hasMedia) { last = i; break; }
    st.hist.forEach(function (h, k) {
      if (h.hasMedia && k !== last) h.parts = h.parts.filter(function (p) { return !p.inline_data; }).concat(h.parts.some(function (p) { return p.text; }) ? [] : [{ text: '(media sent earlier)' }]);
    });
    if (st.hist.length > 16) st.hist = st.hist.slice(-16);
    while (st.hist.length && st.hist[0].role !== 'user') st.hist.shift();
  }
  function askAI(text, filePart) {
    var parts = [];
    if (filePart) parts.push(filePart);
    parts.push({ text: text || t('chatMediaQ') });
    st.hist.push({ role: 'user', parts: parts, hasMedia: !!filePart });
    trimHist();
    var contents = st.hist.map(function (h) { return { role: h.role, parts: h.parts }; });
    var bubble = null, msg = null, partial = '', ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 40000);
    st.ctrl = ctrl;
    DC.ai.ask(contents, st.user, function (full) {
      partial = full; var shown = clean(full); if (!shown) return;
      if (!msg) { typing(false); msg = addMsg('bot', shown); bubble = msg.querySelector('.bubble'); }
      else { bubble.textContent = shown; scrollDown(); }
    }, ctrl.signal).then(function (full) {
      clearTimeout(timer); typing(false);
      var shown = clean(full);
      if (!shown) { st.hist.pop(); localAnswer(text); return; }     // blocked / empty -> instant answer
      st.hist.push({ role: 'model', parts: [{ text: full }] });
      if (!msg) msg = addMsg('bot', shown); else bubble.textContent = shown;
      var tag = tagOf(full), acts = tag ? actionsFor(tag) : [];
      if (acts.length) { var row = document.createElement('div'); row.className = 'msg-act'; acts.forEach(function (x) { row.appendChild(x); }); msg.appendChild(row); }
      document.dispatchEvent(new CustomEvent('chatmessage', { detail: { from: 'bot', text: shown, user: st.user } }));
      setChips(AI_NEXT); scrollDown();
    }).catch(function () {
      clearTimeout(timer); typing(false);
      if (msg) { st.hist.push({ role: 'model', parts: [{ text: partial }] }); return; }   // keep what was already shown
      st.hist.pop();
      if (filePart) addMsg('bot', t('chatMediaErr'), actionsFor('call'));
      else localAnswer(text);
    }).then(done);
  }

  /* ---------- attachments ---------- */
  function showPrev() {
    el.prev.innerHTML = '';
    if (!st.file) { el.prev.hidden = true; return; }
    var box = document.createElement('div'); box.className = 'prev-item';
    box.appendChild(mediaEl(st.file.media));
    var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', t('close'));
    x.addEventListener('click', clearFile); box.appendChild(x);
    el.prev.appendChild(box); el.prev.hidden = false; scrollDown();
  }
  function clearFile() {
    if (st.file && st.file.media) URL.revokeObjectURL(st.file.media.url);
    st.file = null; el.file.value = ''; showPrev();
  }
  function pickFile(f) {
    if (!f) return;
    DC.ai.fileToPart(f).then(function (part) {
      if (st.file) clearFile();
      st.file = { part: part, media: { kind: /^video\//.test(f.type) ? 'video' : 'image', url: URL.createObjectURL(f) } };
      showPrev(); el.input.focus({ preventScroll: true });
    }).catch(function (e) { addMsg('bot', t(e && e.message === 'big' ? 'chatMediaBig' : 'chatMediaType')); });
  }

  /* ---------- conversation ---------- */
  function ask(text, forced) {
    if (st.busy) return;
    text = String(text).trim();
    var file = st.file, useAI = !forced && DC.ai && DC.ai.enabled();
    if (!text && !file) return;
    var media = file ? file.media : null;
    addMsg('user', text, null, media); el.chips.innerHTML = '';
    if (file) { st.file = null; el.file.value = ''; el.prev.innerHTML = ''; el.prev.hidden = true; }   // keep the object URL: the bubble still shows it
    st.busy = true; el.send.disabled = true; typing(true);
    if (useAI) { askAI(text, file && file.part); return; }
    if (forced) st.hist.push({ role: 'user', parts: [{ text: text }] });
    setTimeout(function () {
      typing(false); localAnswer(text, forced);
      if (forced) { st.hist.push({ role: 'model', parts: [{ text: forced.a }] }); }
      done();
    }, 420);
  }

  function greet() {
    if (el.log.children.length) return;
    var first = (st.user.name || '').split(' ')[0];
    addMsg('bot', t('chatHello').replace('{name}', first));
    setChips(kb().start);
    if (st.pending) { var e = entry(st.pending); st.pending = null; if (e) ask(e.t || e.id, e); }
  }

  function showStage() {
    var has = !!st.user;
    el.intro.hidden = has; el.body.hidden = !has;
    if (has) greet();
  }

  /* ---------- lead capture ---------- */
  function saveUser(u) { st.user = u; try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch (e) {} }
  function sendLead(u) {
    document.dispatchEvent(new CustomEvent('lead', { detail: u }));
    if (!CONFIG.leadEndpoint) return;
    var headers = { 'Content-Type': 'application/json' };
    for (var h in CONFIG.bookingHeaders) headers[h] = CONFIG.bookingHeaders[h];
    fetch(CONFIG.leadEndpoint, { method: 'POST', headers: headers, body: JSON.stringify(u) }).catch(function () {});
  }
  function initIntro() {
    var f = el.intro.elements;
    function err(inp, msg) { var er = inp.closest('.field').querySelector('.err'); if (er) er.textContent = msg || ''; inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; }
    el.intro.addEventListener('input', function (e) { if (e.target.name) err(e.target, ''); });
    el.intro.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.cname.value.trim(), phone = f.cphone.value.trim(), ok = true;
      ok = err(f.cname, name ? '' : t('errReq')) && ok;
      ok = err(f.cphone, !phone ? t('errReq') : /^\+?\d{8,15}$/.test(phone.replace(/[\s-]/g, '')) ? '' : t('errPhone')) && ok;
      if (!ok) { var bad = el.intro.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
      var u = { name: name, phone: phone, people: +f.cpeople.value, lang: DC.lang, source: 'chat', at: new Date().toISOString() };
      saveUser(u); sendLead(u); showStage();
    });
  }
  function buildPeople() {
    var sel = $('#chatPeople'), keep = sel.selectedIndex > 0 ? sel.selectedIndex : 0;
    sel.innerHTML = '';
    for (var n = 1; n <= 5; n++) {
      var o = document.createElement('option'); o.value = n;
      o.textContent = n === 1 ? t('pp1') : n === 5 ? t('pp5') : t('ppN').replace('{n}', n); sel.appendChild(o);
    }
    sel.selectedIndex = keep;
  }

  /* ---------- open / close ---------- */
  function open(topic) {
    if (topic) st.pending = topic;
    el.panel.hidden = false;
    requestAnimationFrame(function () { el.panel.classList.add('show'); });
    html.classList.add('chat-open'); el.fab.setAttribute('aria-expanded', 'true'); st.opened = true;
    showStage();
    if (st.user && topic && el.log.children.length) { var e = entry(topic); st.pending = null; if (e) ask(e.t || e.id, e); }
    setTimeout(function () {
      var target = st.user ? el.input : el.intro.elements.cname;
      if (target && DC.fine) target.focus({ preventScroll: true });
    }, 280);
  }
  function close() {
    el.panel.classList.remove('show'); html.classList.remove('chat-open'); el.fab.setAttribute('aria-expanded', 'false'); st.opened = false;
    setTimeout(function () { if (!st.opened) el.panel.hidden = true; }, 300);
    el.fab.focus({ preventScroll: true });
  }

  function init() {
    el.fab = $('#chatFab'); el.panel = $('#chat'); el.intro = $('#chatIntro'); el.body = $('#chatBody');
    el.log = $('#chatLog'); el.chips = $('#chatChips'); el.input = $('#chatInput'); el.form = $('#chatForm');
    el.send = $('#chatSend'); el.attach = $('#chatAttach'); el.file = $('#chatFile'); el.prev = $('#chatPrev');
    if (!el.fab) return;
    try { var u = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); if (u && u.name && u.phone) st.user = u; } catch (e) {}
    if (!CONFIG.whatsapp) html.classList.add('no-wa');
    el.fab.addEventListener('click', function () { st.opened ? close() : open(); });
    $('#chatX').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && st.opened) close(); });
    el.form.addEventListener('submit', function (e) { e.preventDefault(); var v = el.input.value; el.input.value = ''; ask(v); });
    var ai = !!(DC.ai && DC.ai.enabled());
    el.attach.hidden = !ai; el.file.disabled = !ai;
    if (ai) {
      el.attach.addEventListener('click', function () { el.file.click(); });
      el.file.addEventListener('change', function () { pickFile(el.file.files[0]); });
      el.form.addEventListener('paste', function (e) {            // paste a screenshot / photo
        var it = e.clipboardData && [].slice.call(e.clipboardData.items).filter(function (i) { return /^image\//.test(i.type); })[0];
        if (it) pickFile(it.getAsFile());
      });
    }
    initIntro();
    DC.onLang.push(function () { buildPeople(); if (st.user && el.log.children.length) setChips(st.nextIds); });
    buildPeople();
    DC.chat = { open: open, close: close };
  }

  /* offer cards: "ask about this offer" opens the chat on that topic */
  function initOffers() {
    $$('[data-chat]').forEach(function (b) { b.addEventListener('click', function () { if (DC.chat) DC.chat.open(b.getAttribute('data-chat')); }); });
  }
  DC.init.chat = init; DC.init.offers = initOffers;
})();
