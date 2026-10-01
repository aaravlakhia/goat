/* Orders of Magnitude: the journey. The page's scroll position sets the
   size of the view (z, the power of ten in meters across it). Each stop
   holds the view near one size while its note is read, then the zoom
   travels to the next. Play mode flies from stop to stop by itself. */
(function () {
  'use strict';

  const OM = window.OM, U = OM.util;
  const canvas = document.getElementById('sky');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;

  const reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const stops = Array.prototype.map.call(document.querySelectorAll('.journey .stop'), function (el, i) {
    const who = el.querySelector('.who'), h = el.querySelector('h2, h1');
    return {
      el: el, i: i, id: el.id, z: +el.dataset.z, kind: el.dataset.kind, card: el.querySelector('.card'),
      title: h ? h.textContent.trim() : '',
      who: who ? who.textContent.replace(/\s+/g, ' ').trim() : ''
    };
  });
  const after = document.querySelector('.after');
  const DRIFT = 0.06, Z_TOP = 27.5, Z_SPAN = 45;

  /* ---------- Size and layout ---------- */

  let W = 0, H = 0, dpr = 1, vh = 0, view = 0, cx = 0, cy = 0, small = false;
  let layW = -1, layH = -1;

  function layout() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    small = W < 761;
    if (small) {
      cx = W / 2;
      cy = H * (H < 700 ? 0.27 : 0.32);
      view = Math.min(W, H * 0.55);
    } else {
      cx = W * (W > 1100 ? 0.6 : 0.64);
      cy = H * 0.5;
      view = Math.min(W * 0.62, H);
    }
    // Phones change height as their toolbars slide; only re-measure the
    // journey when the size really changes, so the page doesn't jump.
    if (Math.abs(W - layW) > 1 || Math.abs(H - layH) > layH * 0.2) {
      const keep = currentZ;
      layW = W;
      layH = H;
      vh = H;
      stops.forEach(function (st, i) {
        const next = stops[i + 1];
        st.D = st.kind === 'hero' ? 0.75 : st.kind === 'find' ? 1.4 : 0.9;
        st.T = next ? U.clamp(0.32 + 0.12 * (st.z - next.z), 0.5, 1.5) : 0.7;
        st.el.style.height = Math.round((st.D + st.T) * vh) + 'px';
      });
      stops.forEach(function (st) { st.top = st.el.getBoundingClientRect().top + window.scrollY; });
      if (keep !== null) window.scrollTo(0, yFor(keep));
    }
    dirty = true;
  }

  /* ---------- Scroll position to size ---------- */

  function zAt(y) {
    if (y <= stops[0].top) return stops[0].z + DRIFT;
    for (let i = 0; i < stops.length; i++) {
      const st = stops[i], u = y - st.top, D = st.D * vh, T = st.T * vh;
      if (u < D + T || i === stops.length - 1) {
        if (u <= D) return st.z + DRIFT * (1 - 2 * u / D);
        const next = stops[i + 1];
        if (!next) return st.z - DRIFT - Math.min(0.4, (u - D) / vh * 0.3);
        const k = U.clamp((u - D) / T, 0, 1), e = k * k * (3 - 2 * k);
        return U.lerp(st.z - DRIFT, next.z + DRIFT, e);
      }
    }
    return stops[stops.length - 1].z;
  }

  // The scroll position that shows size z (z only ever falls as y grows).
  function yFor(z) {
    let lo = 0, hi = maxY();
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (zAt(mid) > z) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function maxY() {
    const last = stops[stops.length - 1];
    return last.top + (last.D + last.T) * vh;
  }

  function stopY(st) {
    return st.kind === 'hero' ? 0 : st.top + st.D * vh * 0.5;
  }

  function indexAt(y) {
    for (let i = stops.length - 1; i >= 0; i--) if (y >= stops[i].top - 1) return i;
    return 0;
  }

  /* ---------- Background: space, sky, lamplight, the atom ---------- */

  const BG = [
    [28, '#020308', '#05070f'], [23, '#030409', '#0a0918'], [19, '#020306', '#05060d'],
    [12, '#020307', '#04060c'], [9.6, '#02040a', '#050a18'], [7.4, '#030a1c', '#081a3a'],
    [6.2, '#0d2a5c', '#1d4c8a'], [5.0, '#a9c3df', '#e6edf4'], [4.0, '#bcd3ea', '#eef3f7'],
    [3.0, '#78aee0', '#d9e8f2'], [1.2, '#7fb2e2', '#e8eff3'], [0.55, '#5b6f80', '#8d979b'],
    [0.1, '#24180f', '#120c08'], [-0.9, '#1d140d', '#0c0806'], [-1.2, '#06090b', '#020405'],
    [-2.5, '#070c0e', '#030607'], [-3.2, '#0c1517', '#060b0c'], [-4.6, '#081014', '#04080a'],
    [-5.4, '#050508', '#08080d'], [-7.3, '#03060b', '#071019'], [-8.6, '#060512', '#0c0920'],
    [-10.3, '#040309', '#070512'], [-12.6, '#030206', '#07040c'], [-13.4, '#08030a', '#140611'],
    [-14.5, '#140406', '#22080b'], [-17, '#0e0307', '#1b060c']
  ].map(function (k) { return [k[0], hex(k[1]), hex(k[2])]; });

  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  function bgAt(z) {
    if (z >= BG[0][0]) return [BG[0][1], BG[0][2]];
    for (let i = 1; i < BG.length; i++) {
      if (z >= BG[i][0]) {
        const a = BG[i - 1], b = BG[i], k = (a[0] - z) / (a[0] - b[0]);
        const mix = function (p, q) { return p.map(function (v, j) { return Math.round(v + (q[j] - v) * k); }); };
        return [mix(a[1], b[1]), mix(a[2], b[2])];
      }
    }
    const l = BG[BG.length - 1];
    return [l[1], l[2]];
  }

  function lum(c) {
    const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }

  /* ---------- Drawing ---------- */

  let currentZ = null, dirty = true, lastY = -1, light = false, isAfter = false;

  function draw(z, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const bg = bgAt(z);
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, U.rgba(bg[0], 1));
    gr.addColorStop(1, U.rgba(bg[1], 1));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    const isLight = lum(bg[0]) * 0.4 + lum(bg[1]) * 0.6 > 0.3;
    if (isLight !== light) {
      light = isLight;
      document.body.classList.toggle('is-light', light);
    }
    OM.scenes.forEach(function (sc) {
      const a = U.win(z, sc.win);
      if (a < 0.003) return;
      if (!sc.ready) prepare(sc);
      const s = view * sc.unit / Math.pow(10, z);
      const f = sc.focus ? sc.focus(z, t) : [0, 0];
      const g = { ctx: ctx, W: W, H: H, cx: cx, cy: cy, view: view, s: s, ox: cx - f[0] * s, oy: cy - f[1] * s, t: t, z: z, a: a, light: light, small: small, dpr: dpr };
      ctx.save();
      ctx.globalAlpha = a;
      try { sc.draw(g); } catch (err) { if (!sc.failed) { sc.failed = true; console.error('[scene ' + sc.id + ']', err); } }
      ctx.restore();
    });
    streaks(z);
    // A soft vignette, like looking through an instrument.
    const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.35, cx, cy, Math.hypot(W, H) * 0.65);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, light ? 'rgba(20,30,45,0.12)' : 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // Speed lines while the zoom is moving fast, so travel feels like flight.
  const STREAKS = [];
  let zPrev = null, tPrev = 0, zVel = 0;
  for (let i = 0; i < 90; i++) STREAKS.push({ a: Math.random() * Math.PI * 2, r: 0.04 + Math.random() * 0.9, w: 0.4 + Math.random() * 0.6 });
  function streaks(z) {
    const now = performance.now(), dt = Math.min(0.1, (now - tPrev) / 1000 || 0.016);
    tPrev = now;
    const v = zPrev === null ? 0 : (z - zPrev) / dt;
    zPrev = z;
    zVel += (v - zVel) * 0.18;
    const speed = Math.abs(zVel);
    if (reduce.matches || speed < 0.35) return;
    const f = Math.pow(10, -zVel * dt), diag = Math.hypot(W, H) * 0.55;
    const alpha = Math.min(0.32, (speed - 0.35) * 0.12);
    ctx.save();
    ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
    ctx.strokeStyle = light ? 'rgba(30,40,60,1)' : 'rgba(220,228,255,1)';
    ctx.lineWidth = 1;
    STREAKS.forEach(function (p) {
      const r0 = p.r, r1 = U.clamp(p.r * Math.pow(f, 5), 0, 2);
      p.r *= f;
      if (p.r > 1.05) { p.r = 0.03 + Math.random() * 0.12; p.a = Math.random() * Math.PI * 2; }
      else if (p.r < 0.02) { p.r = 0.85 + Math.random() * 0.2; p.a = Math.random() * Math.PI * 2; }
      const c = Math.cos(p.a), s = Math.sin(p.a);
      ctx.globalAlpha = alpha * p.w * Math.min(1, r0 * 3);
      ctx.beginPath();
      ctx.moveTo(cx + c * r0 * diag, cy + s * r0 * diag);
      ctx.lineTo(cx + c * r1 * diag, cy + s * r1 * diag);
      ctx.stroke();
    });
    ctx.restore();
  }

  function prepare(sc) {
    sc.ready = true;
    if (sc.init) {
      try { sc.init(); } catch (err) { sc.failed = true; console.error('[scene ' + sc.id + ']', err); }
    }
  }

  // Get every scene ready in quiet moments, so nothing stutters later.
  function warm(i) {
    if (i >= OM.scenes.length) return;
    if (!OM.scenes[i].ready) prepare(OM.scenes[i]);
    const next = function () { warm(i + 1); };
    if (window.requestIdleCallback) window.requestIdleCallback(next, { timeout: 400 }); else setTimeout(next, 30);
  }

  /* ---------- Notes, readout and ruler ---------- */

  const hudExp = document.getElementById('hud-exp');
  const hudWords = document.getElementById('hud-words');
  const hudLike = document.getElementById('hud-like');
  const rulerMark = document.getElementById('ruler-mark');
  const rulerList = document.getElementById('ruler-stops');
  const announce = document.getElementById('announce');
  const BIG = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion'];
  const LIKE = {
    27: 'the observable universe', 26: 'the observable universe', 25: 'the web of galaxies', 24: 'a supercluster of galaxies',
    23: 'a group of galaxies', 22: 'the Milky Way and its neighbors', 21: 'the Milky Way', 20: 'a slice of our galaxy',
    19: 'a star cluster', 18: 'a hundred light-years', 17: 'the nearest stars', 16: 'one light-year', 15: 'far beyond Pluto',
    14: 'the outer Solar System', 13: 'the Solar System', 12: 'the inner planets', 11: 'the Earth’s orbit',
    10: 'the Earth and the Moon', 9: 'the Moon’s orbit', 8: 'the GPS satellites', 7: 'the Earth', 6: 'a country',
    5: 'a region', 4: 'a city', 3: 'a town', 2: 'the Leaning Tower', 1: 'a house', 0: 'a person', '-1': 'a hand',
    '-2': 'a fingertip', '-3': 'a grain of sand', '-4': 'a human hair', '-5': 'a blood cell', '-6': 'a wave of light',
    '-7': 'a virus', '-8': 'a few molecules', '-9': 'a molecule', '-10': 'an atom', '-11': 'inside an atom',
    '-12': 'empty space in an atom', '-13': 'a gold nucleus', '-14': 'a uranium nucleus', '-15': 'a proton',
    '-16': 'inside a proton', '-17': 'LIGO’s measurement', '-18': 'LIGO’s measurement'
  };

  function words(e) {
    if (e === 0) return 'one meter';
    if (e === 1) return 'ten meters';
    if (e === 2) return 'a hundred meters';
    if (e > 0) return ['one', 'ten', 'a hundred'][e % 3] + ' ' + BIG[Math.floor(e / 3)] + ' meters';
    const n = -e, big = Math.floor(n / 3), r = n % 3;
    if (big === 0) return r === 1 ? 'one tenth of a meter' : 'one hundredth of a meter';
    return 'one ' + (r === 0 ? '' : r === 1 ? 'ten-' : 'hundred-') + BIG[big] + 'th of a meter';
  }

  let shownExp = null, activeStop = -1;

  function updateHud(z, y) {
    const e = Math.floor(z + 0.5);
    if (e !== shownExp) {
      shownExp = e;
      hudExp.textContent = String(e).replace('-', '−');
      hudWords.textContent = words(e);
      hudLike.textContent = LIKE[e] || '';
    }
    rulerMark.style.setProperty('--at', ((Z_TOP - z) / Z_SPAN * 100).toFixed(3) + '%');
    const i = indexAt(y);
    if (i !== activeStop) {
      activeStop = i;
      Array.prototype.forEach.call(rulerList.querySelectorAll('button'), function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
  }

  let flying = false;
  function updateCards(y) {
    stops.forEach(function (st) {
      const c = st.card;
      if (!c) return;
      const u = y - st.top, D = st.D * vh;
      let a, off;
      if (st.kind === 'hero') {
        a = 1 - U.smooth(D * 0.5, D + 0.2 * vh, u);
        off = -Math.max(0, u - D * 0.5) * 0.2;
      } else {
        const fin = U.smooth(-0.22 * vh, 0.02 * vh, u), fout = 1 - U.smooth(D - 0.02 * vh, D + 0.24 * vh, u);
        a = Math.min(fin, fout);
        off = u < D / 2 ? (1 - fin) * 28 : -(1 - fout) * 28;
      }
      if (flying && st.kind !== 'hero') a = 0;
      if (a < 0.005) a = 0;
      if (c._a !== a) {
        c._a = a;
        c.style.opacity = a.toFixed(3);
        c.classList.toggle('is-on', a > 0.5);
      }
      const tr = (small ? '' : 'translateY(-50%) ') + 'translateY(' + off.toFixed(1) + 'px)';
      if (c._t !== tr) {
        c._t = tr;
        c.style.transform = tr;
      }
    });
  }

  function buildRuler() {
    stops.forEach(function (st, i) {
      const li = document.createElement('li');
      li.style.setProperty('--at', ((Z_TOP - st.z) / Z_SPAN * 100).toFixed(2) + '%');
      const b = document.createElement('button');
      b.type = 'button';
      const e = Math.floor(st.z + 0.5);
      const label = st.kind === 'hero' ? 'The start: the whole observable universe' : st.kind === 'find' ? st.who + ': ' + st.title : st.title;
      b.dataset.label = st.kind === 'hero' ? 'The start' : st.kind === 'find' ? st.who : st.title;
      b.setAttribute('aria-label', label + ', 10 to the power ' + (e < 0 ? 'minus ' + -e : e) + ' meters');
      if (st.kind === 'find') b.className = 'is-find';
      b.addEventListener('click', function () { stopTour(); flyTo(i, { say: true }); });
      li.appendChild(b);
      rulerList.appendChild(li);
    });
  }

  /* ---------- Flying from size to size ---------- */

  let anim = null;
  function cancelFlight() {
    if (anim) cancelAnimationFrame(anim.raf);
    anim = null;
    if (flying) {
      flying = false;
      dirty = true;
    }
  }

  function flyTo(i, opt) {
    opt = opt || {};
    i = U.clamp(i, 0, stops.length - 1);
    const st = stops[i], toY = stopY(st);
    const z0 = zAt(window.scrollY), z1 = zAt(toY);
    const dz = Math.abs(z1 - z0);
    cancelFlight();
    const done = function () {
      window.scrollTo(0, toY);
      if (opt.say) say(st);
      if (opt.done) opt.done();
    };
    if (reduce.matches || dz < 0.02) {
      window.scrollTo(0, toY);
      done();
      return;
    }
    const dur = opt.dur || U.clamp(700 + 260 * dz, 900, 4200);
    const t0 = performance.now();
    flying = dz > 1.2;
    anim = {};
    const step = function (now) {
      if (!anim) return;
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      if (flying && k > 0.85) {
        flying = false;
        dirty = true;
      }
      window.scrollTo(0, yFor(z0 + (z1 - z0) * e));
      if (k < 1) anim.raf = requestAnimationFrame(step);
      else {
        anim = null;
        flying = false;
        done();
      }
    };
    anim.raf = requestAnimationFrame(step);
  }

  function say(st) {
    if (!announce) return;
    announce.textContent = st.kind === 'find' ? st.who + '. ' + st.title : st.title || '';
  }

  /* ---------- Play the journey ---------- */

  const playBtn = document.getElementById('play');
  const playLabel = playBtn && playBtn.querySelector('.play-label');
  let touring = false, holdRaf = 0;

  function setPlayUI(on) {
    if (!playBtn) return;
    playBtn.setAttribute('aria-pressed', String(on));
    playLabel.textContent = on ? 'Pause' : 'Play the journey';
    playBtn.style.setProperty('--p', 0);
    document.querySelectorAll('[data-play]').forEach(function (b) { b.textContent = on ? 'Pause the journey' : 'Play the journey'; });
  }

  function startTour() {
    touring = true;
    setPlayUI(true);
    const y = window.scrollY, i = indexAt(y), st = stops[i];
    const inDwell = Math.abs(y - stopY(st)) < st.D * vh * 0.4;
    if (i === 0 && y < 10) leg(1);
    else if (inDwell) hold(i);
    else leg(i + 1);
  }

  function stopTour() {
    if (!touring) return;
    touring = false;
    cancelAnimationFrame(holdRaf);
    cancelFlight();
    setPlayUI(false);
  }

  function leg(i) {
    if (!touring) return;
    if (i >= stops.length) { stopTour(); return; }
    flyTo(i, { say: true, done: function () { hold(i); } });
  }

  function hold(i) {
    if (!touring) return;
    const st = stops[i], dur = st.kind === 'find' ? 11000 : 6000, t0 = performance.now();
    const tick = function (now) {
      if (!touring) return;
      const k = Math.min(1, (now - t0) / dur);
      playBtn.style.setProperty('--p', k.toFixed(3));
      if (k < 1) holdRaf = requestAnimationFrame(tick);
      else {
        playBtn.style.setProperty('--p', 0);
        leg(i + 1);
      }
    };
    holdRaf = requestAnimationFrame(tick);
  }

  function togglePlay() {
    if (touring) stopTour(); else startTour();
  }

  /* ---------- Keys, clicks and the reader's own scrolling ---------- */

  function step(dir) {
    const y = window.scrollY, i = indexAt(y), st = stops[i], mid = stopY(st);
    let target;
    if (dir > 0) target = y < mid - 5 ? i : i + 1;
    else target = y > mid + 5 ? i : i - 1;
    if (target >= stops.length) {
      cancelFlight();
      document.getElementById('timeline').scrollIntoView({ block: 'start' });
      return;
    }
    if (target < 0) return;
    flyTo(target, { say: true, done: touring ? function () { cancelAnimationFrame(holdRaf); hold(target); } : null });
  }

  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (window.scrollY > maxY() - 2) return;
    const onControl = t && t.closest && t.closest('button, a, summary');
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !onControl && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && !onControl && e.shiftKey)) dir = -1;
    if (!dir) {
      if (touring && e.key === 'Escape') stopTour();
      return;
    }
    e.preventDefault();
    step(dir);
  });

  // The reader taking over stops Play and any flight.
  ['wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, function () {
      if (anim || touring) { stopTour(); cancelFlight(); }
    }, { passive: true });
  });
  window.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('#play, [data-play], .ruler, [data-go], [data-fly-out]')) return;
    if (anim || touring) { stopTour(); cancelFlight(); }
  });

  document.addEventListener('click', function (e) {
    const go = e.target.closest && e.target.closest('[data-go]');
    if (go) {
      const i = stops.findIndex(function (st) { return st.id === go.dataset.go; });
      if (i >= 0) {
        e.preventDefault();
        stopTour();
        flyTo(i, { say: true });
        if (go.closest('.after') || go.closest('.card')) {
          const card = stops[i].card;
          setTimeout(function () { if (card) card.focus && card.focus({ preventScroll: true }); }, 0);
        }
      }
      return;
    }
    if (e.target.closest && e.target.closest('[data-play]')) {
      e.preventDefault();
      togglePlay();
      return;
    }
    if (e.target.closest && e.target.closest('[data-fly-out]')) {
      e.preventDefault();
      stopTour();
      flyTo(0, { dur: reduce.matches ? 0 : 5200, say: true });
    }
  });
  if (playBtn) playBtn.addEventListener('click', togglePlay);

  // Tabbing into a hidden note brings its stop into view.
  document.addEventListener('focusin', function (e) {
    const sec = e.target.closest && e.target.closest('.journey .stop');
    if (!sec) return;
    const i = stops.findIndex(function (st) { return st.el === sec; });
    if (i < 0 || anim) return;
    const st = stops[i], y = window.scrollY;
    if (Math.abs(y - stopY(st)) > st.D * vh * 0.45) {
      cancelFlight();
      window.scrollTo(0, stopY(st));
    }
  });

  /* ---------- Run ---------- */

  stops.forEach(function (st) { if (st.card && st.kind !== 'hero') st.card.setAttribute('tabindex', '-1'); });
  buildRuler();
  layout();
  window.addEventListener('resize', layout);

  if (location.hash) {
    const i = stops.findIndex(function (st) { return '#' + st.id === location.hash; });
    if (i > 0) window.scrollTo(0, stopY(stops[i]));
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const y = window.scrollY;
    const moved = y !== lastY;
    if (moved || dirty || currentZ === null) {
      currentZ = zAt(y);
      updateCards(y);
      updateHud(currentZ, y);
      lastY = y;
    }
    // Once the page has scrolled past the journey, the viewport is covered.
    const at = after ? after.getBoundingClientRect().top : H;
    const past = at < H * 0.55;
    if (past !== isAfter) {
      isAfter = past;
      document.body.classList.toggle('is-after', past);
    }
    const covered = at < -H * 0.1;
    if (covered) return;
    if (reduce.matches && !moved && !dirty && !OM.dirty) return;
    dirty = false;
    OM.dirty = false;
    draw(currentZ, reduce.matches ? 2.9 : now / 1000);
  }
  requestAnimationFrame(frame);
  if (reduce.addEventListener) reduce.addEventListener('change', function () { dirty = true; });
  setTimeout(function () { warm(0); }, 600);

  OM.journey = { stops: stops, flyTo: flyTo, zAt: zAt, yFor: yFor, play: togglePlay };
})();
