/* Chain Reaction: a small drawing for each discovery, made from its own
   physics (parabolas for Galileo, orbits for Newton, field lines for
   Faraday...). Used on the collectible cards and the certificate. Every
   drawing is an SVG string in a 200 x 140 box, drawn in currentColor so it
   takes the color of wherever it is placed. */
(function () {
  'use strict';

  const PH = (window.PH = window.PH || {});
  const W = 200, H = 140;
  const f1 = function (n) { return (Math.round(n * 10) / 10).toString(); };

  function path(points) {
    return points.map(function (p, i) { return (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); }).join(' ');
  }

  // Small seeded random numbers, so each drawing is the same every time.
  function rand(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  // Line style: S for outlines, SF for shapes that set their own fill (an
  // attribute may appear only once when the drawing is loaded as an image).
  const SF = 'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const S = 'fill="none" ' + SF;

  const DRAW = {
    // A fountain of parabolas, all with the same g, and strobe dots 1 : 3 : 5 : 7.
    galileo: function () {
      let out = '<path d="M14 126H186" ' + S + ' stroke-opacity=".35"/>';
      const v = 10, g = 0.9;
      [0.5, 0.72, 0.94, 1.14, 1.34].forEach(function (a, i) {
        [-1, 1].forEach(function (side) {
          const pts = [], T = (2 * v * Math.sin(a)) / g;
          for (let k = 0; k <= 40; k++) {
            const t = (k / 40) * T;
            pts.push([100 + side * v * Math.cos(a) * t * 0.72, 126 - (v * Math.sin(a) * t - 0.5 * g * t * t) * 1.55]);
          }
          out += '<path d="' + path(pts) + '" ' + S + ' stroke-width="1.4" stroke-opacity="' + (0.35 + i * 0.13) + '"/>';
        });
      });
      // Strobe dots: in equal moments a falling thing covers 1, 3, 5, 7 units.
      [0, 1, 4, 9, 16].forEach(function (k) {
        out += '<circle cx="186" cy="' + f1(12 + k * 6.8) + '" r="3" fill="currentColor"/>';
      });
      return out;
    },

    // The Earth, a mountain cannon, shots that fall, one that orbits.
    newton: function () {
      let out = '<circle cx="100" cy="72" r="30" fill="currentColor" fill-opacity=".14" ' + SF + ' stroke-opacity=".6"/>';
      out += '<circle cx="100" cy="72" r="46" ' + S + ' stroke-width="1.6"/>';
      out += '<ellipse cx="124" cy="72" rx="70" ry="52" ' + S + ' stroke-width="1.2" stroke-opacity=".55"/>';
      [0.35, 0.7].forEach(function (k) {
        const pts = [];
        for (let a = 0; a <= Math.PI * k * 1.2; a += 0.05) {
          const r = 46 - (a / (Math.PI * k * 1.2)) * 16;
          pts.push([100 + Math.sin(a) * r, 72 - Math.cos(a) * r]);
        }
        out += '<path d="' + path(pts) + '" ' + S + ' stroke-width="1.2" stroke-opacity=".7" stroke-dasharray="2 4"/>';
      });
      out += '<path d="M92 43 100 26 108 43" fill="currentColor" fill-opacity=".5"/>';
      out += '<circle cx="146" cy="72" r="4" fill="currentColor"/>';
      return out;
    },

    // A bar magnet, its field lines, and a coil.
    faraday: function () {
      let out = '';
      for (let k = 1; k <= 4; k++) {
        const s = 12 + k * 12;
        out += '<path d="M126 70C' + (126 + k * 18) + ' ' + (70 - s * 1.3) + ' ' + (74 - k * 18) + ' ' + (70 - s * 1.3) + ' 74 70" ' + S + ' stroke-opacity="' + (0.85 - k * 0.15) + '"/>';
        out += '<path d="M126 70C' + (126 + k * 18) + ' ' + (70 + s * 1.3) + ' ' + (74 - k * 18) + ' ' + (70 + s * 1.3) + ' 74 70" ' + S + ' stroke-opacity="' + (0.85 - k * 0.15) + '"/>';
      }
      out += '<rect x="74" y="62" width="26" height="16" fill="currentColor" fill-opacity=".35" stroke="currentColor"/>';
      out += '<rect x="100" y="62" width="26" height="16" fill="currentColor" stroke="currentColor"/>';
      for (let i = 0; i < 5; i++) out += '<ellipse cx="' + (150 + i * 7) + '" cy="70" rx="3.5" ry="18" ' + S + ' stroke-width="1.6"/>';
      return out;
    },

    // One light wave, shortening from radio to light, over the spectrum.
    maxwell: function () {
      const pts = [], pts2 = [];
      for (let x = 12; x <= 188; x += 1) {
        const ph = 0.03 * Math.pow(x - 8, 1.45);
        pts.push([x, 58 - 26 * Math.sin(ph)]);
        pts2.push([x, 58 + 13 * Math.sin(ph)]);
      }
      let out = '<path d="M12 58H188" ' + S + ' stroke-opacity=".25"/>';
      out += '<path d="' + path(pts2) + '" ' + S + ' stroke-width="1.2" stroke-opacity=".4"/>';
      out += '<path d="' + path(pts) + '" ' + S + ' stroke-width="2"/>';
      out += '<defs><linearGradient id="emb-spec" x1="0" x2="1"><stop offset="0" stop-color="#8b1a1a"/><stop offset=".2" stop-color="#ff3b30"/><stop offset=".38" stop-color="#ffcc00"/><stop offset=".55" stop-color="#34c759"/><stop offset=".72" stop-color="#32ade6"/><stop offset=".88" stop-color="#5856d6"/><stop offset="1" stop-color="#3b1b6b"/></linearGradient></defs>';
      out += '<rect x="12" y="112" width="176" height="8" rx="4" fill="url(#emb-spec)" opacity=".85"/>';
      return out;
    },

    // A grid of atoms, some decayed, a few firing off particles.
    curie: function () {
      const r = rand(1898);
      let out = '';
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 12; col++) {
          const x = 23 + col * 14, y = 20 + row * 16;
          const live = r() > 0.45;
          out += live
            ? '<circle cx="' + x + '" cy="' + y + '" r="3.6" fill="currentColor"/>'
            : '<circle cx="' + x + '" cy="' + y + '" r="1.6" fill="currentColor" fill-opacity=".35"/>';
          if (!live && r() > 0.8) {
            const a = r() * Math.PI * 2;
            out += '<path d="M' + f1(x + Math.cos(a) * 5) + ' ' + f1(y + Math.sin(a) * 5) + 'L' + f1(x + Math.cos(a) * 13) + ' ' + f1(y + Math.sin(a) * 13) + '" ' + S + ' stroke-width="1.4"/>';
          }
        }
      }
      return out;
    },

    // Two light clocks: one ticking straight up and down, one on a zigzag.
    einstein: function () {
      let out = '<path d="M20 22H44M20 118H44" ' + S + ' stroke-width="2.4"/>';
      out += '<path d="M32 22V118" ' + S + ' stroke-opacity=".5" stroke-dasharray="3 4"/>';
      out += '<circle cx="32" cy="58" r="4" fill="currentColor"/>';
      const pts = [];
      for (let i = 0; i <= 4; i++) pts.push([62 + i * 30, i % 2 ? 22 : 118]);
      out += '<path d="' + path(pts) + '" ' + S + ' stroke-width="1.8"/>';
      [62, 122, 182].forEach(function (x) { out += '<path d="M' + (x - 10) + ' 118H' + (x + 10) + '" ' + S + ' stroke-width="2.4"/>'; });
      [92, 152].forEach(function (x) { out += '<path d="M' + (x - 10) + ' 22H' + (x + 10) + '" ' + S + ' stroke-width="2.4"/>'; });
      out += '<circle cx="137" cy="70" r="4" fill="currentColor"/>';
      return out;
    },

    // Alpha particles streaming past a nucleus; the close ones swing wide, one comes back.
    rutherford: function () {
      let out = '';
      const nx = 128, ny = 70;
      [-44, -30, -18, -9, 9, 18, 30, 44].forEach(function (b) {
        const pts = [];
        for (let x = 10; x <= 192; x += 2) {
          const dx = x - nx;
          const bend = (180 / (Math.abs(b) + 6)) * (dx > 0 ? Math.min(1, dx / 40) : 0);
          pts.push([x, ny + b + Math.sign(b) * bend]);
        }
        out += '<path d="' + path(pts) + '" ' + S + ' stroke-width="1.2" stroke-opacity="' + (Math.abs(b) < 10 ? 0.9 : 0.45) + '"/>';
      });
      out += '<path d="M10 70H' + (nx - 10) + 'Q' + (nx - 4) + ' 70 ' + (nx - 12) + ' 64T30 44" ' + S + ' stroke-width="1.8"/>';
      out += '<circle cx="' + nx + '" cy="' + ny + '" r="5" fill="currentColor"/>';
      out += '<circle cx="' + nx + '" cy="' + ny + '" r="12" ' + S + ' stroke-opacity=".3"/>';
      return out;
    },

    // Orbits, a jump down, and hydrogen's four colored lines.
    bohr: function () {
      let out = '';
      [12, 24, 38, 52].forEach(function (r, i) {
        out += '<circle cx="70" cy="62" r="' + r + '" ' + S + ' stroke-opacity="' + (0.8 - i * 0.14) + '"/>';
      });
      out += '<circle cx="70" cy="62" r="3.5" fill="currentColor"/>';
      out += '<circle cx="' + f1(70 + 38 * Math.cos(-0.6)) + '" cy="' + f1(62 + 38 * Math.sin(-0.6)) + '" r="3.5" fill="currentColor"/>';
      const pts = [];
      for (let x = 0; x <= 60; x += 1) pts.push([108 + x, 36 - x * 0.35 + 4 * Math.sin(x * 0.7)]);
      out += '<path d="' + path(pts) + '" ' + S + ' stroke-width="1.6"/>';
      out += '<rect x="120" y="96" width="68" height="26" rx="3" fill="#07090c" stroke="currentColor" stroke-opacity=".35"/>';
      [[184, '#ff2a1c'], [150, '#1ad9ff'], [136, '#5264ff'], [131, '#9c40ff']].forEach(function (l) {
        out += '<path d="M' + l[0] + ' 99V119" stroke="' + l[1] + '" stroke-width="2.4"/>';
      });
      return out;
    },

    // Two slits, the waves spreading from them, and stripes on the screen.
    debroglie: function () {
      let out = '<path d="M40 10V52M40 60V80M40 88V130" ' + S + ' stroke-width="3"/>';
      [56, 84].forEach(function (y) {
        for (let r = 12; r <= 110; r += 14) {
          out += '<path d="M' + f1(40 + r * Math.cos(-0.9)) + ' ' + f1(y + r * Math.sin(-0.9)) + 'A' + r + ' ' + r + ' 0 0 1 ' + f1(40 + r * Math.cos(0.9)) + ' ' + f1(y + r * Math.sin(0.9)) + '" ' + S + ' stroke-opacity="' + f1(0.5 - r / 260) + '"/>';
        }
      });
      for (let y = 8; y <= 132; y += 2) {
        const d = y - 70;
        const I = Math.pow(Math.cos(d / 6.5), 2) * Math.exp(-(d * d) / 2600);
        out += '<path d="M172 ' + y + 'H' + f1(172 + 18 * I) + '" stroke="currentColor" stroke-width="1.6" stroke-opacity="' + f1(0.25 + 0.75 * I) + '"/>';
      }
      return out;
    },

    // A spectrum: the laser's huge peak, and small shifted lines beside it.
    raman: function () {
      let out = '<path d="M14 116H186" ' + S + ' stroke-opacity=".4"/>';
      out += '<path d="M40 116V14" stroke="#4dff7a" stroke-width="3" stroke-linecap="round"/>';
      [[92, 52], [118, 30], [140, 70], [166, 22]].forEach(function (l) {
        out += '<path d="M' + l[0] + ' 116V' + (116 - l[1]) + '" ' + S + ' stroke-width="2.6"/>';
      });
      out += '<path d="M40 30C60 30 60 110 90 112" ' + S + ' stroke-opacity=".35" stroke-dasharray="2 4"/>';
      return out;
    },

    // A nucleus pinching into two, with neutrons flying out.
    meitner: function () {
      let out = '<path d="M64 70C64 44 90 42 100 58C110 42 136 44 136 70C136 96 110 98 100 82C90 98 64 96 64 70Z" fill="currentColor" fill-opacity=".22" ' + SF + ' stroke-width="1.6"/>';
      out += '<circle cx="36" cy="70" r="5" fill="currentColor"/><path d="M8 70H26" ' + S + ' stroke-dasharray="2 4"/>';
      [[-0.9, 1], [0.2, 0.9], [1.1, 0.8]].forEach(function (d) {
        const x = 142 + Math.cos(d[0]) * 40 * d[1], y = 70 + Math.sin(d[0]) * 40 * d[1];
        out += '<path d="M146 70L' + f1(x) + ' ' + f1(y) + '" ' + S + ' stroke-width="1.4"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="4" fill="currentColor"/>';
      });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        out += '<path d="M' + f1(100 + Math.cos(a) * 44) + ' ' + f1(70 + Math.sin(a) * 44) + 'L' + f1(100 + Math.cos(a) * 52) + ' ' + f1(70 + Math.sin(a) * 52) + '" ' + S + ' stroke-opacity=".35"/>';
      }
      return out;
    },

    // The chirp: a wave that rises in pitch and size, then rings down.
    ligo: function () {
      const pts = [];
      for (let x = 10; x <= 190; x += 0.5) {
        const t = (x - 10) / 150;
        let y;
        if (t < 1) {
          const w = Math.pow(1 - t * 0.985, -0.375);
          const ph = 18 * (1 - Math.pow(1 - t * 0.985, 0.625)) * 1.6;
          y = 84 - 8 * Math.pow(w, 1.2) * Math.cos(ph * 3.2);
        } else {
          const k = (x - 160) / 30;
          y = 84 - 34 * Math.exp(-k * 3) * Math.cos(k * 30);
        }
        pts.push([x, y]);
      }
      let out = '<path d="' + path(pts) + '" ' + S + ' stroke-width="1.6"/>';
      out += '<path d="M24 34V14H56" ' + S + ' stroke-width="2" stroke-opacity=".6"/>';
      out += '<circle cx="24" cy="34" r="3" fill="currentColor" fill-opacity=".6"/>';
      out += '<circle cx="150" cy="26" r="7" fill="currentColor"/><circle cx="168" cy="22" r="5.5" fill="currentColor" fill-opacity=".7"/>';
      return out;
    }
  };

  const cache = {};
  let uid = 0;

  // The SVG markup for one discovery. `opts.title` names it for assistive
  // tech; without one the drawing is decorative.
  PH.emblem = function (id, opts) {
    opts = opts || {};
    if (!DRAW[id]) return '';
    if (!cache[id]) cache[id] = DRAW[id]();
    const label = opts.title
      ? ' role="img" aria-label="' + String(opts.title).replace(/"/g, '&quot;') + '"'
      : ' aria-hidden="true" focusable="false"';
    // Gradient ids must be unique on the page (a hidden copy can't lend its gradient).
    const body = cache[id].replace(/emb-spec/g, 'emb-spec-' + (++uid));
    return '<svg class="emblem" viewBox="0 0 ' + W + ' ' + H + '"' + label + '>' + body + '</svg>';
  };

  // The same drawing as a standalone SVG document in one color, for
  // drawing onto a canvas.
  PH.emblemDoc = function (id, color) {
    if (!DRAW[id]) return '';
    if (!cache[id]) cache[id] = DRAW[id]();
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W * 2 + '" height="' + H * 2 + '" style="color:' + color + '">' + cache[id] + '</svg>';
  };
})();
