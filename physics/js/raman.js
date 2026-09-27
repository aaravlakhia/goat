/* Exp. 10: Raman scattering. Green laser light scatters off a sample; a rare
   few photons come out redder by an amount set by the molecule's vibrations. */
(function () {
  'use strict';

  const PH = window.PH;

  const LASER = 532;          // nm
  const NM_MIN = 520, NM_MAX = 680;
  const RAMAN_SHARE = 0.07;   // boosted from about 1 in 10 million so it is visible
  const SCATTER_PER_PX = 0.004;

  // Raman shifts in wavenumbers (cm^-1), with relative strengths and widths.
  const SAMPLES = {
    diamond: { name: 'Diamond', lines: [[1332, 1, 3]] },
    water: { name: 'Water', lines: [[1640, 0.2, 30], [3400, 1, 170]] },
    benzene: { name: 'Benzene', lines: [[606, 0.12, 5], [992, 1, 4], [1178, 0.18, 5], [3062, 0.55, 10]] }
  };

  function shifted(cm) {
    return 1e7 / (1e7 / LASER - cm);
  }

  function gauss() {
    return (Math.random() + Math.random() + Math.random() - 1.5) * 1.4;
  }

  PH.initRaman = function () {
    const stage = document.getElementById('ram-stage');
    if (!stage) return;
    const canvas = document.getElementById('ram-canvas');
    const ctx = canvas.getContext('2d');
    const sampleOut = document.getElementById('ram-sample');
    const linesOut = document.getElementById('ram-lines');
    const countOut = document.getElementById('ram-count');
    const msg = document.getElementById('ram-msg');
    const playBtn = document.getElementById('ram-play');
    const sampleBtns = Array.from(document.querySelectorAll('[data-ram-sample]'));

    let sample = SAMPLES.diamond;
    let photons = [], scattered = [];
    let spectrum = new Float32Array(NM_MAX - NM_MIN + 1);
    let total = 0, ramanCount = 0, spawn = 0;
    let geo = null;

    function layout() {
      const s = PH.fitCanvas(canvas);
      const beamY = s.h * 0.3;
      geo = {
        w: s.w, h: s.h, beamY: beamY,
        cellX0: s.w * 0.42, cellX1: s.w * 0.58, cellY0: beamY - s.h * 0.17, cellY1: beamY + s.h * 0.17,
        specX0: 48, specX1: s.w - 20, specY0: s.h * 0.62, specY1: s.h - 30
      };
      photons = [];
      scattered = [];
    }

    function pickRaman() {
      const lines = sample.lines;
      let sum = 0;
      lines.forEach(function (l) { sum += l[1]; });
      let r = Math.random() * sum;
      for (let i = 0; i < lines.length; i++) {
        r -= lines[i][1];
        if (r <= 0) return shifted(lines[i][0] + gauss() * lines[i][2]);
      }
      return shifted(lines[0][0]);
    }

    function describeLines() {
      return sample.lines
        .filter(function (l) { return l[1] >= 0.15; })
        .map(function (l) { return shifted(l[0]).toFixed(1); })
        .join(' · ') + ' nm';
    }

    function readout() {
      PH.text(sampleOut, sample.name);
      PH.text(linesOut, describeLines());
      PH.text(countOut, PH.formatInt(total) + ' photons, ' + PH.formatInt(ramanCount) + ' changed color');
      const text = total < 60
        ? 'Most light scatters off the sample unchanged: still green, 532 nm.'
        : sample.name + '\'s fingerprint: new colors at ' + describeLines() + '. No other substance has exactly this pattern.';
      PH.text(msg, text);
    }

    function step(dt) {
      spawn += dt * 260;
      while (spawn >= 1) {
        spawn -= 1;
        photons.push({ x: -4, y: geo.beamY + (Math.random() - 0.5) * 6 });
      }
      const speed = 420;
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i];
        const nx = p.x + speed * dt;
        if (p.x < geo.cellX1 && nx > geo.cellX0) {
          const inside = Math.min(nx, geo.cellX1) - Math.max(p.x, geo.cellX0);
          if (Math.random() < inside * SCATTER_PER_PX) {
            const nm = Math.random() < RAMAN_SHARE ? pickRaman() : LASER + gauss() * 0.4;
            const a = Math.random() * Math.PI * 2;
            scattered.push({ x: Math.max(p.x, geo.cellX0) + Math.random() * inside, y: p.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, nm: nm, age: 0 });
            total++;
            if (nm > LASER + 5) ramanCount++;
            const bin = Math.round(nm) - NM_MIN;
            if (bin >= 0 && bin < spectrum.length) spectrum[bin]++;
            photons.splice(i, 1);
            continue;
          }
        }
        p.x = nx;
        if (p.x > geo.w + 4) photons.splice(i, 1);
      }
      for (let i = scattered.length - 1; i >= 0; i--) {
        const q = scattered[i];
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.age += dt;
        if (q.age > 0.9) scattered.splice(i, 1);
      }
      readout();
    }

    function colorOf(nm, alpha) {
      return PH.rgbString(PH.wavelengthRGB(PH.clamp(nm, 380, 750)), alpha);
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const g = geo;

      // The laser beam.
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createLinearGradient(0, g.beamY - 6, 0, g.beamY + 6);
      beam.addColorStop(0, 'rgba(90, 255, 90, 0)');
      beam.addColorStop(0.5, 'rgba(90, 255, 90, 0.35)');
      beam.addColorStop(1, 'rgba(90, 255, 90, 0)');
      ctx.fillStyle = beam;
      ctx.fillRect(0, g.beamY - 6, g.w, 12);
      ctx.globalCompositeOperation = 'source-over';

      // The sample cell.
      ctx.fillStyle = 'rgba(92, 194, 255, 0.06)';
      ctx.fillRect(g.cellX0, g.cellY0, g.cellX1 - g.cellX0, g.cellY1 - g.cellY0);
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(g.cellX0 + 0.5, g.cellY0 + 0.5, g.cellX1 - g.cellX0 - 1, g.cellY1 - g.cellY0 - 1);
      ctx.fillStyle = PH.color.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(sample.name.toUpperCase(), (g.cellX0 + g.cellX1) / 2, g.cellY0 - 6);
      ctx.textAlign = 'left';
      ctx.fillText('LASER · 532 nm', 12, g.beamY - 12);

      // Photons: the beam's own, then the scattered ones.
      ctx.fillStyle = 'rgba(120, 255, 120, 0.9)';
      photons.forEach(function (p) { ctx.fillRect(p.x - 1, p.y - 1, 2, 2); });
      ctx.globalCompositeOperation = 'lighter';
      scattered.forEach(function (q) {
        const a = 1 - q.age / 0.9;
        const raman = q.nm > LASER + 5;
        const size = raman ? 18 : 8;
        ctx.globalAlpha = a;
        ctx.drawImage(PH.glowSprite(colorOf(q.nm, 0.9)), q.x - size / 2, q.y - size / 2, size, size);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // The spectrum, log scale so the faint Raman lines show beside the huge laser peak.
      const x0 = g.specX0, x1 = g.specX1, y0 = g.specY0, y1 = g.specY1;
      const X = function (nm) { return x0 + ((nm - NM_MIN) / (NM_MAX - NM_MIN)) * (x1 - x0); };
      let max = 1;
      for (let i = 0; i < spectrum.length; i++) if (spectrum[i] > max) max = spectrum[i];
      const lmax = Math.log10(max + 1);
      ctx.strokeStyle = PH.color.grid;
      ctx.beginPath();
      ctx.moveTo(x0, Math.round(y1) + 0.5);
      ctx.lineTo(x1, Math.round(y1) + 0.5);
      ctx.stroke();
      const bw = (x1 - x0) / spectrum.length;
      for (let i = 0; i < spectrum.length; i++) {
        if (!spectrum[i]) continue;
        const hgt = (Math.log10(spectrum[i] + 1) / lmax) * (y1 - y0);
        ctx.fillStyle = colorOf(i + NM_MIN, 1);
        ctx.fillRect(X(i + NM_MIN) - bw / 2, y1 - hgt, Math.max(1.5, bw), hgt);
      }
      ctx.fillStyle = PH.color.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      [520, 560, 600, 640, 680].forEach(function (nm) { ctx.fillText(String(nm), X(nm), y1 + 6); });
      ctx.textAlign = 'right';
      ctx.fillText('nm', x1, y1 + 18);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('SCATTERED LIGHT · LOG SCALE', x0, y0 - 8);

      // Label the expected Raman lines by their shift.
      ctx.textAlign = 'left';
      ctx.fillStyle = PH.color.ink;
      sample.lines.forEach(function (l) {
        if (l[1] < 0.15) return;
        ctx.fillText(l[0] + ' cm⁻¹', X(shifted(l[0])) + 6, y0 + 14);
      });
      ctx.fillText('laser', X(LASER) + 6, y0 + 14);
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      draw();
    });
    const sync = PH.bindPlay(playBtn, loop);

    function clear() {
      spectrum = new Float32Array(NM_MAX - NM_MIN + 1);
      total = 0;
      ramanCount = 0;
      readout();
    }

    sampleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        sample = SAMPLES[btn.dataset.ramSample];
        PH.setPressed(sampleBtns, btn);
        clear();
        for (let i = 0; i < 120; i++) step(1 / 60);
        draw();
      });
    });
    document.getElementById('ram-reset').addEventListener('click', function () {
      clear();
      if (!loop.running) draw();
    });

    PH.onResize(stage, function () {
      layout();
      draw();
    });

    layout();
    for (let i = 0; i < 60 * 8; i++) step(1 / 60);
    draw();
    PH.autoplay(loop, sync);
  };
})();
