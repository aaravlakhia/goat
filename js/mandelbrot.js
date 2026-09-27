/* The hero plate and §1: the Mandelbrot set, drawn by a WebGL fragment shader.
   Falls back to a slower CPU renderer when WebGL is unavailable. */
(function () {
  'use strict';

  const SN = window.SN;

  const HOME = { cx: -0.6, cy: 0, w: 3.4 };

  const VERT = [
    'attribute vec2 aPos;',
    'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  const FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;',
    'uniform vec2 uCenter;',
    'uniform float uScale;',
    'uniform float uMaxIter;',
    'uniform float uShift;',
    '',
    '// A cyclic ramp through the page palette: ink, blue, paper, yellow, red.',
    'vec3 ramp(float t) {',
    '  t = fract(t) * 5.0;',
    '  vec3 ink = vec3(0.043, 0.051, 0.071);',
    '  vec3 blue = vec3(0.157, 0.337, 0.690);',
    '  vec3 paper = vec3(0.925, 0.933, 0.910);',
    '  vec3 yellow = vec3(0.949, 0.725, 0.173);',
    '  vec3 red = vec3(0.831, 0.243, 0.180);',
    '  if (t < 1.0) return mix(ink, blue, t);',
    '  if (t < 2.0) return mix(blue, paper, t - 1.0);',
    '  if (t < 3.0) return mix(paper, yellow, t - 2.0);',
    '  if (t < 4.0) return mix(yellow, red, t - 3.0);',
    '  return mix(red, ink, t - 4.0);',
    '}',
    '',
    'void main() {',
    '  vec2 c = (gl_FragCoord.xy - 0.5 * uRes) * uScale + uCenter;',
    '  vec3 inside = vec3(0.027, 0.031, 0.043);',
    '  // The main cardioid and the period-2 bulb never escape: skip them.',
    '  float xq = c.x - 0.25;',
    '  float q = xq * xq + c.y * c.y;',
    '  if (q * (q + xq) <= 0.25 * c.y * c.y || (c.x + 1.0) * (c.x + 1.0) + c.y * c.y <= 0.0625) {',
    '    gl_FragColor = vec4(inside, 1.0);',
    '    return;',
    '  }',
    '  vec2 z = vec2(0.0);',
    '  float n = 0.0;',
    '  float r2 = 0.0;',
    '  for (int i = 0; i < 4000; i++) {',
    '    if (n >= uMaxIter) break;',
    '    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;',
    '    r2 = dot(z, z);',
    '    if (r2 > 1024.0) break;',
    '    n += 1.0;',
    '  }',
    '  if (n >= uMaxIter) {',
    '    gl_FragColor = vec4(inside, 1.0);',
    '    return;',
    '  }',
    '  float mu = max(0.0, n + 1.0 - log2(0.5 * log(r2)));',
    '  vec3 col = ramp(0.2 * log2(mu + 1.0) + uShift);',
    '  col *= 0.3 + 0.7 * smoothstep(0.0, 9.0, mu);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // The same ramp for the CPU fallback, in 0-255 RGB.
  const STOPS = [[11, 13, 18], [40, 86, 176], [236, 238, 232], [242, 185, 44], [212, 62, 46]];
  const INSIDE = [7, 8, 11];

  function shadeCPU(re, im, maxIter, shift, out) {
    const xq = re - 0.25;
    const q = xq * xq + im * im;
    if (q * (q + xq) <= 0.25 * im * im || (re + 1) * (re + 1) + im * im <= 0.0625) {
      out[0] = INSIDE[0]; out[1] = INSIDE[1]; out[2] = INSIDE[2];
      return;
    }
    let zr = 0, zi = 0, n = 0, r2 = 0;
    while (n < maxIter) {
      const t = zr * zr - zi * zi + re;
      zi = 2 * zr * zi + im;
      zr = t;
      r2 = zr * zr + zi * zi;
      if (r2 > 1024) break;
      n++;
    }
    if (n >= maxIter) {
      out[0] = INSIDE[0]; out[1] = INSIDE[1]; out[2] = INSIDE[2];
      return;
    }
    const mu = Math.max(0, n + 1 - Math.log2(0.5 * Math.log(r2)));
    let t = 0.2 * Math.log2(mu + 1) + shift;
    t = (t - Math.floor(t)) * 5;
    const i = Math.min(4, Math.floor(t));
    const f = t - i;
    const a = STOPS[i], b = STOPS[(i + 1) % 5];
    const dim = 0.3 + 0.7 * smoothstep(0, 9, mu);
    out[0] = (a[0] + (b[0] - a[0]) * f) * dim;
    out[1] = (a[1] + (b[1] - a[1]) * f) * dim;
    out[2] = (a[2] + (b[2] - a[2]) * f) * dim;
  }

  function smoothstep(e0, e1, x) {
    const t = SN.clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  class MandelRenderer {
    constructor(canvas, maxDpr) {
      this.canvas = canvas;
      this.maxDpr = maxDpr || 1.5;
      this.quality = 1;
      this.cx = HOME.cx;
      this.cy = HOME.cy;
      this.width = HOME.w;
      this.shift = 0;
      this.gl = null;
      try {
        this.gl = canvas.getContext('webgl', {
          antialias: false, depth: false, stencil: false, alpha: false,
          powerPreference: 'high-performance'
        }) || canvas.getContext('experimental-webgl');
      } catch (err) {
        this.gl = null;
      }
      if (this.gl && !this.initGL()) this.gl = null;
      if (!this.gl) this.ctx = canvas.getContext('2d');
      this.size = { w: 1, h: 1, dpr: 1 };
      this.resize();
    }

    get usesGPU() {
      return !!this.gl;
    }

    initGL() {
      const gl = this.gl;
      const compile = function (type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn(gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);

      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.u = {
        res: gl.getUniformLocation(prog, 'uRes'),
        center: gl.getUniformLocation(prog, 'uCenter'),
        scale: gl.getUniformLocation(prog, 'uScale'),
        maxIter: gl.getUniformLocation(prog, 'uMaxIter'),
        shift: gl.getUniformLocation(prog, 'uShift')
      };

      if (!this.listening) {
        this.listening = true;
        this.canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });
        this.canvas.addEventListener('webglcontextrestored', () => {
          this.initGL();
          this.render();
        });
      }
      return true;
    }

    resize() {
      // The CPU fallback renders at a lower resolution to stay responsive.
      this.size = this.gl
        ? SN.fitCanvas(this.canvas, this.maxDpr, this.quality)
        : SN.fitCanvas(this.canvas, 1, 0.5);
    }

    iterations() {
      const depth = Math.max(0, Math.log10(HOME.w / this.width));
      return Math.round(SN.clamp(140 + 110 * depth, 140, 1800));
    }

    zoom() {
      return HOME.w / this.width;
    }

    // Complex number under a CSS-pixel position.
    toComplex(x, y) {
      const s = this.width / this.size.w;
      return [this.cx + (x - this.size.w / 2) * s, this.cy - (y - this.size.h / 2) * s];
    }

    // CSS-pixel position of a complex number.
    toScreen(re, im) {
      const s = this.size.w / this.width;
      return [this.size.w / 2 + (re - this.cx) * s, this.size.h / 2 - (im - this.cy) * s];
    }

    render() {
      if (this.gl) {
        const gl = this.gl;
        const c = this.canvas;
        gl.viewport(0, 0, c.width, c.height);
        gl.uniform2f(this.u.res, c.width, c.height);
        gl.uniform2f(this.u.center, this.cx, this.cy);
        gl.uniform1f(this.u.scale, this.width / c.width);
        gl.uniform1f(this.u.maxIter, this.iterations());
        gl.uniform1f(this.u.shift, this.shift);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else {
        this.renderCPU();
      }
    }

    renderCPU() {
      const c = this.canvas;
      const W = c.width, H = c.height;
      const img = this.ctx.createImageData(W, H);
      const data = img.data;
      const scale = this.width / W;
      const maxIter = Math.min(this.iterations(), 500);
      const rgb = [0, 0, 0];
      for (let py = 0; py < H; py++) {
        const im = this.cy + (H / 2 - py - 0.5) * scale;
        for (let px = 0; px < W; px++) {
          shadeCPU(this.cx + (px + 0.5 - W / 2) * scale, im, maxIter, this.shift, rgb);
          const o = (py * W + px) * 4;
          data[o] = rgb[0];
          data[o + 1] = rgb[1];
          data[o + 2] = rgb[2];
          data[o + 3] = 255;
        }
      }
      this.ctx.putImageData(img, 0, 0);
    }
  }

  function formatZoom(z) {
    return '×' + (z < 10 ? z.toFixed(1) : SN.formatInt(z));
  }

  /* ---------- Hero: an endless dive into Seahorse Valley ---------- */

  SN.initHero = function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const view = new MandelRenderer(canvas, 1.25);
    const zoomOut = document.getElementById('hero-zoom');
    const iterOut = document.getElementById('hero-iter');
    const centerOut = document.getElementById('hero-center');
    const playBtn = document.getElementById('hero-play');

    const TARGET = [-0.743643887037151, 0.13182590420533];
    const START = [-0.62, 0.0];
    const W_MIN = 2.2e-4;
    const PERIOD = 70; // seconds for one dive in and back out

    // Start partway in, so the first frame already shows the valley.
    let clock = 13;
    let sinceReadout = 1;

    function place(t) {
      const phase = (t % PERIOD) / PERIOD;
      const e = (1 - Math.cos(phase * Math.PI * 2)) / 2;
      view.width = Math.exp(SN.lerp(Math.log(HOME.w), Math.log(W_MIN), e));
      // Keep the target point fixed on screen while the view shrinks around it.
      const f = view.width / HOME.w;
      view.cx = TARGET[0] + (START[0] - TARGET[0]) * f;
      view.cy = TARGET[1] + (START[1] - TARGET[1]) * f;
      view.shift = t * 0.02;
    }

    function readout() {
      zoomOut.textContent = formatZoom(view.zoom());
      iterOut.textContent = SN.formatInt(view.iterations());
      centerOut.textContent = SN.formatComplex(view.cx, view.cy, 5);
    }

    // Adapt resolution so slower graphics cards keep a smooth frame rate.
    let frames = 0, spent = 0;
    function adapt(dt) {
      frames++;
      spent += dt;
      if (frames < 40) return;
      const avg = spent / frames;
      frames = 0;
      spent = 0;
      if (avg > 0.028 && view.quality > 0.45) {
        view.quality = Math.max(0.45, view.quality - 0.15);
        view.resize();
      } else if (avg < 0.018 && view.quality < 1) {
        view.quality = Math.min(1, view.quality + 0.1);
        view.resize();
      }
    }

    const loop = new SN.Loop(canvas, function (dt) {
      clock += dt;
      place(clock);
      view.render();
      sinceReadout += dt;
      if (sinceReadout > 0.12) {
        sinceReadout = 0;
        readout();
      }
      adapt(dt);
    });

    place(clock);
    view.render();
    readout();

    SN.onResize(canvas, function () {
      view.resize();
      view.render();
    });

    // Without a GPU the dive is too slow to animate, so show one still frame.
    if (!view.usesGPU) {
      playBtn.hidden = true;
      return;
    }
    SN.bindPlayButton(playBtn, loop);
    if (!SN.reducedMotion()) {
      loop.play();
      playBtn.textContent = 'Pause';
    } else {
      playBtn.textContent = 'Play';
    }
  };

  /* ---------- §1: the explorer ---------- */

  SN.initMandelbrot = function () {
    const stage = document.getElementById('mandel-stage');
    if (!stage) return;
    const canvas = document.getElementById('mandel-canvas');
    const overlay = document.getElementById('mandel-overlay');
    const octx = overlay.getContext('2d');
    const view = new MandelRenderer(canvas, 1.5);
    const zoomOut = document.getElementById('mandel-zoom');
    const iterOut = document.getElementById('mandel-iter');
    const centerOut = document.getElementById('mandel-center');
    const status = document.getElementById('mandel-status');

    const MIN_W = 1.3e-4;
    const MAX_W = 4.5;
    const ORBIT_STEPS = 200;
    const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    const defaultStatus = canHover
      ? 'Click to zoom in, drag to move, hover to see a point\'s orbit.'
      : 'Tap anywhere to zoom in there.';

    let hover = null;
    let drag = null;
    let animRaf = 0;
    let pending = false;

    function readout() {
      zoomOut.textContent = formatZoom(view.zoom());
      iterOut.textContent = SN.formatInt(view.iterations());
      centerOut.textContent = SN.formatComplex(view.cx, view.cy, view.width < 0.01 ? 7 : 4);
    }

    function setStatus(text) {
      if (status.textContent !== text) status.textContent = text;
    }

    function drawOverlay() {
      const s = SN.fitCanvas(overlay, 2);
      octx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      octx.clearRect(0, 0, s.w, s.h);
      if (!hover) {
        setStatus(view.width <= MIN_W * 1.01
          ? 'Deepest zoom reached: 32-bit graphics numbers run out of digits here.'
          : defaultStatus);
        return;
      }
      const c = view.toComplex(hover.x, hover.y);
      let zr = 0, zi = 0, steps = 0, escaped = false;
      const pts = [view.toScreen(0, 0)];
      while (steps < ORBIT_STEPS) {
        const t = zr * zr - zi * zi + c[0];
        zi = 2 * zr * zi + c[1];
        zr = t;
        steps++;
        pts.push(view.toScreen(zr, zi));
        if (zr * zr + zi * zi > 4) {
          escaped = true;
          break;
        }
      }
      const color = escaped ? SN.color.red : SN.color.yellow;
      octx.lineWidth = 1.25;
      octx.lineJoin = 'round';
      octx.strokeStyle = color;
      octx.globalAlpha = 0.85;
      octx.beginPath();
      pts.forEach(function (p, i) {
        if (i) octx.lineTo(p[0], p[1]);
        else octx.moveTo(p[0], p[1]);
      });
      octx.stroke();
      octx.globalAlpha = 1;
      octx.fillStyle = color;
      for (let i = 1; i < Math.min(pts.length, 80); i++) {
        octx.beginPath();
        octx.arc(pts[i][0], pts[i][1], 2.2, 0, Math.PI * 2);
        octx.fill();
      }
      octx.strokeStyle = SN.color.ink;
      octx.lineWidth = 1.5;
      octx.beginPath();
      octx.arc(hover.x, hover.y, 7, 0, Math.PI * 2);
      octx.stroke();

      const where = 'c = ' + SN.formatComplex(c[0], c[1], view.width < 0.01 ? 7 : 4);
      setStatus(escaped
        ? where + ' escapes after ' + steps + (steps === 1 ? ' step.' : ' steps.')
        : where + ' stayed bounded for ' + ORBIT_STEPS + ' steps: it is in the set, or very close to it.');
    }

    function paint() {
      view.render();
      drawOverlay();
      readout();
    }

    function requestPaint() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        paint();
      });
    }

    function easeInOut(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Glide to a view. With an anchor, that complex point stays under the
    // same pixel the whole way (used for zooming at the cursor).
    function animate(to, duration, anchor, done) {
      cancelAnimationFrame(animRaf);
      to.w = SN.clamp(to.w, MIN_W, MAX_W);
      const from = { cx: view.cx, cy: view.cy, w: view.width };
      const dur = SN.reducedMotion() ? 0 : duration;
      const t0 = performance.now();
      const step = function (now) {
        const t = dur > 0 ? Math.min(1, (now - t0) / dur) : 1;
        const e = easeInOut(t);
        const w = Math.exp(SN.lerp(Math.log(from.w), Math.log(to.w), e));
        view.width = w;
        if (anchor) {
          const f = w / from.w;
          view.cx = anchor[0] + (from.cx - anchor[0]) * f;
          view.cy = anchor[1] + (from.cy - anchor[1]) * f;
        } else {
          const k = (1 - e) * Math.min(w, from.w) / Math.max(w, from.w);
          view.cx = to.cx + (from.cx - to.cx) * k;
          view.cy = to.cy + (from.cy - to.cy) * k;
        }
        paint();
        if (t < 1) {
          animRaf = requestAnimationFrame(step);
        } else {
          animRaf = 0;
          if (done) done();
        }
      };
      animRaf = requestAnimationFrame(step);
    }

    function flyTo(cx, cy, w) {
      const far = Math.hypot(cx - view.cx, cy - view.cy) > 2.5 * Math.max(view.width, w);
      if (far && Math.max(view.width, w) < 1) {
        // Pull back to the whole set first, then dive to the new place.
        animate({ cx: HOME.cx, cy: HOME.cy, w: HOME.w }, 700, null, function () {
          animate({ cx: cx, cy: cy, w: w }, 1100);
        });
      } else {
        animate({ cx: cx, cy: cy, w: w }, 650);
      }
    }

    function zoomAtPoint(x, y, factor) {
      const c = view.toComplex(x, y);
      animate({ cx: c[0], cy: c[1], w: view.width / factor }, 520);
    }

    /* Pointer: click or tap to zoom, drag (mouse) to pan, hover for orbits. */
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false, mouse: e.pointerType === 'mouse' };
      if (drag.mouse) stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', function (e) {
      if (drag && drag.id === e.pointerId) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 5) drag.moved = true;
        if (drag.moved && drag.mouse) {
          cancelAnimationFrame(animRaf);
          const s = view.width / view.size.w;
          view.cx = drag.cx - dx * s;
          view.cy = drag.cy + dy * s;
          hover = null;
          stage.classList.add('is-dragging');
          requestPaint();
        }
        return;
      }
      if (e.pointerType === 'mouse') {
        hover = SN.pointer(e, stage);
        requestPaint();
      }
    });

    stage.addEventListener('pointerup', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      const wasClick = !drag.moved;
      drag = null;
      stage.classList.remove('is-dragging');
      if (wasClick) {
        const p = SN.pointer(e, stage);
        zoomAtPoint(p.x, p.y, e.shiftKey ? 1 / 2.5 : 2.5);
      }
    });

    stage.addEventListener('pointercancel', function () {
      drag = null;
      stage.classList.remove('is-dragging');
    });

    stage.addEventListener('pointerleave', function () {
      if (drag) return;
      hover = null;
      requestPaint();
    });

    stage.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      animate({ cx: view.cx, cy: view.cy, w: view.width * 2.5 }, 520);
    });

    // Trackpad pinch arrives as ctrl + wheel; plain wheel still scrolls the page.
    stage.addEventListener('wheel', function (e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      cancelAnimationFrame(animRaf);
      const p = SN.pointer(e, stage);
      const anchor = view.toComplex(p.x, p.y);
      const w = SN.clamp(view.width * Math.exp(e.deltaY * 0.01), MIN_W, MAX_W);
      const f = w / view.width;
      view.width = w;
      view.cx = anchor[0] + (view.cx - anchor[0]) * f;
      view.cy = anchor[1] + (view.cy - anchor[1]) * f;
      requestPaint();
    }, { passive: false });

    stage.addEventListener('keydown', function (e) {
      const step = view.width * 0.15;
      let handled = true;
      switch (e.key) {
        case 'ArrowLeft': animate({ cx: view.cx - step, cy: view.cy, w: view.width }, 200); break;
        case 'ArrowRight': animate({ cx: view.cx + step, cy: view.cy, w: view.width }, 200); break;
        case 'ArrowUp': animate({ cx: view.cx, cy: view.cy + step, w: view.width }, 200); break;
        case 'ArrowDown': animate({ cx: view.cx, cy: view.cy - step, w: view.width }, 200); break;
        case '+': case '=': animate({ cx: view.cx, cy: view.cy, w: view.width / 2 }, 400); break;
        case '-': case '_': animate({ cx: view.cx, cy: view.cy, w: view.width * 2 }, 400); break;
        case '0': flyTo(HOME.cx, HOME.cy, HOME.w); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    document.getElementById('mandel-in').addEventListener('click', function () {
      animate({ cx: view.cx, cy: view.cy, w: view.width / 2.5 }, 520);
    });
    document.getElementById('mandel-out').addEventListener('click', function () {
      animate({ cx: view.cx, cy: view.cy, w: view.width * 2.5 }, 520);
    });
    document.querySelectorAll('[data-mandel-go]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        flyTo(parseFloat(btn.dataset.cx), parseFloat(btn.dataset.cy), parseFloat(btn.dataset.w));
      });
    });

    SN.onResize(stage, function () {
      view.resize();
      paint();
    });

    paint();
  };
})();
