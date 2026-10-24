/* UI: reveal, counters, cursor, reviews, certificates, faq, nav */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG, html = DC.html, $ = DC.$, $$ = DC.$$, reduce = DC.reduce, fine = DC.fine, hasGsap = DC.hasGsap, t = DC.t;

  /* ---------- 5. UI ---------- */
  // reveal-on-view (words + clip) – CSS does the motion, this adds .in once
  function initReveal() {
    var els = $$('[data-reveal],.reveal');
    if (!hasGsap || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    // geometry based (IntersectionObserver ignores clip-path hidden elements)
    // plays when it enters from below and plays BACKWARDS when you scroll back up past it
    ScrollTrigger.batch(els, { start: 'top 90%',
      onEnter: function (batch) { batch.forEach(function (e) { e.classList.add('in'); }); },
      onLeaveBack: function (batch) { batch.forEach(function (e) { e.classList.remove('in'); }); } });
  }

  // count-up
  function initCounters() {
    var els = $$('[data-count]');
    var tweens = new Map();
    function run(el) {
      var end = +el.dataset.count, suf = el.dataset.suffix || '', o = { v: 0 };
      var fmt = function (n) { return Math.round(n).toLocaleString('en-US') + suf; };
      if (hasGsap && !reduce) { if (tweens.has(el)) tweens.get(el).kill(); tweens.set(el, gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = fmt(o.v); } })); }
      else el.textContent = fmt(end);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    function reset(el) {
      if (tweens.has(el)) { tweens.get(el).kill(); tweens.delete(el); }
      el.textContent = '0' + (el.dataset.suffix || '');
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) run(e.target);
        else if (!reduce && e.boundingClientRect.top > 0) reset(e.target);   // left through the bottom = scrolled back up
      });
    }, { threshold: .6 });
    els.forEach(function (e) { io.observe(e); });
  }

  // cursor ring + magnetic buttons + card spotlight
  function initPointer() {
    if (!fine || !hasGsap || reduce) return;
    var c = document.createElement('div'); c.className = 'cursor'; document.body.appendChild(c);
    var qx = gsap.quickTo(c, 'x', { duration: .35, ease: 'power3' }), qy = gsap.quickTo(c, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { qx(e.clientX); qy(e.clientY); c.classList.add('on'); });
    document.addEventListener('pointerover', function (e) { c.classList.toggle('hot', !!e.target.closest('a,button,.svc,.qa,.part')); });
    document.addEventListener('mouseleave', function () { c.classList.remove('on'); });
    $$('.btn-primary').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3' });
      });
      b.addEventListener('pointerleave', function () { gsap.to(b, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }); });
    });
    $$('.svc').forEach(function (s) {
      s.addEventListener('pointermove', function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // reviews carousel: snap scroll + buttons + drag + progress
  function initReviews() {
    var tr = $('#rvTrack'), bar = $('#rvBar');
    var dir = function () { return html.dir === 'rtl' ? -1 : 1; };
    var step = function () { var c = tr.firstElementChild; return c ? c.offsetWidth + 18 : 320; };
    function upd() {
      var max = tr.scrollWidth - tr.clientWidth, p = max > 0 ? Math.abs(tr.scrollLeft) / max : 1;
      bar.style.transform = 'scaleX(' + Math.max(.14, p) + ')';
    }
    tr.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    $('#rvNext').addEventListener('click', function () { tr.scrollBy({ left: dir() * step(), behavior: 'smooth' }); });
    $('#rvPrev').addEventListener('click', function () { tr.scrollBy({ left: -dir() * step(), behavior: 'smooth' }); });
    var down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; tr.classList.add('drag'); }
      if (moved) tr.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false; tr.classList.remove('drag');
      if (moved) { var s0 = tr.scrollLeft; tr.scrollTo({ left: s0, behavior: 'smooth' }); }
    });
    upd();
  }

  // certificate lightbox
  function initCerts() {
    var lb = $('#lb'), img = $('#lbImg'), x = $('#lbX'), from = null;
    function open(btn) {
      from = btn; img.src = btn.dataset.full; img.alt = $('h3', btn.parentNode).textContent;
      lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('show'); x.focus(); });
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('show'); document.body.style.overflow = '';
      setTimeout(function () { lb.hidden = true; img.removeAttribute('src'); }, 350);
      if (from) from.focus();
    }
    $$('.cert-thumb').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
    x.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  }

  // faq accordion (one open at a time)
  function initFaq() {
    $$('.qa').forEach(function (q) {
      $('button', q).addEventListener('click', function () {
        var open = q.classList.contains('open');
        $$('.qa').forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
        if (!open) { q.classList.add('open'); $('button', q).setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  // nav / language / links
  function initNav() {
    var nav = $('#nav'), burger = $('#burger');
    burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
    $$('#links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });
    $('#lang').addEventListener('click', DC.switchLang);
    $('#telLink').href = 'tel:' + CONFIG.phone.replace(/[^\d+]/g, '');
    $('#dirLink').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.mapsQuery);
    var fab = $('#fab');
    if (CONFIG.whatsapp) {
      fab.href = 'https://wa.me/' + CONFIG.whatsapp; fab.hidden = false;
      if (hasGsap) ScrollTrigger.create({ trigger: '#anatomy', start: 'top 60%', end: 'max',
        onToggle: function (s) { fab.classList.toggle('show', s.isActive); } });
      else fab.classList.add('show');
    }
  }
  DC.init.reveal = initReveal; DC.init.counters = initCounters; DC.init.pointer = initPointer;
  DC.init.reviews = initReviews; DC.init.certs = initCerts; DC.init.faq = initFaq; DC.init.nav = initNav;
})();
