/* Start every experiment. Each one starts on its own, so a failure in one
   (say, no WebGL) never takes the rest of the page down with it. */
(function () {
  'use strict';

  const SN = window.SN;

  function start(name, fn) {
    try {
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.error('[' + name + ']', err);
    }
  }

  // Highlight the masthead link for the section being read.
  function initNav() {
    const links = Array.from(document.querySelectorAll('.navlink'));
    const nav = document.querySelector('.masthead nav');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map(function (a) { return [a.getAttribute('href').slice(1), a]; }));
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        const link = byId.get(entry.target.id);
        if (!link) return;
        link.setAttribute('aria-current', 'true');
        if (nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({ left: link.offsetLeft - 16, behavior: SN.reducedMotion() ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('section.exp').forEach(function (s) { io.observe(s); });
  }

  function boot() {
    start('hero', SN.initHero);
    start('mandelbrot', SN.initMandelbrot);
    start('fourier', SN.initFourier);
    start('lorenz', SN.initLorenz);
    start('phyllotaxis', SN.initPhyllotaxis);
    start('primes', SN.initPrimes);
    start('buffon', SN.initBuffon);
    start('nav', initNav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
