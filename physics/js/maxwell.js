/* Exp. 4: Maxwell's electromagnetic wave, from radio to gamma rays. */
(function () {
  'use strict';

  const PH = window.PH;

  const C = 299792458;
  const LOG_MIN = 5, LOG_MAX = 20;   // 100 kHz to 100 EHz

  const BANDS = [
    { name: 'Radio', to: 3e8 },
    { name: 'Microwave', to: 3e11 },
    { name: 'Infrared', to: 4e14 },
    { name: 'Visible', to: 7.9e14 },
    { name: 'Ultraviolet', to: 3e16 },
    { name: 'X-ray', to: 3e19 },
    { name: 'Gamma', to: Infinity }
  ];

  const USES = [
    [1e5, 'Long-wave radio. Each wave is about 3 km long.'],
    [1e6, 'AM radio. Each wave is about 300 m long, taller than most skyscrapers.'],
    [1e8, 'FM radio. Each wave is about 3 m long.'],
    [2.4e9, 'Wi-Fi and microwave ovens. Each wave is about 12 cm long.'],
    [3e13, 'Infrared. Your body glows at these wavelengths, which is what thermal cameras see.'],
    [2e14, 'Near infrared. Fiber-optic cables carry the internet as light like this.'],
    [1e15, 'Ultraviolet. The part of sunlight that causes sunburn.'],
    [3e17, 'Soft X-rays, used to study the Sun\'s hot outer layers.'],
    [3e18, 'X-rays. Short enough to pass through skin but not through bone.'],
    [1e20, 'Gamma rays, given off by radioactive nuclei and used to destroy tumors.']
  ];

  function bandOf(f) {
    for (let i = 0; i < BANDS.length; i++) if (f < BANDS[i].to) return BANDS[i].name;
    return 'Gamma';
  }

  function colorName(nm) {
    if (nm < 450) return 'violet';
    if (nm < 490) return 'blue';
    if (nm < 560) return 'green';
    if (nm < 590) return 'yellow';
    if (nm < 635) return 'orange';
    return 'red';
  }

  function formatLength(m) {
    if (m >= 1000) return (m / 1000).toFixed(m >= 1e4 ? 0 : 1) + ' km';
    if (m >= 1) return m.toFixed(m >= 10 ? 0 : 1) + ' m';
    if (m >= 0.01) return (m * 100).toFixed(1) + ' cm';
    if (m >= 1e-3) return (m * 1000).toFixed(1) + ' mm';
    if (m >= 1e-6) return (m * 1e6).toFixed(1) + ' μm';
    if (m >= 1e-9) return (m * 1e9).toFixed(m >= 1e-8 ? 0 : 1) + ' nm';
    return (m * 1e12).toFixed(2) + ' pm';
  }

  PH.initMaxwell = function () {
    const stage = document.getElementById('max-stage');
    if (!stage) return;
    const canvas = document.getElementById('max-canvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('max-freq');
    const sliderOut = document.getElementById('max-freq-out');
    const fOut = document.getElementById('max-f');
    const lOut = document.getElementById('max-l');
    const bandOut = document.getElementById('max-band');
    const useOut = document.getElementById('max-use');

    let phase = 0;
    let barGeo = null;

    function freq() {
      return Math.pow(10, LOG_MIN + (parseFloat(slider.value) / 1000) * (LOG_MAX - LOG_MIN));
    }

    function setFreq(f) {
      slider.value = String(Math.round(((Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000));
      readout();
      draw();
    }

    function waveColor(f) {
      const nm = (C / f) * 1e9;
      if (nm >= 380 && nm <= 750) return PH.rgbString(PH.wavelengthRGB(nm));
      return f < 4e14 ? PH.color.glow : '#b9a5ff';
    }

    function readout() {
      const f = freq(), lambda = C / f, band = bandOf(f);
      const fs = PH.formatSI(f, 'Hz');
      sliderOut.textContent = fs;
      fOut.textContent = fs;
      lOut.textContent = formatLength(lambda);
      bandOut.textContent = band;
      let text;
      if (band === 'Visible') {
        text = 'Visible light: ' + colorName(lambda * 1e9) + '. The only slice of the spectrum your eyes can see.';
      } else {
        let best = USES[0], bestD = Infinity;
        USES.forEach(function (u) {
          const d = Math.abs(Math.log10(u[0]) - Math.log10(f));
          if (d < bestD) { bestD = d; best = u; }
        });
        text = best[1];
      }
      PH.text(useOut, text);
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const w = s.w, h = s.h;
      const f = freq();
      const color = waveColor(f);
      const x0 = 58, x1 = w - 18, cy = h * 0.36, amp = h * 0.18;
      // On-screen wavelength shrinks as frequency rises (a log mapping, not to scale).
      const t = (Math.log10(f) - LOG_MIN) / (LOG_MAX - LOG_MIN);
      const lpx = 420 * Math.pow(10 / 420, t);
      const k = (Math.PI * 2) / lpx;

      // Axis of travel.
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, cy + 0.5);
      ctx.lineTo(x1, cy + 0.5);
      ctx.stroke();

      // Antenna with charges sloshing up and down.
      const slosh = Math.sin(phase);
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(34, cy - amp * 0.9);
      ctx.lineTo(34, cy + amp * 0.9);
      ctx.stroke();
      ctx.fillStyle = PH.color.red;
      ctx.beginPath();
      ctx.arc(34, cy - slosh * amp * 0.75, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PH.color.glow;
      ctx.beginPath();
      ctx.arc(34, cy + slosh * amp * 0.75, 5, 0, Math.PI * 2);
      ctx.fill();

      const step = Math.max(1, Math.min(4, lpx / 24));
      // Magnetic field: at right angles, drawn in perspective.
      ctx.strokeStyle = 'rgba(162, 158, 149, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = x0; x <= x1; x += step) {
        const b = Math.sin(k * (x - x0) - phase) * amp * 0.75;
        const px = x + b * 0.42, py = cy + b * 0.3;
        if (x === x0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Electric field: vertical arrows and the wave itself.
      if (lpx > 18) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += Math.max(6, lpx / 12)) {
          const e = Math.sin(k * (x - x0) - phase) * amp;
          ctx.moveTo(x, cy);
          ctx.lineTo(x, cy - e);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let x = x0; x <= x1; x += step) {
        const y = cy - Math.sin(k * (x - x0) - phase) * amp;
        if (x === x0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // A bracket showing one wavelength.
      if (lpx > 40 && lpx < x1 - x0 - 20) {
        const bx = x0 + 20, by = cy - amp - 16;
        ctx.strokeStyle = PH.color.ink;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, by + 5);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + lpx, by);
        ctx.lineTo(bx + lpx, by + 5);
        ctx.stroke();
        ctx.fillStyle = PH.color.ink;
        ctx.font = 'italic 15px "Newsreader", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('λ = ' + formatLength(C / f), bx + lpx / 2, by - 3);
      }

      // The spectrum bar, radio to gamma, on a log scale.
      const bx0 = 18, bx1 = w - 18, by = h - 58, bh = 16;
      barGeo = { x0: bx0, x1: bx1, y: by, h: bh };
      const X = function (freqHz) { return bx0 + ((Math.log10(freqHz) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (bx1 - bx0); };
      let from = Math.pow(10, LOG_MIN);
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      BANDS.forEach(function (b, i) {
        const to = Math.min(b.to, Math.pow(10, LOG_MAX));
        const xa = X(from), xb = X(to);
        if (b.name === 'Visible') {
          const grad = ctx.createLinearGradient(xa, 0, xb, 0);
          for (let j = 0; j <= 6; j++) {
            const nm = 750 - j * (370 / 6);
            grad.addColorStop(j / 6, PH.rgbString(PH.wavelengthRGB(nm)));
          }
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = i % 2 ? 'rgba(235, 231, 223, 0.1)' : 'rgba(235, 231, 223, 0.05)';
        }
        ctx.fillRect(xa, by, xb - xa, bh);
        ctx.fillStyle = b.name === 'Visible' ? PH.color.ink : PH.color.muted;
        if (b.name === 'Visible') {
          ctx.fillText('VISIBLE', (xa + xb) / 2, by + bh + 20);
          ctx.strokeStyle = 'rgba(235, 231, 223, 0.5)';
          ctx.beginPath();
          ctx.moveTo((xa + xb) / 2 + 0.5, by + bh + 2);
          ctx.lineTo((xa + xb) / 2 + 0.5, by + bh + 17);
          ctx.stroke();
        } else if (xb - xa > 46) {
          ctx.fillText(b.name.toUpperCase(), (xa + xb) / 2, by + bh + 6);
        }
        from = to;
      });

      // Marker for the current frequency.
      const mx = X(f);
      ctx.fillStyle = PH.color.ink;
      ctx.beginPath();
      ctx.moveTo(mx, by - 2);
      ctx.lineTo(mx - 6, by - 11);
      ctx.lineTo(mx + 6, by - 11);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(mx - 0.75, by, 1.5, bh);
    }

    const loop = new PH.Loop(stage, function (dt) {
      phase += dt * 5;
      draw();
    });
    const sync = function () {};

    slider.addEventListener('input', function () {
      readout();
      if (!loop.running) draw();
    });
    document.querySelectorAll('[data-max-f]').forEach(function (btn) {
      btn.addEventListener('click', function () { setFreq(parseFloat(btn.dataset.maxF)); });
    });

    // Click or tap the spectrum bar to jump there.
    stage.addEventListener('pointerdown', function (e) {
      if (!barGeo) return;
      const p = PH.pointer(e, stage);
      if (p.y < barGeo.y - 16 || p.y > barGeo.y + barGeo.h + 30) return;
      const t = PH.clamp((p.x - barGeo.x0) / (barGeo.x1 - barGeo.x0), 0, 1);
      slider.value = String(Math.round(t * 1000));
      readout();
      if (!loop.running) draw();
    });

    PH.onResize(stage, draw);
    readout();
    draw();
    PH.autoplay(loop, sync);
  };
})();
