/* Frame sequences + preloader */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG, html = DC.html, $ = DC.$, $$ = DC.$$, reduce = DC.reduce, fine = DC.fine, hasGsap = DC.hasGsap, t = DC.t;

  /* ---------- 3. Frame sequences ---------- */
  // frames live in numbered flat folders: hero-01/frame_000001.webp ... (cfg = DC.FRAMES.x)
  function Seq(cfg, cv) {
    this.cfg = cfg; this.total = cfg.total; this.cv = cv; this.ctx = cv.getContext('2d');
    this.imgs = new Array(cfg.total); this.loaded = 0; this.last = -1;
  }
  Seq.prototype.pad = function (n) { return String(n).padStart(6, '0'); };
  Seq.prototype.url = function (n) {   // n = 1-based frame number
    var f = this.cfg, k = Math.floor((n - 1) / f.per) + 1;
    return f.dir + (k < 10 ? '0' : '') + k + '/frame_' + this.pad(n) + '.webp';
  };
  Seq.prototype.draw = function (i) {
    var k = i, im = this.imgs;
    if (!im[k]) { for (var d = 1; d < this.total; d++) { if (im[i - d]) { k = i - d; break; } if (im[i + d]) { k = i + d; break; } } }
    var img = im[k];
    if (!img || k === this.last) return;
    if (this.cv.width !== img.naturalWidth) { this.cv.width = img.naturalWidth; this.cv.height = img.naturalHeight; }
    this.ctx.drawImage(img, 0, 0);
    this.last = k;
  };
  Seq.prototype.load = function (onFirst, onDone) {
    var self = this, next = 0, active = 0, MAX = 8;
    function one(i) {
      var im = new Image(); im.decoding = 'async';
      im.onload = im.onerror = function (ev) {
        if (ev.type === 'load') { self.imgs[i] = im; if (i === 0 && onFirst) onFirst(); }
        self.loaded++; active--; pump();
        if (self.loaded >= self.total && onDone) onDone();
      };
      im.src = self.url(i + 1);
    }
    function pump() { while (active < MAX && next < self.total) { active++; one(next++); } }
    pump();
  };

  var hero = new Seq(DC.FRAMES.hero, $('#cv'));
  var anat = new Seq(DC.FRAMES.anatomy, $('#cv2'));
  var tour = new Seq(DC.FRAMES.tour, $('#cv3'));
  DC.hero = hero; DC.anat = anat; DC.tour = tour;
  hero.load(function () { hero.draw(0); });

  /* ---------- preloader ---------- */
  var plShown = 0, plStart = Date.now(), plDone = false;
  function finishPreload() {
    if (plDone) return; plDone = true;
    clearInterval(plTimer);
    $('#plnum').textContent = '100'; $('#plbar').style.width = '100%';
    // the other two sequences load in the background, one after the other
    anat.load(function () { anat.draw(0); }, function () { tour.load(function () { tour.draw(0); }); });
    var pre = $('#preloader');
    if (!hasGsap) { pre.style.display = 'none'; html.classList.add('is-ready'); return; }
    gsap.timeline()
      .to('.pl-inner', { opacity: 0, y: -24, duration: .45, ease: 'power2.in', delay: .15 })
      .to(pre, { yPercent: -100, duration: 1, ease: 'power4.inOut' })
      .add(function () { html.classList.add('is-ready'); }, '-=.55')
      .from('#stage', { scale: .92, opacity: 0, duration: 1.2, ease: 'power3.out' }, '-=.5')
      .from('.nav', { yPercent: -160, duration: .9, ease: 'power3.out' }, '-=.9')
      .set(pre, { display: 'none' });
  }
  var plTimer = setInterval(function () {
    var target = hero.loaded / hero.total * 100;
    plShown += (target - plShown) * .14;
    var shown = Math.min(99, Math.round(plShown));
    $('#plnum').textContent = shown; $('#plbar').style.width = shown + '%';
    if (hero.loaded >= hero.total && plShown > 98 && Date.now() - plStart > 1400) finishPreload();
  }, 40);
  setTimeout(finishPreload, 12000);                      // never block the page on slow networks
})();
