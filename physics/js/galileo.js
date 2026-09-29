/* Exp. 1: Galileo. A hammer and a feather dropped side by side, in air, in a
   vacuum and on the Moon, with strobe "ghost" images every 0.1 s. */
(function () {
  'use strict';

  const PH = window.PH;

  const HEIGHT = 1.6;        // drop height, m (about shoulder height, as on Apollo 15)
  const SLOW = 3;            // shown at one third of real speed
  const STROBE = 0.1;        // seconds between ghost images
  const FEATHER_VT = 0.9;    // a feather's terminal speed in air, m/s
  const WORLDS = {
    air: { g: 9.81, air: true, moon: false },
    vacuum: { g: 9.81, air: false, moon: false },
    moon: { g: 1.62, air: false, moon: true }
  };

  PH.initGalileo = function () {
    const stage = document.getElementById('gal-stage');
    if (!stage) return;
    const canvas = document.getElementById('gal-canvas');
    const ctx = canvas.getContext('2d');
    const hammerOut = document.getElementById('gal-hammer');
    const featherOut = document.getElementById('gal-feather');
    const ruleOut = document.getElementById('gal-rule');
    const msg = document.getElementById('gal-msg');
    const worldBtns = Array.from(document.querySelectorAll('[data-gal-world]'));

    let world = 'air';
    let t = 0;
    let wait = 0;
    let hammer, feather;
    const dust = [];
    for (let i = 0; i < 70; i++) dust.push({ x: Math.random(), y: Math.random(), p: Math.random() * 6 });

    function body() {
      return { y: 0, v: 0, landed: false, tLand: 0, ghosts: [0], nextGhost: STROBE };
    }

    function drop() {
      t = 0;
      wait = 0;
      hammer = body();
      feather = body();
      hammerOut.textContent = '…';
      featherOut.textContent = '…';
      const w = WORLDS[world];
      msg.textContent = w.air
        ? 'Air pushes back on the feather much more than on the hammer.'
        : w.moon
          ? 'No air on the Moon, and gravity is one sixth as strong.'
          : 'A vacuum chamber: all the air has been pumped out.';
    }

    function advance(b, g, air, dt) {
      if (b.landed) return;
      const steps = 8, h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const a = air ? g * (1 - (b.v * b.v) / (FEATHER_VT * FEATHER_VT)) : g;
        b.v += a * h;
        b.y += b.v * h;
        const now = t + (i + 1) * h;
        while (now >= b.nextGhost && b.y < HEIGHT) {
          b.ghosts.push(b.y);
          b.nextGhost += STROBE;
        }
        if (b.y >= HEIGHT) {
          b.y = HEIGHT;
          b.landed = true;
          b.tLand = now;
          break;
        }
      }
    }

    function step(dtReal) {
      if (!hammer) return;
      const w = WORLDS[world];
      const dt = dtReal / SLOW;
      advance(hammer, w.g, false, dt);
      advance(feather, w.g, w.air, dt);
      t += dt;
      if (hammer.landed) hammerOut.textContent = hammer.tLand.toFixed(2) + ' s';
      if (feather.landed) featherOut.textContent = feather.tLand.toFixed(2) + ' s';
      if (hammer.landed && feather.landed) {
        if (wait === 0) {
          msg.textContent = w.air
            ? 'The hammer lands first. Air, not weight, holds the feather back.'
            : w.moon
              ? 'They land together, just as they did for astronaut David Scott on the Moon in 1971.'
              : 'They land together. Without air, weight makes no difference at all.';
        }
        wait += dtReal;
        if (wait > 2.6) drop();
      }
      // The 1 : 3 : 5 : 7 rule, measured from the hammer's ghost images.
      const gh = hammer.ghosts;
      if (gh.length >= 5) {
        const d1 = gh[1] - gh[0];
        const parts = [];
        for (let k = 1; k <= 4; k++) parts.push(Math.round((gh[k] - gh[k - 1]) / d1));
        PH.text(ruleOut, parts.join(' : '));
      }
    }

    function drawHammer(x, bottom, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(x - 3.5, bottom - 58, 7, 58);
      ctx.fillStyle = '#c9cdd3';
      ctx.fillRect(x - 21, bottom - 72, 42, 17);
      ctx.fillStyle = '#9aa1ab';
      ctx.fillRect(x - 21, bottom - 60, 42, 5);
      ctx.globalAlpha = 1;
    }

    function drawFeather(x, bottom, rot, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, bottom - 34);
      ctx.rotate(rot);
      ctx.strokeStyle = '#ebe7df';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 34);
      ctx.quadraticCurveTo(4, 0, -2, -38);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.8)';
      ctx.beginPath();
      for (let i = 0; i < 17; i++) {
        const f = i / 16;
        const y = 22 - f * 58;
        const cx = 3.2 * (1 - Math.pow(f * 2 - 1, 2));
        const len = 13 * Math.sin(Math.PI * Math.min(1, 0.15 + f * 0.95));
        ctx.moveTo(cx, y);
        ctx.lineTo(cx - len, y - 7);
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + len * 0.8, y - 7);
      }
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const w = s.w, h = s.h;
      const floorY = h - 34, topY = 96;
      const scale = (floorY - topY) / HEIGHT;
      const hx = w * 0.4, fx = w * 0.62;
      const cfg = WORLDS[world];

      // Ground.
      if (cfg.moon) {
        ctx.fillStyle = '#1a1c20';
        ctx.fillRect(0, floorY, w, h - floorY);
        ctx.fillStyle = 'rgba(235, 231, 223, 0.55)';
        for (let i = 0; i < 40; i++) {
          const x = (i * 97.3) % w, y = (i * 53.1) % (topY + 20);
          ctx.fillRect(x, y * 0.9, 1.2, 1.2);
        }
      } else {
        ctx.fillStyle = '#12161c';
        ctx.fillRect(0, floorY, w, h - floorY);
      }
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, floorY + 0.5);
      ctx.lineTo(w, floorY + 0.5);
      ctx.stroke();

      // Air: a faint drifting haze.
      if (cfg.air) {
        ctx.fillStyle = 'rgba(92, 194, 255, 0.28)';
        dust.forEach(function (d) {
          const x = ((d.x * w + Math.sin(d.p + t * 3) * 14) % w + w) % w;
          const y = topY - 60 + d.y * (floorY - topY + 60);
          ctx.fillRect(x, y, 1.5, 1.5);
        });
      }

      // Height ruler.
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.25)';
      for (let m = 0; m <= HEIGHT + 0.001; m += 0.4) {
        const y = Math.round(floorY - m * scale) + 0.5;
        ctx.beginPath();
        ctx.moveTo(52, y);
        ctx.lineTo(62, y);
        ctx.stroke();
        ctx.fillText(m.toFixed(1) + ' m', 48, y);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = PH.color.ink;
      ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('HAMMER', hx, topY - 88 + 6);
      ctx.fillText('FEATHER', fx, topY - 88 + 6);

      if (!hammer) return;
      const start = floorY - HEIGHT * scale;

      // Ghost images every 0.1 s.
      hammer.ghosts.forEach(function (y, i) { if (i) drawHammer(hx, start + y * scale, 0.14); });
      feather.ghosts.forEach(function (y, i) {
        if (!i) return;
        const tt = i * STROBE;
        drawFeather(fx + (cfg.air ? Math.sin(tt * 2.6) * 18 * Math.min(1, tt) : 0), start + y * scale, cfg.air ? Math.sin(tt * 2.6 + 0.8) * 0.5 : 0, 0.14);
      });

      drawHammer(hx, start + hammer.y * scale, 1);
      const sway = cfg.air ? Math.sin(t * 2.6) * 18 * Math.min(1, t) : 0;
      const rot = cfg.air ? Math.sin(t * 2.6 + 0.8) * 0.5 : 0;
      drawFeather(fx + sway, start + feather.y * scale, feather.landed ? 1.35 : rot, 1);

      // The clock sits in the ground strip, clear of the labels on narrow screens.
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('t = ' + t.toFixed(2) + ' s', w - 34, floorY + (h - floorY) / 2);
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });

    worldBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        world = btn.dataset.galWorld;
        PH.setPressed(worldBtns, btn);
        drop();
        loop.play();
      });
    });

    document.getElementById('gal-drop').addEventListener('click', function () {
      drop();
      loop.play();
    });

    PH.onResize(stage, draw);

    drop();
    if (PH.reducedMotion()) {
      // Show the finished drop as a still picture.
      for (let i = 0; i < 600 && !(hammer.landed && feather.landed); i++) step(1 / 60);
    } else {
      loop.play();
    }
    draw();
  };
})();
