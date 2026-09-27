/* Exp. 12: LIGO. Two black holes spiral together; ripples in space spread
   outward and a detector records the rising "chirp". */
(function () {
  'use strict';

  const PH = window.PH;

  const TM = 7;            // seconds of inspiral shown
  const RING = 1.4;        // seconds of ringdown
  const HOLD = 2.4;        // pause before the loop starts again
  const W0 = 2.2;          // starting orbital angular speed, rad/s
  const WAVE_SPEED = 170;  // px/s, how fast the ripples spread on screen
  const M1 = 36, M2 = 29;

  function omega(t) {
    const x = Math.max(1 - Math.min(t, TM) / TM, 0.004);
    return W0 * Math.pow(x, -3 / 8);
  }

  // Orbital phase, the integral of omega.
  function phase(t) {
    const tt = Math.min(t, TM * 0.996);
    let p = W0 * TM * (8 / 5) * (1 - Math.pow(1 - tt / TM, 5 / 8));
    if (t > tt) p += omega(tt) * (t - tt);
    return p;
  }

  // Wave strain seen at time t (before the merger it rises and speeds up;
  // afterwards the new black hole rings down).
  function strain(t) {
    if (t < 0) return 0;
    if (t <= TM) return Math.pow(omega(t) / W0, 2 / 3) * Math.cos(2 * phase(t));
    const w = omega(TM) * 1.15;
    return Math.pow(omega(TM) / W0, 2 / 3) * Math.exp(-(t - TM) / 0.22) * Math.cos(2 * phase(TM) + 2 * w * (t - TM));
  }

  function amplitude(t) {
    if (t < 0) return 0;
    if (t <= TM) return Math.pow(omega(t) / W0, 2 / 3);
    return Math.pow(omega(TM) / W0, 2 / 3) * Math.exp(-(t - TM) / 0.22);
  }

  PH.initLigo = function () {
    const stage = document.getElementById('ligo-stage');
    if (!stage) return;
    const canvas = document.getElementById('ligo-canvas');
    const ctx = canvas.getContext('2d');
    const phaseOut = document.getElementById('ligo-phase');
    const freqOut = document.getElementById('ligo-freq');
    const msg = document.getElementById('ligo-msg');
    const hearBtn = document.getElementById('ligo-hear');
    const playBtn = document.getElementById('ligo-play');

    let t = 0;
    let audio = null;
    let playingSound = false;

    function readout() {
      let stageName, text, f;
      if (t < TM - 0.25) {
        stageName = 'Inspiral';
        text = 'The black holes circle closer and faster, sending out ripples in space.';
        f = 35 * (omega(t) / W0);
      } else if (t < TM + 0.25) {
        stageName = 'Merger';
        text = 'Merger! In a fraction of a second, three Suns\' worth of mass turns into gravitational waves.';
        f = 250;
      } else {
        stageName = 'Ringdown';
        text = 'The new black hole, 62 times the mass of the Sun, rings like a struck bell and settles down.';
        f = 250;
      }
      PH.text(phaseOut, stageName);
      PH.text(freqOut, Math.round(Math.min(f, 250)) + ' Hz');
      if (!playingSound) PH.text(msg, text);
    }

    function draw() {
      const s = PH.begin(canvas, ctx);
      const w = s.w, h = s.h;
      const traceH = Math.max(54, h * 0.2);
      const cy = (h - traceH) / 2, cx = w / 2;
      const a0 = Math.min(w, h - traceH) * 0.16;

      // The fabric of space: a grid pushed around by the passing waves.
      const gap = 24, pushPx = 9;
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil((h - traceH) / gap) + 1;
      const px = new Float32Array(cols * rows), py = new Float32Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap, y = r * gap;
          const dx = x - cx, dy = y - cy;
          const rad = Math.hypot(dx, dy) || 1;
          const ang = Math.atan2(dy, dx);
          const tr = t - rad / WAVE_SPEED;
          let d = 0;
          if (tr > 0) {
            const ph = tr <= TM ? phase(tr) : phase(TM) + omega(TM) * 1.15 * (tr - TM);
            d = amplitude(tr) * Math.cos(2 * ang - 2 * ph) * pushPx * Math.min(1, 60 / rad) * 1.6;
          }
          const i = r * cols + c;
          px[i] = x + (dx / rad) * d;
          py[i] = y + (dy / rad) * d;
        }
      }
      ctx.strokeStyle = 'rgba(92, 194, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c === 0) ctx.moveTo(px[i], py[i]);
          else ctx.lineTo(px[i], py[i]);
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const i = r * cols + c;
          if (r === 0) ctx.moveTo(px[i], py[i]);
          else ctx.lineTo(px[i], py[i]);
        }
      }
      ctx.stroke();

      // The black holes, or the single merged one.
      function hole(x, y, rad) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(PH.glowSprite('rgba(255, 180, 84, 0.55)'), x - rad * 2.4, y - rad * 2.4, rad * 4.8, rad * 4.8);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 214, 160, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, rad + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (t < TM) {
        const sep = a0 * Math.pow(Math.max(1 - t / TM, 0), 0.25) + 6;
        const ph = phase(t);
        const r1 = (sep * M2) / (M1 + M2), r2 = (sep * M1) / (M1 + M2);
        hole(cx + Math.cos(ph) * r1, cy + Math.sin(ph) * r1, 11);
        hole(cx - Math.cos(ph) * r2, cy - Math.sin(ph) * r2, 9);
      } else {
        if (t < TM + 0.35) {
          ctx.globalCompositeOperation = 'lighter';
          const k = (t - TM) / 0.35, size = 60 + k * 260;
          ctx.globalAlpha = 1 - k;
          ctx.drawImage(PH.glowSprite('rgba(255, 244, 220, 0.9)'), cx - size / 2, cy - size / 2, size, size);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        hole(cx, cy, 14);
      }

      // Detector trace along the bottom.
      const ty = h - traceH / 2 - 6;
      const total = TM + RING;
      ctx.fillStyle = 'rgba(12, 15, 20, 0.92)';
      ctx.fillRect(0, h - traceH - 12, w, traceH + 12);
      ctx.strokeStyle = PH.color.faint;
      ctx.beginPath();
      ctx.moveTo(14, h - traceH - 11.5);
      ctx.lineTo(w - 14, h - traceH - 11.5);
      ctx.moveTo(14, Math.round(ty) + 0.5);
      ctx.lineTo(w - 14, Math.round(ty) + 0.5);
      ctx.stroke();
      ctx.strokeStyle = PH.color.amber;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const end = Math.min(t, total);
      const n = Math.max(2, Math.floor((end / total) * (w - 28)));
      for (let i = 0; i <= n; i++) {
        const tt = (i / n) * end;
        // Stretch the time axis near the merger so the fast cycles stay readable.
        const x = 14 + Math.pow(tt / total, 1.6) * (w - 28);
        const y = ty - strain(tt) * (traceH * 0.1);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = PH.color.muted;
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('DETECTOR SIGNAL (STRAIN)', 14, h - traceH - 6);
    }

    const loop = new PH.Loop(stage, function (dt) {
      t += dt;
      if (t > TM + RING + HOLD) t = 0;
      readout();
      draw();
    });
    const sync = PH.bindPlay(playBtn, loop);

    document.getElementById('ligo-replay').addEventListener('click', function () {
      t = 0;
      if (!loop.running) {
        loop.play();
        sync();
      }
    });

    // The chirp as sound: the real shape, stretched to about a second and
    // raised two octaves so small speakers can play it.
    function chirpBuffer(ac) {
      const rate = ac.sampleRate, T = 1.0, f0 = 140, fMax = 1000, ring = 0.25;
      const len = Math.floor((T + ring) * rate);
      const buf = ac.createBuffer(1, len, rate);
      const data = buf.getChannelData(0);
      let ph = 0, lastF = f0, lastA = 0;
      for (let i = 0; i < len; i++) {
        const tt = i / rate;
        let f, a;
        if (tt < T) {
          const x = Math.max(1 - tt / T, 1e-4);
          f = Math.min(fMax, f0 * Math.pow(x, -3 / 8));
          a = Math.pow(f / f0, 2 / 3) / Math.pow(fMax / f0, 2 / 3);
          if (f >= fMax) a = Math.max(a, lastA);
          lastF = f;
          lastA = a;
        } else {
          f = lastF;
          a = lastA * Math.exp(-(tt - T) / 0.05);
        }
        const fade = Math.min(1, tt / 0.05);
        ph += (2 * Math.PI * f) / rate;
        data[i] = Math.sin(ph) * a * fade * 0.6;
      }
      return buf;
    }

    hearBtn.addEventListener('click', function () {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) throw new Error('no audio');
        if (!audio) audio = new AC();
        if (audio.state === 'suspended') audio.resume();
        const src = audio.createBufferSource();
        src.buffer = chirpBuffer(audio);
        src.connect(audio.destination);
        src.start();
        playingSound = true;
        msg.textContent = 'This is the real chirp shape, stretched to about a second and raised two octaves so phone speakers can play it.';
        hearBtn.textContent = 'Playing…';
        src.onended = function () {
          playingSound = false;
          hearBtn.textContent = 'Hear the chirp';
        };
        t = 0;
        if (!loop.running) {
          loop.play();
          sync();
        }
      } catch (err) {
        msg.textContent = 'Your browser blocked sound here. Try again after tapping the page, or turn up the volume.';
      }
    });

    PH.onResize(stage, draw);
    t = 4.6;
    readout();
    draw();
    PH.autoplay(loop, sync);
  };
})();
