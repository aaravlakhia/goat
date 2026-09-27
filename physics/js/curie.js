/* Exp. 5: Curie. 400 radioactive atoms decaying at random, and the halving
   curve that emerges from the randomness. */
(function () {
  'use strict';

  const PH = window.PH;

  const SIDE = 20, N = SIDE * SIDE;
  const SECONDS_PER_HALF = 2.4;   // real seconds for one half-life
  const T_MAX = 8;                // half-lives shown on the chart
  const ISOTOPES = {
    radium: { name: 'Radium-226', half: 1600, unit: 'years', becomes: 'Its decay chain ends in stable lead.' },
    carbon: { name: 'Carbon-14', half: 5730, unit: 'years', becomes: 'Each carbon-14 atom has become nitrogen-14.' },
    polonium: { name: 'Polonium-210', half: 138, unit: 'days', becomes: 'Each polonium atom has become stable lead.' },
    iodine: { name: 'Iodine-131', half: 8, unit: 'days', becomes: 'Each iodine atom has become xenon.' }
  };

  PH.initCurie = function () {
    const stage = document.getElementById('cur-stage');
    if (!stage) return;
    const canvas = document.getElementById('cur-canvas');
    const ctx = canvas.getContext('2d');
    const chart = document.getElementById('cur-chart');
    const cctx = chart.getContext('2d');
    const chartBox = document.getElementById('cur-chart-box');
    const leftOut = document.getElementById('cur-left');
    const halvesOut = document.getElementById('cur-halves');
    const timeOut = document.getElementById('cur-time');
    const msg = document.getElementById('cur-msg');
    const playBtn = document.getElementById('cur-play');
    const isoBtns = Array.from(document.querySelectorAll('[data-cur-iso]'));

    let iso = ISOTOPES.radium;
    const alive = new Uint8Array(N);
    const decayedAt = new Float32Array(N);
    let streaks = [];
    let t = 0, count = N, history = [], sinceSample = 0, done = 0, hoverX = null;

    function restart() {
      alive.fill(1);
      decayedAt.fill(-1);
      streaks = [];
      t = 0;
      count = N;
      history = [[0, N]];
      done = 0;
      readout();
    }

    function step(dt) {
      if (count === 0 || t >= T_MAX) {
        done += dt;
        if (done > 2.5) restart();
        return;
      }
      const dh = dt / SECONDS_PER_HALF;
      const p = 1 - Math.pow(2, -dh);
      t += dh;
      for (let i = 0; i < N; i++) {
        if (alive[i] && Math.random() < p) {
          alive[i] = 0;
          decayedAt[i] = t;
          count--;
          streaks.push({ i: i, a: Math.random() * Math.PI * 2, age: 0 });
        }
      }
      for (let k = streaks.length - 1; k >= 0; k--) {
        streaks[k].age += dt;
        if (streaks[k].age > 0.6) streaks.splice(k, 1);
      }
      sinceSample += dh;
      if (sinceSample >= 0.04) {
        sinceSample = 0;
        history.push([t, count]);
      }
      readout();
    }

    function readout() {
      PH.text(leftOut, count + ' of ' + N);
      PH.text(halvesOut, t.toFixed(1));
      PH.text(timeOut, PH.formatInt(t * iso.half) + ' ' + iso.unit);
      let text;
      if (count === 0 || t >= T_MAX) {
        text = count === 0
          ? 'All ' + N + ' atoms have decayed. ' + iso.becomes
          : 'After 8 half-lives only about 1 atom in 256 is left.';
      } else if (t < 0.15) {
        text = 'No one can say which atom goes next.';
      } else if (t < 1.1) {
        text = 'After one half-life (' + PH.formatInt(iso.half) + ' ' + iso.unit + ' for ' + iso.name + '), about half are gone.';
      } else if (t < 2.1) {
        text = 'After two half-lives, about a quarter are left. Half of the half.';
      } else {
        text = 'Each atom is random, but the group halves like clockwork. That steady clock is how radiocarbon dating works.';
      }
      PH.text(msg, text);
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const cell = Math.min((s.w - 24) / SIDE, (s.h - 24) / SIDE);
      const gx = (s.w - cell * SIDE) / 2 + cell / 2, gy = (s.h - cell * SIDE) / 2 + cell / 2;
      const r = cell * 0.22;

      // Decayed atoms: small and gray.
      ctx.fillStyle = 'rgba(162, 158, 149, 0.35)';
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        if (alive[i]) continue;
        const x = gx + (i % SIDE) * cell, y = gy + Math.floor(i / SIDE) * cell;
        ctx.moveTo(x + r * 0.6, y);
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
      }
      ctx.fill();

      // Living atoms glow faintly blue, as radium does.
      ctx.globalCompositeOperation = 'lighter';
      const sprite = PH.glowSprite('rgba(92, 194, 255, 0.55)');
      const gs = cell * 1.3;
      for (let i = 0; i < N; i++) {
        if (!alive[i]) continue;
        const x = gx + (i % SIDE) * cell, y = gy + Math.floor(i / SIDE) * cell;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(sprite, x - gs / 2, y - gs / 2, gs, gs);
      }
      ctx.globalAlpha = 1;

      // Just-decayed atoms fire off a particle.
      ctx.strokeStyle = PH.color.amber;
      ctx.lineWidth = 1.5;
      streaks.forEach(function (st) {
        const x = gx + (st.i % SIDE) * cell, y = gy + Math.floor(st.i / SIDE) * cell;
        const d0 = st.age * 90, d1 = d0 + 10;
        ctx.globalAlpha = 1 - st.age / 0.6;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(st.a) * d0, y + Math.sin(st.a) * d0);
        ctx.lineTo(x + Math.cos(st.a) * d1, y + Math.sin(st.a) * d1);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = '#e9f6ff';
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        if (!alive[i]) continue;
        const x = gx + (i % SIDE) * cell, y = gy + Math.floor(i / SIDE) * cell;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    function drawChart() {
      const ideal = [];
      for (let x = 0; x <= T_MAX + 0.001; x += 0.1) ideal.push([x, N * Math.pow(2, -x)]);
      PH.chart(chart, cctx, {
        x: [0, T_MAX],
        y: [0, N],
        yTicks: [{ v: 0, label: '0' }, { v: 100, label: '100' }, { v: 200, label: '200' }, { v: 400, label: '400' }],
        xTicks: [0, 2, 4, 6, 8].map(function (v) { return { v: v, label: v === 8 ? '8 half-lives' : String(v) }; }),
        series: [
          { points: history, color: PH.color.ink, width: 2 },
          { points: ideal, color: PH.color.markBlue, width: 1.5, alpha: 0.9 }
        ],
        hoverX: hoverX,
        hoverText: function (p) { return p[1] + ' left after ' + p[0].toFixed(1) + ' half-lives'; }
      });
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
      drawChart();
    });
    const sync = PH.bindPlay(playBtn, loop);

    document.getElementById('cur-restart').addEventListener('click', function () {
      restart();
      draw();
      drawChart();
    });
    isoBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        iso = ISOTOPES[btn.dataset.curIso];
        PH.setPressed(isoBtns, btn);
        restart();
        draw();
        drawChart();
      });
    });
    PH.hoverChart(chartBox, function (x) {
      hoverX = x;
      if (!loop.running) drawChart();
    });

    PH.onResize(stage, function () {
      draw();
      drawChart();
    });

    restart();
    if (PH.reducedMotion()) {
      // A still picture partway through the second half-life.
      for (let i = 0; i < 100; i++) step(1 / 30);
    }
    draw();
    drawChart();
    PH.autoplay(loop, sync);
  };
})();
