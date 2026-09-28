/* Chain Reaction: helpers shared by every experiment. */
(function () {
  'use strict';

  const PH = (window.PH = window.PH || {});

  const motion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  // The reader's Motion choice (see prefs.js), which starts from the device's.
  PH.reducedMotion = function () {
    return PH.prefs ? PH.prefs.get('motion') === 'off' : motion.matches;
  };

  // Plate colors. The glow colors light up experiments; the "mark" colors are
  // the validated legend palette used wherever color tells categories apart.
  PH.color = {
    plate: '#0c0f14',
    ink: '#ebe7df',
    muted: '#a29e95',
    faint: 'rgba(235, 231, 223, 0.12)',
    grid: 'rgba(235, 231, 223, 0.09)',
    glow: '#5cc2ff',
    amber: '#ffb454',
    red: '#ff6b5b',
    markBlue: '#2f96d6',
    markAmber: '#c47a1e',
    markMagenta: '#d75ac0'
  };

  PH.clamp = function (x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
  };

  PH.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  PH.formatInt = function (n) {
    return Math.round(n).toLocaleString('en-US');
  };

  const SUPERSCRIPT = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };

  PH.sup = function (n) {
    return String(n).split('').map(function (ch) { return SUPERSCRIPT[ch] || ch; }).join('');
  };

  // 2.4e9 -> "2.4 G" style SI formatting, for frequencies and lengths.
  const PREFIX = [
    [1e18, 'E'], [1e15, 'P'], [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'],
    [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f']
  ];

  PH.formatSI = function (x, unit) {
    for (let i = 0; i < PREFIX.length; i++) {
      if (x >= PREFIX[i][0] * 0.9999) {
        const v = x / PREFIX[i][0];
        return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + PREFIX[i][1] + unit;
      }
    }
    return x.toExponential(1) + ' ' + unit;
  };

  // Approximate RGB for a visible wavelength in nanometres (380-750 nm).
  PH.wavelengthRGB = function (nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 750) { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40;
    else if (nm > 700) f = 0.35 + 0.65 * (750 - nm) / 50;
    if (nm < 380 || nm > 750) f = 0;
    const c = function (v) { return Math.round(255 * Math.pow(v * f, 0.8)); };
    return [c(r), c(g), c(b)];
  };

  PH.rgbString = function (rgb, alpha) {
    return alpha === undefined
      ? 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'
      : 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
  };

  // Match a canvas's backing store to its CSS box; drawing code works in CSS px.
  PH.fitCanvas = function (canvas, maxDpr) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2);
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    return { w: w, h: h, dpr: bw / w };
  };

  // Size, clear and paint a canvas in one call. Returns the CSS size.
  PH.begin = function (canvas, ctx, maxDpr) {
    const s = PH.fitCanvas(canvas, maxDpr);
    ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PH.color.plate;
    ctx.fillRect(0, 0, s.w, s.h);
    return s;
  };

  // Call fn when el changes size. Hidden elements (exhibit mode hides every
  // chapter but one) report zero size; they are skipped until shown again.
  PH.onResize = function (el, fn) {
    let raf = 0;
    const run = function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        if (el.clientWidth > 0 && el.clientHeight > 0) fn();
      });
    };
    if ('ResizeObserver' in window) new ResizeObserver(run).observe(el);
    else window.addEventListener('resize', run);
  };

  PH.setPressed = function (buttons, active) {
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === active));
    });
  };

  PH.pointer = function (e, el) {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  PH.text = function (el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  };

  // Show a year, counting through the years in between like a time machine.
  PH.rollYear = function (el, value) {
    if (!el) return;
    value = String(value);
    if (el.dataset.to === value) return;
    el.dataset.to = value;
    const from = parseInt(el.textContent, 10), to = parseInt(value, 10);
    cancelAnimationFrame(el.rollRaf || 0);
    if (PH.reducedMotion() || isNaN(from) || isNaN(to) || from === to) {
      el.textContent = value;
      return;
    }
    const t0 = performance.now(), dur = 700;
    const step = function (now) {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) el.rollRaf = requestAnimationFrame(step);
    };
    el.rollRaf = requestAnimationFrame(step);
  };

  // A soft round glow, pre-rendered once per color and reused for every flash.
  const glowCache = new Map();
  PH.glowSprite = function (color) {
    if (glowCache.has(color)) return glowCache.get(color);
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.18, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glowCache.set(color, c);
    return c;
  };

  // An animation loop that only runs while its element is on screen and the
  // experiment is playing. frame(dt) receives seconds since the last frame.
  PH.Loop = class Loop {
    constructor(target, frame) {
      this.frame = frame;
      this.target = target;
      this.visible = false;
      this.running = false;
      this.raf = 0;
      this.last = 0;
      this.onVisible = null;
      this.tick = this.tick.bind(this);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          const was = this.visible;
          this.visible = entries[entries.length - 1].isIntersecting;
          if (this.visible && !was && this.onVisible) this.onVisible();
          this.sync();
        }, { rootMargin: '120px 0px' }).observe(target);
      } else {
        this.visible = true;
      }
    }

    play() {
      this.running = true;
      this.sync();
    }

    pause() {
      this.running = false;
      this.sync();
    }

    sync() {
      const go = this.running && this.visible;
      if (go && !this.raf) {
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.tick);
      } else if (!go && this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
      }
    }

    tick(now) {
      const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      this.raf = requestAnimationFrame(this.tick);
      // A plate that was just hidden keeps its loop for a frame or two until
      // the observer notices; don't draw it at zero size. While Present mode
      // covers the page, the experiments rest.
      if (this.target.clientWidth === 0 || PH.hush) return;
      this.frame(dt);
    }
  };

  // Wire a Play/Pause button to a loop. Returns a function that refreshes its label.
  PH.bindPlay = function (button, loop, onPlay) {
    const sync = function () {
      button.textContent = loop.running ? 'Pause' : 'Play';
    };
    button.addEventListener('click', function () {
      if (loop.running) {
        loop.pause();
      } else {
        if (onPlay) onPlay();
        loop.play();
      }
      sync();
    });
    sync();
    return sync;
  };

  // Start a loop unless the reader prefers reduced motion. If they turn
  // motion off later, every experiment that started by itself stops.
  const autoplayed = [];
  PH.autoplay = function (loop, syncLabel) {
    if (!PH.reducedMotion()) loop.play();
    if (syncLabel) syncLabel();
    autoplayed.push([loop, syncLabel]);
  };

  const stillHooks = [];
  PH.onStill = function (fn) {
    stillHooks.push(fn);
  };

  PH.stillAll = function () {
    autoplayed.forEach(function (a) {
      if (!a[0].running) return;
      a[0].pause();
      if (a[1]) a[1]();
    });
    stillHooks.forEach(function (fn) {
      try { fn(); } catch (err) { console.error(err); }
    });
  };

  /* A small line chart for the plates: hairline grid, labeled ticks, one or
     more series, an optional reference line and a hover readout. */
  PH.chart = function (canvas, ctx, spec) {
    const s = PH.begin(canvas, ctx);
    const m = Object.assign({ l: 46, r: 16, t: 30, b: 24 }, spec.margin || {});
    const pw = s.w - m.l - m.r, ph = s.h - m.t - m.b;
    const ylog = !!spec.yLog;
    const ty = function (v) { return ylog ? Math.log10(Math.max(v, 1e-12)) : v; };
    const y0 = ty(spec.y[0]), y1 = ty(spec.y[1]);
    const X = function (v) { return m.l + ((v - spec.x[0]) / (spec.x[1] - spec.x[0])) * pw; };
    const Y = function (v) { return m.t + (1 - (PH.clamp(ty(v), y0, y1) - y0) / (y1 - y0)) * ph; };

    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.lineWidth = 1;
    ctx.strokeStyle = PH.color.grid;
    ctx.fillStyle = PH.color.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    (spec.yTicks || []).forEach(function (t) {
      const y = Math.round(Y(t.v)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(m.l, y);
      ctx.lineTo(m.l + pw, y);
      ctx.stroke();
      ctx.fillText(t.label, m.l - 8, y);
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    (spec.xTicks || []).forEach(function (t, i, all) {
      if (i === all.length - 1) ctx.textAlign = 'right';
      ctx.fillText(t.label, i === all.length - 1 ? m.l + pw : X(t.v), m.t + ph + 7);
    });

    if (spec.ref) {
      const y = Math.round(Y(spec.ref.v)) + 0.5;
      ctx.strokeStyle = spec.ref.color;
      ctx.beginPath();
      ctx.moveTo(m.l, y);
      ctx.lineTo(m.l + pw, y);
      ctx.stroke();
      if (spec.ref.label) {
        ctx.fillStyle = spec.ref.color;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(spec.ref.label, m.l + pw, y - 3);
      }
    }

    (spec.series || []).forEach(function (se) {
      if (!se.points || se.points.length < 2) return;
      ctx.strokeStyle = se.color;
      ctx.lineWidth = se.width || 2;
      ctx.lineJoin = 'round';
      ctx.globalAlpha = se.alpha === undefined ? 1 : se.alpha;
      ctx.beginPath();
      se.points.forEach(function (p, i) {
        if (i) ctx.lineTo(X(p[0]), Y(p[1]));
        else ctx.moveTo(X(p[0]), Y(p[1]));
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    const main = spec.series && spec.series[0];
    if (spec.hoverX !== null && spec.hoverX !== undefined && main && main.points.length) {
      const target = spec.x[0] + PH.clamp((spec.hoverX - m.l) / pw, 0, 1) * (spec.x[1] - spec.x[0]);
      let best = main.points[0];
      for (let i = 1; i < main.points.length; i++) {
        if (Math.abs(main.points[i][0] - target) < Math.abs(best[0] - target)) best = main.points[i];
      }
      const x = X(best[0]), y = Y(best[1]);
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, m.t);
      ctx.lineTo(Math.round(x) + 0.5, m.t + ph);
      ctx.stroke();
      ctx.fillStyle = PH.color.plate;
      ctx.strokeStyle = main.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const text = spec.hoverText(best);
      ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
      const tw = ctx.measureText(text).width;
      const left = x + 12 + tw > s.w - 4;
      const tx = left ? x - 12 : x + 12;
      const tyy = PH.clamp(y, m.t + 8, m.t + ph - 8);
      ctx.fillStyle = 'rgba(12, 15, 20, 0.88)';
      ctx.fillRect(left ? tx - tw - 6 : tx - 6, tyy - 10, tw + 12, 20);
      ctx.fillStyle = PH.color.ink;
      ctx.textAlign = left ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tx, tyy);
    }
    return { X: X, Y: Y, size: s };
  };

  // Track the pointer over a chart box and redraw on move.
  PH.hoverChart = function (box, onChange) {
    box.addEventListener('pointermove', function (e) { onChange(PH.pointer(e, box).x); });
    box.addEventListener('pointerleave', function () { onChange(null); });
  };
})();
