/* Orders of Magnitude: smaller than you can see. Light waves, molecules,
   the hydrogen atom, the nucleus, a proton, and LIGO's measurement. */
(function () {
  'use strict';

  const OM = window.OM, U = OM.util;
  const TAU = Math.PI * 2;

  /* ---------- Light: Maxwell ---------- */

  const WAVES = [700, 620, 580, 530, 470, 420];
  const NAMES = { 700: 'red', 620: 'orange', 580: 'yellow', 530: 'green', 470: 'blue', 420: 'violet' };

  OM.scene({
    id: 'light', unit: 1e-9, win: [-4.9, -5.5, -6.5, -7.0],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, W = g.W;
      const c = 420;                                   // drawn speed, nm per second
      const amp = 42, gap = 128;
      ctx.globalCompositeOperation = 'lighter';
      WAVES.forEach(function (lam, i) {
        const y0 = oy + (i - 2.5) * gap * s, col = U.waveRGB(lam);
        if (y0 < -100 || y0 > g.H + 100) return;
        [[7, 0.16], [1.8, 0.95]].forEach(function (pass) {
          ctx.lineWidth = pass[0];
          ctx.strokeStyle = U.rgba(col, pass[1] * g.a);
          ctx.beginPath();
          for (let px = -4; px <= W + 4; px += 2) {
            const x = (px - ox) / s;
            const y = y0 - Math.sin(TAU * (x - c * g.t) / lam) * amp * s;
            if (px === -4) ctx.moveTo(px, y); else ctx.lineTo(px, y);
          }
          ctx.stroke();
        });
      });
      ctx.globalCompositeOperation = 'source-over';
      // Labels and one wavelength marked on red and on violet.
      const lx = ox + (g.small ? 0.2 : 0.28) * g.view;
      WAVES.forEach(function (lam, i) {
        const y0 = oy + (i - 2.5) * gap * s;
        U.label(ctx, g, lam + ' nm · ' + NAMES[lam], lx, y0 - amp * s - 12, { alpha: 0.9 });
      });
      [0, 5].forEach(function (i) {
        const lam = WAVES[i], y0 = oy + (i - 2.5) * gap * s + amp * s + 10;
        const phase = ((c * g.t) % lam + lam) % lam;
        let x0 = ox + (Math.floor(((g.W * 0.15) - ox) / s / lam) * lam + phase + lam / 4) * s;
        if (x0 < 10) x0 += lam * s;
        const x1 = x0 + lam * s;
        ctx.strokeStyle = U.ink(g, 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + 4);
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y0);
        ctx.moveTo(x1, y0 - 4); ctx.lineTo(x1, y0 + 4);
        ctx.stroke();
        U.label(ctx, g, 'one wavelength', (x0 + x1) / 2, y0 + 12, { align: 'center', alpha: 0.7 });
      });
    }
  });

  /* ---------- Molecules of benzene: Raman ---------- */

  const CC = 0.139, CH = 0.248;                       // nm, ring and hydrogen radii

  function benzene(ctx, g, x, y, rot, tilt, size, breathe) {
    const s = g.s, R = CC * (1 + breathe) * s, RH = CH * (1 + breathe * 0.6) * s;
    const pts = [], hs = [];
    for (let i = 0; i < 6; i++) {
      const a = rot + i * TAU / 6, ca = Math.cos(a), sa = Math.sin(a) * tilt;
      pts.push([x + ca * R, y + sa * R]);
      hs.push([x + ca * RH, y + sa * RH]);
    }
    ctx.strokeStyle = 'rgba(200,205,220,0.75)';
    ctx.lineWidth = Math.max(1, 0.022 * s);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[(i + 1) % 6][0], pts[(i + 1) % 6][1]);
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(hs[i][0], hs[i][1]);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,205,220,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, R * 0.62, R * 0.62 * tilt, 0, 0, TAU);
    ctx.stroke();
    const order = [];
    for (let i = 0; i < 6; i++) { order.push([pts[i], 0.072, [110, 116, 130]]); order.push([hs[i], 0.048, [236, 238, 244]]); }
    order.sort(function (a, b) { return a[0][1] - b[0][1]; });
    order.forEach(function (o) { U.drawBall(ctx, o[2], o[0][0], o[0][1], Math.max(1.4, o[1] * s * size)); });
  }

  OM.scene({
    id: 'raman', unit: 1e-9, win: [-7.4, -7.9, -8.55, -8.85],
    init: function () {
      const r = U.rng(71);
      this.m = [[0, 0, 0.3, 0.2]];
      while (this.m.length < 26) {
        const x = (r() - 0.5) * 16, y = (r() - 0.5) * 12;
        if (this.m.some(function (m) { return Math.hypot(m[0] - x, m[1] - y) < 0.95; })) continue;
        this.m.push([x, y, r() * TAU, r() * TAU]);
      }
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, t = g.t;
      ctx.globalAlpha = g.a;
      // Photons: green light in, mostly green out, now and then a new color.
      const period = 1.5, hitIndex = function (i) { return Math.floor(U.lerp(0, 4, ((i * 0.618) % 1))); };
      const near = this.m.slice(0, 5);
      let breathe = 0;
      for (let i = Math.floor((t - 2.6) / period); i <= Math.floor(t / period); i++) {
        const age = t - i * period;
        if (age < 0 || age > 2.6) continue;
        const tgt = near[hitIndex(i)];
        const tx = tgt[0], ty = tgt[1];
        const inA = Math.PI + (((i * 0.37) % 1) - 0.5) * 0.6;
        const raman = (i % 4) === 3;
        let px, py, col, dir;
        if (age < 1.1) {
          const d = (1.1 - age) * 6;
          px = tx + Math.cos(inA) * d; py = ty + Math.sin(inA) * d; col = U.waveRGB(530); dir = inA + Math.PI;
          if (age > 0.95) breathe = Math.max(breathe, 1 - (age - 0.95) / 0.15);
        } else {
          const outA = ((i * 2.399) % TAU), d = (age - 1.1) * 6;
          px = tx + Math.cos(outA) * d; py = ty + Math.sin(outA) * d; col = U.waveRGB(raman ? 600 : 530); dir = outA;
          if (raman && age < 2.2) breathe = Math.max(breathe, 0.6);
        }
        // A short wave packet.
        ctx.strokeStyle = U.rgba(col, g.a * (age > 2.2 ? (2.6 - age) / 0.4 : 1));
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = -20; k <= 20; k++) {
          const u = k / 20 * 0.7, env = Math.exp(-u * u * 6) * 0.12;
          const x = px - Math.cos(dir) * u + -Math.sin(dir) * Math.sin(k * 0.9) * env;
          const y = py - Math.sin(dir) * u + Math.cos(dir) * Math.sin(k * 0.9) * env;
          if (k === -20) ctx.moveTo(ox + x * s, oy + y * s); else ctx.lineTo(ox + x * s, oy + y * s);
        }
        ctx.stroke();
        if (raman && age > 1.3 && age < 2.4 && !g.small) U.label(ctx, g, 'a new color: Raman light', ox + px * s + 14, oy + py * s - 12, { alpha: 0.9 });
      }
      this.m.forEach(function (m, i) {
        const x = ox + m[0] * s, y = oy + m[1] * s;
        if (x < -60 || y < -60 || x > g.W + 60 || y > g.H + 60) return;
        const rot = m[2] + t * 0.25 * (i % 2 ? 1 : -1), tilt = 0.45 + 0.55 * Math.abs(Math.cos(m[3] + t * 0.2));
        const b = i < 5 ? breathe * 0.06 * Math.sin(t * 30) : 0;
        benzene(ctx, g, x, y, rot, tilt, 1, b);
      });
      U.label(ctx, g, 'benzene: 6 carbon and 6 hydrogen atoms', ox + 0.35 * s, oy + 0.62 * s, { to: [ox + 0.12 * s, oy + 0.2 * s] });
      if (!g.small) U.label(ctx, g, 'light drawn far shorter than life (real light waves\nare about a thousand times longer than these molecules)', ox - 7.5 * s, oy + 5.2 * s, { alpha: 0.6 });
    }
  });

  /* ---------- The hydrogen atom: Bohr, then de Broglie ---------- */

  const A0 = 52.9;                                     // Bohr radius, pm
  const RN = [A0, 4 * A0, 9 * A0];

  OM.scene({
    id: 'atom', unit: 1e-12, win: [-8.45, -8.8, -9.6, -10.2],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, t = g.t;
      const wave = U.smooth(-9.05, -9.22, g.z);         // 0: Bohr's orbits, 1: de Broglie's waves
      ctx.globalAlpha = g.a;
      // The nucleus: far smaller than a pixel here.
      ctx.globalCompositeOperation = 'lighter';
      U.drawGlow(ctx, [255, 150, 120], ox, oy, 7);
      ctx.globalCompositeOperation = 'source-over';
      // Orbits as thin circles, fading into standing waves.
      RN.forEach(function (r, i) {
        const n = i + 1, R = r * s;
        ctx.strokeStyle = U.ink(g, 0.28 * (1 - wave));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox, oy, R, 0, TAU);
        ctx.stroke();
        if (wave > 0) {
          ctx.globalCompositeOperation = 'lighter';
          const amp = Math.min(0.16 * R, 22 + 4 * n) * Math.cos(t * 2.4);
          [[6, 0.18], [1.8, 0.95]].forEach(function (pass) {
            ctx.strokeStyle = 'rgba(190,160,255,' + (pass[1] * wave * g.a).toFixed(3) + ')';
            ctx.lineWidth = pass[0];
            ctx.beginPath();
            for (let k = 0; k <= 240; k++) {
              const th = k / 240 * TAU, rr = R + amp * Math.sin(n * th);
              const x = ox + Math.cos(th) * rr, y = oy + Math.sin(th) * rr;
              if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
            }
            ctx.stroke();
          });
          ctx.globalCompositeOperation = 'source-over';
        }
        const la = Math.PI * 0.32;
        const lbl = wave > 0.5 ? (n === 1 ? '1 wave fits level 1' : n + ' waves fit level ' + n) : 'level ' + n;
        if (R > 18) U.label(ctx, g, lbl, ox + Math.cos(la) * R + 8, oy - Math.sin(la) * R - 8, { alpha: 0.85 });
      });
      // A wave that does not fit (2½ waves) cancels itself out.
      if (wave > 0 && !g.small) {
        const R = 6.25 * A0 * s, amp = 18 * Math.cos(t * 2.4);
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(255,120,120,' + (0.55 * wave * g.a).toFixed(3) + ')';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = 0; k <= 240; k++) {
          const th = k / 240 * TAU, rr = R + amp * Math.sin(2.5 * th);
          const x = ox + Math.cos(th) * rr, y = oy + Math.sin(th) * rr;
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        U.label(ctx, g, '2½ waves don’t fit:\nno orbit here', ox - R * 0.71 - 10, oy + R * 0.71 + 14, { align: 'right', alpha: wave, color: 'rgba(255,150,150,1)' });
      }
      // Bohr: the electron drops from level 3 to level 2 and gives out red light.
      if (wave < 1) {
        const cyc = 6, c = ((t % cyc) + cyc) % cyc;
        let r, ang;
        const w3 = 0.7, w2 = 0.7 * 27 / 8;
        if (c < 2.6) { r = RN[2]; ang = c * w3; }
        else if (c < 2.9) { r = U.lerp(RN[2], RN[1], ease((c - 2.6) / 0.3)); ang = 2.6 * w3 + (c - 2.6) * 2; }
        else if (c < 5.6) { r = RN[1]; ang = 2.6 * w3 + 0.6 + (c - 2.9) * w2; }
        else { r = U.lerp(RN[1], RN[2], ease((c - 5.6) / 0.4)); ang = 2.6 * w3 + 0.6 + 2.7 * w2 + (c - 5.6) * 2; }
        ctx.globalAlpha = g.a * (1 - wave);
        ctx.globalCompositeOperation = 'lighter';
        const ex = ox + Math.cos(ang) * r * s, ey = oy + Math.sin(ang) * r * s;
        U.drawGlow(ctx, [140, 200, 255], ex, ey, 12);
        ctx.fillStyle = '#dff0ff';
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, TAU);
        ctx.fill();
        // The photon flies outward from where the jump happened.
        if (c > 2.75 && c < 5.2) {
          const ja = 2.6 * w3 + 0.15, d = RN[1] + (c - 2.75) * 260;
          const red = U.waveRGB(656);
          ctx.strokeStyle = U.rgba(red, 0.95);
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let k = -24; k <= 24; k++) {
            const u = k * 3, env = Math.exp(-(k * k) / 160) * 9;
            const along = d + u;
            const x = ox + Math.cos(ja) * along * s - Math.sin(ja) * Math.sin(k * 0.8) * env;
            const y = oy + Math.sin(ja) * along * s + Math.cos(ja) * Math.sin(k * 0.8) * env;
            if (k === -24) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
          U.label(ctx, g, 'red light, 656 nm', ox + Math.cos(ja) * (d + 90) * s + 10, oy + Math.sin(ja) * (d + 90) * s, { alpha: (1 - wave) * 0.9 });
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = g.a;
      }
      U.label(ctx, g, 'the nucleus, far too small to see here', ox + 16, oy + 22, { to: [ox + 2, oy + 2], alpha: 0.75 });
    }
  });
  function ease(x) { return x * x * (3 - 2 * x); }

  /* ---------- Empty space ---------- */

  OM.scene({
    id: 'empty', unit: 1, win: [-10.15, -10.5, -11.3, -11.7],
    draw: function (g) {
      const ctx = g.ctx;
      ctx.globalAlpha = g.a;
      ctx.globalCompositeOperation = 'lighter';
      U.drawGlow(ctx, [255, 150, 120], g.cx, g.cy, 4);
      ctx.globalCompositeOperation = 'source-over';
      U.label(ctx, g, 'still zooming into the atom…', g.cx, g.cy - 40, { align: 'center', size: 13 });
      U.label(ctx, g, 'nothing here but empty space', g.cx, g.cy + 40, { align: 'center', size: 13, alpha: 0.7 });
    }
  });

  /* ---------- Nuclei, drawn as balls of protons and neutrons ---------- */

  function pack(n, R, seed) {
    const r = U.rng(seed), out = [];
    let tries = 0;
    while (out.length < n && tries < 200000) {
      tries++;
      const x = (r() * 2 - 1) * R, y = (r() * 2 - 1) * R, z = (r() * 2 - 1) * R;
      if (x * x + y * y + z * z > R * R) continue;
      const min = tries > 60000 ? 1.25 : 1.5;
      if (out.some(function (p) { return (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y) + (p[2] - z) * (p[2] - z) < min * min; })) continue;
      out.push([x, y, z]);
    }
    return out;
  }
  const PROTON = [236, 92, 78], NEUTRON = [150, 164, 190];

  function nucleusSprite(n, z, R, seed) {
    const N = 512, c = U.canvas(N), x = c.getContext('2d'), k = N / (2 * (R + 1.2));
    const pts = pack(n, R, seed), r = U.rng(seed + 1);
    pts.forEach(function (p, i) { p.push(i < z ? 1 : 0, r()); });
    pts.sort(function (a, b) { return a[2] - b[2]; });
    pts.forEach(function (p) {
      const col = p[3] ? PROTON : NEUTRON;
      const rr = 0.85 * k;
      x.drawImage(U.ball(col), N / 2 + p[0] * k - rr, N / 2 + p[1] * k - rr, rr * 2, rr * 2);
    });
    return { img: c, size: 2 * (R + 1.2) };
  }

  /* ---------- Gold, and alpha particles: Rutherford ---------- */

  const D_CLOSE = 30;                                  // fm: closest approach, head-on, 7.7 MeV alphas on gold

  function trajectory(b) {
    let x = -420, y = b, vx = 1, vy = 0;
    const pts = [[x, y]], k = D_CLOSE / 2;
    for (let i = 0; i < 20000; i++) {
      const r = Math.hypot(x, y), dt = U.clamp(r * 0.01, 0.02, 4);
      const a = k / (r * r);
      vx += a * x / r * dt;
      vy += a * y / r * dt;
      x += vx * dt;
      y += vy * dt;
      if (i % 3 === 0) pts.push([x, y]);
      if (Math.abs(x) > 460 || Math.abs(y) > 460) break;
    }
    pts.push([x, y]);
    return pts;
  }

  OM.scene({
    id: 'rutherford', unit: 1e-15, win: [-11.3, -11.9, -12.95, -13.3],
    init: function () {
      this.nuc = nucleusSprite(197, 79, 7.0, 81);
      const bs = [1.2, -3, 5, -8, 12, -17, 24, -33, 45, -60, 80, -105, 135, -170, 210, -255, 300, -350, 400];
      this.paths = bs.map(function (b) {
        const p = trajectory(b);
        let len = 0;
        const acc = [0];
        for (let i = 1; i < p.length; i++) { len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); acc.push(len); }
        return { p: p, acc: acc, len: len, ph: Math.abs(b) * 0.37 };
      });
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      ctx.globalAlpha = g.a;
      // A faint haze: the gold atom's electrons, far out.
      this.paths.forEach(function (P) {
        ctx.strokeStyle = 'rgba(160,210,255,' + (0.24 * g.a).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        P.p.forEach(function (q, i) { const x = ox + q[0] * s, y = oy + q[1] * s; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke();
        // The alpha particle travelling along it.
        const d = ((g.t * 150 + P.ph * 37) % (P.len + 300));
        if (d > P.len) return;
        let i = 1;
        while (i < P.acc.length - 1 && P.acc[i] < d) i++;
        const f = (d - P.acc[i - 1]) / Math.max(1e-6, P.acc[i] - P.acc[i - 1]);
        const x = ox + U.lerp(P.p[i - 1][0], P.p[i][0], f) * s, y = oy + U.lerp(P.p[i - 1][1], P.p[i][1], f) * s;
        ctx.globalCompositeOperation = 'lighter';
        U.drawGlow(ctx, [170, 220, 255], x, y, 12);
        ctx.globalCompositeOperation = 'source-over';
      });
      const sz = this.nuc.size * s;
      ctx.drawImage(this.nuc.img, ox - sz / 2, oy - sz / 2, sz, sz);
      if (sz < 10) {
        ctx.globalCompositeOperation = 'lighter';
        U.drawGlow(ctx, [255, 170, 130], ox, oy, 8);
        ctx.globalCompositeOperation = 'source-over';
      }
      U.label(ctx, g, 'gold nucleus: 79 protons, 118 neutrons', ox + sz / 2 + 20, oy - sz / 2 - 18, { to: [ox + sz * 0.3, oy - sz * 0.3] });
      U.label(ctx, g, 'alpha particles', ox - 300 * s, oy - 170 * s - 14, { alpha: 0.85 });
      if (!g.small) U.label(ctx, g, 'a close hit bounces back', ox + 30 * s, oy + 60 * s, { alpha: 0.8 });
    }
  });

  /* ---------- Uranium splits: Meitner ---------- */

  const U_CYCLE = 7.2;

  OM.scene({
    id: 'meitner', unit: 1e-15, win: [-12.95, -13.28, -14.05, -14.4],
    init: function () {
      const pts = pack(236, 7.5, 91), r = U.rng(92);
      pts.sort(function (a, b) { return a[0] - b[0]; });
      // 141 nucleons become barium (56 protons), 92 krypton (36), and 3 fly off as neutrons.
      const A = pts.slice(0, 141), B = pts.slice(144), F = pts.slice(141, 144);
      const tag = function (list, protons, side) {
        const idx = list.map(function (p, i) { return i; }).sort(function () { return r() - 0.5; });
        return list.map(function (p, i) { return { p: p, pr: idx.indexOf(i) < protons, side: side }; });
      };
      const RA = 1.2 * Math.cbrt(141), RB2 = 1.2 * Math.cbrt(92);
      const ca = pack(141, RA, 93), cb = pack(92, RB2, 94);
      this.nuc = tag(A, 56, -1).concat(tag(B, 36, 1)).concat(F.map(function (p) { return { p: p, pr: false, side: 0 }; }));
      let ia = 0, ib = 0;
      this.nuc.forEach(function (n) {
        if (n.side < 0) n.home = ca[ia++] || [0, 0, 0];
        else if (n.side > 0) n.home = cb[ib++] || [0, 0, 0];
        else n.dir = [r() - 0.5, r() - 0.5].map(function (v) { return v * 2; });
      });
      this.RA = RA; this.RB = RB2;
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      const c = ((g.t % U_CYCLE) + U_CYCLE) % U_CYCLE;
      ctx.globalAlpha = g.a;
      const fadeIn = U.smooth(0, 0.4, c), fadeOut = 1 - U.smooth(6.6, 7.2, c);
      const sep = c < 3.4 ? 0 : Math.pow(c - 3.4, 1.6) * 9;
      const stretch = c < 2.4 ? 0 : U.smooth(2.4, 3.4, c);
      const wob = c > 1.6 && c < 3.4 ? Math.sin((c - 1.6) * 14) * 0.07 * (1 - stretch) : 0;
      const cA = -(this.RA + this.RB) * 0.48 * stretch - sep, cB = (this.RA + this.RB) * 0.52 * stretch + sep;
      const list = this.nuc.map(function (n) {
        let x, y, z;
        if (n.side === 0) {
          const out = c < 3.4 ? 0 : (c - 3.4) * 26;
          x = n.p[0] * (1 - stretch) + n.dir[0] * out; y = n.p[1] * (1 - stretch) + n.dir[1] * out; z = n.p[2];
        } else {
          const ctr = n.side < 0 ? cA : cB;
          x = U.lerp(n.p[0] * (1 + wob), ctr + n.home[0], stretch);
          y = U.lerp(n.p[1] * (1 - wob), n.home[1], stretch);
          z = U.lerp(n.p[2], n.home[2], stretch);
          if (sep > 0) x = ctr + n.home[0];
        }
        return [x, y, z, n.pr];
      });
      list.sort(function (a, b) { return a[2] - b[2]; });
      ctx.globalAlpha = g.a * Math.min(fadeIn, fadeOut);
      const rr = Math.max(1.6, 0.85 * s);
      list.forEach(function (q) { U.drawBall(ctx, q[3] ? PROTON : NEUTRON, ox + q[0] * s, oy + q[1] * s, rr); });
      // The incoming neutron.
      if (c < 1.6) {
        const x = ox + U.lerp(-60, -7.5, ease(c / 1.6)) * s;
        U.drawBall(ctx, NEUTRON, x, oy, rr);
        ctx.globalCompositeOperation = 'lighter';
        U.drawGlow(ctx, [180, 200, 255], x, oy, rr * 3);
        ctx.globalCompositeOperation = 'source-over';
        U.label(ctx, g, 'a slow neutron', x, oy - rr - 16, { align: 'center' });
      }
      // The flash: energy released.
      if (c > 3.35 && c < 4.6) {
        const k = (c - 3.35) / 1.25;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = g.a * (1 - k);
        U.drawGlow(ctx, [255, 240, 210], ox + (cA + cB) / 2 * s, oy, (6 + k * 40) * s);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = g.a * Math.min(fadeIn, fadeOut);
      if (c < 3.0) U.label(ctx, g, 'uranium-235: 92 protons, 143 neutrons', ox, oy + 9.5 * s + 18, { align: 'center' });
      if (c > 3.8) {
        U.label(ctx, g, 'barium', ox + cA * s, oy + this.RA * s + 18, { align: 'center' });
        U.label(ctx, g, 'krypton', ox + cB * s, oy + this.RB * s + 18, { align: 'center' });
        U.label(ctx, g, '3 neutrons, free to split more nuclei', ox, oy - 10 * s - 22, { align: 'center', alpha: 0.85 });
      }
    }
  });

  /* ---------- A proton ---------- */

  OM.scene({
    id: 'proton', unit: 1e-15, win: [-14.0, -14.35, -15.3, -15.8],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, t = g.t;
      const R = 0.84 * s;
      ctx.globalAlpha = g.a;
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 1.25);
      gr.addColorStop(0, 'rgba(255,120,90,0.28)');
      gr.addColorStop(0.7, 'rgba(255,90,70,0.16)');
      gr.addColorStop(1, 'rgba(255,80,60,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(ox, oy, R * 1.25, 0, TAU);
      ctx.fill();
      // Three quarks, joined by gluons.
      const q = [0, 1, 2].map(function (i) {
        const a = t * 0.5 + i * TAU / 3 + Math.sin(t * 0.9 + i) * 0.3, d = 0.42 + 0.06 * Math.sin(t * 1.3 + i * 2);
        return [ox + Math.cos(a) * d * s, oy + Math.sin(a) * d * s];
      });
      for (let i = 0; i < 3; i++) {
        const a = q[i], b = q[(i + 1) % 3], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
        ctx.strokeStyle = 'rgba(255,230,200,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k <= 60; k++) {
          const u = k / 60, w = Math.sin(u * TAU * 7 + t * 8) * Math.min(6, L * 0.04);
          const x = a[0] + dx * u - dy / L * w, y = a[1] + dy * u + dx / L * w;
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      const cols = [[255, 90, 90], [90, 230, 120], [100, 150, 255]];
      q.forEach(function (p, i) {
        U.drawGlow(ctx, cols[i], p[0], p[1], 18);
      });
      ctx.globalCompositeOperation = 'source-over';
      q.forEach(function (p, i) { U.drawBall(ctx, cols[i], p[0], p[1], 6); });
      ['up quark', 'up quark', 'down quark'].forEach(function (n, i) {
        U.label(ctx, g, n, q[i][0] + 10, q[i][1] - 14, { alpha: 0.9 });
      });
      if (!g.small) U.label(ctx, g, 'gluons hold them together', (q[0][0] + q[1][0]) / 2 + 12, (q[0][1] + q[1][1]) / 2 + 18, { alpha: 0.7 });
      U.label(ctx, g, 'a proton, 1.7 × 10⁻¹⁵ m across', ox, oy + R * 1.25 + 20, { align: 'center', alpha: 0.85 });
    }
  });

  /* ---------- LIGO's measurement ---------- */

  // The shape of the 14 September 2015 signal: a rising chirp, the merger, the ringdown.
  function chirp(u) {
    // u from 0 to 1 over about 0.2 s; the merger is at u = 0.86.
    const tm = 0.86;
    if (u < tm) {
      const tau = (tm - u) / tm;
      const f = Math.pow(Math.max(tau, 0.012), -3 / 8);
      const ph = -2 * Math.PI * 5.2 * Math.pow(Math.max(tau, 0.012), 5 / 8) / (5 / 8);
      return { h: Math.pow(f, 2 / 3) * Math.cos(ph) / 21, phase: ph };
    }
    const k = (u - tm) / (1 - tm);
    const ph0 = -2 * Math.PI * 5.2 * Math.pow(0.012, 5 / 8) / (5 / 8);
    return { h: Math.exp(-k * 7) * Math.cos(ph0 + k * 2 * Math.PI * 4) * Math.pow(Math.pow(0.012, -3 / 8), 2 / 3) / 21, phase: 0 };
  }
  const PEAK = (function () { let m = 0; for (let i = 0; i <= 2000; i++) m = Math.max(m, Math.abs(chirp(i / 2000).h)); return m; })();

  OM.scene({
    id: 'ligo', unit: 1e-18, win: [-15.9, -16.5, -99, -99],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, W = g.W;
      const amp = 4;                                  // 4 × 10⁻¹⁸ m at the peak
      const x0 = g.small ? 16 : Math.max(ox - g.view * 0.36, 16), x1 = g.small ? W - 16 : Math.min(W - 80, ox + g.view * 0.58);
      ctx.globalAlpha = g.a;
      // Zero line.
      ctx.strokeStyle = U.ink(g, 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, oy);
      ctx.lineTo(x1, oy);
      ctx.stroke();
      // The trace draws itself, holds, and starts again.
      const cyc = 6, c = ((g.t % cyc) + cyc) % cyc, shown = U.clamp(c / 3.2, 0, 1);
      const fade = c > 5.4 ? 1 - (c - 5.4) / 0.6 : 1;
      ctx.globalCompositeOperation = 'lighter';
      let lastX = x0, lastY = oy;
      [[6, 0.15], [1.8, 1]].forEach(function (pass) {
        ctx.strokeStyle = 'rgba(242,196,107,' + (pass[1] * fade * g.a).toFixed(3) + ')';
        ctx.lineWidth = pass[0];
        ctx.beginPath();
        const n = Math.round((x1 - x0) / 1.5);
        for (let i = 0; i <= n * shown; i++) {
          const u = i / n, h = chirp(u).h / PEAK;
          const x = x0 + (x1 - x0) * u, y = oy - h * amp * s;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          lastX = x; lastY = y;
        }
        ctx.stroke();
      });
      if (shown < 1) U.drawGlow(ctx, [255, 220, 150], lastX, lastY, 14);
      ctx.globalCompositeOperation = 'source-over';
      // The size of the stretch, marked.
      const px = x0 + (x1 - x0) * 0.83;
      ctx.strokeStyle = U.ink(g, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 5, oy - amp * s); ctx.lineTo(px + 5, oy - amp * s);
      ctx.moveTo(px, oy - amp * s); ctx.lineTo(px, oy);
      ctx.moveTo(px - 5, oy); ctx.lineTo(px + 5, oy);
      ctx.stroke();
      U.label(ctx, g, '4 × 10⁻¹⁸ m', px, oy - amp * s - 16, { align: 'center', color: 'rgba(242,196,107,1)' });
      U.label(ctx, g, 'time →  about 0.2 seconds', x1, oy + amp * s + 26, { align: 'right', alpha: 0.7 });
      U.label(ctx, g, g.small ? 'how much LIGO’s arms\nchanged length' : 'how much LIGO’s arms changed length (signal shape simplified)', x0, oy - amp * s - (g.small ? 52 : 44), { alpha: 0.8 });
    }
  });
})();
