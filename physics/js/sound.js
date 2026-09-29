/* Chain Reaction: sound effects, made on the spot with the Web Audio API
   (no audio files). They stay silent until the reader turns them on in
   Display, and every one is short and quiet. */
(function () {
  'use strict';

  const PH = window.PH;
  let ctx = null, out = null;
  const last = {};
  // The shortest gap between two of the same sound, in ms.
  const GAP = { tick: 25, thud: 70, pop: 200, flip: 80, whoosh: 250 };

  function wanted() {
    return !!(PH.prefs && PH.prefs.get('sound') === 'on');
  }

  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (err) {
      return null;
    }
    out = ctx.createGain();
    out.gain.value = 0.32;
    const comp = ctx.createDynamicsCompressor();
    out.connect(comp);
    comp.connect(ctx.destination);
    return ctx;
  }

  function tone(c, t, freq, dur, o) {
    o = o || {};
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const peak = o.gain || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  let noiseBuf = null;
  function noise(c, t, dur, o) {
    o = o || {};
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain || 0.15, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    // One click of a digit wheel.
    tick: function (c, t) { tone(c, t, 1900, 0.03, { type: 'square', gain: 0.035 }); },
    // An odometer spinning down: clicks that slow as it settles.
    spin: function (c, t) {
      let at = t, gap = 0.028;
      for (let i = 0; i < 14; i++) {
        tone(c, at, 1700 + (i % 2) * 300, 0.03, { type: 'square', gain: 0.03 });
        at += gap;
        gap *= 1.17;
      }
    },
    right: function (c, t) {
      [1047, 1319, 1568, 2093].forEach(function (f, i) { tone(c, t + i * 0.07, f, 0.35, { type: 'triangle', gain: 0.16 }); });
    },
    wrong: function (c, t) {
      tone(c, t, 392, 0.22, { type: 'triangle', gain: 0.14 });
      tone(c, t + 0.13, 311, 0.3, { type: 'triangle', gain: 0.12 });
    },
    card: function (c, t) {
      [2093, 2637, 3136, 3520, 4186].forEach(function (f, i) { tone(c, t + i * 0.055, f, 0.4, { gain: 0.07 }); });
      noise(c, t, 0.5, { freq: 5000, to: 9000, q: 0.7, gain: 0.05, attack: 0.05 });
    },
    flip: function (c, t) { noise(c, t, 0.09, { freq: 1400, to: 3200, q: 1.2, gain: 0.12 }); },
    // A nucleus splitting: a low thump and a burst.
    pop: function (c, t) {
      tone(c, t, 170, 0.35, { to: 38, gain: 0.32 });
      noise(c, t, 0.22, { filter: 'lowpass', freq: 1400, to: 200, gain: 0.16 });
    },
    whoosh: function (c, t) { noise(c, t, 0.45, { freq: 350, to: 2600, q: 0.9, gain: 0.08, attack: 0.12 }); },
    thud: function (c, t) {
      tone(c, t, 150, 0.14, { to: 60, gain: 0.16 });
      noise(c, t, 0.06, { filter: 'lowpass', freq: 800, gain: 0.05 });
    }
  };

  PH.sound = {
    play: function (name) {
      if (!wanted() || !SOUNDS[name]) return;
      const now = performance.now();
      if (last[name] && now - last[name] < (GAP[name] || 40)) return;
      last[name] = now;
      const c = audio();
      if (!c) return;
      if (c.state === 'suspended') c.resume().catch(function () {});
      try {
        SOUNDS[name](c, c.currentTime + 0.01);
      } catch (err) { /* a sound is never worth an error */ }
    },
    get available() {
      return !!(window.AudioContext || window.webkitAudioContext);
    }
  };

  // No Web Audio, no sound setting.
  if (!PH.sound.available) {
    const opt = document.getElementById('opt-sound');
    if (opt) opt.hidden = true;
  }

  // Browsers only let sound start after a tap or key press, so wake the
  // audio on the first one if the reader has sound on.
  function unlock() {
    if (!wanted()) return;
    const c = audio();
    if (c && c.state === 'suspended') c.resume().catch(function () {});
  }
  ['pointerdown', 'keydown'].forEach(function (type) {
    window.addEventListener(type, unlock, { passive: true });
  });

  // Turning sound on answers with a small chime, so you know it works.
  if (PH.prefs) {
    PH.prefs.on(function (name, value) {
      if (name === 'sound' && value === 'on') setTimeout(function () { PH.sound.play('right'); }, 30);
    });
  }
})();
