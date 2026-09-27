/* §4: Vogel's sunflower. Seed n sits at angle n·θ and radius c·√n; the program
   finds which seeds touch and traces the spiral families they form. */
(function () {
  'use strict';

  const SN = window.SN;

  const GOLDEN = 360 * (2 - (1 + Math.sqrt(5)) / 2); // 137.5077…°
  const DEG = Math.PI / 180;
  // Seeds shade from pale at the center to deep gold at the rim.
  const SEED_COLORS = ['#f4ead2', '#f3dca0', '#f2cb6c', '#f2b92c', '#e7a51f', '#d98f1a'];

  // Wrap an angle in degrees to (-180, 180].
  function wrap(d) {
    d = ((d % 360) + 360) % 360;
    return d > 180 ? d - 360 : d;
  }

  SN.initPhyllotaxis = function () {
    const stage = document.getElementById('phyllo-stage');
    if (!stage) return;
    const canvas = document.getElementById('phyllo-canvas');
    const ctx = canvas.getContext('2d');
    const angleIn = document.getElementById('phyllo-angle');
    const angleOut = document.getElementById('phyllo-angle-out');
    const countIn = document.getElementById('phyllo-count');
    const countOut = document.getElementById('phyllo-count-out');
    const spiralsIn = document.getElementById('phyllo-spirals');
    const sweepBtn = document.getElementById('phyllo-sweep');
    const turnOut = document.getElementById('phyllo-turn');
    const seedsOut = document.getElementById('phyllo-seeds');
    const famOut = document.getElementById('phyllo-families');

    let angle = GOLDEN;
    let count = parseInt(countIn.value, 10);
    let sweepT = 0;

    // Which offsets F connect a seed n to a touching neighbor n + F?
    // Keep the three strongest, dropping multiples of ones already kept.
    function families(xs, ys, c) {
      const thr2 = Math.pow(2.25 * c, 2);
      const found = [];
      for (let F = 1; F <= 160 && F < count / 3; F++) {
        let close = 0;
        for (let n = 0; n + F < count; n++) {
          const dx = xs[n + F] - xs[n], dy = ys[n + F] - ys[n];
          if (dx * dx + dy * dy < thr2) close++;
        }
        const coverage = close / (count - F);
        if (coverage >= 0.16) found.push({ F: F, coverage: coverage });
      }
      const kept = [];
      found.forEach(function (f) {
        if (!kept.some(function (k) { return f.F % k.F === 0; })) kept.push(f);
      });
      kept.sort(function (a, b) { return b.coverage - a.coverage; });
      return kept.slice(0, 3).sort(function (a, b) { return a.F - b.F; });
    }

    function draw() {
      const size = SN.fitCanvas(canvas);
      const w = size.w, h = size.h;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.fillStyle = SN.color.plate;
      ctx.fillRect(0, 0, w, h);

      const R = Math.min(w, h) / 2 - 12;
      const c = R / Math.sqrt(count);
      const cx = w / 2, cy = h / 2;
      const xs = new Float32Array(count), ys = new Float32Array(count);
      for (let n = 0; n < count; n++) {
        const r = c * Math.sqrt(n + 0.5);
        const th = n * angle * DEG;
        xs[n] = cx + r * Math.cos(th);
        ys[n] = cy + r * Math.sin(th);
      }

      // Seeds, in bands from the center out.
      const rad = Math.max(0.8, c * 0.44);
      const bands = SEED_COLORS.length;
      for (let b = 0; b < bands; b++) {
        ctx.fillStyle = SEED_COLORS[b];
        ctx.beginPath();
        const from = Math.floor((b / bands) * count), to = Math.floor(((b + 1) / bands) * count);
        for (let n = from; n < to; n++) {
          ctx.moveTo(xs[n] + rad, ys[n]);
          ctx.arc(xs[n], ys[n], rad, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      const fams = families(xs, ys, c);
      if (spiralsIn.checked) {
        const thr2 = Math.pow(2.25 * c, 2);
        ctx.lineWidth = Math.max(0.9, c * 0.2);
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.9;
        fams.forEach(function (f) {
          const turn = wrap(f.F * angle);
          ctx.strokeStyle = Math.abs(turn) < 0.3 ? SN.color.ink : turn > 0 ? SN.color.red : SN.color.blue;
          ctx.beginPath();
          for (let n = 0; n + f.F < count; n++) {
            const dx = xs[n + f.F] - xs[n], dy = ys[n + f.F] - ys[n];
            if (dx * dx + dy * dy < thr2) {
              ctx.moveTo(xs[n], ys[n]);
              ctx.lineTo(xs[n + f.F], ys[n + f.F]);
            }
          }
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }

      angleOut.textContent = angle.toFixed(3) + '°';
      turnOut.textContent = (angle / 360).toFixed(6);
      seedsOut.textContent = SN.formatInt(count);
      famOut.textContent = fams.length
        ? fams.map(function (f) {
          const turn = wrap(f.F * angle);
          return f.F + (Math.abs(turn) < 0.3 ? ' spokes' : turn > 0 ? ' ↻' : ' ↺');
        }).join(' · ')
        : 'none clear';
    }

    const loop = new SN.Loop(stage, function (dt) {
      sweepT += dt;
      angle = GOLDEN + 3 * Math.sin(sweepT * 0.25);
      angleIn.value = angle.toFixed(3);
      draw();
    });

    function stopSweep() {
      if (!loop.running) return;
      loop.pause();
      sweepBtn.setAttribute('aria-pressed', 'false');
      sweepBtn.textContent = 'Sweep';
    }

    sweepBtn.addEventListener('click', function () {
      if (loop.running) {
        stopSweep();
      } else {
        // Start the sweep from the current angle so it doesn't jump.
        sweepT = Math.asin(SN.clamp((angle - GOLDEN) / 3, -1, 1)) / 0.25;
        loop.play();
        sweepBtn.setAttribute('aria-pressed', 'true');
        sweepBtn.textContent = 'Stop sweep';
      }
    });

    angleIn.addEventListener('input', function () {
      stopSweep();
      angle = parseFloat(angleIn.value);
      draw();
    });

    countIn.addEventListener('input', function () {
      count = parseInt(countIn.value, 10);
      countOut.textContent = SN.formatInt(count);
      if (!loop.running) draw();
    });

    spiralsIn.addEventListener('change', function () {
      if (!loop.running) draw();
    });

    document.querySelectorAll('[data-phyllo-angle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopSweep();
        const v = btn.dataset.phylloAngle;
        angle = v === 'golden' ? GOLDEN : parseFloat(v);
        angleIn.value = angle.toFixed(3);
        draw();
      });
    });

    SN.onResize(stage, draw);
    draw();
  };
})();
