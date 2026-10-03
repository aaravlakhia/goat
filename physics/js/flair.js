/* Chain Reaction: the signature details. Each chapter takes the color of its
   branch of physics, the big year spins like an odometer when the fuse
   reaches it, headlines rise into place, every experiment sits in an
   instrument frame, and outlined titles light up where the pointer goes.
   It is all decoration: without this file the page reads the same, and
   with motion turned off nothing here moves. */
(function () {
  'use strict';

  const PH = window.PH;
  const root = document.documentElement;
  const pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  function moving() {
    return !PH.reducedMotion();
  }

  // The color a chapter wears, from the CSS (so there is one source of truth).
  function accentOf(el) {
    return (getComputedStyle(el).getPropertyValue('--accent') || '').trim() || '#5cc2ff';
  }

  /* ---------- Chapter openers ---------- */

  function labelChapters(chapters) {
    const lanes = PH.story ? PH.story.lanes : null;
    const byId = PH.story ? PH.story.byId : {};
    chapters.forEach(function (ch, i) {
      const c = byId[ch.id];
      const lane = c && lanes ? lanes[c.lane].name : '';
      const p = document.createElement('p');
      p.className = 'ch-index';
      p.innerHTML = '<span class="ch-num" aria-hidden="true"><b></b>/' + pad2(chapters.length) + '</span><span class="sr-only"></span><span class="ch-lane"></span>';
      p.querySelector('b').textContent = pad2(i + 1);
      p.querySelector('.sr-only').textContent = 'Discovery ' + (i + 1) + ' of ' + chapters.length + ': ';
      p.querySelector('.ch-lane').textContent = lane;
      const year = ch.querySelector('.year');
      if (year) year.insertAdjacentElement('beforebegin', p);

      // An instrument frame around each experiment.
      const plate = ch.querySelector('.fig .plate');
      if (plate) {
        const bar = document.createElement('div');
        bar.className = 'plate-bar';
        bar.setAttribute('aria-hidden', 'true');
        bar.innerHTML = '<span class="pb-exp">Exp. <b></b></span><span class="pb-lane"></span><span class="pb-live"><i></i>Live</span>';
        bar.querySelector('b').textContent = pad2(i + 1);
        bar.querySelector('.pb-lane').textContent = lane;
        plate.insertAdjacentElement('afterbegin', bar);
      }
    });
  }

  // Each chapter opens on a full screen of its own: the number and branch,
  // a giant year, the name and the idea in one line, with the chapter's 3D
  // formation flying in behind (see the director in cosmos.js). It repeats
  // what the chapter says below, so screen readers skip it.
  function buildOpeners(chapters) {
    const lanes = PH.story ? PH.story.lanes : null;
    const byId = PH.story ? PH.story.byId : {};
    chapters.forEach(function (ch, i) {
      if (ch.querySelector('.opener')) return;
      const c = byId[ch.id] || {};
      const op = document.createElement('header');
      op.className = 'opener';
      op.setAttribute('aria-hidden', 'true');
      op.innerHTML =
        '<p class="op-kicker"><span class="op-num"></span><span class="op-of">/' + pad2(chapters.length) + '</span><span class="op-lane"></span></p>' +
        '<p class="op-year"></p>' +
        '<p class="op-name"></p>' +
        '<p class="op-idea"></p>' +
        '<p class="op-cue"><i></i>Scroll into the story</p>';
      op.querySelector('.op-num').textContent = pad2(i + 1);
      op.querySelector('.op-lane').textContent = c.lane != null && lanes ? lanes[c.lane].name : '';
      op.querySelector('.op-year').textContent = ch.dataset.year || c.year || '';
      op.querySelector('.op-name').textContent = ch.dataset.name || c.name || '';
      op.querySelector('.op-idea').textContent = c.idea || '';
      ch.insertAdjacentElement('afterbegin', op);
    });
    root.classList.add('has-openers');
  }

  // The year spins like an odometer: digits that differ from the previous
  // chapter's year count up through a full turn or two and land back on
  // this year, so nothing jumps before the spin starts.
  function spinYear(el, prev) {
    const to = el.textContent.trim();
    if (!moving() || !prev || prev.length !== to.length || prev === to || el.classList.contains('is-rolling')) return;
    const odo = document.createElement('span');
    odo.className = 'odo';
    odo.setAttribute('aria-hidden', 'true');
    const anims = [];
    for (let k = 0; k < to.length; k++) {
      const d = document.createElement('span');
      d.className = 'odo-d';
      const reel = document.createElement('span');
      reel.className = 'odo-r';
      const target = +to[k];
      const turns = prev[k] === to[k] ? 0 : (k >= to.length - 2 ? 2 : 1);
      const steps = turns * 10;
      let html = '';
      for (let s = 0; s <= steps; s++) html += '<span>' + ((target + s) % 10) + '</span>';
      reel.innerHTML = html;
      d.appendChild(reel);
      odo.appendChild(d);
      if (steps) anims.push({ reel: reel, steps: steps, k: k });
    }
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = to;
    el.textContent = '';
    el.append(sr, odo);
    el.classList.add('is-rolling');
    if (PH.sound) PH.sound.play('spin');
    let left = anims.length;
    const done = function () {
      if (--left > 0) return;
      el.classList.remove('is-rolling');
      el.textContent = to;
    };
    anims.forEach(function (a) {
      // Each digit on the reel sits 1.12em below the last (see .odo-r).
      if (!a.reel.animate) { done(); return; }
      const anim = a.reel.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-a.steps * 1.12) + 'em)' }], {
        duration: 900 + a.k * 160,
        easing: 'cubic-bezier(0.16, 0.84, 0.24, 1)',
        fill: 'forwards'
      });
      anim.onfinish = done;
      anim.oncancel = done;
    });
    if (!anims.length) done();
  }

  // Headlines rise word by word the first time they come into view.
  function splitWords(h) {
    if (h.children.length || !h.textContent.trim()) return;
    const words = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    words.forEach(function (w, i) {
      const s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--i', i);
      s.textContent = w;
      h.appendChild(s);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  }

  function initReveal() {
    const heads = Array.from(document.querySelectorAll('.chapter h2'));
    heads.forEach(splitWords);
    const blocks = Array.from(document.querySelectorAll('.chapter .opener, .chapter .quote, .chapter .call, .chapter .fig, .chapter .setoff, .parts li, .open li, .endmark'));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-shown');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    const last = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-shown');
        last.unobserve(e.target);
      });
    });
    heads.concat(blocks).forEach(function (el) {
      // The last line of the page can never scroll up past the reveal line.
      (el.classList.contains('endmark') ? last : io).observe(el);
    });
    // Stagger items in a list by their place in it.
    document.querySelectorAll('.parts li, .open li').forEach(function (li) {
      li.style.setProperty('--i', Array.prototype.indexOf.call(li.parentNode.children, li));
    });
    root.classList.add('flair');
  }

  /* ---------- The fuse, the top bar and the chapter colors ---------- */

  function initThread(chapters) {
    const box = document.getElementById('chapters');
    const fuse = box && box.querySelector('.fuse');
    const mast = document.querySelector('.masthead');
    if (!box || !fuse || !mast) return;
    const colors = chapters.map(accentOf);

    // A slim progress rail under the top bar, one segment per chapter.
    const rail = document.createElement('div');
    rail.className = 'mast-rail';
    rail.setAttribute('aria-hidden', 'true');
    const segs = chapters.map(function (ch, i) {
      const s = document.createElement('i');
      s.style.setProperty('--c', colors[i]);
      rail.appendChild(s);
      return s;
    });
    mast.appendChild(rail);

    // The burnt fuse keeps the color of each chapter it has passed.
    function paintFuse() {
      const top = box.getBoundingClientRect().top;
      const h = box.offsetHeight || 1;
      const stops = [];
      chapters.forEach(function (ch, i) {
        const r = ch.getBoundingClientRect();
        const a = ((r.top - top) / h) * 100, b = ((r.bottom - top) / h) * 100;
        stops.push(colors[i] + ' ' + Math.max(0, a + 1).toFixed(2) + '%', colors[i] + ' ' + Math.max(0, b - 1).toFixed(2) + '%');
      });
      fuse.style.setProperty('--fuse-grad', 'linear-gradient(180deg, ' + stops.join(', ') + ')');
    }

    let lit = chapters.map(function (ch) { return ch.classList.contains('is-lit'); });
    let nowAccent = '';
    let raf = 0;
    function update() {
      raf = 0;
      const vh = window.innerHeight, line = vh * 0.55;
      const exhibit = document.body.classList.contains('is-exhibit');
      const cur = exhibit ? chapters.findIndex(function (c) { return c.classList.contains('is-current'); }) : -1;
      let current = 0;
      chapters.forEach(function (ch, i) {
        let f;
        if (exhibit) {
          f = i <= cur ? 1 : 0;
          if (i === cur) current = i;
        } else {
          const r = ch.getBoundingClientRect();
          f = PH.clamp((line - r.top) / (r.height || 1), 0, 1);
          if (r.top + 150 < line) current = i;
        }
        segs[i].style.setProperty('--f', f.toFixed(3));
        // A chapter that has just lit spins its year.
        const on = ch.classList.contains('is-lit');
        if (on && !lit[i] && i > 0) spinYear(ch.querySelector('.year'), chapters[i - 1].dataset.year);
        lit[i] = on;
      });
      if (colors[current] !== nowAccent) {
        nowAccent = colors[current];
        root.style.setProperty('--now-accent', nowAccent);
      }
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', function () { paintFuse(); schedule(); });
    // Chapters change height as experiments size themselves and as text size
    // changes, so the fuse colors follow the layout.
    if ('ResizeObserver' in window) {
      let pending = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(paintFuse);
      }).observe(box);
    }
    // The fuse's own script lights chapters on scroll; watch for it here too
    // (for exhibit mode and jumps that light a chapter without scrolling).
    const mo = new MutationObserver(schedule);
    chapters.forEach(function (ch) { mo.observe(ch, { attributes: true, attributeFilter: ['class'] }); });
    paintFuse();
    update();
  }

  /* ---------- Outlined words that light up under the pointer ---------- */

  const LANE_GRADIENT = 'linear-gradient(90deg, #6aaeff 0%, #3ddc9a 28%, #ffb454 52%, #ff8a5c 74%, #ff7fb0 100%)';

  function litText(el) {
    const lit = document.createElement('span');
    lit.className = 'lit';
    lit.setAttribute('aria-hidden', 'true');
    lit.textContent = el.textContent;
    el.appendChild(lit);
    el.classList.add('has-lit');
    el.style.setProperty('--lanes', LANE_GRADIENT);
    return lit;
  }

  function place(el, x, y, r) {
    el.style.setProperty('--lx', x.toFixed(1) + 'px');
    el.style.setProperty('--ly', y.toFixed(1) + 'px');
    el.style.setProperty('--lr', r.toFixed(1) + 'px');
  }

  function initTitle() {
    const word = document.querySelector('.hero h1 .outline');
    const hero = document.querySelector('.hero');
    if (!word || !hero) return;
    litText(word);
    let raf = 0, target = null, r = 0, rTarget = 0, x = 0, y = 0, sweeping = false;

    // Once, as the title arrives: a spark runs through the outline, left to right.
    function sweep() {
      if (!moving()) return;
      sweeping = true;
      const w = word.offsetWidth, h = word.offsetHeight, t0 = performance.now(), dur = 1700;
      const step = function (now) {
        const k = Math.min(1, (now - t0) / dur);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const rad = h * 0.9 * Math.sin(Math.PI * Math.min(1, k * 1.15));
        place(word, -h + (w + 2 * h) * e, h * 0.55, Math.max(0, rad));
        if (k < 1 && sweeping) requestAnimationFrame(step);
        else { sweeping = false; if (!target) place(word, x, y, 0); }
      };
      requestAnimationFrame(step);
    }
    setTimeout(sweep, 1250);

    // Then it follows the pointer while it is over the title area.
    function frame() {
      raf = 0;
      r += (rTarget - r) * 0.18;
      if (target) { x += (target.x - x) * 0.25; y += (target.y - y) * 0.25; }
      if (!sweeping) place(word, x, y, r);
      if (Math.abs(rTarget - r) > 0.5 || (target && (Math.abs(target.x - x) > 0.5 || Math.abs(target.y - y) > 0.5))) raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    hero.addEventListener('pointermove', function (e) {
      if (!moving()) return;
      const b = word.getBoundingClientRect();
      const near = e.clientY > b.top - b.height * 1.6 && e.clientY < b.bottom + b.height * 0.6;
      target = { x: e.clientX - b.left, y: e.clientY - b.top };
      if (!r) { x = target.x; y = target.y; }
      sweeping = false;
      rTarget = near ? b.height * 0.95 : 0;
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', function () {
      rTarget = 0;
      kick();
    });
  }

  function initEndmark() {
    const mark = document.querySelector('.endmark');
    if (!mark) return;
    const words = Array.from(mark.querySelectorAll('span'));
    words.forEach(litText);
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    mark.addEventListener('pointermove', function (e) {
      if (!moving()) return;
      words.forEach(function (w) {
        const b = w.getBoundingClientRect();
        place(w, e.clientX - b.left, e.clientY - b.top, b.height * 1.1);
      });
    }, { passive: true });
    mark.addEventListener('pointerleave', function () {
      words.forEach(function (w) { w.style.setProperty('--lr', '0px'); });
    });
  }

  /* ---------- Giant lines always fit ---------- */

  // The title and the last line are sized to fill the width in their own
  // typeface. If the web fonts don't load and a wider fallback shows, they
  // shrink to fit instead of running off the side of the screen.
  function initFit() {
    const items = [
      { el: document.querySelector('.hero h1'), line: document.querySelector('.hero h1 .outline') },
      { el: document.querySelector('.endmark'), line: null },
      { el: document.querySelector('.lives h2'), line: null }
    ].filter(function (it) { return it.el; });
    let raf = 0;
    function run() {
      raf = 0;
      items.forEach(function (it) {
        it.el.style.fontSize = '';
        const line = it.line || it.el;
        // Glyph widths don't scale perfectly with size, so check again.
        for (let i = 0; i < 3; i++) {
          const avail = it.el.clientWidth, need = line.scrollWidth;
          if (!avail || need <= avail) break;
          const size = parseFloat(getComputedStyle(it.el).fontSize);
          it.el.style.fontSize = Math.floor(size * (avail / need) * 0.985) + 'px';
        }
      });
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(run);
    }
    run();
    window.addEventListener('resize', schedule);
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(schedule);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', schedule);
    }
  }

  /* ---------- Numbers count up as the cover arrives ---------- */

  function initCount() {
    const nums = Array.from(document.querySelectorAll('.hero-meta b[data-count]'));
    if (!moving()) return;
    let done = false;
    const finish = function () {
      done = true;
      nums.forEach(function (b) { b.textContent = b.dataset.count; });
    };
    // Printing, or turning motion off, mid-count shows the real numbers.
    window.addEventListener('beforeprint', finish);
    if (PH.prefs) PH.prefs.on(function (name, value) { if (name === 'motion' && value === 'off') finish(); });
    nums.forEach(function (b, i) {
      const n = +b.dataset.count;
      b.textContent = '0';
      setTimeout(function () {
        const t0 = performance.now(), dur = 1300 + i * 120;
        const step = function (now) {
          if (done) return;
          const k = Math.min(1, (now - t0) / dur);
          b.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 4))));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, 1000 + i * 90);
    });
  }

  /* ---------- A soft light that follows the pointer across panels ---------- */

  function initSpotlight() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    const SEL = '.plate, .parts button, .open li, .map-info, .cta, .chainmap';
    let raf = 0, last = null;
    document.addEventListener('pointermove', function (e) {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        const t = last.target && last.target.closest ? last.target.closest(SEL) : null;
        if (!t) return;
        const b = t.getBoundingClientRect();
        t.style.setProperty('--mx', (last.clientX - b.left).toFixed(0) + 'px');
        t.style.setProperty('--my', (last.clientY - b.top).toFixed(0) + 'px');
      });
    }, { passive: true });
  }

  PH.initFlair = function () {
    const chapters = Array.from(document.querySelectorAll('.chapter'));
    const parts = [
      ['fit', initFit],
      ['labels', function () { labelChapters(chapters); }],
      ['openers', function () { buildOpeners(chapters); }],
      ['reveal', initReveal],
      ['thread', function () { initThread(chapters); }],
      ['title', initTitle],
      ['endmark', initEndmark],
      ['count', initCount],
      ['spotlight', initSpotlight]
    ];
    parts.forEach(function (p) {
      try { p[1](); } catch (err) { console.error('[flair ' + p[0] + ']', err); }
    });
  };
})();
