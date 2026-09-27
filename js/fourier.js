/* §2: any closed shape, rebuilt from spinning circles (a discrete Fourier transform). */
(function () {
  'use strict';

  const SN = window.SN;

  const SAMPLES = 256;   // points taken from the outline
  const CURVE = 1024;    // points in the rebuilt curve that trails the pen
  const PERIOD = 12;     // seconds for one full drawing

  const SHAPES = {
    heart: function () {
      const pts = [];
      for (let i = 0; i < 400; i++) {
        const t = (i / 400) * Math.PI * 2;
        pts.push([
          (16 * Math.pow(Math.sin(t), 3)) / 17,
          -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17
        ]);
      }
      return pts;
    },
    star: function () {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 0.42 : 1;
        pts.push([r * Math.cos(a), r * Math.sin(a)]);
      }
      return pts;
    },
    square: function () {
      return [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]];
    }
  };

  const LABELS = {
    heart: 'A heart',
    star: 'A star',
    square: 'A square'
  };

  // Resample a closed polyline to n points evenly spaced along its length.
  function resample(points, n) {
    const pts = points.slice();
    pts.push(points[0]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const total = cum[cum.length - 1];
    if (!(total > 0)) return null;
    const out = [];
    let j = 0;
    for (let i = 0; i < n; i++) {
      const d = (total * i) / n;
      while (j < cum.length - 2 && cum[j + 1] < d) j++;
      const seg = cum[j + 1] - cum[j];
      const t = seg > 0 ? (d - cum[j]) / seg : 0;
      out.push([
        pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
        pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t
      ]);
    }
    return out;
  }

  // Discrete Fourier transform of points treated as complex numbers x + iy.
  // Returns one circle per frequency, largest first (the constant term is skipped
  // because the points are already centered).
  function transform(pts) {
    const n = pts.length;
    const terms = [];
    for (let k = -n / 2; k < n / 2; k++) {
      if (k === 0) continue;
      let re = 0, im = 0;
      for (let j = 0; j < n; j++) {
        const a = (-2 * Math.PI * k * j) / n;
        const ca = Math.cos(a), sa = Math.sin(a);
        re += pts[j][0] * ca - pts[j][1] * sa;
        im += pts[j][0] * sa + pts[j][1] * ca;
      }
      re /= n;
      im /= n;
      terms.push({ k: k, amp: Math.hypot(re, im), phase: Math.atan2(im, re) });
    }
    terms.sort(function (a, b) { return b.amp - a.amp; });
    return terms;
  }

  SN.initFourier = function () {
    const stage = document.getElementById('fourier-stage');
    if (!stage) return;
    const canvas = document.getElementById('fourier-canvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('fourier-count');
    const countOut = document.getElementById('fourier-count-out');
    const note = document.getElementById('fourier-note');
    const drawBtn = document.getElementById('fourier-draw');
    const playBtn = document.getElementById('fourier-play');
    const shapeBtns = Array.from(document.querySelectorAll('[data-fourier-shape]'));

    let size = SN.fitCanvas(canvas);
    let ghost = [];
    let terms = [];
    let count = parseInt(slider.value, 10);
    let curve = new Float32Array(CURVE * 2);
    let t = 0;
    let mode = 'play';
    let stroke = null;
    let label = LABELS.heart;

    function scale() {
      return Math.min(size.w, size.h) * 0.34;
    }

    function setPath(points) {
      const pts = resample(points, SAMPLES);
      if (!pts) return false;
      let mx = 0, my = 0;
      pts.forEach(function (p) { mx += p[0]; my += p[1]; });
      mx /= pts.length;
      my /= pts.length;
      ghost = pts.map(function (p) { return [p[0] - mx, p[1] - my]; });
      terms = transform(ghost);
      buildCurve();
      t = 0;
      return true;
    }

    function buildCurve() {
      const n = Math.min(count, terms.length);
      for (let s = 0; s < CURVE; s++) {
        const tt = (s / CURVE) * Math.PI * 2;
        let x = 0, y = 0;
        for (let i = 0; i < n; i++) {
          const a = terms[i].k * tt + terms[i].phase;
          x += terms[i].amp * Math.cos(a);
          y += terms[i].amp * Math.sin(a);
        }
        curve[2 * s] = x;
        curve[2 * s + 1] = y;
      }
    }

    function describe() {
      note.textContent = label + ', rebuilt from ' + count + (count === 1 ? ' spinning circle.' : ' spinning circles.');
    }

    function drawPrompt() {
      ctx.fillStyle = SN.color.muted;
      ctx.font = '500 14px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!stroke) {
        ctx.fillText('Draw one loop here', size.w / 2, size.h / 2 - 12);
        ctx.fillStyle = 'rgba(154, 163, 176, 0.7)';
        ctx.font = '400 12px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText('lift your finger or mouse to finish', size.w / 2, size.h / 2 + 14);
        return;
      }
      ctx.strokeStyle = SN.color.yellow;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      stroke.forEach(function (p, i) {
        if (i) ctx.lineTo(p[0], p[1]);
        else ctx.moveTo(p[0], p[1]);
      });
      ctx.stroke();
    }

    function draw() {
      size = SN.fitCanvas(canvas);
      const w = size.w, h = size.h;
      const S = scale();
      const cx = w / 2, cy = h / 2;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.fillStyle = SN.color.plate;
      ctx.fillRect(0, 0, w, h);

      if (mode === 'draw') {
        drawPrompt();
        return;
      }

      // The original outline, faint.
      ctx.strokeStyle = 'rgba(232, 235, 239, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ghost.forEach(function (p, i) {
        if (i) ctx.lineTo(cx + p[0] * S, cy + p[1] * S);
        else ctx.moveTo(cx + p[0] * S, cy + p[1] * S);
      });
      ctx.closePath();
      ctx.stroke();

      // The rebuilt curve: one full turn behind the pen, fading with age.
      const moving = loop.running;
      const head = Math.floor(t * CURVE) % CURVE;
      const CHUNKS = 64, per = CURVE / CHUNKS;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let c = 0; c < CHUNKS; c++) {
        const alpha = moving ? Math.pow((c + 1) / CHUNKS, 1.4) : 1;
        ctx.strokeStyle = 'rgba(242, 185, 44, ' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        for (let j = 0; j <= per; j++) {
          const idx = (head + 1 + c * per + j) % CURVE;
          const x = cx + curve[2 * idx] * S;
          const y = cy + curve[2 * idx + 1] * S;
          if (j) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }

      // The circles, each riding on the one before.
      const n = Math.min(count, terms.length);
      const ang = t * Math.PI * 2;
      const circles = new Path2D();
      const arms = new Path2D();
      let x = cx, y = cy;
      for (let i = 0; i < n; i++) {
        const term = terms[i];
        const r = term.amp * S;
        const a = term.k * ang + term.phase;
        const nx = x + r * Math.cos(a);
        const ny = y + r * Math.sin(a);
        if (r > 0.6) {
          circles.moveTo(x + r, y);
          circles.arc(x, y, r, 0, Math.PI * 2);
        }
        arms.moveTo(x, y);
        arms.lineTo(nx, ny);
        x = nx;
        y = ny;
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(232, 235, 239, 0.17)';
      ctx.stroke(circles);
      ctx.strokeStyle = 'rgba(232, 235, 239, 0.7)';
      ctx.stroke(arms);

      // The pen.
      ctx.fillStyle = SN.color.yellow;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(242, 185, 44, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    const loop = new SN.Loop(stage, function (dt) {
      if (mode === 'play') t = (t + dt / PERIOD) % 1;
      draw();
    });

    const syncPlay = SN.bindPlayButton(playBtn, loop);

    function choose(name) {
      mode = 'play';
      stroke = null;
      stage.classList.remove('is-drawing');
      label = LABELS[name];
      setPath(SHAPES[name]());
      SN.setPressed(shapeBtns, shapeBtns.find(function (b) { return b.dataset.fourierShape === name; }));
      describe();
      draw();
    }

    shapeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { choose(btn.dataset.fourierShape); });
    });

    slider.addEventListener('input', function () {
      count = parseInt(slider.value, 10);
      countOut.textContent = String(count);
      buildCurve();
      if (mode === 'play') describe();
      if (!loop.running) draw();
    });

    drawBtn.addEventListener('click', function () {
      mode = 'draw';
      stroke = null;
      stage.classList.add('is-drawing');
      SN.setPressed(shapeBtns, null);
      note.textContent = 'Draw one closed loop on the plate. It will close itself when you let go.';
      draw();
    });

    stage.addEventListener('pointerdown', function (e) {
      if (mode !== 'draw') return;
      e.preventDefault();
      stage.setPointerCapture(e.pointerId);
      const p = SN.pointer(e, stage);
      stroke = [[p.x, p.y]];
      draw();
    });

    stage.addEventListener('pointermove', function (e) {
      if (mode !== 'draw' || !stroke) return;
      const p = SN.pointer(e, stage);
      const last = stroke[stroke.length - 1];
      if (Math.hypot(p.x - last[0], p.y - last[1]) > 2) {
        stroke.push([p.x, p.y]);
        draw();
      }
    });

    function finish() {
      if (mode !== 'draw' || !stroke) return;
      let length = 0;
      for (let i = 1; i < stroke.length; i++) {
        length += Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]);
      }
      if (stroke.length < 8 || length < 60) {
        note.textContent = 'That line was too short. Try a bigger loop.';
        stroke = null;
        draw();
        return;
      }
      const S = scale();
      const pts = stroke.map(function (p) { return [(p[0] - size.w / 2) / S, (p[1] - size.h / 2) / S]; });
      mode = 'play';
      stroke = null;
      stage.classList.remove('is-drawing');
      label = 'Your drawing';
      setPath(pts);
      describe();
      if (!SN.reducedMotion()) {
        loop.play();
        syncPlay();
      }
      draw();
    }

    stage.addEventListener('pointerup', finish);
    stage.addEventListener('pointercancel', finish);

    SN.onResize(stage, draw);

    choose('heart');
    if (!SN.reducedMotion()) {
      loop.play();
      syncPlay();
    }
  };
})();
