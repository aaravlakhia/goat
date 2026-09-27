/* Exp. 3: Faraday's induction. Drag a magnet through a coil; the voltage is
   the rate of change of magnetic flux through the coil. */
(function () {
  'use strict';

  const PH = window.PH;

  const K = 0.25;       // volts per unit of flux change per second (sets the scale)
  const TRACE = 4;      // seconds of voltage kept on the scope
  const PX_PER_CM = 12; // for the speed readout

  PH.initFaraday = function () {
    const stage = document.getElementById('far-stage');
    if (!stage) return;
    const canvas = document.getElementById('far-canvas');
    const ctx = canvas.getContext('2d');
    const voltsOut = document.getElementById('far-volts');
    const speedOut = document.getElementById('far-speed');
    const msg = document.getElementById('far-msg');
    const spinBtn = document.getElementById('far-spin');

    let size = PH.fitCanvas(canvas);
    let geo = null;
    let magX = null;       // magnet center, px
    let target = null;     // where the pointer wants it
    let prevFlux = null;
    let emf = 0, vel = 0;
    let spin = false, spinT = 0;
    let drag = null;
    let still = 0;
    let trace = [];
    let clock = 0;
    let demo = !PH.reducedMotion();

    function layout() {
      size = PH.fitCanvas(canvas);
      const w = size.w, h = size.h;
      geo = {
        cx: w * 0.56, cy: h * 0.5,
        coilLen: Math.max(90, w * 0.2), coilR: h * 0.14,
        magLen: Math.max(110, w * 0.2), magH: Math.max(26, h * 0.085),
        scopeY: h - 46, scopeH: 34
      };
      geo.minX = geo.magLen / 2 + 14;
      geo.maxX = w - geo.magLen / 2 - 14;
      if (magX === null) magX = geo.minX + 10;
      magX = PH.clamp(magX, geo.minX, geo.maxX);
      if (target !== null) target = PH.clamp(target, geo.minX, geo.maxX);
    }

    function flux(x) {
      const d = (x - geo.cx) / (geo.coilLen * 0.75);
      return 1 / Math.pow(1 + d * d, 1.5);
    }

    function step(dt) {
      clock += dt;
      if (spin) {
        spinT += dt;
        const x = geo.cx + (geo.coilLen * 0.95) * Math.sin(spinT * Math.PI * 2 * 0.7);
        target = PH.clamp(x, geo.minX, geo.maxX);
      } else if (demo && !drag) {
        // A gentle opening demonstration: in, pause, out.
        const c = clock % 6;
        const inside = geo.cx, outside = geo.minX + 10;
        target = c < 1.2 ? PH.lerp(outside, inside, easeInOut(c / 1.2))
          : c < 3 ? inside
            : c < 4.2 ? PH.lerp(inside, outside, easeInOut((c - 3) / 1.2)) : outside;
      }
      const old = magX;
      if (target !== null) magX = target;
      vel = dt > 0 ? (magX - old) / dt : 0;
      const f = flux(magX);
      const raw = prevFlux === null || dt <= 0 ? 0 : (-(f - prevFlux) / dt) * K * (geo.coilLen / 150);
      prevFlux = f;
      emf += (raw - emf) * Math.min(1, dt * 18);
      trace.push([clock, emf]);
      while (trace.length && trace[0][0] < clock - TRACE) trace.shift();

      still = Math.abs(vel) < 4 ? still + dt : 0;
      let text;
      if (spin) text = 'Back and forth, again and again: the voltage swings both ways. This is alternating current, like the supply in your home.';
      else if (Math.abs(emf) > 0.9) text = 'Fast change, big voltage. The bulb lights up.';
      else if (Math.abs(emf) > 0.12) text = emf > 0 ? 'Current flows one way…' : '…and the other way when the magnet moves back.';
      else if (still > 0.3 && Math.abs(magX - geo.cx) < geo.coilLen * 0.6) text = 'The magnet is inside the coil but not moving. No change, so no electricity.';
      else if (still > 0.3) text = 'Push the magnet into the coil.';
      else text = 'Moving slowly makes only a little voltage.';
      PH.text(msg, text);
      PH.text(voltsOut, (emf >= 0 ? '' : '−') + Math.abs(emf).toFixed(2) + ' V');
      PH.text(speedOut, Math.abs(vel / PX_PER_CM).toFixed(1) + ' cm/s');
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function drawCoil(front) {
      const g = geo, loops = 9;
      ctx.lineWidth = 3;
      ctx.strokeStyle = front ? '#d98a3a' : 'rgba(217, 138, 58, 0.35)';
      for (let i = 0; i < loops; i++) {
        const x = g.cx - g.coilLen / 2 + (i + 0.5) * (g.coilLen / loops);
        ctx.beginPath();
        // Front half of each turn on the right side of the ellipse, back half on the left.
        if (front) ctx.ellipse(x, g.cy, 7, g.coilR, 0, -Math.PI / 2, Math.PI / 2);
        else ctx.ellipse(x, g.cy, 7, g.coilR, 0, Math.PI / 2, Math.PI * 1.5);
        ctx.stroke();
      }
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const g = geo, w = s.w;
      const mx = magX, my = g.cy;
      const nX = mx + g.magLen / 2, sX = mx - g.magLen / 2;

      // Field lines looping from the north pole round to the south pole.
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.13)';
      ctx.lineWidth = 1;
      for (let k = 1; k <= 4; k++) {
        const spread = g.magH * 0.6 + k * g.coilR * 0.55;
        [-1, 1].forEach(function (side) {
          ctx.beginPath();
          ctx.moveTo(nX, my + side * 4);
          ctx.bezierCurveTo(nX + k * 34, my + side * spread * 1.2, sX - k * 34, my + side * spread * 1.2, sX, my + side * 4);
          ctx.stroke();
        });
      }

      // Wires up to the bulb and the meter.
      const bulbX = g.cx - 60, bulbY = 60, meterX = g.cx + 70, meterY = 70;
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(g.cx - g.coilLen / 2, g.cy - g.coilR);
      ctx.lineTo(g.cx - g.coilLen / 2, bulbY + 26);
      ctx.lineTo(bulbX, bulbY + 26);
      ctx.moveTo(bulbX, bulbY + 26);
      ctx.lineTo(meterX - 30, bulbY + 26);
      ctx.moveTo(meterX + 30, meterY);
      ctx.lineTo(g.cx + g.coilLen / 2, meterY);
      ctx.lineTo(g.cx + g.coilLen / 2, g.cy - g.coilR);
      ctx.stroke();

      drawCoil(false);

      // The magnet: north half red, south half blue.
      ctx.fillStyle = '#a7443a';
      ctx.fillRect(mx, my - g.magH / 2, g.magLen / 2, g.magH);
      ctx.fillStyle = '#2a6c9e';
      ctx.fillRect(sX, my - g.magH / 2, g.magLen / 2, g.magH);
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sX + 0.5, my - g.magH / 2 + 0.5, g.magLen - 1, g.magH - 1);
      ctx.fillStyle = PH.color.ink;
      ctx.font = '600 13px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', nX - 14, my);
      ctx.fillText('S', sX + 14, my);

      drawCoil(true);

      // The bulb, glowing with the size of the voltage.
      const glow = PH.clamp(Math.abs(emf) / 1.2, 0, 1);
      if (glow > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        const r = 20 + glow * 60;
        ctx.globalAlpha = glow;
        ctx.drawImage(PH.glowSprite('rgba(255, 180, 84, 0.9)'), bulbX - r, bulbY - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = glow > 0.05 ? '#fff1d6' : 'rgba(235, 231, 223, 0.5)';
      ctx.beginPath();
      ctx.moveTo(bulbX - 5, bulbY + 8);
      ctx.lineTo(bulbX - 3, bulbY - 3);
      ctx.lineTo(bulbX + 3, bulbY - 3);
      ctx.lineTo(bulbX + 5, bulbY + 8);
      ctx.stroke();
      ctx.fillStyle = 'rgba(235, 231, 223, 0.35)';
      ctx.fillRect(bulbX - 7, bulbY + 13, 14, 12);

      // The meter: a needle that swings both ways.
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(meterX, meterY, 30, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
      const ang = -Math.PI / 2 + PH.clamp(emf / 1.5, -1, 1) * (Math.PI / 3);
      ctx.strokeStyle = PH.color.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(meterX, meterY);
      ctx.lineTo(meterX + Math.cos(ang) * 25, meterY + Math.sin(ang) * 25);
      ctx.stroke();
      ctx.fillStyle = PH.color.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillText('−   0   +', meterX, meterY - 38);

      // Oscilloscope strip.
      const sy = g.scopeY, sh = g.scopeH;
      ctx.strokeStyle = PH.color.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(14, sy + 0.5);
      ctx.lineTo(w - 14, sy + 0.5);
      ctx.stroke();
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'left';
      ctx.fillText('VOLTAGE · LAST 4 s', 14, sy - sh / 2 - 12);
      if (trace.length > 1) {
        ctx.strokeStyle = PH.color.amber;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        trace.forEach(function (p, i) {
          const x = 14 + ((p[0] - (clock - TRACE)) / TRACE) * (w - 28);
          const y = sy - PH.clamp(p[1] / 1.5, -1, 1) * (sh / 2);
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });

    stage.addEventListener('pointerdown', function (e) {
      demo = false;
      if (spin) toggleSpin();
      drag = { id: e.pointerId, offset: SNpos(e) - magX };
      if (e.pointerType === 'mouse') stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      target = PH.clamp(SNpos(e) - drag.offset, geo.minX, geo.maxX);
    });
    const end = function () {
      drag = null;
      stage.classList.remove('is-dragging');
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      demo = false;
      target = PH.clamp((target === null ? magX : target) + (e.key === 'ArrowRight' ? 40 : -40), geo.minX, geo.maxX);
      loop.play();
    });

    function SNpos(e) {
      return PH.pointer(e, stage).x;
    }

    function toggleSpin() {
      spin = !spin;
      spinT = Math.asin(PH.clamp((magX - geo.cx) / (geo.coilLen * 0.95), -1, 1)) / (Math.PI * 2 * 0.7);
      demo = false;
      spinBtn.setAttribute('aria-pressed', String(spin));
      spinBtn.textContent = spin ? 'Stop the generator' : 'Run as a generator';
      loop.play();
    }
    spinBtn.addEventListener('click', toggleSpin);

    PH.onResize(stage, function () {
      layout();
      draw();
    });

    layout();
    prevFlux = flux(magX);
    draw();
    loop.play();
  };
})();
