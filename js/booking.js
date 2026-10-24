/* Appointment system */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG, html = DC.html, $ = DC.$, $$ = DC.$$, reduce = DC.reduce, fine = DC.fine, hasGsap = DC.hasGsap, t = DC.t;

  /* ---------- appointment system ---------- */
  var BK = { day: null, slot: null, remote: {}, local: {} };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var isoDate = function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  var locale = function () { return DC.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US'; };
  try { (JSON.parse(localStorage.getItem('dc_bookings') || '[]')).forEach(function (k) { BK.local[k] = 1; }); } catch (e) {}

  function hash01(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  function daySlots() {
    var out = [], m = CONFIG.openHour * 60, end = CONFIG.closeHour * 60;
    for (; m + CONFIG.slotMinutes <= end; m += CONFIG.slotMinutes) out.push(pad2(Math.floor(m / 60)) + ':' + pad2(m % 60));
    return out;
  }
  function isBooked(date, time) {
    var key = date + '|' + time;
    if (BK.local[key] || BK.remote[key]) return true;
    if (CONFIG.demoSeed) { var h = +time.slice(0, 2), base = h >= 17 ? .55 : h >= 12 ? .36 : .3; return hash01(date + time) < base; }
    return false;
  }
  function isPast(date, time) {
    var p = time.split(':'), d = new Date(date + 'T00:00:00'); d.setHours(+p[0], +p[1], 0, 0);
    return d.getTime() < Date.now() + CONFIG.minLeadMinutes * 60000;
  }
  function fmtTime(time) { var p = time.split(':'); return new Intl.DateTimeFormat(locale(), { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(2000, 0, 1, +p[0], +p[1])); }
  function fmtDay(date, long) { return new Intl.DateTimeFormat(locale(), long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short' }).format(new Date(date + 'T12:00:00')); }
  function freeCount(date) { return daySlots().filter(function (s) { return !isPast(date, s) && !isBooked(date, s); }).length; }
  function dayList() {
    var list = [], now = new Date();
    for (var i = 0; i < CONFIG.daysAhead; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), iso = isoDate(d);
      var closed = CONFIG.closedWeekdays.indexOf(d.getDay()) > -1;
      list.push({ iso: iso, n: d.getDate(), closed: closed, free: closed ? 0 : freeCount(iso), today: i === 0 });
    }
    return list;
  }

  function renderBooking() {
    if (!$('#days')) return;
    var days = dayList(), box = $('#days');
    var cur = days.filter(function (d) { return d.iso === BK.day && d.free > 0; })[0];
    if (!cur) { cur = days.filter(function (d) { return d.free > 0; })[0]; BK.day = cur ? cur.iso : null; BK.slot = null; }
    var keepScroll = box.scrollLeft;
    box.innerHTML = '';
    days.forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'day' + (d.iso === BK.day ? ' sel' : '');
      b.disabled = d.free === 0; b.setAttribute('aria-pressed', d.iso === BK.day);
      var sub = d.closed ? t('closed') : d.free === 0 ? t('full') : d.today ? t('today') : t('left').replace('{n}', d.free);
      b.innerHTML = '<small></small><b></b><em></em>';
      b.children[0].textContent = fmtDay(d.iso); b.children[1].textContent = d.n; b.children[2].textContent = sub;
      b.addEventListener('click', function () { BK.day = d.iso; BK.slot = null; renderBooking(); });
      box.appendChild(b);
    });
    box.scrollLeft = keepScroll;
    renderSlots(); renderSummary();
  }

  function renderSlots() {
    var wrap = $('#slots'); wrap.innerHTML = '';
    if (!BK.day) return;
    var groups = { morning: [], afternoon: [], evening: [] }, i = 0;
    daySlots().forEach(function (s) {
      if (isPast(BK.day, s)) return;
      var h = +s.slice(0, 2); groups[h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'].push(s);
    });
    ['morning', 'afternoon', 'evening'].forEach(function (g) {
      if (!groups[g].length) return;
      var sg = document.createElement('div'); sg.className = 'sg';
      var h4 = document.createElement('h4'); h4.textContent = t(g); sg.appendChild(h4);
      var grid = document.createElement('div'); grid.className = 'sgrid';
      groups[g].forEach(function (s) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'slot'; b.style.setProperty('--i', i++);
        b.textContent = fmtTime(s); b.dataset.time = s;
        var booked = isBooked(BK.day, s);
        if (booked) { b.disabled = true; b.setAttribute('aria-label', fmtTime(s) + ' – ' + t('legBooked')); }
        if (BK.slot === s && !booked) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); }
        b.addEventListener('click', function () { BK.slot = s; $('#errSlot').textContent = ''; renderSlots(); renderSummary(); });
        grid.appendChild(b);
      });
      sg.appendChild(grid); wrap.appendChild(sg);
    });
  }

  function renderSummary() {
    var el = $('#summary');
    if (BK.day && BK.slot) { el.className = 'summary'; el.textContent = t('sumText').replace('{day}', fmtDay(BK.day, true)).replace('{time}', fmtTime(BK.slot)); }
    else { el.className = 'summary empty'; el.textContent = t('sumEmpty'); }
  }

  function loadBusy() {
    if (!CONFIG.busyEndpoint) return;
    fetch(CONFIG.busyEndpoint, { headers: CONFIG.bookingHeaders }).then(function (r) { return r.json(); }).then(function (rows) {
      var m = {}; rows.forEach(function (r) { m[r.date + '|' + String(r.time).slice(0, 5)] = 1; });
      BK.remote = m; renderBooking();
    }).catch(function () {});
  }

  function saveLocal(key) {
    BK.local[key] = 1;
    try { localStorage.setItem('dc_bookings', JSON.stringify(Object.keys(BK.local))); } catch (e) {}
  }

  function makeICS(d) {
    var p = d.time.split(':'), st = new Date(d.date + 'T00:00:00'); st.setHours(+p[0], +p[1], 0, 0);
    var en = new Date(st.getTime() + CONFIG.slotMinutes * 60000);
    var f = function (x) { return x.getFullYear() + pad2(x.getMonth() + 1) + pad2(x.getDate()) + 'T' + pad2(x.getHours()) + pad2(x.getMinutes()) + '00'; };
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dental//Booking//EN', 'BEGIN:VEVENT', 'UID:' + d.ref + '@dental',
      'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(st), 'DTEND:' + f(en), 'SUMMARY:' + t('calTitle'),
      'LOCATION:' + CONFIG.mapsQuery, 'DESCRIPTION:' + d.service + ' x' + d.people + ' / ' + d.ref, 'END:VEVENT', 'END:VCALENDAR'];
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    a.download = 'appointment-' + d.date + '.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  var form = $('#form'), lastBooking = null;

  // group size: 1 person ... 5+  (2 = duo offer, 3+ = group offer)
  function buildPeople() {
    var sel = $('#people'), keep = sel.selectedIndex > 0 ? sel.selectedIndex : 0;
    sel.innerHTML = '';
    for (var n = 1; n <= 5; n++) {
      var o = document.createElement('option'); o.value = n;
      o.textContent = n === 1 ? t('pp1') : n === 5 ? t('pp5') : t('ppN').replace('{n}', n); sel.appendChild(o);
    }
    sel.selectedIndex = keep; peopleNote();
  }
  function peopleNote() {
    var n = +$('#people').value, el = $('#peopleNote');
    el.textContent = n >= 3 ? t('offGroup') : n === 2 ? t('offDuo') : '';
    el.classList.toggle('on', n >= 2);
  }
  DC.onLang.push(buildPeople);
  function renderDone() {
    var v = JSON.parse($('#doneMsg').dataset.vals);
    $('#doneMsg').textContent = t('okMsg').replace('{name}', v.name).replace('{day}', fmtDay(v.date, true)).replace('{time}', fmtTime(v.time));
    $('#doneRef').textContent = v.ref;
  }
  DC.onLang.push(function () { renderBooking(); var d = $('#doneMsg'); if (d && d.dataset.vals) renderDone(); });

  function initForm() {
    var f = form.elements;
    function fieldErr(el, msg) {
      var er = el.closest('.field').querySelector('.err'); if (er) er.textContent = msg || ''; el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }
    form.addEventListener('input', function (e) { if (e.target.name) fieldErr(e.target, ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'phone', 'service'].forEach(function (k) {
        var v = f[k].value.trim(), msg = '';
        if (!v) msg = t('errReq');
        else if (k === 'phone' && !/^\+?\d{8,15}$/.test(v.replace(/[\s-]/g, ''))) msg = t('errPhone');
        ok = fieldErr(f[k], msg) && ok;
      });
      if (!BK.day || !BK.slot) { $('#errSlot').textContent = t('errSlot'); ok = false; }
      else if (isBooked(BK.day, BK.slot)) { $('#errSlot').textContent = t('errTaken'); BK.slot = null; renderBooking(); ok = false; }
      if (!ok) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }

      var ref = 'DC-' + Date.now().toString(36).slice(-5).toUpperCase();
      var data = { name: f.name.value.trim(), phone: f.phone.value.trim(), service: f.service.value, people: +f.people.value, date: BK.day, time: BK.slot, lang: DC.lang, ref: ref };
      var btn = form.querySelector('button[type=submit]'), lbl = $('#submitLbl');
      function success() {
        saveLocal(data.date + '|' + data.time);
        lastBooking = data;
        $('#doneMsg').dataset.vals = JSON.stringify(data); renderDone();
        $('#done').classList.add('show');
        btn.disabled = false; lbl.textContent = t('fSubmit');
        BK.slot = null; renderBooking();
        form.dispatchEvent(new CustomEvent('booking', { detail: data, bubbles: true }));
      }
      if (!CONFIG.bookingEndpoint) { success(); return; }
      btn.disabled = true; lbl.textContent = t('sending'); $('#formErr').textContent = '';
      var headers = { 'Content-Type': 'application/json' };
      for (var h in CONFIG.bookingHeaders) headers[h] = CONFIG.bookingHeaders[h];
      fetch(CONFIG.bookingEndpoint, { method: 'POST', headers: headers, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); success(); })
        .catch(function () { $('#formErr').textContent = t('errSend'); btn.disabled = false; lbl.textContent = t('fSubmit'); });
    });
    $('#people').addEventListener('change', peopleNote);
    form.addEventListener('reset', function () { setTimeout(peopleNote, 0); });
    $('#addCal').addEventListener('click', function () { if (lastBooking) makeICS(lastBooking); });
    $('#another').addEventListener('click', function () {
      $('#done').classList.remove('show'); form.reset(); $('#doneMsg').dataset.vals = '';
      $$('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    });
    loadBusy(); setInterval(function () { loadBusy(); renderBooking(); }, 60000);
  }
  DC.init.form = initForm;
})();
