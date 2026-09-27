/* Exp. 2: Newton's cannon. A ball fired sideways from 150 km up, under real
   gravity, either falls back, orbits, or escapes. */
(function () {
  'use strict';

  const PH = window.PH;

  const RE = 6371;          // Earth's radius, km
  const GM = 398600.4;      // Earth's gravity, km^3/s^2
  const R0 = RE + 150;      // launch radius, km
  const WARP = 900;         // simulated seconds per real second
  const DT = 2;             // integration step, simulated seconds
  const DEMO = [4, 6.6, 7.82, 9.6];

  // Where a shot will end up, worked out from its energy before it flies.
  function predict(v) {
    const eps = (v * v) / 2 - GM / R0;
    if (eps >= 0) return { kind: 'escape' };
    const a = -GM / (2 * eps);
    const hmom = R0 * v;
    const e = Math.sqrt(Math.max(0, 1 + (2 * eps * hmom * hmom) / (GM * GM)));
    const period = 2 * Math.PI * Math.sqrt((a * a * a) / GM);
    if (a * (1 - e) < RE) return { kind: 'crash', period: period };
    return { kind: 'orbit', period: period };
  }

  function formatDuration(sec) {
    const m = Math.round(sec / 60);
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  }

  PH.initNewton = function () {
    const stage = document.getElementById('new-stage');
    if (!stage) return;
    const canvas = document.getElementById('new-canvas');
    const ctx = canvas.getContext('2d');
    const speedIn = document.getElementById('new-speed');
    const speedOut = document.getElementById('new-speed-out');
    const kmsOut = document.getElementById('new-kms');
    const kmhOut = document.getElementById('new-kmh');
    const timeOut = document.getElementById('new-time');
    const msg = document.getElementById('new-msg');

    let shots = [];
    let demo = PH.reducedMotion() ? DEMO.length : 0;
    let pause = 0;

    function speed() {
      return parseFloat(speedIn.value);
    }

    function showSpeed() {
      const v = speed();
      speedOut.textContent = v.toFixed(2) + ' km/s';
      kmsOut.textContent = v.toFixed(2) + ' km/s';
      kmhOut.textContent = PH.formatInt(v * 3600) + ' km/h';
    }

    function fire(v) {
      const p = predict(v);
      shots.push({ x: 0, y: R0, vx: v, vy: 0, t: 0, v0: v, p: p, status: 'flying', pts: [[0, R0]], lastRec: 0 });
      if (shots.length > 6) shots.shift();
      msg.textContent = p.kind === 'crash'
        ? 'Too slow to orbit: the ground will come up to meet it.'
        : p.kind === 'orbit'
          ? 'Fast enough that the Earth curves away as fast as it falls…'
          : 'Faster than escape speed: gravity can slow it, but never stop it.';
    }

    function current() {
      return shots[shots.length - 1];
    }

    function stepShot(s, simDt) {
      if (s.status === 'crashed' || s.status === 'escaped') return;
      const n = Math.ceil(simDt / DT), h = simDt / n;
      for (let i = 0; i < n; i++) {
        let r = Math.hypot(s.x, s.y);
        let k = -GM / (r * r * r);
        s.vx += 0.5 * h * k * s.x;
        s.vy += 0.5 * h * k * s.y;
        s.x += h * s.vx;
        s.y += h * s.vy;
        r = Math.hypot(s.x, s.y);
        k = -GM / (r * r * r);
        s.vx += 0.5 * h * k * s.x;
        s.vy += 0.5 * h * k * s.y;
        s.t += h;
        const recording = s.p.kind !== 'orbit' || s.t <= s.p.period * 1.02;
        if (recording && s.t - s.lastRec >= 15) {
          s.pts.push([s.x, s.y]);
          s.lastRec = s.t;
        }
        if (r < RE) {
          s.status = 'crashed';
          s.pts.push([s.x * RE / r, s.y * RE / r]);
          const angle = Math.acos(PH.clamp(s.y / r, -1, 1));
          const range = RE * (s.x < 0 ? 2 * Math.PI - angle : angle);
          if (s === current()) {
            msg.textContent = 'Landed ' + PH.formatInt(range) + ' km away, after ' + formatDuration(s.t) + '. It fell the whole time.';
          }
          return;
        }
        if (r > RE * 7) {
          s.status = 'escaped';
          if (s === current()) msg.textContent = 'Escaped! It will never come back. This is how probes leave Earth for other planets.';
          return;
        }
        if (s.p.kind === 'orbit' && s.status === 'flying' && s.t >= s.p.period) {
          s.status = 'orbiting';
          if (s === current()) {
            msg.textContent = 'In orbit! It circles the Earth every ' + formatDuration(s.p.period) + ', falling the whole time and always missing.';
          }
        }
      }
    }

    function step(dt) {
      const simDt = dt * WARP;
      shots.forEach(function (s) { stepShot(s, simDt); });
      const s = current();
      if (s) timeOut.textContent = formatDuration(s.t);
      // The opening demonstration: a few shots in a row.
      if (demo < DEMO.length) {
        const done = !s || s.status === 'crashed' || s.status === 'escaped' || s.status === 'orbiting';
        if (done) {
          pause += dt;
          if (pause > 0.8) {
            pause = 0;
            speedIn.value = String(DEMO[demo]);
            showSpeed();
            fire(DEMO[demo]);
            demo++;
          }
        }
      }
    }

    function draw() {
      const sz = PH.begin(canvas, ctx);
      const w = sz.w, h = sz.h;
      const px = Math.min(w, h) * 0.3 / RE;
      const cx = w / 2, cy = h * 0.56;
      const X = function (x) { return cx + x * px; };
      const Y = function (y) { return cy - y * px; };
      const er = RE * px;

      // Stars.
      ctx.fillStyle = 'rgba(235, 231, 223, 0.4)';
      for (let i = 0; i < 90; i++) ctx.fillRect((i * 131.7) % w, (i * 71.3) % h, 1, 1);

      // Earth, with a thin atmosphere.
      const glow = ctx.createRadialGradient(cx, cy, er * 0.98, cx, cy, er * 1.12);
      glow.addColorStop(0, 'rgba(92, 194, 255, 0.35)');
      glow.addColorStop(1, 'rgba(92, 194, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, er * 1.12, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(cx - er * 0.35, cy - er * 0.4, er * 0.1, cx, cy, er);
      body.addColorStop(0, '#1f4f73');
      body.addColorStop(1, '#0b1824');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, er, 0, Math.PI * 2);
      ctx.fill();

      // Newton's mountain and cannon at the top.
      const topY = Y(R0);
      ctx.fillStyle = '#2a3440';
      ctx.beginPath();
      ctx.moveTo(cx - 30, Y(RE) + 6);
      ctx.lineTo(cx, topY);
      ctx.lineTo(cx + 30, Y(RE) + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PH.color.ink;
      ctx.fillRect(cx - 4, topY - 5, 14, 5);

      // Earlier shots faint, the newest bright.
      shots.forEach(function (s, i) {
        const newest = i === shots.length - 1;
        ctx.strokeStyle = newest ? PH.color.amber : 'rgba(255, 180, 84, 0.28)';
        ctx.lineWidth = newest ? 2 : 1.2;
        ctx.beginPath();
        s.pts.forEach(function (p, j) {
          if (j) ctx.lineTo(X(p[0]), Y(p[1]));
          else ctx.moveTo(X(p[0]), Y(p[1]));
        });
        if (s.status === 'flying') ctx.lineTo(X(s.x), Y(s.y));
        ctx.stroke();
        if (s.status !== 'crashed' && s.status !== 'escaped') {
          const bx = X(s.x), by = Y(s.y);
          if (newest) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(PH.glowSprite('rgba(255, 180, 84, 0.9)'), bx - 14, by - 14, 28, 28);
            ctx.globalCompositeOperation = 'source-over';
          }
          ctx.fillStyle = newest ? '#fff3dd' : 'rgba(255, 180, 84, 0.5)';
          ctx.beginPath();
          ctx.arc(bx, by, newest ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.status === 'crashed' && newest) {
          const p = s.pts[s.pts.length - 1];
          ctx.fillStyle = PH.color.red;
          ctx.beginPath();
          ctx.arc(X(p[0]), Y(p[1]), 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('EARTH · 12,742 km across', 14, h - 22);
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });

    speedIn.addEventListener('input', showSpeed);
    document.getElementById('new-fire').addEventListener('click', function () {
      demo = DEMO.length;
      fire(speed());
      loop.play();
    });
    document.querySelectorAll('[data-new-v]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        demo = DEMO.length;
        speedIn.value = btn.dataset.newV;
        showSpeed();
        fire(speed());
        loop.play();
      });
    });

    PH.onResize(stage, draw);

    showSpeed();
    if (PH.reducedMotion()) {
      // A still picture of four finished shots.
      DEMO.forEach(function (v) {
        fire(v);
        for (let i = 0; i < 400; i++) stepShot(current(), 30);
      });
      msg.textContent = 'Four shots: two fall back, one orbits, one flies off on a long loop. Press Fire to launch your own.';
    } else {
      loop.play();
    }
    draw();
  };
})();
