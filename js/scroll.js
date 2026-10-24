/* Scroll-driven animation (GSAP / ScrollTrigger) */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG, html = DC.html, $ = DC.$, $$ = DC.$$, reduce = DC.reduce, fine = DC.fine, hasGsap = DC.hasGsap, t = DC.t;

  var hero = DC.hero, anat = DC.anat, tour = DC.tour;

  /* ---------- 4. Scroll animation ---------- */
  var chapters = $$('.chapter'), callouts = $$('.callout');
  function setChapter(idx) {
    chapters.forEach(function (c, i) { c.classList.toggle('on', i === idx); });
    callouts.forEach(function (c) { c.classList.toggle('on', +c.dataset.show === idx); });
  }
  function pad3(n) { return String(n).padStart(3, '0'); }

  function renderHero(p) {
    var i = Math.min(hero.total - 1, Math.max(0, Math.round(p * (hero.total - 1))));
    hero.draw(i);
    $('#pbar').style.width = (p * 100) + '%';
    $('#pnum').textContent = pad3(i + 1) + ' / ' + hero.total;
    setChapter(p < .33 ? 0 : p < .68 ? 1 : 2);
  }
  var parts = $$('#parts .part'), intro = $('#anatIntro');
  var tparts = $$('#tparts .part'), tintro = $('#tourIntro');
  function renderAnat(p) {
    var i = Math.min(anat.total - 1, Math.max(0, Math.round(p * (anat.total - 1))));
    anat.draw(i);
    $('#abar').style.width = (p * 100) + '%';
    $('#anum').textContent = pad3(i + 1) + ' / ' + anat.total;
    var idx = p < .16 ? -1 : p < .38 ? 0 : p < .6 ? 1 : p < .8 ? 2 : 3;
    parts.forEach(function (el, k) { el.classList.toggle('on', k === idx); });
    intro.classList.toggle('off', idx >= 0);
  }

  function renderTour(p) {
    var i = Math.min(tour.total - 1, Math.max(0, Math.round(p * (tour.total - 1))));
    tour.draw(i);
    $('#tbar').style.width = (p * 100) + '%';
    $('#tnum').textContent = pad3(i + 1) + ' / ' + tour.total;
    var idx = p < .14 ? -1 : p < .42 ? 0 : p < .72 ? 1 : 2;
    tparts.forEach(function (el, k) { el.classList.toggle('on', k === idx); });
    tintro.classList.toggle('off', idx >= 0);
  }

  function initScroll() {
    if (!hasGsap || reduce) {
      setChapter(0); renderAnat(.7); renderTour(.85); parts.concat(tparts).forEach(function (el) { el.classList.add('on'); });
      $$('.chapter').forEach(function (c) { c.style.position = 'relative'; c.style.opacity = 1; c.style.visibility = 'visible'; });
      $('.copy').style.height = 'auto';
      $$('.tl-item').forEach(function (it) { it.classList.add('lit'); });
      return;
    }
    var h = { p: 0 };
    gsap.to(h, { p: 1, ease: 'none', onUpdate: function () { renderHero(h.p); },
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: .6 } });
    var a = { p: 0 };
    gsap.to(a, { p: 1, ease: 'none', onUpdate: function () { renderAnat(a.p); },
      scrollTrigger: { trigger: '#anatomy', start: 'top top', end: 'bottom bottom', scrub: .6 } });

    var tp = { p: 0 };
    gsap.to(tp, { p: 1, ease: 'none', onUpdate: function () { renderTour(tp.p); },
      scrollTrigger: { trigger: '#implants', start: 'top top', end: 'bottom bottom', scrub: .6 } });
    gsap.fromTo('#tourCard', { scale: .86, rotationX: 8, transformPerspective: 1200 }, { scale: 1, rotationX: 0, ease: 'none',
      scrollTrigger: { trigger: '#implants', start: 'top bottom', end: 'top top', scrub: true } });

    // transition: anatomy opens from a rounded card to full bleed
    gsap.fromTo('#anatStage', { clipPath: 'inset(10% 5% 10% 5% round 44px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: '#anatomy', start: 'top bottom', end: 'top top', scrub: true } });
    gsap.fromTo('#cv2', { scale: 1.18 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: '#anatomy', start: 'top bottom', end: 'top top', scrub: true } });

    // hero parallax blobs
    gsap.to('.blob.b1', { yPercent: 35, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true } });
    gsap.to('.blob.b2', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: true } });

    // 3D tilt on the hero card
    if (fine) {
      gsap.set('#stage', { transformPerspective: 1100 });
      var ry = gsap.quickTo('#stage', 'rotationY', { duration: .9, ease: 'power3' });
      var rx = gsap.quickTo('#stage', 'rotationX', { duration: .9, ease: 'power3' });
      $('#heroPin').addEventListener('pointermove', function (e) {
        ry((e.clientX / innerWidth - .5) * 9); rx(-(e.clientY / innerHeight - .5) * 7);
      });
    }

    // marquee: drifts constantly, speeds up with scroll velocity
    var mq = $('#mq'), set = mq.firstElementChild;
    for (var k = 0; k < 3; k++) mq.appendChild(set.cloneNode(true));
    var tween = gsap.to(mq, { x: function () { return -set.offsetWidth; }, ease: 'none', duration: 28, repeat: -1 });
    ScrollTrigger.create({ onUpdate: function (self) {
      var v = Math.min(6, Math.abs(self.getVelocity()) / 400);
      gsap.to(tween, { timeScale: 1 + v, duration: .25, overwrite: true, onComplete: function () { gsap.to(tween, { timeScale: 1, duration: 1.2 }); } });
    } });

    // certificates timeline: glowing rail fills, nodes light up as you pass them
    gsap.to('#tlFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#tl', start: 'top 65%', end: 'bottom 65%', scrub: .4 } });
    $$('.tl-item').forEach(function (it) {
      ScrollTrigger.create({ trigger: it, start: 'center 68%',
        onEnter: function () { it.classList.add('lit'); }, onLeaveBack: function () { it.classList.remove('lit'); } });
    });

    // process rail draws as you scroll
    gsap.to('#rail', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#stepsRow', start: 'top 80%', end: 'bottom 55%', scrub: .5 } });

    // nav: hide on scroll down, show on scroll up; top progress bar; active link
    var nav = $('#nav'), bar = $('#topbar');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) {
      bar.style.transform = 'scaleX(' + self.progress + ')';
      nav.classList.toggle('hide', self.direction === 1 && self.scroll() > 240 && !nav.classList.contains('open'));
    } });
    $$('#links a').forEach(function (a) {
      var sec = $(a.getAttribute('href')); if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (s) { a.classList.toggle('active', s.isActive); } });
    });
  }
  DC.init.scroll = initScroll;
})();
