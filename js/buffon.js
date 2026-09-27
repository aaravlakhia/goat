/* §6: Buffon's needles. Needles as long as the planks are wide cross a crack
   with probability 2/π, so 2N/C estimates π. */
(function () {
  'use strict';

  const SN = window.SN;

  const STRIPS = 6;          // planks on the plate
  const MAX_STORED = 15000;  // needles kept for redrawing after a resize
  const MAX_DROPS = 1000000;
  const PI_TEXT = Math.PI.toFixed(5);
  const Y_MIN = 2.4, Y_MAX = 4.0;

  SN.initBuffon = function () {
    const stage = document.getElementById('buffon-stage');
    if (!stage) return;
    const canvas = document.getElementById('buffon-canvas');
    const ctx = canvas.getContext('2d');
    const chartBox = document.getElementById('buffon-chart-box');
    const chart = document.getElementById('buffon-chart');
    const cctx = chart.getContext('2d');
    const estOut = document.getElementById('buffon-estimate');
    const statsOut = document.getElementById('buffon-stats');
    const rainBtn = document.getElementById('buffon-rain');

    let size = SN.fitCanvas(canvas);
    let drops = 0, hits = 0;
    let stored = [];       // [x as fraction of width, y in plank widths, angle, crosses]
    let history = [];      // [drops, estimate] at roughly log-spaced checkpoints
    let nextMark = 1;
    let hoverX = null;

    function estimate() {
      return hits > 0 ? (2 * drops) / hits : NaN;
    }

    function drawFloor() {
      size = SN.fitCanvas(canvas);
      const w = size.w, h = size.h, d = h / STRIPS;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = SN.color.plate;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(232, 235, 239, 0.03)';
      for (let k = 1; k < STRIPS; k += 2) ctx.fillRect(0, k * d, w, d);
      ctx.strokeStyle = 'rgba(232, 235, 239, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k <= STRIPS; k++) {
        const y = SN.clamp(Math.round(k * d) + 0.5, 0.5, h - 0.5);
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }

    // Draw a batch of needles, grouped by color. n is the drop count, which
    // sets how bold each needle is: early needles stand out, later ones blend.
    function drawNeedles(list, n) {
      const d = size.h / STRIPS;
      ctx.globalAlpha = n < 300 ? 0.95 : n < 3000 ? 0.6 : 0.3;
      ctx.lineWidth = n < 300 ? 2 : 1.2;
      ctx.lineCap = 'round';
      [true, false].forEach(function (crossing) {
        ctx.strokeStyle = crossing ? SN.color.red : SN.color.blue;
        ctx.beginPath();
        list.forEach(function (nd) {
          if (nd[3] !== crossing) return;
          const x = nd[0] * size.w, y = nd[1] * d;
          const hx = 0.5 * d * Math.cos(nd[2]), hy = 0.5 * d * Math.sin(nd[2]);
          ctx.moveTo(x - hx, y - hy);
          ctx.lineTo(x + hx, y + hy);
        });
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    function drop(k) {
      const batch = [];
      for (let i = 0; i < k && drops < MAX_DROPS; i++) {
        const nx = Math.random();
        const ny = Math.random() * STRIPS;
        const th = Math.random() * Math.PI;
        const half = 0.5 * Math.sin(th);
        const crosses = Math.floor(ny - half) !== Math.floor(ny + half);
        const nd = [nx, ny, th, crosses];
        batch.push(nd);
        if (stored.length < MAX_STORED) stored.push(nd);
        drops++;
        if (crosses) hits++;
        if (drops >= nextMark) {
          history.push([drops, estimate()]);
          nextMark = Math.max(nextMark + 1, Math.ceil(nextMark * 1.03));
        }
      }
      drawNeedles(batch, drops);
      update();
    }

    function drawChart() {
      const s = SN.fitCanvas(chart);
      const w = s.w, h = s.h;
      const M = { l: 44, r: 30, t: 30, b: 24 };
      const pw = w - M.l - M.r, ph = h - M.t - M.b;
      const xMax = Math.max(3, Math.ceil(Math.log10(Math.max(drops, 1))));
      const X = function (n) { return M.l + (Math.log10(n) / xMax) * pw; };
      const Y = function (v) { return M.t + ((Y_MAX - SN.clamp(v, Y_MIN, Y_MAX)) / (Y_MAX - Y_MIN)) * ph; };

      cctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      cctx.fillStyle = SN.color.plate;
      cctx.fillRect(0, 0, w, h);
      cctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
      cctx.lineWidth = 1;

      cctx.strokeStyle = SN.color.grid;
      cctx.fillStyle = SN.color.muted;
      cctx.textAlign = 'right';
      cctx.textBaseline = 'middle';
      [2.5, 3.0, 3.5].forEach(function (v) {
        const y = Math.round(Y(v)) + 0.5;
        cctx.beginPath();
        cctx.moveTo(M.l, y);
        cctx.lineTo(M.l + pw, y);
        cctx.stroke();
        cctx.fillText(v.toFixed(1), M.l - 8, y);
      });
      cctx.textAlign = 'center';
      cctx.textBaseline = 'top';
      const names = ['1', '10', '100', '1k', '10k', '100k', '1M'];
      for (let e = 0; e <= xMax; e++) cctx.fillText(names[e] || '10' + SN.sup(e), X(Math.pow(10, e)), M.t + ph + 7);

      // The target: π.
      const py = Math.round(Y(Math.PI)) + 0.5;
      cctx.strokeStyle = SN.color.yellow;
      cctx.beginPath();
      cctx.moveTo(M.l, py);
      cctx.lineTo(M.l + pw, py);
      cctx.stroke();
      cctx.fillStyle = SN.color.yellow;
      cctx.textAlign = 'left';
      cctx.textBaseline = 'middle';
      cctx.font = '500 12px "STIX Two Text", Georgia, serif';
      cctx.fillText('π', M.l + pw + 8, py);

      const pts = history.filter(function (p) { return isFinite(p[1]); });
      if (pts.length > 1) {
        cctx.strokeStyle = SN.color.ink;
        cctx.lineWidth = 2;
        cctx.lineJoin = 'round';
        cctx.beginPath();
        pts.forEach(function (p, i) {
          if (i) cctx.lineTo(X(p[0]), Y(p[1]));
          else cctx.moveTo(X(p[0]), Y(p[1]));
        });
        cctx.stroke();
      }
      if (pts.length) {
        const last = pts[pts.length - 1];
        cctx.fillStyle = SN.color.ink;
        cctx.beginPath();
        cctx.arc(X(last[0]), Y(last[1]), 3.5, 0, Math.PI * 2);
        cctx.fill();
      }

      if (hoverX !== null && pts.length) {
        const target = Math.pow(10, SN.clamp((hoverX - M.l) / pw, 0, 1) * xMax);
        let best = pts[0];
        for (let i = 1; i < pts.length; i++) {
          if (Math.abs(Math.log(pts[i][0] / target)) < Math.abs(Math.log(best[0] / target))) best = pts[i];
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
        const text = SN.formatInt(best[0]) + (best[0] === 1 ? ' needle: ' : ' needles: ') + best[1].toFixed(4);
        cctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
        const tw = cctx.measureText(text).width;
        const left = x + 12 + tw > w - 4;
        const tx = left ? x - 12 : x + 12;
        const ty = SN.clamp(y, M.t + 8, M.t + ph - 8);
        cctx.fillStyle = 'rgba(11, 13, 18, 0.85)';
        cctx.fillRect(left ? tx - tw - 6 : tx - 6, ty - 10, tw + 12, 20);
        cctx.fillStyle = SN.color.ink;
        cctx.textAlign = left ? 'right' : 'left';
        cctx.textBaseline = 'middle';
        cctx.fillText(text, tx, ty);
      }
    }

    function update() {
      const est = estimate();
      if (!isFinite(est)) {
        estOut.innerHTML = 'π ≈ <span>–</span>';
        statsOut.textContent = drops
          ? SN.formatInt(drops) + (drops === 1 ? ' needle' : ' needles') + ', none crossing yet. Keep dropping.'
          : 'No needles dropped yet.';
      } else {
        const txt = est.toFixed(5);
        let same = 0;
        while (same < txt.length && txt[same] === PI_TEXT[same]) same++;
        // Only count whole correct digits: "3." alone is not a match.
        if (same === 2) same = 1;
        estOut.innerHTML = 'π ≈ <span class="match">' + txt.slice(0, same) + '</span>' + txt.slice(same);
        const err = (Math.abs(est - Math.PI) / Math.PI) * 100;
        statsOut.textContent = SN.formatInt(drops) + ' needles · ' + SN.formatInt(hits) + ' crossed · off by ' +
          (err < 0.01 ? err.toFixed(4) : err.toFixed(2)) + '%';
      }
      drawChart();
    }

    function reset() {
      drops = 0;
      hits = 0;
      stored = [];
      history = [];
      nextMark = 1;
      drawFloor();
      update();
    }

    const loop = new SN.Loop(stage, function () {
      const k = drops < 200 ? 1 : drops < 2000 ? 12 : drops < 20000 ? 80 : 300;
      drop(k);
      if (drops >= MAX_DROPS) stopRain();
    });

    function stopRain() {
      loop.pause();
      rainBtn.setAttribute('aria-pressed', 'false');
      rainBtn.textContent = 'Rain';
    }

    rainBtn.addEventListener('click', function () {
      if (loop.running) {
        stopRain();
      } else {
        loop.play();
        rainBtn.setAttribute('aria-pressed', 'true');
        rainBtn.textContent = 'Stop rain';
      }
    });

    document.querySelectorAll('[data-buffon-drop]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        drop(parseInt(btn.dataset.buffonDrop, 10));
      });
    });

    document.getElementById('buffon-reset').addEventListener('click', function () {
      stopRain();
      reset();
    });

    chartBox.addEventListener('pointermove', function (e) {
      hoverX = SN.pointer(e, chartBox).x;
      drawChart();
    });
    chartBox.addEventListener('pointerleave', function () {
      hoverX = null;
      drawChart();
    });

    SN.onResize(stage, function () {
      drawFloor();
      drawNeedles(stored, drops);
      drawChart();
    });

    // Open with a few needles already on the floor, so the plate shows what it does.
    reset();
    drop(60);
  };
})();
