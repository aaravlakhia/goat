/* The Shape of Numbers: helpers shared by every experiment. */
(function () {
  'use strict';

  const SN = (window.SN = window.SN || {});

  const motion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  SN.reducedMotion = function () {
    return motion.matches;
  };

  // Plate colors, shared with the CSS custom properties of the same names.
  SN.color = {
    plate: '#0b0d12',
    ink: '#e8ebef',
    muted: '#9aa3b0',
    red: '#e5533c',
    blue: '#5b8be8',
    yellow: '#f2b92c',
    grid: 'rgba(232, 235, 239, 0.1)'
  };

  SN.clamp = function (x, lo, hi) {
    return Math.min(hi, Math.max(lo, x));
  };

  SN.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  SN.formatInt = function (n) {
    return Math.round(n).toLocaleString('en-US');
  };

  // "−0.74364 + 0.13183i", with a true minus sign.
  SN.formatComplex = function (re, im, digits) {
    const r = (re < 0 ? '−' : '') + Math.abs(re).toFixed(digits);
    return r + (im < 0 ? ' − ' : ' + ') + Math.abs(im).toFixed(digits) + 'i';
  };

  const SUPERSCRIPT = {
    '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };

  SN.sup = function (n) {
    return String(n).split('').map(function (ch) { return SUPERSCRIPT[ch] || ch; }).join('');
  };

  // Scientific notation for readouts: "3.1 × 10⁻⁴", or plain for everyday sizes.
  SN.formatSci = function (x) {
    if (!isFinite(x) || x <= 0) return '0';
    if (x >= 0.01 && x < 1000) return x < 1 ? x.toFixed(3) : x.toFixed(1);
    const exp = Math.floor(Math.log10(x));
    const mant = x / Math.pow(10, exp);
    return mant.toFixed(1) + ' × 10' + SN.sup(exp);
  };

  // Match a canvas's backing store to its CSS box. Returns the CSS size and the
  // real device-pixel ratio used, so drawing code can work in CSS pixels.
  SN.fitCanvas = function (canvas, maxDpr, quality) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr || 2) * (quality || 1);
    const bw = Math.max(1, Math.round(w * dpr));
    const bh = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    return { w: w, h: h, dpr: bw / w };
  };

  // Call fn (at most once per frame) whenever el changes size.
  SN.onResize = function (el, fn) {
    let raf = 0;
    const run = function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fn);
    };
    if ('ResizeObserver' in window) new ResizeObserver(run).observe(el);
    else window.addEventListener('resize', run);
  };

  SN.setPressed = function (buttons, active) {
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === active));
    });
  };

  // Local pointer position in CSS pixels.
  SN.pointer = function (e, el) {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // An animation loop that only runs while its element is on screen and
  // the experiment is playing. frame(dt) receives seconds since last frame.
  SN.Loop = class Loop {
    constructor(target, frame) {
      this.frame = frame;
      this.visible = false;
      this.running = false;
      this.raf = 0;
      this.last = 0;
      this.tick = this.tick.bind(this);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          this.visible = entries[entries.length - 1].isIntersecting;
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
      const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
      this.last = now;
      this.raf = requestAnimationFrame(this.tick);
      this.frame(dt);
    }
  };

  // Wire a Play/Pause button to a loop.
  SN.bindPlayButton = function (button, loop, onPlay) {
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
})();
