/* Orders of Magnitude: the Earth (with real coastlines), the Moon's orbit,
   GPS satellites, and the clouds over Pisa. */
(function () {
  'use strict';

  const OM = window.OM, U = OM.util;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const MM = 1e6;                         // these scenes measure in thousands of km
  const RE = 6.371;                       // Earth's radius
  const PISA = [43.723, 10.396];

  /* ---------- Land, from the compressed map ---------- */

  let land = null, LW = 0, LH = 0, RB = 0;
  (function load() {
    const d = window.OM_LAND;
    if (!d || typeof DecompressionStream === 'undefined') return;
    try {
      const bin = atob(d.data), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
      new Response(stream).arrayBuffer().then(function (buf) {
        land = new Uint8Array(buf);
        LW = d.w; LH = d.h; RB = LW >> 3;
        OM.dirty = true;
      }).catch(function () { /* the Earth stays an ocean world */ });
    } catch (e) { /* the same */ }
  })();

  function bit(x, y) {
    if (y < 0) y = 0; else if (y >= LH) y = LH - 1;
    x = ((x % LW) + LW) % LW;
    return (land[y * RB + (x >> 3)] >> (7 - (x & 7))) & 1;
  }

  // How much of this spot is land, 0 to 1, smoothly between map cells.
  function landAt(lon, lat) {
    if (!land) return 0;
    const fx = (lon + 180) / 360 * LW - 0.5, fy = (90 - lat) / 180 * LH - 0.5;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const a = bit(x0, y0), b = bit(x0 + 1, y0), c = bit(x0, y0 + 1), d = bit(x0 + 1, y0 + 1);
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  }

  const cloudNoise = U.noise2(77, 48, 24), terrain = U.noise2(78, 128, 64);
  function clouds(lon, lat) {
    const x = (lon + 180) / 360 * 48, y = (90 - lat) / 180 * 24;
    // Five octaves, with a gentle swirl, for soft and ragged cloud.
    const wx = x + cloudNoise(x * 1.7 + 5, y * 1.7) * 1.4, wy = y + cloudNoise(x * 1.7, y * 1.7 + 9) * 0.9;
    let v = 0, amp = 0.5, f = 1;
    for (let k = 0; k < 5; k++) {
      v += cloudNoise(wx * f, wy * f) * amp;
      amp *= 0.5;
      f *= 2.03;
    }
    // Fewer clouds over the subtropical deserts, more in the storm belts.
    const al = Math.abs(lat);
    v += al < 12 ? 0.04 : al < 32 ? -0.08 : al < 65 ? 0.05 : 0;
    return U.smooth(0.5, 0.78, v);
  }

  function landColor(lat, lon, out) {
    const tx = (lon + 180) / 360 * 128, ty = (90 - lat) / 180 * 64;
    const al = Math.abs(lat), n = terrain(tx, ty) * 0.55 + terrain(tx * 2.7 + 3, ty * 2.7) * 0.3 + terrain(tx * 7.1, ty * 7.1 + 5) * 0.15;
    let r, g, b;
    if (lat < -62 || (lat > 60 && lon > -75 && lon < -10) || al > 78) { r = 232; g = 238; b = 244; }
    else if (al < 14) { r = 46 + n * 30; g = 98 + n * 30; b = 48; }
    else if (al < 34) {
      // Deserts toward the middle of the band, greener at its edges.
      const d = U.clamp(U.smooth(0.25, 0.75, n) * 0.6 + (1 - Math.abs(al - 24) / 10) * 0.6, 0, 1);
      r = U.lerp(98, 200, d); g = U.lerp(122, 170, d); b = U.lerp(64, 114, d);
    }
    else if (al < 60) { r = 70 + n * 40; g = 104 + n * 30; b = 58; }
    else { r = 110 + n * 30; g = 118 + n * 20; b = 100; }
    out[0] = r; out[1] = g; out[2] = b;
  }

  /* ---------- The globe, drawn pixel by pixel ---------- */

  const L = (function () { const v = [-0.55, 0.5, 0.67], m = Math.hypot(v[0], v[1], v[2]); return v.map(function (x) { return x / m; }); })();
  let gCan = null, gCtx = null, gImg = null, gKey = '';

  OM.drawGlobe = function (g, cx, cy, R, lat0, lon0, cloudy) {
    if (cloudy == null) cloudy = 0.85;
    const ctx = g.ctx, W = g.W, H = g.H;
    if (R < 2) {
      ctx.globalAlpha = g.a;
      U.drawGlow(ctx, [120, 170, 255], cx, cy, 5);
      return;
    }
    const bx0 = Math.max(0, Math.floor(cx - R)), bx1 = Math.min(W, Math.ceil(cx + R));
    const by0 = Math.max(0, Math.floor(cy - R)), by1 = Math.min(H, Math.ceil(cy + R));
    if (bx1 <= bx0 || by1 <= by0) return;
    const bw = bx1 - bx0, bh = by1 - by0;
    const budget = g.small ? 150000 : 240000;
    const q = Math.min(g.dpr, Math.sqrt(budget / (bw * bh)));
    const iw = Math.max(1, Math.round(bw * q)), ih = Math.max(1, Math.round(bh * q));
    const key = [iw, ih, cx.toFixed(1), cy.toFixed(1), R.toFixed(1), lat0.toFixed(2), lon0.toFixed(2), cloudy.toFixed(2), !!land].join('|');
    if (key !== gKey) {
      gKey = key;
      if (!gCan || gCan.width !== iw || gCan.height !== ih) {
        gCan = U.canvas(iw, ih);
        gCtx = gCan.getContext('2d');
        gImg = gCtx.createImageData(iw, ih);
      }
      const d = gImg.data, cl = Math.cos(lat0 * DEG), sl = Math.sin(lat0 * DEG), co = Math.cos(lon0 * DEG), so = Math.sin(lon0 * DEG);
      const col = [0, 0, 0];
      let k = 0;
      for (let j = 0; j < ih; j++) {
        const ny = (cy - (by0 + (j + 0.5) / q)) / R;
        for (let i = 0; i < iw; i++, k += 4) {
          const nx = (bx0 + (i + 0.5) / q - cx) / R;
          const rr = nx * nx + ny * ny;
          if (rr > 1) { d[k + 3] = 0; continue; }
          const nz = Math.sqrt(1 - rr);
          // From the view to the Earth: tilt by latitude, then turn by longitude.
          const y1 = ny * cl + nz * sl, z1 = -ny * sl + nz * cl;
          const ex = nx * co + z1 * so, ez = -nx * so + z1 * co;
          const lat = Math.asin(y1 < -1 ? -1 : y1 > 1 ? 1 : y1) / DEG, lon = Math.atan2(ex, ez) / DEG;
          const f = U.smooth(0.3, 0.7, landAt(lon, lat));
          let r = 16, gg = 58, b = 118;
          if (f > 0) {
            landColor(lat, lon, col);
            r += (col[0] - r) * f; gg += (col[1] - gg) * f; b += (col[2] - b) * f;
          }
          const c = clouds(lon, lat) * cloudy;
          r += (246 - r) * c; gg += (248 - gg) * c; b += (252 - b) * c;
          const sh = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
          const lit = 0.16 + 0.95 * sh;
          // A blue haze toward the edge, where we look through more air.
          const haze = Math.pow(1 - nz, 2.2) * 0.75;
          d[k] = (r * lit) * (1 - haze) + 120 * haze;
          d[k + 1] = (gg * lit) * (1 - haze) + 175 * haze;
          d[k + 2] = (b * lit) * (1 - haze) + 255 * haze;
          d[k + 3] = rr > 0.995 ? 255 * (1 - (rr - 0.995) / 0.005) : 255;
        }
      }
      gCtx.putImageData(gImg, 0, 0);
    }
    ctx.globalAlpha = g.a;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(gCan, bx0, by0, bw, bh);
    // The thin blue line of the atmosphere.
    if (R < 4 * Math.max(W, H)) {
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.09);
      gr.addColorStop(0, 'rgba(90,160,255,0)');
      gr.addColorStop(0.3, 'rgba(110,175,255,0.42)');
      gr.addColorStop(1, 'rgba(90,150,255,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.09, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  // Where the globe faces: Europe and Africa at first, then Pisa.
  function view(z) {
    const k = U.smooth(7.75, 6.9, z);
    return [U.lerp(22, PISA[0], k), U.lerp(-8, PISA[1], k)];
  }

  // A point on Earth (lat, lon, height in Earth radii) as seen from the view.
  function toView(lat, lon, h, v) {
    const cl = Math.cos(lat * DEG), e = [cl * Math.sin(lon * DEG), Math.sin(lat * DEG), cl * Math.cos(lon * DEG)];
    return rot(e, v, h);
  }
  function rot(e, v, h) {
    const co = Math.cos(v[1] * DEG), so = Math.sin(v[1] * DEG), cl = Math.cos(v[0] * DEG), sl = Math.sin(v[0] * DEG);
    const x1 = e[0] * co - e[2] * so, z1 = e[0] * so + e[2] * co;
    const y2 = e[1] * cl - z1 * sl, z2 = e[1] * sl + z1 * cl;
    return [x1 * h, y2 * h, z2 * h];
  }

  OM.scene({
    id: 'earth', unit: MM, win: [11.8, 11.1, 6.0, 5.4],
    draw: function (g) {
      const v = view(g.z);
      // The sky clears over Italy as we come down.
      OM.drawGlobe(g, g.ox, g.oy, RE * g.s, v[0], v[1], 0.88 - 0.6 * U.smooth(7.6, 6.7, g.z));
      const lw = U.win(g.z, [8.6, 8.3, 7.15, 6.9]);
      if (lw > 0) {
        const p = toView(PISA[0], PISA[1], RE, v);
        if (p[2] > 0) {
          const x = g.ox + p[0] * g.s, y = g.oy - p[1] * g.s;
          U.label(g.ctx, g, 'Pisa, Italy', x + 30, y - 26, { to: [x, y], alpha: lw });
        }
      }
      const ew = U.win(g.z, [10.6, 10.2, 9.4, 9.0]);
      if (ew > 0) U.label(g.ctx, g, 'Earth', g.ox, g.oy + Math.max(10, RE * g.s) + 16, { align: 'center', alpha: ew });
    }
  });

  /* ---------- The Moon's orbit: Newton ---------- */

  const MOON_R = 384.4, MOON_PERIOD = 36;

  OM.scene({
    id: 'moon', unit: MM, win: [10.4, 9.8, 8.6, 8.1],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy;
      const ang = -0.6 - TAU * g.t / MOON_PERIOD;
      const mx = ox + Math.cos(ang) * MOON_R * s, my = oy + Math.sin(ang) * MOON_R * s;
      ctx.globalAlpha = g.a;
      ctx.setLineDash([2, 6]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = U.ink(g, 0.4);
      ctx.beginPath();
      ctx.arc(ox, oy, MOON_R * s, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'lighter';
      U.drawGlow(ctx, [110, 170, 255], ox, oy, Math.max(14, RE * s * 3));
      ctx.globalCompositeOperation = 'source-over';
      // The straight line the Moon would follow without gravity.
      const tx = Math.sin(ang), ty = -Math.cos(ang), len = MOON_R * 0.55 * s;
      ctx.strokeStyle = 'rgba(242,196,107,0.85)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + tx * len, my + ty * len);
      ctx.stroke();
      ctx.setLineDash([]);
      arrowHead(ctx, mx + tx * len, my + ty * len, tx, ty, 'rgba(242,196,107,0.85)');
      // and the fall toward Earth.
      const fx = ox - mx, fy = oy - my, fl = Math.hypot(fx, fy), fall = Math.min(60, fl * 0.22);
      ctx.strokeStyle = 'rgba(160,210,255,0.9)';
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + fx / fl * fall, my + fy / fl * fall);
      ctx.stroke();
      arrowHead(ctx, mx + fx / fl * fall, my + fy / fl * fall, fx / fl, fy / fl, 'rgba(160,210,255,0.9)');
      // The Moon itself, lit like the Earth.
      const mr = Math.max(3.5, 1.737 * s);
      U.drawBall(ctx, [196, 196, 192], mx, my, mr);
      U.label(ctx, g, 'the Moon', mx + mr + 8, my + mr + 12, { alpha: 0.9 });
      if (!g.small) {
        U.label(ctx, g, 'without gravity it would\nfly off this way', mx + tx * len * 0.75 + 10, my + ty * len * 0.75 - 26, { alpha: 0.85, color: 'rgba(242,196,107,1)' });
      }
      U.label(ctx, g, 'gravity pulls it in', mx + fx / fl * fall * 0.6 + 12, my + fy / fl * fall * 0.6 + 14, { alpha: 0.85, color: 'rgba(160,210,255,1)' });
      U.label(ctx, g, '384,400 km', ox + MOON_R * s * 0.7071 + 8, oy + MOON_R * s * 0.7071 + 8, { alpha: 0.6 });
    }
  });

  function arrowHead(ctx, x, y, dx, dy, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + dx * 7, y + dy * 7);
    ctx.lineTo(x - dy * 4, y + dx * 4);
    ctx.lineTo(x + dy * 4, y - dx * 4);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------- GPS: Einstein ---------- */

  const GPS_R = 26.56, INC = 55 * DEG, GPS_PERIOD = 40;

  function gpsPoint(plane, u) {
    const O = plane * 60 * DEG + 0.3;
    const n = [Math.sin(O), 0, Math.cos(O)];
    const m = [Math.cos(INC) * Math.cos(O), Math.sin(INC), -Math.cos(INC) * Math.sin(O)];
    return [n[0] * Math.cos(u) + m[0] * Math.sin(u), n[1] * Math.cos(u) + m[1] * Math.sin(u), n[2] * Math.cos(u) + m[2] * Math.sin(u)];
  }

  OM.scene({
    id: 'gps', unit: MM, win: [9.0, 8.4, 7.3, 6.9],
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, v = view(g.z), Rp = RE * s;
      const hidden = function (p) { return p[2] < 0 && p[0] * p[0] + p[1] * p[1] < RE * RE; };
      ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        let prev = null;
        for (let i = 0; i <= 96; i++) {
          const p = rot(gpsPoint(k, i / 96 * TAU), v, GPS_R);
          const q = [ox + p[0] * s, oy - p[1] * s];
          if (prev && !hidden(p)) {
            ctx.strokeStyle = 'rgba(242,196,107,' + ((p[2] > 0 ? 0.32 : 0.14) * g.a).toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(prev[0], prev[1]);
            ctx.lineTo(q[0], q[1]);
            ctx.stroke();
          }
          prev = q;
        }
      }
      // Pisa, and the satellites in its sky.
      const pv = toView(PISA[0], PISA[1], RE, v), px = ox + pv[0] * s, py = oy - pv[1] * s;
      const up = [pv[0] / RE, pv[1] / RE, pv[2] / RE];
      const sats = [];
      for (let k = 0; k < 6; k++) {
        for (let j = 0; j < 4; j++) {
          const u = j * TAU / 4 + k * 0.52 + TAU * g.t / GPS_PERIOD;
          const p = rot(gpsPoint(k, u), v, GPS_R);
          const sky = (p[0] - pv[0]) * up[0] + (p[1] - pv[1]) * up[1] + (p[2] - pv[2]) * up[2];
          sats.push({ p: p, x: ox + p[0] * s, y: oy - p[1] * s, sky: sky, hid: hidden(p) });
        }
      }
      if (pv[2] > 0) {
        const seen = sats.filter(function (st) { return st.sky > 2 && !st.hid; }).sort(function (a, b) { return b.sky - a.sky; }).slice(0, 4);
        ctx.setLineDash([3, 6]);
        ctx.lineDashOffset = -g.t * 30;
        ctx.strokeStyle = 'rgba(242,196,107,' + (0.55 * g.a).toFixed(3) + ')';
        seen.forEach(function (st) {
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(px, py);
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
      let tagged = null;
      sats.forEach(function (st) {
        if (st.hid) return;
        ctx.globalAlpha = g.a * (st.p[2] > 0 ? 1 : 0.5);
        ctx.strokeStyle = 'rgba(200,215,240,0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(st.x - 5, st.y);
        ctx.lineTo(st.x + 5, st.y);
        ctx.stroke();
        ctx.fillStyle = '#f2c46b';
        ctx.fillRect(st.x - 1.6, st.y - 1.6, 3.2, 3.2);
        if (!tagged && st.p[2] > 0 && st.x > ox + Rp * 1.3 && st.y < oy) tagged = st;
      });
      ctx.globalAlpha = g.a;
      if (tagged) U.label(ctx, g, 'its clock gains\n38 µs every day', tagged.x + 14, tagged.y - 16, { to: [tagged.x + 3, tagged.y - 3], color: 'rgba(242,196,107,1)' });
      U.label(ctx, g, 'GPS satellites, 20,200 km up', ox, oy + GPS_R * s + 22, { align: 'center', alpha: 0.85 });
    }
  });

  /* ---------- Falling through the clouds ---------- */

  let puff = null;
  function puffSprite() {
    if (puff) return puff;
    const c = U.canvas(128), x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 58, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.5, 'rgba(246,249,253,0.7)');
    gr.addColorStop(0.8, 'rgba(222,232,245,0.25)');
    gr.addColorStop(1, 'rgba(210,222,240,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 128, 128);
    return (puff = c);
  }

  OM.scene({
    id: 'clouds', unit: 1000, win: [6.4, 5.75, 3.95, 3.35],
    init: function () {
      const r = U.rng(51);
      this.p = [];
      for (let i = 0; i < 240; i++) {
        const d = Math.pow(10, -1 + r() * 3.9), a = r() * TAU;
        const size = d * (0.3 + r() * 0.45) + 0.04;
        for (let j = 0; j < 3; j++) {
          this.p.push([d * Math.cos(a) + U.gauss(r) * size * 0.5, d * Math.sin(a) + U.gauss(r) * size * 0.3, size * (0.6 + r() * 0.6)]);
        }
      }
    },
    draw: function (g) {
      const ctx = g.ctx, s = g.s, ox = g.ox, oy = g.oy, sp = puffSprite();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = g.a * 0.85;
      this.p.forEach(function (p) {
        const r = p[2] * s;
        if (r < 1.5 || r > 6 * Math.max(g.W, g.H)) return;
        const x = ox + p[0] * s, y = oy + p[1] * s;
        if (x + r < 0 || y + r < 0 || x - r > g.W || y - r > g.H) return;
        ctx.drawImage(sp, x - r, y - r, r * 2, r * 2);
      });
    }
  });
})();
