/* Orders of Magnitude: from the observable universe down to the Solar System. */
(function () {
  'use strict';

  const OM = window.OM, U = OM.util;
  const TAU = Math.PI * 2;
  const MPC = 3.0857e22, LY = 9.4607e15, AU = 1.496e11;

  /* ---------- The observable universe, and the ripple ---------- */

  const R_OU = 14250;                 // radius of the observable universe, Mpc
  const SRC = [-262, -315];           // the black-hole merger, 410 Mpc away
  const STY = [
    { c: 'rgb(140,160,255)', a: 0.42, size: 1.2 },
    { c: 'rgb(190,205,255)', a: 0.7, size: 1.4 },
    { c: 'rgb(236,238,255)', a: 0.9, size: 1.9 },
    { c: 'rgb(255,214,170)', a: 1, size: 2.4 }
  ];

  OM.scene({
    id: 'cosmos', unit: MPC, win: [99, 99, 23.7, 22.9],
    init: function () {
      // The cosmic web: strands of galaxies with clusters where they meet.
      // Half are spread evenly; half crowd toward us, so every zoom level
      // on the way in still shows a web.
      const r = U.rng(7), b = [[], [], [], []];
      for (let i = 0; i < 1100; i++) {
        const even = i % 2 === 0;
        const rad = even ? R_OU * Math.sqrt(r()) * 0.985 : R_OU * Math.pow(10, -r() * 3.3);
        const ang = r() * TAU;
        const cx = rad * Math.cos(ang), cy = rad * Math.sin(ang);
        const L = even ? 250 + r() * 1300 : Math.max(6, rad * (0.15 + r() * 0.4));
        const dir = r() * Math.PI, dx = Math.cos(dir), dy = Math.sin(dir);
        const k = 9 + Math.floor(r() * 8);
        for (let j = 0; j < k; j++) {
          const f = r() - 0.5, w = U.gauss(r) * L * 0.035;
          b[r() < 0.6 ? 0 : 1].push(cx + dx * L * f - dy * w, cy + dy * L * f + dx * w);
        }
        const n = 3 + Math.floor(r() * 6), ex = cx + dx * L * 0.5, ey = cy + dy * L * 0.5;
        for (let j = 0; j < n; j++) b[j === 0 ? 3 : 2].push(ex + U.gauss(r) * L * 0.025, ey + U.gauss(r) * L * 0.025);
      }
      this.b = b.map(function (a) { return new Float32Array(a); });
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, W = g.W, H = g.H;
      ctx.globalCompositeOperation = 'lighter';

      // The edge: the afterglow of the Big Bang, as far as we can ever see.
      const R = R_OU * s;
      if (R < 4 * Math.max(W, H)) {
        const gr = ctx.createRadialGradient(ox, oy, R * 0.86, ox, oy, R * 1.05);
        gr.addColorStop(0, 'rgba(255,120,80,0)');
        gr.addColorStop(0.7, 'rgba(255,130,90,0.07)');
        gr.addColorStop(0.9, 'rgba(255,170,120,0.24)');
        gr.addColorStop(1, 'rgba(255,120,80,0)');
        ctx.globalAlpha = g.a;
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(ox, oy, R * 1.05, 0, TAU);
        ctx.fill();
      }

      // The galaxies only change when the size does, so keep them as a
      // picture and redraw it only while the reader is zooming.
      const key = Math.round(g.z * 500) + '|' + W + '|' + H + '|' + ox.toFixed(1) + '|' + oy.toFixed(1);
      if (!this.cache || this.cache.width !== Math.round(W * g.dpr) || this.cache.height !== Math.round(H * g.dpr)) {
        this.cache = U.canvas(W * g.dpr, H * g.dpr);
        this.key = '';
      }
      if (key !== this.key) {
        this.key = key;
        const c2 = this.cache.getContext('2d');
        c2.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
        c2.clearRect(0, 0, W, H);
        c2.globalCompositeOperation = 'lighter';
        const x0 = -ox / s, x1 = (W - ox) / s, y0 = -oy / s, y1 = (H - oy) / s;
        for (let k = 0; k < 4; k++) {
          const p = this.b[k], st = STY[k], h = st.size / 2;
          c2.fillStyle = st.c;
          c2.globalAlpha = st.a;
          for (let i = 0; i < p.length; i += 2) {
            const x = p[i], y = p[i + 1];
            if (x < x0 || x > x1 || y < y0 || y > y1) continue;
            c2.fillRect(ox + x * s - h, oy + y * s - h, st.size, st.size);
          }
        }
      }
      ctx.globalAlpha = g.a;
      ctx.drawImage(this.cache, 0, 0, W, H);

      // Us.
      ctx.globalAlpha = g.a;
      U.drawGlow(ctx, [255, 220, 170], ox, oy, 9);

      // The gravitational wave, spreading from the merger toward us.
      const rw = U.win(g.z, [26.9, 26.35, 24.9, 24.3]);
      if (rw > 0) {
        const sx = ox + SRC[0] * s, sy = oy + SRC[1] * s;
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 6; k++) {
          const rr = (g.t * 70 + k * 120) % 720;
          ctx.strokeStyle = 'rgba(150,215,255,' + (rw * g.a * 0.6 * (1 - rr / 720)).toFixed(3) + ')';
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(sx, sy, rr * s, 0, TAU);
          ctx.stroke();
        }
        const ph = g.t * 9, d = 3;
        ctx.globalAlpha = g.a * rw;
        U.drawGlow(ctx, [170, 220, 255], sx, sy, 14);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx + Math.cos(ph) * d - 1.5, sy + Math.sin(ph) * d - 1.5, 3, 3);
        ctx.fillRect(sx - Math.cos(ph) * d - 1.5, sy - Math.sin(ph) * d - 1.5, 3, 3);
        ctx.globalCompositeOperation = 'source-over';
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = U.ink(g, 0.3 * rw);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ox, oy);
        ctx.stroke();
        ctx.setLineDash([]);
        U.label(ctx, g, 'two black holes merging', sx - 18, sy - 22, { to: [sx - 4, sy - 4], align: 'right', alpha: rw });
        U.label(ctx, g, '1.3 billion light-years', (sx + ox) / 2 + 10, (sy + oy) / 2 + 4, { alpha: rw * 0.8 });
        ctx.globalCompositeOperation = 'lighter';
      }

      ctx.globalCompositeOperation = 'source-over';
      const lw = U.win(g.z, [26.3, 25.9, 24.2, 23.8]);
      if (lw > 0) U.label(ctx, g, 'the Milky Way: you are here', ox + 22, oy + 22, { to: [ox + 3, oy + 3], alpha: lw });
      const ew = U.win(g.z, [99, 99, 26.95, 26.6]);
      if (ew > 0 && R > 60) {
        U.label(ctx, g, 'the edge of the observable universe', ox, oy - R - 18, { align: 'center', alpha: ew });
        if (!g.small) U.label(ctx, g, '93 billion light-years across', ox, oy + R + 20, { align: 'center', alpha: ew * 0.75 });
      }
    }
  });

  /* ---------- The Milky Way, with Andromeda and the Magellanic Clouds ---------- */

  const GU = 1e20;                      // galaxy units: 1e20 m, about 10,570 light-years
  const SUN = [0.55, 2.4];              // 26,000 light-years from the center
  const ANDRO = [150, -190];            // 2.5 million light-years away
  const LMC = [8, 13], SMC = [11.5, 15.3];
  function toSun(z) { return U.smooth(21.0, 20.15, z); }

  function paintGalaxy() {
    const N = 1400, K = N / 12, C = N / 2;
    const c = U.canvas(N), x = c.getContext('2d');
    let gr = x.createRadialGradient(C, C, 0, C, C, 5.6 * K);
    gr.addColorStop(0, 'rgba(255,222,170,0.6)');
    gr.addColorStop(0.07, 'rgba(255,205,150,0.32)');
    gr.addColorStop(0.3, 'rgba(150,165,230,0.1)');
    gr.addColorStop(1, 'rgba(60,70,140,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, N, N);
    x.globalCompositeOperation = 'lighter';
    const r = U.rng(21), pitch = Math.tan(17 * Math.PI / 180);
    for (let i = 0; i < 44000; i++) {
      let px, py, col, a, sz = 1.25;
      if (r() < 0.14) {
        const u = U.gauss(r) * 0.7, v = U.gauss(r) * 0.3, ba = 0.45;
        px = u * Math.cos(ba) - v * Math.sin(ba);
        py = u * Math.sin(ba) + v * Math.cos(ba);
        col = '255,214,160';
        a = 0.3 + r() * 0.4;
      } else {
        const rad = 0.35 + -Math.log(1 - r() * 0.97) * 1.5;
        if (rad > 5.4) continue;
        const arm = Math.floor(r() * 4), major = arm % 2 === 0;
        const inArm = r() < (major ? 0.72 : 0.55);
        const th = inArm ? arm * Math.PI / 2 + Math.log(rad / 0.45) / pitch + U.gauss(r) * (major ? 0.15 : 0.23) : r() * TAU;
        px = rad * Math.cos(th) + U.gauss(r) * 0.05;
        py = rad * Math.sin(th) + U.gauss(r) * 0.05;
        const hot = inArm && r() < 0.05;
        col = hot ? '255,150,190' : inArm ? '190,210,255' : '255,232,200';
        a = (inArm ? 0.5 : 0.26) + r() * 0.4;
        if (hot) sz = 2.2;
      }
      x.fillStyle = 'rgba(' + col + ',' + a.toFixed(2) + ')';
      x.fillRect(C + px * K, C + py * K, sz, sz);
    }
    // Dust lanes along the inside edge of the main arms.
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = 'rgba(14,9,7,0.08)';
    for (let i = 0; i < 9000; i++) {
      const arm = Math.floor(r() * 2) * 2, rad = 0.8 + r() * 4.2;
      const th = arm * Math.PI / 2 + Math.log(rad / 0.45) / pitch - 0.16 + U.gauss(r) * 0.05;
      x.beginPath();
      x.arc(C + rad * Math.cos(th) * K, C + rad * Math.sin(th) * K, (0.03 + r() * 0.05) * K, 0, TAU);
      x.fill();
    }
    // A soft bloom where the browser can blur.
    if ('filter' in x) {
      const copy = U.canvas(N);
      copy.getContext('2d').drawImage(c, 0, 0);
      x.filter = 'blur(9px)';
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.65;
      x.drawImage(copy, 0, 0);
      x.filter = 'none';
      x.globalAlpha = 1;
    }
    return c;
  }

  function paintCloud(seed, n, spread) {
    const N = 256, c = U.canvas(N), x = c.getContext('2d'), r = U.rng(seed);
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const px = N / 2 + U.gauss(r) * N * spread, py = N / 2 + U.gauss(r) * N * spread * 0.6;
      x.fillStyle = 'rgba(210,220,255,' + (0.15 + r() * 0.4).toFixed(2) + ')';
      x.fillRect(px, py, 1.4, 1.4);
    }
    return c;
  }

  OM.scene({
    id: 'galaxy', unit: GU, win: [23.6, 22.9, 20.2, 19.6],
    init: function () {
      this.img = paintGalaxy();
      this.lmc = paintCloud(4, 1400, 0.12);
      this.smc = paintCloud(5, 700, 0.09);
    },
    focus: function (z) {
      const k = toSun(z);
      return [SUN[0] * k, SUN[1] * k];
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = g.a;
      ctx.drawImage(this.img, ox - 6 * s, oy - 6 * s, 12 * s, 12 * s);

      const aw = U.win(g.z, [23.7, 23.2, 21.9, 21.4]);
      if (aw > 0) {
        ctx.save();
        ctx.globalAlpha = g.a * aw * 0.9;
        ctx.translate(ox + ANDRO[0] * s, oy + ANDRO[1] * s);
        ctx.rotate(-0.65);
        ctx.scale(1, 0.3);
        ctx.drawImage(this.img, -13.2 * s, -13.2 * s, 26.4 * s, 26.4 * s);
        ctx.restore();
      }
      const mw = U.win(g.z, [23.0, 22.6, 21.7, 21.3]);
      if (mw > 0) {
        ctx.globalAlpha = g.a * mw;
        ctx.drawImage(this.lmc, ox + LMC[0] * s - 0.9 * s, oy + LMC[1] * s - 0.9 * s, 1.8 * s, 1.8 * s);
        ctx.drawImage(this.smc, ox + SMC[0] * s - 0.5 * s, oy + SMC[1] * s - 0.5 * s, 1.0 * s, 1.0 * s);
      }

      ctx.globalCompositeOperation = 'source-over';
      const nw = U.win(g.z, [23.3, 22.9, 22.1, 21.7]);
      if (nw > 0) {
        U.label(ctx, g, 'the Milky Way', ox, oy + 6.5 * s + 16, { align: 'center', alpha: nw });
        const ax = ox + ANDRO[0] * s, ay = oy + ANDRO[1] * s;
        U.label(ctx, g, 'the Andromeda Galaxy\n2.5 million light-years away', ax, ay + 7 * s + 18, { align: 'center', alpha: nw * aw });
      }
      if (mw > 0 && !g.small) {
        U.label(ctx, g, 'Large and Small\nMagellanic Clouds', ox + LMC[0] * s + 18, oy + LMC[1] * s + 22, { alpha: mw * 0.85, to: [ox + LMC[0] * s + 4, oy + LMC[1] * s + 4] });
      }
      const sw = U.win(g.z, [22.0, 21.7, 20.0, 19.7]);
      if (sw > 0) {
        const sx = ox + SUN[0] * s, sy = oy + SUN[1] * s;
        ctx.globalAlpha = g.a * sw;
        ctx.strokeStyle = 'rgba(242,196,107,0.95)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, TAU);
        ctx.stroke();
        U.label(ctx, g, 'You are here: the Sun', sx + 34, sy + 30, { to: [sx + 5, sy + 5], alpha: sw, color: 'rgba(242,196,107,1)' });
      }
    }
  });

  /* ---------- The stars around the Sun ---------- */

  // Stars spread evenly at each zoom level: each layer is one size range,
  // and they cross-fade as you zoom, like flying into a star field.
  const LAYERS = [40000, 4000, 400, 40];
  OM.scene({
    id: 'field', unit: LY, win: [21.0, 20.5, 17.7, 17.3],
    init: function () {
      const r = U.rng(31);
      const cols = [[255, 244, 230], [255, 226, 180], [255, 196, 150], [205, 220, 255], [255, 170, 130]];
      this.layers = LAYERS.map(function (R) {
        const p = [];
        for (let i = 0; i < 320; i++) {
          const rad = R * 1.5 * Math.sqrt(r()), a = r() * TAU;
          p.push({ x: rad * Math.cos(a), y: rad * Math.sin(a), c: cols[Math.floor(r() * cols.length)], b: 0.35 + r() * 0.65, ph: r() * TAU });
        }
        return { R: R, z: Math.log10(R * LY), p: p };
      });
    },
    focus: function (z) {
      const k = toSun(z) - 1;
      return [SUN[0] * GU / LY * k, SUN[1] * GU / LY * k];
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalCompositeOperation = 'lighter';
      this.layers.forEach(function (L) {
        const w = 1 - Math.abs(g.z - L.z) / 1.05;
        if (w <= 0) return;
        L.p.forEach(function (st) {
          const x = ox + st.x * s, y = oy + st.y * s;
          if (x < -10 || y < -10 || x > g.W + 10 || y > g.H + 10) return;
          const tw = 0.85 + 0.15 * Math.sin(g.t * 1.7 + st.ph);
          ctx.globalAlpha = g.a * w * st.b * tw;
          ctx.fillStyle = U.rgba(st.c, 1);
          const sz = st.b > 0.9 ? 2.2 : 1.5;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
          if (st.b > 0.93) U.drawGlow(ctx, st.c, x, y, 7);
        });
      });
    }
  });

  // The nearest stars, at their real distances from the Sun.
  const NEAR = [
    ['Proxima Centauri', 14.495, 4.24, [255, 125, 95], 1.7, 'up'],
    ['Alpha Centauri A and B', 14.66, 4.37, [255, 236, 190], 3.2, 'down'],
    ['Barnard’s Star', 17.96, 5.96, [255, 130, 95], 1.6, 'up'],
    ['Wolf 359', 10.94, 7.86, [255, 120, 90], 1.4, 'up'],
    ['Lalande 21185', 11.06, 8.31, [255, 140, 100], 1.6, 'down'],
    ['Sirius A and B', 6.75, 8.6, [205, 222, 255], 3.8, 'up'],
    ['Luyten 726-8', 1.65, 8.73, [255, 120, 90], 1.4, 'down'],
    ['Ross 154', 18.83, 9.69, [255, 125, 95], 1.4, 'down'],
    ['Epsilon Eridani', 3.55, 10.5, [255, 200, 150], 2.2, 'up'],
    ['Procyon A and B', 7.66, 11.46, [255, 248, 230], 3.1, 'down']
  ];
  const MAIN = { 'Proxima Centauri': 1, 'Sirius A and B': 1, 'Barnard’s Star': 1, 'Alpha Centauri A and B': 1 };

  OM.scene({
    id: 'stars', unit: LY, win: [18.8, 18.0, 15.9, 15.4],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalCompositeOperation = 'source-over';
      ctx.setLineDash([2, 6]);
      ctx.lineWidth = 1;
      [5, 10].forEach(function (d) {
        ctx.globalAlpha = g.a;
        ctx.strokeStyle = U.ink(g, 0.18);
        ctx.beginPath();
        ctx.arc(ox, oy, d * s, 0, TAU);
        ctx.stroke();
        U.label(ctx, g, d + ' light-years', ox + d * s * 0.7071 + 6, oy + d * s * 0.7071 + 6, { alpha: 0.6 });
      });
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = g.a;
      U.drawGlow(ctx, [255, 225, 160], ox, oy, 18);
      ctx.fillStyle = '#fff4d8';
      ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
      NEAR.forEach(function (st) {
        const a = st[1] * 15 * Math.PI / 180;
        const x = ox + st[2] * Math.cos(a) * s, y = oy - st[2] * Math.sin(a) * s;
        const tw = 0.85 + 0.15 * Math.sin(g.t * 2 + st[2]);
        ctx.globalAlpha = g.a * tw;
        U.drawGlow(ctx, st[3], x, y, st[4] * 5);
        ctx.fillStyle = U.rgba(st[3], 1);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });
      ctx.globalCompositeOperation = 'source-over';
      U.label(ctx, g, 'the Sun', ox + 14, oy - 14, { to: [ox + 3, oy - 3] });
      NEAR.forEach(function (st) {
        if (g.small && !MAIN[st[0]]) return;
        const a = st[1] * 15 * Math.PI / 180;
        const x = ox + st[2] * Math.cos(a) * s, y = oy - st[2] * Math.sin(a) * s;
        const dy = st[5] === 'up' ? -18 : 18;
        U.label(ctx, g, st[0] + ' · ' + st[2] + ' ly', x + 12, y + dy, { to: [x + 2, y + dy / 6], alpha: MAIN[st[0]] ? 1 : 0.7 });
      });
    }
  });

  /* ---------- The Solar System ---------- */

  const PLANETS = [
    ['Mercury', 0.387, 0.206, 77, [190, 180, 170], 2.2, 0.1],
    ['Venus', 0.723, 0.007, 131, [240, 215, 165], 3, 2.0],
    ['Earth', 1.0, 0.017, 102, [100, 160, 255], 3.2, 4.1],
    ['Mars', 1.524, 0.093, 336, [235, 125, 85], 2.6, 0.7],
    ['Jupiter', 5.203, 0.049, 14, [230, 195, 150], 5.5, 3.3],
    ['Saturn', 9.537, 0.057, 92, [232, 212, 160], 4.8, 5.2],
    ['Uranus', 19.19, 0.046, 170, [165, 225, 235], 4, 1.4],
    ['Neptune', 30.07, 0.010, 44, [115, 155, 255], 4, 4.6]
  ];
  const HALLEY = [17.83, 0.967, 112];
  const YEAR = 8;                     // seconds on screen for one Earth year

  function kepler(M, e) {
    let E = M + e * Math.sin(M);
    for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    return E;
  }

  function orbitPos(a, e, w, M) {
    const E = kepler(M, e), b = a * Math.sqrt(1 - e * e);
    const x = a * (Math.cos(E) - e), y = b * Math.sin(E);
    const cw = Math.cos(w * Math.PI / 180), sw = Math.sin(w * Math.PI / 180);
    return [x * cw - y * sw, -(x * sw + y * cw)];
  }

  function earthAt(t) {
    const p = PLANETS[2];
    return orbitPos(p[1], p[2], p[3], TAU * t / YEAR + p[6]);
  }
  OM.earthAt = earthAt;

  OM.scene({
    id: 'solar', unit: AU, win: [15.3, 14.4, 11.9, 11.3],
    init: function () {
      const r = U.rng(41);
      this.belt = [];
      for (let i = 0; i < 520; i++) this.belt.push([2.15 + r() * 1.15, r() * TAU, 0.4 + r() * 0.6]);
    },
    focus: function (z, t) {
      const k = U.smooth(12.8, 12.0, z), e = earthAt(t);
      return [e[0] * k, e[1] * k];
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;
      ctx.globalAlpha = g.a;
      // Orbits
      PLANETS.concat([['Halley', HALLEY[0], HALLEY[1], HALLEY[2]]]).forEach(function (p) {
        const a = p[1], e = p[2], w = p[3] * Math.PI / 180, b = a * Math.sqrt(1 - e * e);
        if (a * s < 3) return;
        ctx.strokeStyle = p[0] === 'Halley' ? 'rgba(160,215,255,0.22)' : U.ink(g, 0.16);
        ctx.beginPath();
        ctx.ellipse(ox - a * e * Math.cos(w) * s, oy + a * e * Math.sin(w) * s, a * s, b * s, -w, 0, TAU);
        ctx.stroke();
      });
      // Asteroid belt
      ctx.fillStyle = U.ink(g, 0.5);
      this.belt.forEach(function (b) {
        if (b[0] * s < 6) return;
        const M = b[1] + TAU * g.t / (YEAR * Math.pow(b[0], 1.5));
        ctx.globalAlpha = g.a * b[2] * 0.6;
        ctx.fillRect(ox + b[0] * Math.cos(M) * s, oy - b[0] * Math.sin(M) * s, 1.2, 1.2);
      });
      ctx.globalAlpha = g.a;
      // The Sun
      ctx.globalCompositeOperation = 'lighter';
      const sr = Math.max(3, 0.00465 * s);
      U.drawGlow(ctx, [255, 205, 120], ox, oy, sr * 7);
      U.drawGlow(ctx, [255, 245, 220], ox, oy, sr * 2.2);
      ctx.globalCompositeOperation = 'source-over';
      // Planets
      const self = this;
      PLANETS.forEach(function (p) {
        const pos = orbitPos(p[1], p[2], p[3], TAU * g.t / (YEAR * Math.pow(p[1], 1.5)) + p[6]);
        const x = ox + pos[0] * s, y = oy + pos[1] * s;
        if (p[1] * s < 4) return;
        const rr = p[5];
        if (p[0] === 'Saturn') {
          ctx.strokeStyle = 'rgba(232,212,160,0.8)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(x, y, rr * 2.1, rr * 0.7, -0.35, 0, TAU);
          ctx.stroke();
        }
        U.drawBall(ctx, p[4], x, y, rr);
        if (p[1] * s > 26 && (!g.small || p[1] > 1.2 || p[0] === 'Earth')) {
          U.label(ctx, g, p[0], x + rr + 6, y - rr - 6, { alpha: 0.8 });
        }
      });
      // Halley's Comet, its tail pointing away from the Sun.
      const hp = orbitPos(HALLEY[0], HALLEY[1], HALLEY[2], TAU * g.t / (YEAR * 75.3) + 0.25);
      const hx = ox + hp[0] * s, hy = oy + hp[1] * s, hd = Math.hypot(hp[0], hp[1]);
      const tail = U.clamp(2.2 / hd, 0.15, 2.4) * s, ux = hp[0] / hd, uy = hp[1] / hd;
      const tg = ctx.createLinearGradient(hx, hy, hx + ux * tail, hy + uy * tail);
      tg.addColorStop(0, 'rgba(190,225,255,0.7)');
      tg.addColorStop(1, 'rgba(190,225,255,0)');
      ctx.strokeStyle = tg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + ux * tail, hy + uy * tail);
      ctx.stroke();
      ctx.fillStyle = '#e8f4ff';
      ctx.fillRect(hx - 1.5, hy - 1.5, 3, 3);
      if (HALLEY[0] * s > 40) U.label(ctx, g, 'Halley’s Comet', hx - 10, hy + 18, { align: 'right', to: [hx - 2, hy + 2], alpha: 0.8 });
      if (sr * 7 > 4) U.label(ctx, g, 'the Sun', ox - 14, oy - 16, { align: 'right', to: [ox - 3, oy - 3], alpha: 0.9 * (1 - U.smooth(12.6, 12.1, g.z)) });
      void self;
    }
  });
})();
