/* Core: helpers + language (EN / AR) */
(function () {
  'use strict';
  var DC = window.DC, CONFIG = DC.CONFIG;
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (reduce) html.classList.add('reduce');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  DC.html = html; DC.$ = $; DC.$$ = $$; DC.reduce = reduce; DC.fine = fine; DC.hasGsap = hasGsap;

  var DICT = window.I18N, lang = 'en';
  try { lang = localStorage.getItem('lang') || ''; } catch (e) {}
  if (lang !== 'ar' && lang !== 'en') lang = (navigator.language || '').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';

  function setText(el, str) {
    if (!el.classList.contains('split')) { el.textContent = str; return; }
    el.textContent = '';
    var words = str.split(' ');
    words.forEach(function (w, i) {
      var o = document.createElement('span'); o.className = 'w'; o.style.setProperty('--i', i);
      var s = document.createElement('span'); s.textContent = w; o.appendChild(s); el.appendChild(o);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  function t(k) { return DICT[lang][k] || DICT.en[k] || k; }

  function buildSelect() {
    var sel = $('#svcSelect'), keep = sel.selectedIndex > 0 ? sel.selectedIndex : 0;
    sel.innerHTML = '';
    var o = document.createElement('option'); o.value = ''; o.textContent = t('fServiceP'); sel.appendChild(o);
    for (var i = 1; i <= 9; i++) { var op = document.createElement('option'); op.textContent = t('s' + i + 't'); op.value = op.textContent; sel.appendChild(op); }
    sel.selectedIndex = keep;
  }

  function applyLang(l) {
    lang = l; DC.lang = l;
    html.lang = l; html.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.title = t('_title');
    var md = $('meta[name="description"]'); if (md) md.content = t('_desc');
    $$('[data-i18n]').forEach(function (el) { setText(el, t(el.getAttribute('data-i18n'))); });
    $$('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    $('#lang').setAttribute('data-l', l);
    $('#telText').textContent = CONFIG.phone;
    buildSelect();
    try { localStorage.setItem('lang', l); } catch (e) {}
    $$('.rc').forEach(function (c) { var n = $('cite', c); $('.av', c).textContent = (n.textContent.trim() || '?').charAt(0); });
    $$('.cert-thumb').forEach(function (b) { b.setAttribute('aria-label', t('zoom') + ': ' + $('h3', b.parentNode).textContent); });
    var pi = $('.portrait img'); if (pi) pi.alt = t('brand');
    DC.onLang.forEach(function (fn) { fn(); });
  }

  function switchLang() {
    var next = lang === 'en' ? 'ar' : 'en';
    if (reduce || !hasGsap) { applyLang(next); return; }
    var c = $('#curtain'), label = c.firstElementChild;
    label.textContent = next === 'ar' ? 'عربي' : 'EN';
    gsap.timeline()
      .set(c, { display: 'grid', yPercent: 100 })
      .to(c, { yPercent: 0, duration: .6, ease: 'power4.inOut' })
      .fromTo(label, { scale: .8, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: 'back.out(2)' }, '-=.15')
      .add(function () { applyLang(next); ScrollTrigger.refresh(); })
      .to(c, { yPercent: -100, duration: .7, ease: 'power4.inOut', delay: .3 })
      .set(c, { display: 'none' });
  }
  DC.lang = lang;
  DC.t = t; DC.applyLang = applyLang; DC.switchLang = switchLang;
})();
