/* Orders of Magnitude: shared helpers and the list of scenes.
   Each scene is drawn in its own units (megaparsecs, meters, femtometers…)
   and knows the range of sizes where it can be seen. */
(function () {
  'use strict';

  const OM = window.OM = { scenes: [] };
  const U = OM.util = {};

  // A small seeded random number generator, so every visit draws the same sky.
  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  U.gauss = function (r) {
    let u = 0;
    while (!u) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };

  U.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };

  // Smoothstep from a to b (a may be larger than b).
  U.smooth = function (a, b, x) {
    let t = (x - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  };

  // How visible a scene is at size z, given [appear, full, fading, gone].
  U.win = function (z, w) {
    if (z > w[0] || z < w[3]) return 0;
    if (z > w[1]) return U.smooth(w[0], w[1], z);
    if (z < w[2]) return U.smooth(w[3], w[2], z);
    return 1;
  };

  U.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h || w));
    return c;
  };

  U.rgba = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };

  // Soft glow sprites, one per color.
  const glows = {};
  U.glow = function (c) {
    const key = c.join(',');
    if (glows[key]) return glows[key];
    const s = U.canvas(64), g = s.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, U.rgba(c, 1));
    gr.addColorStop(0.18, U.rgba(c, 0.55));
    gr.addColorStop(0.45, U.rgba(c, 0.14));
    gr.addColorStop(1, U.rgba(c, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return (glows[key] = s);
  };

  U.drawGlow = function (ctx, c, x, y, r) {
    ctx.drawImage(U.glow(c), x - r, y - r, r * 2, r * 2);
  };

  // Lit spheres (atoms, nucleons, balls), lit from the upper left.
  const balls = {};
  U.ball = function (c) {
    const key = c.join(',');
    if (balls[key]) return balls[key];
    const s = U.canvas(64), g = s.getContext('2d');
    const gr = g.createRadialGradient(24, 22, 2, 32, 32, 31);
    const hi = c.map(function (v) { return Math.round(v + (255 - v) * 0.55); });
    const lo = c.map(function (v) { return Math.round(v * 0.32); });
    gr.addColorStop(0, U.rgba(hi, 1));
    gr.addColorStop(0.35, U.rgba(c, 1));
    gr.addColorStop(1, U.rgba(lo, 1));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(32, 32, 31, 0, Math.PI * 2);
    g.fill();
    return (balls[key] = s);
  };

  U.drawBall = function (ctx, c, x, y, r) {
    ctx.drawImage(U.ball(c), x - r, y - r, r * 2, r * 2);
  };

  // Text colors that suit the scene behind them.
  U.ink = function (g, a) {
    return g.light ? 'rgba(18,20,27,' + a + ')' : 'rgba(236,238,244,' + a + ')';
  };

  // A small annotation, with an optional leader line to what it names.
  U.label = function (ctx, g, text, x, y, opt) {
    opt = opt || {};
    const size = opt.size || (g.small ? 10 : 11);
    ctx.save();
    ctx.globalAlpha = (opt.alpha == null ? 1 : opt.alpha) * g.a;
    if (opt.to) {
      ctx.strokeStyle = U.ink(g, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(opt.to[0], opt.to[1]);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = U.ink(g, 0.8);
      ctx.beginPath();
      ctx.arc(opt.to[0], opt.to[1], 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = (opt.weight || 500) + ' ' + size + 'px "DM Mono", ui-monospace, Menlo, monospace';
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = opt.base || 'middle';
    let dx = opt.to ? (ctx.textAlign === 'right' ? -5 : ctx.textAlign === 'left' ? 5 : 0) : 0;
    const lines = String(text).split('\n');
    let w = 0;
    lines.forEach(function (line) { w = Math.max(w, ctx.measureText(line).width); });
    const left = ctx.textAlign === 'center' ? x + dx - w / 2 : ctx.textAlign === 'right' ? x + dx - w : x + dx;
    if (left < 8) dx += 8 - left;
    else if (left + w > g.W - 8) dx -= left + w - (g.W - 8);
    lines.forEach(function (line, i) {
      const ly = y + i * size * 1.35;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = g.light ? 'rgba(255,255,255,0.7)' : 'rgba(4,5,9,0.75)';
      ctx.strokeText(line, x + dx, ly);
      ctx.fillStyle = opt.color || U.ink(g, 0.92);
      ctx.fillText(line, x + dx, ly);
    });
    ctx.restore();
  };

  // The color of light of a given wavelength, roughly as the eye sees it.
  U.waveRGB = function (nm) {
    let r = 0, gg = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { gg = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { gg = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; gg = 1; }
    else if (nm < 645) { r = 1; gg = -(nm - 645) / 65; }
    else { r = 1; }
    let f = 1;
    if (nm > 700) f = 0.3 + 0.7 * (780 - nm) / 80;
    else if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    const c = function (v) { return Math.round(255 * Math.pow(Math.max(0, v * f), 0.8)); };
    return [c(r), c(gg), c(b)];
  };

  // A smooth value-noise field, for clouds and texture.
  U.noise2 = function (seed, w, h) {
    const r = U.rng(seed), grid = [];
    for (let i = 0; i < w * h; i++) grid.push(r());
    return function (x, y) {
      x = ((x % w) + w) % w;
      y = ((y % h) + h) % h;
      const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
      const x1 = (x0 + 1) % w, y1 = (y0 + 1) % h;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = grid[y0 * w + x0], b = grid[y0 * w + x1], c = grid[y1 * w + x0], d = grid[y1 * w + x1];
      return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    };
  };

  OM.scene = function (s) {
    OM.scenes.push(s);
    return s;
  };
})();
