/* Exp. 8: Bohr's hydrogen atom. Electrons drop between energy levels and each
   drop sends out a photon of one exact wavelength, building hydrogen's spectrum. */
(function () {
  'use strict';

  const PH = window.PH;

  const RYDBERG = 1.0967758e7;   // hydrogen, per metre
  const LEVELS = 6;
  const NM_MIN = 380, NM_MAX = 750;

  function wavelength(from, to) {
    return 1e9 / (RYDBERG * (1 / (to * to) - 1 / (from * from)));
  }

  function energy(n) {
    return -13.6 / (n * n);
  }

  function describe(nm) {
    if (nm < NM_MIN) return nm.toFixed(0) + ' nm · ultraviolet, invisible';
    if (nm > NM_MAX) return PH.formatInt(nm) + ' nm · infrared, invisible';
    const names = [[450, 'violet'], [490, 'cyan-blue'], [500, 'cyan'], [560, 'green'], [590, 'yellow'], [635, 'orange'], [800, 'red']];
    let name = 'red';
    for (let i = 0; i < names.length; i++) if (nm < names[i][0]) { name = names[i][1]; break; }
    return nm.toFixed(0) + ' nm · ' + name;
  }

  PH.initBohr = function () {
    const stage = document.getElementById('bohr-stage');
    if (!stage) return;
    const canvas = document.getElementById('bohr-canvas');
    const ctx = canvas.getContext('2d');
    const lastOut = document.getElementById('bohr-last');
    const lightOut = document.getElementById('bohr-light');
    const invisibleOut = document.getElementById('bohr-invisible');
    const msg = document.getElementById('bohr-msg');
    const heatBtn = document.getElementById('bohr-heat');

    let n = 1, angle = 0, dwell = 0.6;
    let heat = true;
    let photons = [];
    let spectrum = new Float32Array(NM_MAX - NM_MIN + 1);
    let uv = 0, ir = 0, total = 0;
    let geo = null;
    let lastJump = null;

    function layout() {
      const s = PH.fitCanvas(canvas);
      const specH = 44;
      const top = 14, bottom = s.h - specH - 34;
      const cy = (top + bottom) / 2;
      const rMax = Math.min((bottom - top) / 2, s.w * 0.24);
      geo = {
        w: s.w, h: s.h, cx: Math.min(s.w * 0.3, rMax + 30), cy: cy, rMax: rMax, r1: rMax * 0.12,
        specY: s.h - specH - 14, specH: specH, specX0: 40, specX1: s.w - 40,
        ladX0: s.w * 0.62, ladX1: s.w - 56, ladTop: top + 10, ladBottom: bottom - 4
      };
    }

    function radius(level) {
      return geo.r1 + (geo.rMax - geo.r1) * Math.pow((level - 1) / (LEVELS - 1), 0.85);
    }

    function specX(nm) {
      return geo.specX0 + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * (geo.specX1 - geo.specX0);
    }

    function ladderY(level) {
      const e = energy(level);
      return geo.ladTop + ((e / -13.6)) * (geo.ladBottom - geo.ladTop);
    }

    function kick(level) {
      if (level <= n) return;
      n = level;
      dwell = 0.35 + Math.random() * 0.6;
      msg.textContent = 'Kicked up to level ' + level + '. It won\'t stay there long.';
    }

    function emit() {
      const to = 1 + Math.floor(Math.random() * (n - 1));
      const nm = wavelength(n, to);
      const r = radius(n);
      const sx = geo.cx + Math.cos(angle) * r, sy = geo.cy + Math.sin(angle) * r;
      let tx, ty;
      if (nm < NM_MIN) { tx = geo.specX0 - 18; ty = geo.specY + geo.specH / 2; }
      else if (nm > NM_MAX) { tx = geo.specX1 + 18; ty = geo.specY + geo.specH / 2; }
      else { tx = specX(nm); ty = geo.specY + 4; }
      photons.push({ sx: sx, sy: sy, tx: tx, ty: ty, nm: nm, age: 0 });
      lastJump = { from: n, to: to, nm: nm };
      lastOut.textContent = 'n = ' + n + ' → ' + to;
      lightOut.textContent = describe(nm) + ' · ' + (energy(n) - energy(to)).toFixed(2) + ' eV';
      if (to === 2) msg.textContent = 'Landed on level 2: visible light. This is one of hydrogen\'s four colored lines.';
      else if (to === 1) msg.textContent = 'Landed on level 1: a big drop, so ultraviolet light your eyes can\'t see.';
      else msg.textContent = 'A small drop: infrared light, also invisible.';
      n = to;
      dwell = 0.3 + Math.random() * 0.7;
    }

    function photonColor(nm, alpha) {
      if (nm < NM_MIN) return 'rgba(185, 165, 255, ' + alpha + ')';
      if (nm > NM_MAX) return 'rgba(170, 90, 70, ' + alpha + ')';
      return PH.rgbString(PH.wavelengthRGB(nm), alpha);
    }

    function step(dt) {
      angle += dt * (2.4 / Math.pow(n, 1.3));
      dwell -= dt;
      if (dwell <= 0) {
        if (n > 1) emit();
        else if (heat) kick(3 + Math.floor(Math.random() * 4));
        else dwell = 0.2;
      }
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i];
        p.age += dt;
        if (p.age >= 0.9) {
          if (p.nm < NM_MIN) uv++;
          else if (p.nm > NM_MAX) ir++;
          else spectrum[Math.round(p.nm) - NM_MIN] += 1;
          total++;
          invisibleOut.textContent = uv + ' UV · ' + ir + ' infrared';
          photons.splice(i, 1);
        }
      }
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const g = geo;

      // Energy levels as orbits (not to scale).
      ctx.lineWidth = 1;
      for (let k = 1; k <= LEVELS; k++) {
        ctx.strokeStyle = k === n ? 'rgba(92, 194, 255, 0.55)' : 'rgba(235, 231, 223, 0.14)';
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, radius(k), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = PH.color.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (let k = 1; k <= LEVELS; k++) {
        const room = k === LEVELS || radius(k + 1) - radius(k) > 26;
        if (room && (k <= 3 || k === LEVELS)) ctx.fillText('n=' + k, g.cx + radius(k) + 4, g.cy - 6);
      }

      // Nucleus: a single proton.
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(PH.glowSprite('rgba(255, 107, 91, 0.8)'), g.cx - 14, g.cy - 14, 28, 28);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = PH.color.red;
      ctx.beginPath();
      ctx.arc(g.cx, g.cy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Electron.
      const r = radius(n);
      const ex = g.cx + Math.cos(angle) * r, ey = g.cy + Math.sin(angle) * r;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(PH.glowSprite('rgba(92, 194, 255, 0.9)'), ex - 12, ey - 12, 24, 24);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#e9f6ff';
      ctx.beginPath();
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Energy ladder, drawn to scale.
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.35)';
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'left';
      for (let k = 1; k <= LEVELS; k++) {
        const y = Math.round(ladderY(k)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(g.ladX0, y);
        ctx.lineTo(g.ladX1, y);
        ctx.stroke();
      }
      ctx.fillText('n=1  −13.6 eV', g.ladX0, ladderY(1) + 10);
      ctx.fillText('n=2  −3.4 eV', g.ladX0, ladderY(2) + 10);
      ctx.fillText('n=3…6', g.ladX0, ladderY(6) - 10);
      if (lastJump) {
        const x = (g.ladX0 + g.ladX1) / 2;
        const y0 = ladderY(lastJump.from), y1 = ladderY(lastJump.to);
        ctx.strokeStyle = photonColor(lastJump.nm, 1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y1 - 6);
        ctx.stroke();
        ctx.fillStyle = photonColor(lastJump.nm, 1);
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x - 5, y1 - 8);
        ctx.lineTo(x + 5, y1 - 8);
        ctx.closePath();
        ctx.fill();
      }

      // Photons in flight: little wave packets.
      photons.forEach(function (p) {
        const k = p.age / 0.9;
        const x = PH.lerp(p.sx, p.tx, k), y = PH.lerp(p.sy, p.ty, k);
        const dx = p.tx - p.sx, dy = p.ty - p.sy, len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, ux = dx / len, uy = dy / len;
        ctx.strokeStyle = photonColor(p.nm, 1);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = -12; j <= 12; j += 2) {
          const wob = Math.sin(j * 0.8 + p.age * 30) * 4 * (1 - Math.abs(j) / 13);
          const px = x + ux * j + nx * wob, py = y + uy * j + ny * wob;
          if (j === -12) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      });

      // The spectrum strip.
      const sy = g.specY, sh = g.specH;
      ctx.fillStyle = '#05070a';
      ctx.fillRect(g.specX0, sy, g.specX1 - g.specX0, sh);
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(g.specX0 - 0.5, sy - 0.5, g.specX1 - g.specX0 + 1, sh + 1);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < spectrum.length; i++) {
        if (!spectrum[i]) continue;
        const nm = i + NM_MIN;
        const a = Math.min(1, 0.35 + spectrum[i] * 0.12);
        const x = specX(nm);
        ctx.fillStyle = PH.rgbString(PH.wavelengthRGB(nm), a);
        ctx.fillRect(x - 1.5, sy, 3, sh);
        ctx.fillStyle = PH.rgbString(PH.wavelengthRGB(nm), a * 0.25);
        ctx.fillRect(x - 5, sy, 10, sh);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = PH.color.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      [400, 500, 600, 700].forEach(function (nm) { ctx.fillText(nm + ' nm', specX(nm), sy + sh + 5); });
      ctx.textBaseline = 'middle';
      ctx.fillText('UV', g.specX0 - 20, sy + sh / 2);
      ctx.fillText('IR', g.specX1 + 20, sy + sh / 2);
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });

    function setHeat(on) {
      heat = on;
      heatBtn.setAttribute('aria-pressed', String(on));
      heatBtn.textContent = on ? 'Stop heating' : 'Heat the gas';
      if (on) loop.play();
    }

    heatBtn.addEventListener('click', function () { setHeat(!heat); });
    document.querySelectorAll('[data-bohr-n]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setHeat(false);
        kick(parseInt(btn.dataset.bohrN, 10));
        loop.play();
      });
    });
    document.getElementById('bohr-clear').addEventListener('click', function () {
      spectrum = new Float32Array(NM_MAX - NM_MIN + 1);
      uv = 0;
      ir = 0;
      invisibleOut.textContent = '0 UV · 0 infrared';
      if (!loop.running) draw();
    });

    // Tap an orbit to kick the electron up to it.
    stage.addEventListener('pointerdown', function (e) {
      const p = PH.pointer(e, stage);
      const d = Math.hypot(p.x - geo.cx, p.y - geo.cy);
      for (let k = 2; k <= LEVELS; k++) {
        if (Math.abs(d - radius(k)) < 8) {
          setHeat(false);
          kick(k);
          loop.play();
          break;
        }
      }
    });

    PH.onResize(stage, function () {
      layout();
      draw();
    });

    layout();
    // Build up some spectrum before the first frame.
    for (let i = 0; i < 60 * 25; i++) step(1 / 60);
    photons = [];
    draw();
    if (PH.reducedMotion()) setHeat(false);
    else loop.play();
    PH.onStill(function () { if (heat) setHeat(false); });
    heatBtn.setAttribute('aria-pressed', String(heat));
    heatBtn.textContent = heat ? 'Stop heating' : 'Heat the gas';
  };
})();
