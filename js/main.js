/* Boot: runs once every other file has registered itself in DC.init */
(function () {
  'use strict';
  var DC = window.DC;
  DC.applyLang(DC.lang);
  ['nav', 'reveal', 'counters', 'reviews', 'faq', 'certs', 'form', 'offers', 'chat', 'pointer', 'scroll'].forEach(function (k) {
    if (DC.init[k]) DC.init[k]();
  });
  if (DC.hasGsap) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
