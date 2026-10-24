/* Site chat: the visitor leaves their details first, then asks questions and the assistant answers.
   Answers come from lang/chat-en.js and lang/chat-ar.js (no server needed).
   Details are sent to CONFIG.leadEndpoint (if set) and fired as a "lead" event on document. */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG, $ = DC.$, $$ = DC.$$, t = DC.t, html = DC.html;
  var USER_KEY = 'dc_chat_user';
  var st = { user: null, pending: null, nextIds: [], opened: false, busy: false };
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
  function addMsg(who, text, actions) {
    var m = document.createElement('div'); m.className = 'msg ' + who;
    var b = document.createElement('div'); b.className = 'bubble'; b.textContent = text; m.appendChild(b);
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
  function ask(text, forced) {
    if (st.busy) return;
    text = String(text).trim(); if (!text) return;
    addMsg('user', text); el.chips.innerHTML = '';
    var e = forced || findAnswer(text), cfg = kb();
    st.busy = true; typing(true);
    setTimeout(function () {
      typing(false);
      if (e) { addMsg('bot', e.a, actionsFor(e.act)); setChips(e.next); }
      else { addMsg('bot', cfg.fallback, actionsFor('call')); setChips(cfg.fallbackNext); }
      st.busy = false; if (el.input) el.input.focus({ preventScroll: true });
    }, 520 + Math.min(500, text.length * 8));
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
    if (!el.fab) return;
    try { var u = JSON.parse(localStorage.getItem(USER_KEY) || 'null'); if (u && u.name && u.phone) st.user = u; } catch (e) {}
    if (!CONFIG.whatsapp) html.classList.add('no-wa');
    el.fab.addEventListener('click', function () { st.opened ? close() : open(); });
    $('#chatX').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && st.opened) close(); });
    el.form.addEventListener('submit', function (e) { e.preventDefault(); var v = el.input.value; el.input.value = ''; ask(v); });
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
