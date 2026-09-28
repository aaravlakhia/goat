/* Exp. 9: the double-slit experiment with electrons. Each electron lands at
   one random spot, but the odds follow a wave interference pattern. */
(function () {
  'use strict';

  const PH = window.PH;

  const MAX_HITS = 30000;
  const BINS = 120;
  const FLIGHT = 0.9;   // seconds for an animated electron to cross the stage

  function sinc(x) {
    return Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x;
  }

  PH.initDeBroglie = function () {
    const stage = document.getElementById('dbg-stage');
    if (!stage) return;
    const canvas = document.getElementById('dbg-canvas');
    const ctx = canvas.getContext('2d');
    const countOut = document.getElementById('dbg-count');
    const detOut = document.getElementById('dbg-detector');
    const msg = document.getElementById('dbg-msg');
    const watch = document.getElementById('dbg-watch');
    const rateBtns = Array.from(document.querySelectorAll('[data-dbg-rate]'));

    let rate = 40, spawn = 0;
    let hits = [];            // landing offsets from the center, as a fraction of the stage height
    let bins = new Float32Array(BINS);
    let flying = [], ripples = [], blips = [];
    let geo = null;
    const layer = document.createElement('canvas');
    const lctx = layer.getContext('2d');

    function layout() {
      const s = PH.fitCanvas(canvas);
      geo = {
        w: s.w, h: s.h, dpr: s.dpr, cy: s.h / 2,
        gunX: s.w * 0.06, wallX: s.w * 0.4, screenX: s.w * 0.78, histX: s.w * 0.81, histW: s.w * 0.16,
        slitGap: s.h * 0.13, slitW: s.h * 0.035, fringe: s.h * 0.075, span: s.h * 0.44
      };
      layer.width = canvas.width;
      layer.height = canvas.height;
      lctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      lctx.clearRect(0, 0, s.w, s.h);
      hits.forEach(function (f) { plotHit(f * geo.h); });
    }

    // Chance of landing at offset y (px) from the center line.
    function odds(y) {
      const env = Math.pow(sinc((Math.PI * y) / (geo.fringe * 4)), 2);
      if (watch.checked) return env;
      const c = Math.cos((Math.PI * y) / geo.fringe);
      return c * c * env;
    }

    function sample() {
      for (let tries = 0; tries < 1000; tries++) {
        const y = (Math.random() * 2 - 1) * geo.span;
        if (Math.random() < odds(y)) return y;
      }
      return 0;
    }

    function plotHit(y) {
      const x = geo.screenX + (Math.random() - 0.5) * 8;
      lctx.fillStyle = 'rgba(160, 225, 255, 0.55)';
      lctx.fillRect(x - 0.8, geo.cy + y - 0.8, 1.6, 1.6);
    }

    function land(y) {
      if (hits.length >= MAX_HITS) return;
      hits.push(y / geo.h);
      const b = Math.floor(((y + geo.span) / (2 * geo.span)) * BINS);
      if (b >= 0 && b < BINS) bins[b]++;
      plotHit(y);
      blips.push({ y: y, age: 0 });
    }

    function launch() {
      const y = sample();
      const slit = watch.checked ? (Math.random() < 0.5 ? -1 : 1) : 0;
      if (rate > 100) {
        land(y);
        return;
      }
      flying.push({ y: y, slit: slit, age: 0, rippled: false });
    }

    function readout() {
      const n = hits.length;
      PH.text(countOut, PH.formatInt(n));
      PH.text(detOut, watch.checked ? 'on' : 'off');
      let text;
      if (watch.checked) {
        text = n < 300
          ? 'The detector now records which slit each electron goes through…'
          : 'With the detector on, the stripes vanish. The electrons pile up in one smooth band, as tiny bullets would.';
      } else if (n < 40) {
        text = 'Each dot is one electron. So far they look completely random.';
      } else if (n < 500) {
        text = 'Keep watching. Bands are starting to appear.';
      } else {
        text = 'Stripes! Each electron interfered with itself, as if it went through both slits at once.';
      }
      PH.text(msg, text);
    }

    function step(dt) {
      spawn += dt * rate;
      while (spawn >= 1) {
        spawn -= 1;
        launch();
      }
      for (let i = flying.length - 1; i >= 0; i--) {
        const e = flying[i];
        e.age += dt;
        if (!e.rippled && e.age > FLIGHT * 0.45) {
          e.rippled = true;
          if (rate < 100) {
            if (e.slit === 0) {
              ripples.push({ y: -geo.slitGap / 2, age: 0 }, { y: geo.slitGap / 2, age: 0 });
            } else {
              ripples.push({ y: (e.slit * geo.slitGap) / 2, age: 0, seen: true });
            }
          }
        }
        if (e.age >= FLIGHT) {
          land(e.y);
          flying.splice(i, 1);
        }
      }
      [ripples, blips].forEach(function (list) {
        for (let i = list.length - 1; i >= 0; i--) {
          list[i].age += dt;
          if (list[i].age > 0.8) list.splice(i, 1);
        }
      });
      readout();
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const g = geo;

      // Electron gun.
      ctx.fillStyle = 'rgba(235, 231, 223, 0.25)';
      ctx.fillRect(g.gunX - 16, g.cy - 10, 22, 20);
      ctx.fillStyle = PH.color.glow;
      ctx.fillRect(g.gunX + 4, g.cy - 3, 4, 6);

      // The wall with two slits.
      ctx.fillStyle = 'rgba(235, 231, 223, 0.55)';
      const a = g.slitGap / 2 - g.slitW / 2, b = g.slitGap / 2 + g.slitW / 2;
      ctx.fillRect(g.wallX - 3, 10, 6, g.cy - b - 10);
      ctx.fillRect(g.wallX - 3, g.cy - a, 6, 2 * a);
      ctx.fillRect(g.wallX - 3, g.cy + b, 6, g.h - 34 - g.cy - b);

      // The detector "eye" beside the slits when watching.
      if (watch.checked) {
        ctx.strokeStyle = PH.color.amber;
        ctx.lineWidth = 1.5;
        [-1, 1].forEach(function (side) {
          const y = g.cy + (side * g.slitGap) / 2;
          ctx.beginPath();
          ctx.ellipse(g.wallX + 18, y, 7, 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(g.wallX + 18, y, 1.8, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Ripples spreading from the slits.
      ctx.lineWidth = 1.2;
      ripples.forEach(function (r) {
        const k = r.age / 0.8;
        ctx.strokeStyle = r.seen ? 'rgba(255, 180, 84, ' + (0.6 * (1 - k)) + ')' : 'rgba(92, 194, 255, ' + (0.45 * (1 - k)) + ')';
        ctx.beginPath();
        ctx.arc(g.wallX, g.cy + r.y, 6 + k * (g.screenX - g.wallX), -Math.PI / 2.4, Math.PI / 2.4);
        ctx.stroke();
      });

      // Electrons in flight.
      ctx.fillStyle = '#e9f6ff';
      flying.forEach(function (e) {
        const k = e.age / FLIGHT;
        let x, y;
        if (k < 0.45) {
          x = PH.lerp(g.gunX + 8, g.wallX, k / 0.45);
          y = g.cy + (e.slit * g.slitGap / 2) * (k / 0.45);
        } else {
          const k2 = (k - 0.45) / 0.55;
          x = PH.lerp(g.wallX, g.screenX, k2);
          y = PH.lerp(g.cy + (e.slit * g.slitGap) / 2, g.cy + e.y, k2);
        }
        if (e.slit === 0 && k >= 0.45) return; // between the slits and the screen, it is only a wave
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // The screen and its accumulated hits.
      ctx.fillStyle = 'rgba(235, 231, 223, 0.06)';
      ctx.fillRect(g.screenX - 6, 8, 12, g.h - 16);
      ctx.drawImage(layer, 0, 0, s.w, s.h);
      ctx.globalCompositeOperation = 'lighter';
      blips.forEach(function (bp) {
        ctx.globalAlpha = 1 - bp.age / 0.8;
        ctx.drawImage(PH.glowSprite('rgba(92, 194, 255, 0.9)'), g.screenX - 9, g.cy + bp.y - 9, 18, 18);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Histogram of where the electrons landed.
      let max = 1;
      for (let i = 0; i < BINS; i++) if (bins[i] > max) max = bins[i];
      const bh = (2 * g.span) / BINS;
      ctx.fillStyle = PH.color.glow;
      for (let i = 0; i < BINS; i++) {
        if (!bins[i]) continue;
        const len = (bins[i] / max) * g.histW;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(g.histX, g.cy - g.span + i * bh, len, Math.max(1, bh - 0.6));
      }
      ctx.globalAlpha = 1;

      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('GUN', g.gunX, g.cy + 16);
      ctx.fillText('TWO SLITS', g.wallX, g.h - 8 - 10);
      ctx.fillText('SCREEN', g.screenX, g.h - 8 - 10);
      ctx.textAlign = 'left';
      ctx.fillText('COUNT', g.histX, 8);
    }

    function clear() {
      hits = [];
      bins = new Float32Array(BINS);
      flying = [];
      ripples = [];
      blips = [];
      lctx.clearRect(0, 0, geo.w, geo.h);
      readout();
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });

    rateBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        rate = parseInt(btn.dataset.dbgRate, 10);
        PH.setPressed(rateBtns, btn);
        loop.play();
      });
    });
    watch.addEventListener('change', function () {
      clear();
      loop.play();
    });
    document.getElementById('dbg-reset').addEventListener('click', function () {
      clear();
      if (!loop.running) draw();
    });

    PH.onResize(stage, function () {
      const r = canvas.getBoundingClientRect();
      if (!geo || Math.abs(r.width - geo.w) > 1 || Math.abs(r.height - geo.h) > 1) layout();
      draw();
    });

    layout();
    // Start with a pattern already partly built, so the plate shows what it does.
    for (let i = 0; i < 700; i++) land(sample());
    blips = [];
    readout();
    draw();
    if (!PH.reducedMotion()) loop.play();
    PH.onStill(function () { loop.pause(); });
  };
})();
