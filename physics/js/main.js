/* Start every experiment and the 3D background, burn the fuse as the reader
   scrolls, and wire up the phone diagram. Each part starts on its own, so one
   failure never takes the rest of the page down with it. */
(function () {
  'use strict';

  const PH = window.PH;

  function start(name, fn) {
    try {
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.error('[' + name + ']', err);
    }
  }

  // The fuse fills as you scroll; each chapter lights when the spark reaches it.
  function initFuse() {
    const chapters = document.getElementById('chapters');
    const fuse = chapters.querySelector('.fuse');
    const list = Array.from(chapters.querySelectorAll('.chapter'));
    const yearOut = document.getElementById('now-year');
    const nameOut = document.getElementById('now-name');
    let raf = 0;

    function update() {
      raf = 0;
      // In exhibit mode the navigator owns the chapter state and the readout.
      if (document.body.classList.contains('is-exhibit')) return;
      const vh = window.innerHeight;
      const line = vh * 0.55;
      const box = chapters.getBoundingClientRect();
      const p = PH.clamp((line - box.top) / box.height, 0, 1);
      fuse.style.setProperty('--p', p.toFixed(4));
      fuse.style.setProperty('--spark', (p * box.height).toFixed(1) + 'px');
      let current = list[0];
      list.forEach(function (ch) {
        const top = ch.getBoundingClientRect().top + 150;
        const lit = top < line;
        ch.classList.toggle('is-lit', lit);
        if (lit) current = ch;
      });
      PH.rollYear(yearOut, current.dataset.year);
      PH.text(nameOut, current.dataset.name);
    }

    function schedule() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  }

  // Highlight a phone part from the list, the diagram, or keyboard focus.
  function initPhone() {
    const buttons = Array.from(document.querySelectorAll('.parts button'));
    const shapes = Array.from(document.querySelectorAll('.phone [data-part]'));
    const go = document.getElementById('pocket-open');
    const names = {};
    document.querySelectorAll('.chapter').forEach(function (ch) { names[ch.id] = ch.dataset.name; });
    let pinned = null;

    function show(part) {
      const btn = buttons.find(function (b) { return b.dataset.part === part; });
      if (go && btn) {
        go.hidden = false;
        go.dataset.ch = btn.dataset.ch;
        go.textContent = 'Open the ' + names[btn.dataset.ch] + ' exhibit →';
      }
      buttons.forEach(function (b) {
        b.classList.toggle('is-on', b.dataset.part === part);
        b.setAttribute('aria-pressed', String(b.dataset.part === part));
      });
      shapes.forEach(function (s) { s.classList.toggle('is-on', s.dataset.part === part); });
    }

    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('mouseenter', function () { show(b.dataset.part); });
      b.addEventListener('mouseleave', function () { show(pinned); });
      b.addEventListener('focus', function () { show(b.dataset.part); });
      b.addEventListener('blur', function () { show(pinned); });
      b.addEventListener('click', function () {
        pinned = pinned === b.dataset.part ? null : b.dataset.part;
        show(pinned || b.dataset.part);
      });
    });
    document.querySelectorAll('.phone .tag').forEach(function (tag) {
      tag.style.cursor = 'pointer';
      tag.addEventListener('click', function () {
        pinned = tag.dataset.part;
        show(pinned);
      });
    });
  }

  function initPocketLink() {
    const go = document.getElementById('pocket-open');
    if (!go) return;
    go.addEventListener('click', function () {
      if (PH.nav && go.dataset.ch) PH.nav.open(go.dataset.ch);
    });
  }

  // Without WebGL2 (or if its shaders fail), the title keeps the flat
  // chain reaction instead of the 3D one.
  function initBackground() {
    PH.initCosmos();
    if (!PH.cosmos) {
      start('hero', PH.initHero);
      return;
    }
    PH.cosmos.onfail = function () {
      PH.cosmos = null;
      const old = document.getElementById('hero-play');
      if (old) old.replaceWith(old.cloneNode(true));
      start('hero', PH.initHero);
    };
  }

  function boot() {
    start('galileo', PH.initGalileo);
    start('newton', PH.initNewton);
    start('faraday', PH.initFaraday);
    start('maxwell', PH.initMaxwell);
    start('curie', PH.initCurie);
    start('einstein', PH.initEinstein);
    start('rutherford', PH.initRutherford);
    start('bohr', PH.initBohr);
    start('debroglie', PH.initDeBroglie);
    start('raman', PH.initRaman);
    start('meitner', PH.initMeitner);
    start('ligo', PH.initLigo);
    start('navigator', PH.initNavigator);
    start('background', initBackground);
    start('present', PH.initCinema);
    start('display', PH.initDisplay);
    start('listen', PH.initListen);
    start('fuse', initFuse);
    start('phone', initPhone);
    start('pocket', initPocketLink);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
