/* Orders of Magnitude: human-sized and hand-sized. The Leaning Tower of
   Pisa, Faraday's coil and magnet, a speck of radium in a cloud chamber,
   and a human hair. */
(function () {
  'use strict';

  const OM = window.OM, U = OM.util;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;

  /* ---------- The Leaning Tower of Pisa: Galileo ---------- */

  const LEAN = 3.97 * DEG, RB = 7.7, RT = 5.6;
  const LEVELS = [0, 10.5, 17.4, 24.3, 31.2, 38.1, 45.0, 51.9];
  const TOP = 56.7, G = 9.81;
  const DROP_H = 51 * Math.cos(LEAN) - (RB + 0.6) * Math.sin(LEAN);
  const DROP_X = (RB + 0.6) * Math.cos(LEAN) + 51 * Math.sin(LEAN);
  const FALL = Math.sqrt(2 * DROP_H / G), CYCLE = 1.2 + FALL + 2.4;

  function marble(light) {
    const r = Math.round(U.lerp(168, 248, light)), g = Math.round(U.lerp(156, 243, light)), b = Math.round(U.lerp(136, 232, light));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawTower(ctx, s) {
    // Local coordinates: meters, x right, up is negative y.
    const body = function (y0, y1, R) {
      const gr = ctx.createLinearGradient(-R * s, 0, R * s, 0);
      gr.addColorStop(0, '#cbbfa9');
      gr.addColorStop(0.28, '#f7f2e8');
      gr.addColorStop(0.62, '#e6dccb');
      gr.addColorStop(1, '#9d8f78');
      ctx.fillStyle = gr;
      ctx.fillRect(-R * s, -y1 * s, 2 * R * s, (y1 - y0) * s);
    };
    const cornice = function (y, R) {
      ctx.fillStyle = '#fbf8f1';
      ctx.fillRect(-(R + 0.45) * s, -(y + 0.35) * s, 2 * (R + 0.45) * s, 0.5 * s);
      ctx.fillStyle = 'rgba(80,66,46,0.35)';
      ctx.fillRect(-(R + 0.3) * s, -(y - 0.15) * s, 2 * (R + 0.3) * s, 0.28 * s);
    };
    const columns = function (y0, y1, R, n, open) {
      if (open) {
        // The shadowed gallery behind the columns.
        const gr = ctx.createLinearGradient(-R * s, 0, R * s, 0);
        gr.addColorStop(0, '#8c8070');
        gr.addColorStop(0.35, '#a99b85');
        gr.addColorStop(1, '#6d6152');
        ctx.fillStyle = gr;
        ctx.fillRect(-(R - 0.9) * s, -(y1 - 1.1) * s, 2 * (R - 0.9) * s, (y1 - y0 - 1.5) * s);
      }
      const xs = [];
      for (let j = 0; j < n; j++) {
        const th = (j + 0.5) / n * TAU;
        const c = Math.cos(th);
        if (c <= 0.02) continue;
        const x = R * Math.sin(th);
        xs.push(x);
        const w = (open ? 0.62 : 0.45) * Math.sqrt(c) * s;
        ctx.fillStyle = marble(0.62 + 0.38 * (-Math.sin(th) * 0.5 + 0.5) * c);
        ctx.fillRect(x * s - w / 2, -(y1 - 0.4) * s, w, (y1 - y0 - 0.4) * s);
      }
      xs.sort(function (a, b) { return a - b; });
      ctx.strokeStyle = open ? 'rgba(250,246,238,0.95)' : 'rgba(150,138,118,0.55)';
      ctx.lineWidth = Math.max(0.6, 0.3 * s);
      for (let j = 0; j < xs.length - 1; j++) {
        const a = xs[j], b = xs[j + 1], mid = (a + b) / 2, rx = (b - a) / 2;
        ctx.beginPath();
        ctx.ellipse(mid * s, -(y1 - 1.1) * s, rx * s, Math.min(1.1, rx * 0.9) * s, 0, Math.PI, TAU);
        ctx.stroke();
      }
    };
    // Ground floor: blind arcades and a door.
    body(0, LEVELS[1], RB);
    columns(0.4, LEVELS[1] - 0.6, RB, 15, false);
    ctx.fillStyle = '#5b5044';
    ctx.beginPath();
    ctx.moveTo(-1.1 * s, 0);
    ctx.lineTo(-1.1 * s, -3.1 * s);
    ctx.arc(0, -3.1 * s, 1.1 * s, Math.PI, TAU);
    ctx.lineTo(1.1 * s, 0);
    ctx.fill();
    // Six open galleries.
    for (let i = 1; i < 7; i++) {
      body(LEVELS[i], LEVELS[i + 1], RB);
      columns(LEVELS[i] + 0.5, LEVELS[i + 1], RB, 30, true);
      cornice(LEVELS[i], RB);
    }
    cornice(LEVELS[7], RB);
    // The bell chamber.
    body(LEVELS[7], TOP - 0.6, RT);
    columns(LEVELS[7] + 0.5, TOP - 0.6, RT, 12, true);
    cornice(TOP - 0.6, RT);
    ctx.fillStyle = '#c9bca6';
    ctx.fillRect(-(RT - 0.6) * s, -(TOP + 0.3) * s, 2 * (RT - 0.6) * s, 0.6 * s);
  }

  function drawDuomo(ctx, ox, oy, s) {
    // The cathedral beside the tower, simplified and a little hazy.
    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalAlpha *= 0.82;
    const x0 = -190, x1 = -58, h = 26;
    const gr = ctx.createLinearGradient(0, -h * s, 0, 0);
    gr.addColorStop(0, '#f1ece2');
    gr.addColorStop(1, '#d9d1c2');
    ctx.fillStyle = gr;
    ctx.fillRect(x0 * s, -h * s, (x1 - x0) * s, h * s);
    // The grey-and-white bands of Pisan marble.
    ctx.fillStyle = 'rgba(120,120,128,0.18)';
    for (let y = 2; y < h; y += 2.4) ctx.fillRect(x0 * s, -y * s, (x1 - x0) * s, 0.7 * s);
    // Blind arcades.
    ctx.strokeStyle = 'rgba(140,130,115,0.6)';
    ctx.lineWidth = Math.max(0.5, 0.25 * s);
    for (let x = x0 + 4; x < x1 - 2; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x * s, -2 * s);
      ctx.lineTo(x * s, -13 * s);
      ctx.arc((x + 3) * s, -13 * s, 3 * s, Math.PI, TAU);
      ctx.lineTo((x + 6) * s, -2 * s);
      ctx.stroke();
    }
    // Gabled front and the dome.
    ctx.fillStyle = '#ece6da';
    ctx.beginPath();
    ctx.moveTo(x0 * s, -h * s);
    ctx.lineTo((x0 + 14) * s, -(h + 8) * s);
    ctx.lineTo((x0 + 28) * s, -h * s);
    ctx.fill();
    ctx.fillStyle = '#e4ddcf';
    ctx.fillRect(-112 * s, -(h + 9) * s, 22 * s, 9 * s);
    ctx.beginPath();
    ctx.ellipse(-101 * s, -(h + 9) * s, 11 * s, 9 * s, 0, Math.PI, TAU);
    ctx.fill();
    ctx.restore();
  }

  OM.scene({
    id: 'pisa', unit: 1, win: [3.6, 2.8, 1.45, 0.95],
    focus: function (z) { return [U.smooth(1.9, 1.1, z) * 10, -28 - U.smooth(1.9, 1.0, z) * 48]; },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, W = g.W, H = g.H;
      ctx.globalAlpha = g.a;
      // Sun and haze.
      ctx.globalCompositeOperation = 'lighter';
      U.drawGlow(ctx, [255, 236, 190], W * 0.12, H * 0.1, Math.max(W, H) * 0.35);
      ctx.globalCompositeOperation = 'source-over';
      // Distant hills.
      ctx.fillStyle = 'rgba(118,146,176,0.5)';
      ctx.beginPath();
      ctx.moveTo(0, oy);
      for (let x = 0; x <= W; x += 8) {
        const m = (x - ox) / s;
        const hgt = 18 + 14 * Math.sin(m * 0.004 + 1) + 9 * Math.sin(m * 0.011 + 2) + 5 * Math.sin(m * 0.031);
        ctx.lineTo(x, oy - hgt * Math.min(s, 6));
      }
      ctx.lineTo(W, oy);
      ctx.fill();
      drawDuomo(ctx, ox, oy, s);
      // The lawn and the path.
      const lawn = ctx.createLinearGradient(0, oy, 0, H);
      lawn.addColorStop(0, '#7aa255');
      lawn.addColorStop(1, '#4f7a37');
      ctx.fillStyle = lawn;
      ctx.fillRect(0, oy, W, Math.max(0, H - oy));
      ctx.fillStyle = '#efe9dc';
      ctx.fillRect(0, oy, W, Math.max(1, 1.6 * s));
      // The tower's shadow.
      ctx.fillStyle = 'rgba(30,50,20,0.28)';
      ctx.beginPath();
      ctx.ellipse(ox + 14 * s, oy + 1.2 * s, 24 * s, 2.2 * s, 0, 0, TAU);
      ctx.fill();
      // The tower, leaning about 4 degrees.
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(LEAN);
      drawTower(ctx, s);
      ctx.restore();
      // People, for scale.
      [[-15, '#28324a'], [-12.6, '#8a3a32'], [13.5, '#3d4a2c'], [15.1, '#5b4a7a']].forEach(function (p) {
        const x = ox + p[0] * s, h = 1.72 * s;
        ctx.fillStyle = p[1];
        ctx.fillRect(x - 0.22 * s, oy - h * 0.86, 0.44 * s, h * 0.86);
        ctx.beginPath();
        ctx.arc(x, oy - h * 0.92, 0.13 * s, 0, TAU);
        ctx.fill();
      });

      // Two balls, heavy and light, dropped together.
      const c = ((g.t % CYCLE) + CYCLE) % CYCLE;
      const ft = U.clamp(c - 1.2, 0, FALL);
      const fallen = 0.5 * G * ft * ft;
      const bx1 = ox + (DROP_X + 0.7) * s, bx2 = ox + (DROP_X + 2.6) * s;
      const by = oy - (DROP_H - fallen) * s;
      // Ghosts every half second show the gaps growing: 1, 3, 5, 7…
      for (let k = 1; k * 0.5 < ft; k++) {
        const y = oy - (DROP_H - 0.5 * G * k * k * 0.25) * s;
        ctx.globalAlpha = g.a * 0.3;
        U.drawBall(ctx, [60, 62, 70], bx1, y, 5.5);
        U.drawBall(ctx, [176, 120, 70], bx2, y, 3.4);
      }
      ctx.globalAlpha = g.a;
      U.drawBall(ctx, [60, 62, 70], bx1, by, 5.5);
      U.drawBall(ctx, [176, 120, 70], bx2, by, 3.4);
      if (ft >= FALL && c < 1.2 + FALL + 0.7) {
        const k = (c - 1.2 - FALL) / 0.7;
        ctx.fillStyle = 'rgba(210,200,170,' + (0.6 * (1 - k)).toFixed(2) + ')';
        ctx.beginPath();
        ctx.ellipse((bx1 + bx2) / 2, oy, (6 + k * 30), 3 + k * 6, 0, Math.PI, TAU);
        ctx.fill();
      }
      // Distance fallen after 1, 2 and 3 seconds.
      const lx = bx2 + 16;
      [1, 2, 3].forEach(function (sec) {
        if (ft < sec) return;
        const d = 0.5 * G * sec * sec, y = oy - (DROP_H - d) * s;
        ctx.strokeStyle = U.ink(g, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx2 + 6, y);
        ctx.lineTo(lx - 4, y);
        ctx.stroke();
        U.label(ctx, g, sec + ' s: fallen ' + d.toFixed(1) + ' m', lx, y);
      });
      if (c < 1.2 || ft < 0.4) U.label(ctx, g, 'heavy ball and light ball,\nreleased together', bx2 + 14, oy - DROP_H * s - 18, { alpha: 0.9 });
      // Height.
      const hx = ox - (RB + 7) * s;
      ctx.strokeStyle = U.ink(g, 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, oy);
      ctx.lineTo(hx, oy - TOP * s);
      ctx.moveTo(hx - 5, oy);
      ctx.lineTo(hx + 5, oy);
      ctx.moveTo(hx - 5, oy - TOP * s);
      ctx.lineTo(hx + 5, oy - TOP * s);
      ctx.stroke();
      U.label(ctx, g, '57 m', hx - 8, oy - TOP * s / 2, { align: 'right' });
      if (!g.small) U.label(ctx, g, 'people, 1.7 m', ox - 13.8 * s, oy + 16, { align: 'center', alpha: 0.75 });
      U.label(ctx, g, 'balls drawn larger than life', bx2 + 14, oy + 18, { alpha: 0.65 });
    }
  });

  /* ---------- Faraday's coil ---------- */

  const MAG_OUT = -15, MAG_IN = -2.5, MAG_L = 8, MAG_H = 1.8, F_CYCLE = 8;
  function ease(x) { return x * x * (3 - 2 * x); }
  function magX(t) {
    const p = ((t % F_CYCLE) + F_CYCLE) % F_CYCLE;
    if (p < 1.4) return MAG_OUT;
    if (p < 2.4) return U.lerp(MAG_OUT, MAG_IN, ease(p - 1.4));
    if (p < 4.6) return MAG_IN;
    if (p < 5.6) return U.lerp(MAG_IN, MAG_OUT, ease(p - 4.6));
    return MAG_OUT;
  }
  const VMAX = 1.5 * (MAG_IN - MAG_OUT);

  const WIRE = [[6, 2.8], [6, 7.2], [11.9, 7.2], [11.9, 6.3], [15.1, 6.3], [15.1, 7.9], [-6, 7.9], [-6, 2.8]];
  const WIRE_LEN = (function () { let l = 0; for (let i = 1; i < WIRE.length; i++) l += Math.hypot(WIRE[i][0] - WIRE[i - 1][0], WIRE[i][1] - WIRE[i - 1][1]); return l; })();
  function alongWire(d) {
    d = ((d % WIRE_LEN) + WIRE_LEN) % WIRE_LEN;
    for (let i = 1; i < WIRE.length; i++) {
      const a = WIRE[i - 1], b = WIRE[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d <= l) return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l];
      d -= l;
    }
    return WIRE[0];
  }

  // Field lines of a bar magnet (as a dipole), in the magnet's own frame.
  const FIELD = (function () {
    const lines = [];
    [2.6, 4.2, 6.5, 9.5, 13.5].forEach(function (C) {
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const th = 0.04 + (Math.PI - 0.08) * i / 80, r = C * Math.sin(th) * Math.sin(th);
        pts.push([r * Math.cos(th) * 1.25, r * Math.sin(th)]);
      }
      lines.push(pts);
    });
    return lines;
  })();

  OM.scene({
    id: 'faraday', unit: 0.01, win: [0.9, 0.25, -0.82, -1.0],
    focus: function () { return [-1, 1.5]; },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, W = g.W, H = g.H;
      const X = function (x) { return ox + x * s; }, Y = function (y) { return oy + y * s; };
      ctx.globalAlpha = g.a;
      // Lamp light and the bench.
      ctx.globalCompositeOperation = 'lighter';
      U.drawGlow(ctx, [255, 190, 120], X(-14), Y(-20), 30 * s);
      ctx.globalCompositeOperation = 'source-over';
      const bench = ctx.createLinearGradient(0, Y(8.5), 0, Y(20));
      bench.addColorStop(0, '#6b4528');
      bench.addColorStop(1, '#2e1c10');
      ctx.fillStyle = bench;
      ctx.fillRect(0, Y(8.5), W, Math.max(0, H - Y(8.5)));
      ctx.fillStyle = 'rgba(255,214,160,0.25)';
      ctx.fillRect(0, Y(8.5), W, Math.max(1, 0.15 * s));

      const xm = magX(g.t), dt = 0.02;
      const v = (magX(g.t + dt) - magX(g.t - dt)) / (2 * dt);
      const I = v / VMAX;                       // -1 … 1

      // Field lines move with the magnet.
      ctx.strokeStyle = 'rgba(140,200,255,0.28)';
      ctx.lineWidth = 1;
      FIELD.forEach(function (pts) {
        [1, -1].forEach(function (sy) {
          ctx.beginPath();
          let on = false;
          pts.forEach(function (p) {
            const inside = Math.abs(p[0]) < MAG_L / 2 && Math.abs(p[1]) < MAG_H / 2;
            const x = X(xm + p[0]), y = Y(p[1] * sy);
            if (inside) { on = false; return; }
            if (on) ctx.lineTo(x, y); else ctx.moveTo(x, y);
            on = true;
          });
          ctx.stroke();
        });
      });

      // Supports, then the back of the coil.
      ctx.fillStyle = '#5a3a22';
      [-4.6, 4.6].forEach(function (x) { ctx.fillRect(X(x - 0.7), Y(2.9), 1.4 * s, 5.6 * s); });
      const turns = 15, cx0 = -6, cx1 = 6, ry = 2.8, rx = 0.75;
      ctx.lineWidth = Math.max(1, 0.32 * s);
      ctx.strokeStyle = '#7a3f1d';
      for (let i = 0; i < turns; i++) {
        const x = U.lerp(cx0, cx1, i / (turns - 1));
        ctx.beginPath();
        ctx.ellipse(X(x), Y(0), rx * s, ry * s, 0, -Math.PI / 2, Math.PI / 2, true);
        ctx.stroke();
      }
      // The magnet: north (red) end first.
      const mx0 = X(xm - MAG_L / 2), my0 = Y(-MAG_H / 2), mw = MAG_L * s, mh = MAG_H * s;
      ctx.fillStyle = '#c8cdd8';
      ctx.fillRect(mx0, my0, mw / 2, mh);
      ctx.fillStyle = '#d6453d';
      ctx.fillRect(mx0 + mw / 2, my0, mw / 2, mh);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(mx0, my0, mw, mh * 0.25);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(mx0, my0 + mh * 0.75, mw, mh * 0.25);
      ctx.font = '600 ' + Math.max(9, Math.round(0.95 * s)) + 'px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText('N', X(xm + MAG_L / 4), Y(0));
      ctx.fillStyle = '#2b2f3a';
      ctx.fillText('S', X(xm - MAG_L / 4), Y(0));
      // The front of the coil, glowing while current flows.
      const glow = Math.abs(I);
      for (let i = 0; i < turns; i++) {
        const x = U.lerp(cx0, cx1, i / (turns - 1));
        const gr = ctx.createLinearGradient(0, Y(-ry), 0, Y(ry));
        gr.addColorStop(0, '#f6c08a');
        gr.addColorStop(0.45, '#d9894d');
        gr.addColorStop(1, '#8a4620');
        ctx.strokeStyle = gr;
        ctx.lineWidth = Math.max(1.2, 0.36 * s);
        ctx.beginPath();
        ctx.ellipse(X(x), Y(0), rx * s, ry * s, 0, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
      }
      if (glow > 0.05) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = g.a * glow * 0.7;
        U.drawGlow(ctx, [255, 170, 90], X(0), Y(0), 9 * s);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = g.a;
      }
      // Wires, with the current drawn as moving dots.
      ctx.strokeStyle = '#c47a45';
      ctx.lineWidth = Math.max(1, 0.18 * s);
      ctx.beginPath();
      WIRE.forEach(function (p, i) { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); });
      ctx.stroke();
      const shift = (xm - MAG_OUT) * 1.6;
      ctx.fillStyle = '#ffe2a8';
      for (let d = 0; d < WIRE_LEN; d += 1.3) {
        const p = alongWire(d + shift);
        ctx.globalAlpha = g.a * (0.25 + 0.75 * glow);
        ctx.fillRect(X(p[0]) - 1.5, Y(p[1]) - 1.5, 3, 3);
      }
      ctx.globalAlpha = g.a;
      // The galvanometer: its needle swings with the current.
      const gx = X(13.5), gy = Y(3.0), gr2 = 3.5 * s;
      ctx.fillStyle = '#9b7438';
      ctx.beginPath();
      ctx.arc(gx, gy, gr2 * 1.12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#f1e8d3';
      ctx.beginPath();
      ctx.arc(gx, gy, gr2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#3b3328';
      ctx.lineWidth = 1;
      for (let k = -5; k <= 5; k++) {
        const a = -Math.PI / 2 + k * 10 * DEG, r0 = gr2 * 0.72, r1 = gr2 * (k % 5 === 0 ? 0.9 : 0.84);
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(a) * r0, gy + gr2 * 0.35 + Math.sin(a) * r0);
        ctx.lineTo(gx + Math.cos(a) * r1, gy + gr2 * 0.35 + Math.sin(a) * r1);
        ctx.stroke();
      }
      const na = -Math.PI / 2 + I * 48 * DEG;
      ctx.strokeStyle = '#b3261e';
      ctx.lineWidth = Math.max(1.2, 0.12 * s);
      ctx.beginPath();
      ctx.moveTo(gx, gy + gr2 * 0.35);
      ctx.lineTo(gx + Math.cos(na) * gr2 * 0.95, gy + gr2 * 0.35 + Math.sin(na) * gr2 * 0.95);
      ctx.stroke();
      ctx.fillStyle = '#3b3328';
      ctx.beginPath();
      ctx.arc(gx, gy + gr2 * 0.35, Math.max(2, 0.25 * s), 0, TAU);
      ctx.fill();
      // What is happening.
      const state = Math.abs(I) < 0.05 ? 'magnet still: no current' : v > 0 ? 'magnet moving in: current flows' : 'magnet moving out: current flows the other way';
      U.label(ctx, g, state, X(0), Y(-ry) - 46, { align: 'center', size: g.small ? 11 : 13, color: Math.abs(I) < 0.05 ? undefined : 'rgba(255,214,150,1)' });
      U.label(ctx, g, 'galvanometer', gx, gy - gr2 * 1.12 - 14, { align: 'center', alpha: 0.75 });
      if (!g.small) U.label(ctx, g, 'coil of copper wire', X(cx0), Y(-ry) - 16, { alpha: 0.8 });
    }
  });

  /* ---------- A speck of radium in a cloud chamber: Curie ---------- */

  const NEEDLE = Math.atan2(40, -48);
  function hash(i, k) {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  const RANGES = [33, 40, 46, 69];            // mm in air: radium-226 and its daughters

  let mist = null;
  function mistSprite() {
    if (mist) return mist;
    const c = U.canvas(256), x = c.getContext('2d'), r = U.rng(61);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = 'rgba(200,220,235,' + (0.02 + r() * 0.05).toFixed(3) + ')';
      x.beginPath();
      x.arc(r() * 256, r() * 256, 2 + r() * 10, 0, TAU);
      x.fill();
    }
    return (mist = c);
  }

  OM.scene({
    id: 'curie', unit: 0.001, win: [-0.95, -1.2, -1.95, -2.45],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalAlpha = g.a * 0.7;
      const ms = 120 * s;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) ctx.drawImage(mistSprite(), ox + i * ms - ms / 2, oy + j * ms - ms / 2, ms, ms);
      ctx.globalAlpha = g.a;
      // The needle.
      // A tapered steel needle, sharp at the radium end.
      const ux = Math.cos(NEEDLE), uy = Math.sin(NEEDLE), px = -uy, py = ux;
      const nx = ox + ux * 70 * s, ny = oy + uy * 70 * s, hw = 0.6 * s;
      const ngr = ctx.createLinearGradient(nx + px * hw, ny + py * hw, nx - px * hw, ny - py * hw);
      ngr.addColorStop(0, '#2b2f37');
      ngr.addColorStop(0.45, '#6b7280');
      ngr.addColorStop(1, '#1d2026');
      ctx.fillStyle = ngr;
      ctx.beginPath();
      ctx.moveTo(nx + px * hw, ny + py * hw);
      ctx.lineTo(ox + ux * 0.4 * s, oy + uy * 0.4 * s);
      ctx.lineTo(nx - px * hw, ny - py * hw);
      ctx.closePath();
      ctx.fill();
      // Alpha tracks: each one a straight trail of mist that thickens and fades.
      ctx.globalCompositeOperation = 'lighter';
      const life = 1.6, gap = 0.17;
      for (let i = Math.floor((g.t - life) / gap); i <= Math.floor(g.t / gap); i++) {
        const age = g.t - i * gap;
        if (age < 0 || age > life) continue;
        let ang = hash(i, 1) * TAU;
        if (Math.abs(Math.atan2(Math.sin(ang - NEEDLE), Math.cos(ang - NEEDLE))) < 0.5) ang += Math.PI;
        const h = hash(i, 2), range = RANGES[h < 0.35 ? 0 : h < 0.6 ? 1 : h < 0.85 ? 2 : 3];
        const k = age / life, fade = Math.pow(1 - k, 1.4);
        const x1 = ox + Math.cos(ang) * range * s, y1 = oy + Math.sin(ang) * range * s;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        ctx.strokeStyle = 'rgba(225,240,255,' + (0.16 * fade).toFixed(3) + ')';
        ctx.lineWidth = U.clamp((0.12 + k * 0.4) * s, 1, 10);
        ctx.beginPath();
        ctx.moveTo(ox + ca * 1.2 * s, oy + sa * 1.2 * s);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.fillStyle = 'rgba(235,245,255,' + (0.7 * fade).toFixed(3) + ')';
        const step = Math.max(0.12, 2.2 / s), sz = U.clamp((0.05 + k * 0.08) * s, 1, 3.2);
        for (let d = 1.2, j = 0; d < range; d += step, j++) {
          const jit = (hash(i * 131 + j, 7) - 0.5) * (0.12 + k * 0.8);
          ctx.fillRect(ox + (ca * d - sa * jit) * s - sz / 2, oy + (sa * d + ca * jit) * s - sz / 2, sz, sz);
        }
        ctx.globalAlpha = g.a * fade * 0.6;
        U.drawGlow(ctx, [220, 236, 255], x1, y1, U.clamp(0.5 * s, 3, 14));
        ctx.globalAlpha = g.a;
      }
      // Now and then a beta particle: thin and wandering.
      for (let i = Math.floor((g.t - 1.1) / 0.9); i <= Math.floor(g.t / 0.9); i++) {
        const age = g.t - i * 0.9;
        if (age < 0 || age > 1.1) continue;
        let a = hash(i, 5) * TAU, x = ox, y = oy;
        ctx.strokeStyle = 'rgba(200,225,255,' + (0.5 * (1 - age / 1.1)).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let j = 0; j < 40; j++) {
          a += (hash(i, 10 + j) - 0.5) * 0.7;
          x += Math.cos(a) * 2.4 * s;
          y += Math.sin(a) * 2.4 * s;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // The radium itself, glowing.
      U.drawGlow(ctx, [130, 225, 255], ox, oy, Math.max(10, 3 * s));
      U.drawGlow(ctx, [230, 250, 255], ox, oy, Math.max(3, 0.8 * s));
      ctx.globalCompositeOperation = 'source-over';
      U.label(ctx, g, 'a speck of radium on a needle tip', ox - 18, oy + 26, { align: 'right', to: [ox - 3, oy + 3] });
      if (!g.small) U.label(ctx, g, 'alpha particle trails, 3 to 7 cm long', ox + 40 * s * 0.55, oy - 40 * s * 0.62, { alpha: 0.8 });
    }
  });

  /* ---------- A human hair, and red blood cells ---------- */

  const HAIR_A = -0.33, HAIR_W = 70;
  const CELLS = [[92, 62, 0.2], [116, 84, 1.3], [76, 98, 2.2], [132, 48, 0.7], [-104, -70, 1.9], [-126, -48, 0.4]];

  OM.scene({
    id: 'hair', unit: 1e-6, win: [-2.7, -3.3, -4.3, -4.85],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalAlpha = g.a;
      // Blood cells: red discs, thinner in the middle.
      CELLS.forEach(function (c) {
        const x = ox + c[0] * s, y = oy + c[1] * s, r = 3.75 * s;
        if (r < 1) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.82 + 0.18 * Math.cos(c[2]));
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        gr.addColorStop(0, 'rgba(175,40,48,0.9)');
        gr.addColorStop(0.45, 'rgba(196,52,58,0.95)');
        gr.addColorStop(0.8, 'rgba(226,78,74,1)');
        gr.addColorStop(1, 'rgba(120,18,28,0.9)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
        ctx.restore();
      });
      // The hair: a long cylinder with overlapping scales.
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(HAIR_A);
      const L = (Math.hypot(g.W, g.H) + Math.hypot(ox - g.W / 2, oy - g.H / 2) * 2) / s;
      const half = HAIR_W / 2;
      const gr = ctx.createLinearGradient(0, -half * s, 0, half * s);
      gr.addColorStop(0, '#2a1709');
      gr.addColorStop(0.14, '#7d4f27');
      gr.addColorStop(0.36, '#c48d53');
      gr.addColorStop(0.5, '#d6a466');
      gr.addColorStop(0.75, '#8a5a2c');
      gr.addColorStop(1, '#25150a');
      ctx.fillStyle = gr;
      ctx.fillRect(-L * s, -half * s, 2 * L * s, HAIR_W * s);
      const step = 7.5;
      if (step * s > 3) {
        const u0 = Math.floor(-L / step) * step;
        for (let u = u0; u < L; u += step) {
          const j = (hash(Math.round(u / step), 3) - 0.5) * 2.5;
          const x = (u + j) * s;
          ctx.strokeStyle = 'rgba(40,20,6,0.35)';
          ctx.lineWidth = Math.max(0.8, 0.9 * s);
          ctx.beginPath();
          ctx.moveTo(x + 0.8 * s, -half * s);
          ctx.quadraticCurveTo(x + 5.8 * s, 0, x + 0.8 * s, half * s);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,232,196,0.32)';
          ctx.lineWidth = Math.max(0.6, 0.6 * s);
          ctx.beginPath();
          ctx.moveTo(x, -half * s);
          ctx.quadraticCurveTo(x + 5 * s, 0, x, half * s);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(255,240,215,0.18)';
      ctx.fillRect(-L * s, -12 * s, 2 * L * s, 4 * s);
      ctx.restore();
      const lw = U.win(g.z, [-3.3, -3.5, -4.1, -4.3]);
      U.label(ctx, g, 'a human hair, about 70 µm wide', ox + 30 * s, oy + 52 * s, { alpha: lw, to: [ox + 10 * s, oy + 26 * s] });
      U.label(ctx, g, 'red blood cells, about 7 µm', ox + 92 * s, oy + 62 * s - 4.5 * s - 18, { align: 'center', alpha: lw });
    }
  });
})();
