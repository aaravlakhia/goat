/* §3: the Lorenz attractor. Two paths start a tiny distance apart and the chart
   tracks how fast they separate. */
(function () {
  'use strict';

  const SN = window.SN;

  const SIGMA = 10, RHO = 28, BETA = 8 / 3;
  const H = 0.004;        // integration step, in model time units
  const SPEED = 2.2;      // model time units per second of real time
  const TRAIL = 3000;     // points kept per path
  const T_MAX = 40;       // chart width, in model time units
  const LOG_MIN = -10, LOG_MAX = 2;

  const k1 = new Float64Array(3), k2 = new Float64Array(3);
  const k3 = new Float64Array(3), k4 = new Float64Array(3);

  function deriv(x, y, z, out) {
    out[0] = SIGMA * (y - x);
    out[1] = x * (RHO - z) - y;
    out[2] = x * y - BETA * z;
  }

  // One fourth-order Runge–Kutta step, in place.
  function rk4(s) {
    const h2 = H / 2;
    deriv(s[0], s[1], s[2], k1);
    deriv(s[0] + h2 * k1[0], s[1] + h2 * k1[1], s[2] + h2 * k1[2], k2);
    deriv(s[0] + h2 * k2[0], s[1] + h2 * k2[1], s[2] + h2 * k2[2], k3);
    deriv(s[0] + H * k3[0], s[1] + H * k3[1], s[2] + H * k3[2], k4);
    for (let i = 0; i < 3; i++) s[i] += (H / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }

  // A point already on the attractor, and a long faint "track" of its shape.
  function warmStart() {
    const s = Float64Array.from([1, 1, 1]);
    for (let i = 0; i < 1500; i++) rk4(s);
    return s;
  }

  function traceGhost(from) {
    const s = Float64Array.from(from);
    const pts = new Float32Array(12000 * 3);
    for (let i = 0; i < 12000; i++) {
      for (let j = 0; j < 4; j++) rk4(s);
      pts[i * 3] = s[0];
      pts[i * 3 + 1] = s[1];
      pts[i * 3 + 2] = s[2];
    }
    return pts;
  }

  SN.initLorenz = function () {
    const stage = document.getElementById('lorenz-stage');
    if (!stage) return;
    const canvas = document.getElementById('lorenz-canvas');
    const ctx = canvas.getContext('2d');
    const chartBox = document.getElementById('lorenz-chart-box');
    const chart = document.getElementById('lorenz-chart');
    const cctx = chart.getContext('2d');
    const timeOut = document.getElementById('lorenz-time');
    const gapOut = document.getElementById('lorenz-gap');
    const stateOut = document.getElementById('lorenz-state');
    const playBtn = document.getElementById('lorenz-play');
    const gapBtns = Array.from(document.querySelectorAll('[data-lorenz-gap]'));

    const START = warmStart();
    const GHOST = traceGhost(START);
    let gapExp = 6;
    let paths = [];
    let time = 0;
    let steps = 0;
    let runs = [];
    let current = null;
    let yaw = 0.75, pitch = 0.3;
    let drag = null;
    let hoverX = null;

    function makePath(start, color, width) {
      return { s: Float64Array.from(start), trail: new Float32Array(TRAIL * 3), head: 0, len: 0, color: color, width: width };
    }

    function record(p) {
      const i = p.head * 3;
      p.trail[i] = p.s[0];
      p.trail[i + 1] = p.s[1];
      p.trail[i + 2] = p.s[2];
      p.head = (p.head + 1) % TRAIL;
      p.len = Math.min(TRAIL, p.len + 1);
    }

    function gap() {
      const a = paths[0].s, b = paths[1].s;
      return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    }

    function reset() {
      if (current && current.points.length > 2) {
        runs = runs.filter(function (r) { return r.exp !== current.exp; });
        runs.unshift(current);
        runs = runs.slice(0, 3);
      }
      const d = Math.pow(10, -gapExp);
      paths = [
        makePath([START[0], START[1], START[2]], SN.color.red, 2.6),
        makePath([START[0] + d, START[1], START[2]], SN.color.blue, 1.3)
      ];
      time = 0;
      steps = 0;
      current = { exp: gapExp, points: [[0, -gapExp]] };
      runs = runs.filter(function (r) { return r.exp !== gapExp; });
    }

    function simulate(duration) {
      const n = Math.max(1, Math.round(duration / H));
      for (let i = 0; i < n; i++) {
        rk4(paths[0].s);
        rk4(paths[1].s);
        time += H;
        steps++;
        if (steps % 2 === 0) {
          record(paths[0]);
          record(paths[1]);
        }
        if (steps % 12 === 0 && time <= T_MAX) {
          current.points.push([time, Math.log10(Math.max(gap(), 1e-12))]);
        }
      }
    }

    /* ---------- The attractor ---------- */

    const proj = [0, 0];
    function project(x, y, z, cyaw, syaw, cp, sp) {
      const xr = x * cyaw - y * syaw;
      const yr = x * syaw + y * cyaw;
      const zc = z - 24;
      proj[0] = xr;
      proj[1] = zc * cp - yr * sp;
    }

    function drawScene() {
      const size = SN.fitCanvas(canvas);
      const w = size.w, h = size.h;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.fillStyle = SN.color.plate;
      ctx.fillRect(0, 0, w, h);

      const sc = Math.min(w / 62, h / 56);
      const ox = w / 2, oy = h / 2;
      const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // The attractor's shape: both paths stay on this track forever.
      ctx.strokeStyle = 'rgba(232, 235, 239, 0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < GHOST.length; i += 3) {
        project(GHOST[i], GHOST[i + 1], GHOST[i + 2], cyaw, syaw, cp, sp);
        const X = ox + proj[0] * sc, Y = oy - proj[1] * sc;
        if (i) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      }
      ctx.stroke();

      paths.forEach(function (p) {
        const len = p.len;
        if (len < 2) return;
        const start = (p.head - len + TRAIL) % TRAIL;
        const CHUNKS = 30;
        const per = Math.ceil(len / CHUNKS);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        for (let c = 0; c < CHUNKS; c++) {
          const i0 = c * per;
          if (i0 >= len - 1) break;
          const i1 = Math.min(len - 1, i0 + per);
          ctx.globalAlpha = 0.06 + 0.94 * Math.pow((c + 1) / CHUNKS, 1.6);
          ctx.beginPath();
          for (let i = i0; i <= i1; i++) {
            const k = ((start + i) % TRAIL) * 3;
            project(p.trail[k], p.trail[k + 1], p.trail[k + 2], cyaw, syaw, cp, sp);
            const X = ox + proj[0] * sc, Y = oy - proj[1] * sc;
            if (i === i0) ctx.moveTo(X, Y);
            else ctx.lineTo(X, Y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // Glowing heads.
      paths.forEach(function (p) {
        project(p.s[0], p.s[1], p.s[2], cyaw, syaw, cp, sp);
        const X = ox + proj[0] * sc, Y = oy - proj[1] * sc;
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, 16);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(11, 13, 18, 0)');
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(X, Y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(X, Y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    /* ---------- The chart: gap over time, log scale ---------- */

    const M = { l: 48, r: 16, t: 30, b: 24 };

    function drawChart() {
      const size = SN.fitCanvas(chart);
      const w = size.w, h = size.h;
      cctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      cctx.fillStyle = SN.color.plate;
      cctx.fillRect(0, 0, w, h);
      const pw = w - M.l - M.r, ph = h - M.t - M.b;
      const X = function (t) { return M.l + (t / T_MAX) * pw; };
      const Y = function (v) { return M.t + ((LOG_MAX - SN.clamp(v, LOG_MIN, LOG_MAX)) / (LOG_MAX - LOG_MIN)) * ph; };

      cctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
      cctx.lineWidth = 1;
      cctx.strokeStyle = SN.color.grid;
      cctx.fillStyle = SN.color.muted;
      cctx.textAlign = 'right';
      cctx.textBaseline = 'middle';
      [-9, -6, -3, 0].forEach(function (v) {
        const y = Math.round(Y(v)) + 0.5;
        cctx.beginPath();
        cctx.moveTo(M.l, y);
        cctx.lineTo(M.l + pw, y);
        cctx.stroke();
        cctx.fillText(v === 0 ? '1' : '10' + SN.sup(v), M.l - 8, y);
      });
      cctx.textAlign = 'center';
      cctx.textBaseline = 'top';
      [0, 10, 20, 30, 40].forEach(function (t) {
        cctx.fillText(String(t), X(t), M.t + ph + 7);
      });

      function line(points, color, width) {
        cctx.strokeStyle = color;
        cctx.lineWidth = width;
        cctx.lineJoin = 'round';
        cctx.beginPath();
        points.forEach(function (p, i) {
          if (i) cctx.lineTo(X(p[0]), Y(p[1]));
          else cctx.moveTo(X(p[0]), Y(p[1]));
        });
        cctx.stroke();
      }

      function startLabel(run, color) {
        cctx.fillStyle = color;
        cctx.textAlign = 'left';
        cctx.textBaseline = 'bottom';
        cctx.fillText('10' + SN.sup(-run.exp), X(0) + 5, Y(-run.exp) - 4);
      }

      runs.forEach(function (r) {
        line(r.points, 'rgba(154, 163, 176, 0.55)', 1.5);
        startLabel(r, SN.color.muted);
      });
      line(current.points, SN.color.ink, 2);
      startLabel(current, SN.color.ink);

      // Hover crosshair on the current run.
      if (hoverX !== null && current.points.length > 1) {
        const t = SN.clamp(((hoverX - M.l) / pw) * T_MAX, 0, T_MAX);
        let best = current.points[0];
        for (let i = 1; i < current.points.length; i++) {
          if (Math.abs(current.points[i][0] - t) < Math.abs(best[0] - t)) best = current.points[i];
        }
        const x = X(best[0]), y = Y(best[1]);
        cctx.strokeStyle = 'rgba(232, 235, 239, 0.35)';
        cctx.lineWidth = 1;
        cctx.beginPath();
        cctx.moveTo(Math.round(x) + 0.5, M.t);
        cctx.lineTo(Math.round(x) + 0.5, M.t + ph);
        cctx.stroke();
        cctx.fillStyle = SN.color.plate;
        cctx.strokeStyle = SN.color.ink;
        cctx.lineWidth = 2;
        cctx.beginPath();
        cctx.arc(x, y, 4.5, 0, Math.PI * 2);
        cctx.fill();
        cctx.stroke();
        const text = 't = ' + best[0].toFixed(1) + '   gap ' + SN.formatSci(Math.pow(10, best[1]));
        cctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
        cctx.textBaseline = 'middle';
        const tw = cctx.measureText(text).width;
        const left = x + 12 + tw > w - 4;
        cctx.textAlign = left ? 'right' : 'left';
        const tx = left ? x - 12 : x + 12;
        const ty = SN.clamp(y, M.t + 8, M.t + ph - 8);
        cctx.fillStyle = 'rgba(11, 13, 18, 0.85)';
        cctx.fillRect(left ? tx - tw - 6 : tx - 6, ty - 10, tw + 12, 20);
        cctx.fillStyle = SN.color.ink;
        cctx.fillText(text, tx, ty);
      }
    }

    function readout() {
      const g = gap();
      timeOut.textContent = time.toFixed(1);
      gapOut.textContent = SN.formatSci(g);
      let msg;
      if (g < 1e-2) msg = 'The two paths are moving together.';
      else if (g < 2) msg = 'The paths are starting to drift apart.';
      else msg = 'The paths have split. They will never agree again.';
      if (stateOut.textContent !== msg) stateOut.textContent = msg;
    }

    function drawAll() {
      drawScene();
      drawChart();
      readout();
    }

    const loop = new SN.Loop(stage, function (dt) {
      if (!drag) yaw += dt * 0.14;
      simulate(dt * SPEED);
      drawAll();
    });

    function restart() {
      reset();
      if (SN.reducedMotion() && !loop.running) simulate(T_MAX);
      drawAll();
    }

    SN.bindPlayButton(playBtn, loop);

    document.getElementById('lorenz-restart').addEventListener('click', restart);
    gapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        gapExp = parseInt(btn.dataset.lorenzGap, 10);
        SN.setPressed(gapBtns, btn);
        restart();
      });
    });

    /* Drag to rotate. Touch rotates on horizontal swipes only, so vertical
       swipes still scroll the page. */
    stage.addEventListener('pointerdown', function (e) {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch, mouse: e.pointerType === 'mouse' };
      if (drag.mouse) stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      yaw = drag.yaw + (e.clientX - drag.x) * 0.01;
      if (drag.mouse) pitch = SN.clamp(drag.pitch + (e.clientY - drag.y) * 0.008, -1.3, 1.3);
      if (!loop.running) drawScene();
    });
    const endDrag = function () {
      drag = null;
      stage.classList.remove('is-dragging');
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('keydown', function (e) {
      const turns = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
      const d = turns[e.key];
      if (!d) return;
      e.preventDefault();
      yaw += d[0];
      pitch = SN.clamp(pitch + d[1], -1.3, 1.3);
      if (!loop.running) drawScene();
    });

    chartBox.addEventListener('pointermove', function (e) {
      hoverX = SN.pointer(e, chartBox).x;
      if (!loop.running) drawChart();
    });
    chartBox.addEventListener('pointerleave', function () {
      hoverX = null;
      if (!loop.running) drawChart();
    });

    SN.onResize(stage, drawAll);

    reset();
    if (SN.reducedMotion()) {
      simulate(T_MAX);
      drawAll();
    } else {
      drawAll();
      loop.play();
      playBtn.textContent = 'Pause';
    }
  };
})();
