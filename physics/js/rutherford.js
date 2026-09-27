/* Exp. 7: Rutherford's gold foil. Alpha particles fly past gold nuclei under
   Coulomb repulsion. In the plum-pudding model the charge is spread out, so
   nothing can turn a particle around. */
(function () {
  'use strict';

  const PH = window.PH;

  const V = 260;            // alpha speed, px/s
  const CLOSEST = 0.8;      // head-on distance of closest approach, px
  const KC = (CLOSEST * V * V) / 2;
  const RATE = 22;          // alphas fired per second
  const COLORS = { through: PH.color.markBlue, deflected: PH.color.markAmber, back: PH.color.markMagenta };

  function category(vx, vy) {
    const deg = (Math.atan2(Math.abs(vy), vx) * 180) / Math.PI;
    return deg < 10 ? 'through' : deg < 90 ? 'deflected' : 'back';
  }

  PH.initRutherford = function () {
    const stage = document.getElementById('ruth-stage');
    if (!stage) return;
    const canvas = document.getElementById('ruth-canvas');
    const ctx = canvas.getContext('2d');
    const out = {
      total: document.getElementById('ruth-total'),
      through: document.getElementById('ruth-through'),
      deflected: document.getElementById('ruth-deflect'),
      back: document.getElementById('ruth-back')
    };
    const msg = document.getElementById('ruth-msg');
    const playBtn = document.getElementById('ruth-play');
    const modelBtns = Array.from(document.querySelectorAll('[data-ruth-model]'));

    let model = 'rutherford';
    let geo = null, nuclei = [];
    let alphas = [], hits = [], spawn = 0;
    let counts = { total: 0, through: 0, deflected: 0, back: 0 };

    function layout() {
      const s = PH.fitCanvas(canvas);
      const cx = s.w * 0.5, cy = s.h * 0.5;
      const rd = Math.min(s.w, s.h) * 0.46;
      const gap = Math.max(26, s.h / 13);
      geo = { w: s.w, h: s.h, cx: cx, cy: cy, rd: rd, gap: gap, atomR: gap * 0.48 };
      nuclei = [];
      for (let y = cy - rd * 0.8; y <= cy + rd * 0.8; y += gap) nuclei.push([cx, y]);
      alphas = [];
    }

    function resetCounts() {
      counts = { total: 0, through: 0, deflected: 0, back: 0 };
      hits = [];
      readout();
    }

    function readout() {
      PH.text(out.total, PH.formatInt(counts.total));
      PH.text(out.through, PH.formatInt(counts.through));
      PH.text(out.deflected, PH.formatInt(counts.deflected));
      PH.text(out.back, PH.formatInt(counts.back));
      let text;
      if (model === 'thomson') {
        text = 'Plum pudding: the positive charge is spread thinly through each atom, so it can only nudge the particles. None bounce back.';
      } else if (counts.back === 0) {
        text = 'Tiny nucleus: most particles pass straight through the empty space in each atom.';
      } else {
        text = 'Tiny nucleus: most pass straight through, but a few come close to a nucleus and are flung back. ' +
          counts.back + ' of ' + PH.formatInt(counts.total) + ' so far.';
      }
      PH.text(msg, text);
    }

    function accel(x, y, out2) {
      let ax = 0, ay = 0, nearest = Infinity;
      for (let i = 0; i < nuclei.length; i++) {
        const dx = x - nuclei[i][0], dy = y - nuclei[i][1];
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);
        if (r < nearest) nearest = r;
        let f;
        if (model === 'thomson') {
          // Spread-out charge: a weak push, and only while inside the atom.
          const R = geo.atomR;
          f = r < R ? (KC * 0.9 * r) / (R * R * R) : 0;
        } else {
          f = KC / (r2 + 0.02);
        }
        if (r > 0) {
          ax += (f * dx) / r;
          ay += (f * dy) / r;
        }
      }
      out2[0] = ax;
      out2[1] = ay;
      return nearest;
    }

    const acc = [0, 0];
    function move(a, dt) {
      let left = dt;
      while (left > 0) {
        const near = accel(a.x, a.y, acc);
        const h = Math.min(left, (0.12 * Math.max(near, 0.25)) / V);
        a.vx += acc[0] * h * 0.5;
        a.vy += acc[1] * h * 0.5;
        a.x += a.vx * h;
        a.y += a.vy * h;
        accel(a.x, a.y, acc);
        a.vx += acc[0] * h * 0.5;
        a.vy += acc[1] * h * 0.5;
        left -= h;
      }
    }

    function step(dt) {
      spawn += dt * RATE;
      while (spawn >= 1) {
        spawn -= 1;
        const dy = (Math.random() * 2 - 1) * geo.rd * 0.72;
        const x = geo.cx - Math.sqrt(geo.rd * geo.rd - dy * dy) + 4;
        alphas.push({ x: x, y: geo.cy + dy, vx: V, vy: 0, trail: [] });
      }
      for (let i = alphas.length - 1; i >= 0; i--) {
        const a = alphas[i];
        move(a, dt);
        a.trail.push(a.x, a.y);
        if (a.trail.length > 60) a.trail.splice(0, 2);
        const dx = a.x - geo.cx, dy = a.y - geo.cy;
        if (dx * dx + dy * dy > geo.rd * geo.rd) {
          const c = category(a.vx, a.vy);
          counts.total++;
          counts[c]++;
          const ang = Math.atan2(dy, dx);
          hits.push({ x: geo.cx + Math.cos(ang) * geo.rd, y: geo.cy + Math.sin(ang) * geo.rd, c: c, age: 0 });
          alphas.splice(i, 1);
        }
      }
      for (let i = hits.length - 1; i >= 0; i--) {
        hits[i].age += dt;
        if (hits[i].age > 2.5) hits.splice(i, 1);
      }
      readout();
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const g = geo;

      // Detector ring, like the zinc sulfide screen Geiger and Marsden watched.
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.18)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, g.rd, 0, Math.PI * 2);
      ctx.stroke();

      // Source.
      ctx.fillStyle = 'rgba(235, 231, 223, 0.2)';
      ctx.fillRect(g.cx - g.rd - 4, g.cy - g.rd * 0.76, 10, g.rd * 1.52);

      // The foil's atoms.
      if (model === 'thomson') {
        nuclei.forEach(function (n) {
          ctx.fillStyle = 'rgba(215, 90, 192, 0.14)';
          ctx.beginPath();
          ctx.arc(n[0], n[1], g.atomR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(92, 194, 255, 0.8)';
          for (let k = 0; k < 5; k++) {
            const a = k * 1.3 + n[1] * 0.1;
            ctx.beginPath();
            ctx.arc(n[0] + Math.cos(a) * g.atomR * 0.55, n[1] + Math.sin(a) * g.atomR * 0.55, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      } else {
        ctx.strokeStyle = 'rgba(235, 231, 223, 0.07)';
        ctx.lineWidth = 1;
        nuclei.forEach(function (n) {
          ctx.beginPath();
          ctx.arc(n[0], n[1], g.atomR, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.fillStyle = '#f2c14e';
        nuclei.forEach(function (n) {
          ctx.beginPath();
          ctx.arc(n[0], n[1], 2.6, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Alpha particles with short trails, colored by how far they've turned.
      ctx.lineWidth = 1.5;
      alphas.forEach(function (a) {
        const c = COLORS[category(a.vx, a.vy)];
        ctx.strokeStyle = c;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        for (let i = 0; i < a.trail.length; i += 2) {
          if (i) ctx.lineTo(a.trail[i], a.trail[i + 1]);
          else ctx.moveTo(a.trail[i], a.trail[i + 1]);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff4e2';
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Flashes where particles hit the detector.
      ctx.globalCompositeOperation = 'lighter';
      hits.forEach(function (hh) {
        const k = hh.age / 2.5;
        ctx.globalAlpha = (1 - k) * (hh.c === 'through' ? 0.5 : 1);
        const size = hh.c === 'back' ? 34 : 22;
        ctx.drawImage(PH.glowSprite(COLORS[hh.c]), hh.x - size / 2, hh.y - size / 2, size, size);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('GOLD FOIL', g.cx, g.cy - g.rd * 0.84);
      ctx.textAlign = 'left';
      ctx.fillText('ALPHA SOURCE', 12, s.h - 10);
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });
    const sync = PH.bindPlay(playBtn, loop);

    modelBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        model = btn.dataset.ruthModel;
        PH.setPressed(modelBtns, btn);
        alphas = [];
        resetCounts();
        if (!loop.running) draw();
      });
    });
    document.getElementById('ruth-reset').addEventListener('click', function () {
      resetCounts();
      if (!loop.running) draw();
    });

    PH.onResize(stage, function () {
      layout();
      draw();
    });

    layout();
    for (let i = 0; i < 120; i++) step(1 / 60);
    resetCounts();
    for (let i = 0; i < 60; i++) step(1 / 60);
    draw();
    PH.autoplay(loop, sync);
  };
})();
