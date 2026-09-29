/* Chain Reaction: the Display panel. Each choice shows at once behind the
   panel and is kept by prefs.js. */
(function () {
  'use strict';

  const PH = window.PH;

  const HINTS = {
    bg: {
      vivid: 'The universe stays bright behind the whole page.',
      calm: 'Bright on the cover, the map and in Present mode. While you read, it fades to a faint glow behind the text.',
      off: 'A plain dark page with nothing behind the text. It saves battery too.'
    },
    contrast: {
      standard: 'Soft silver text on black, as designed.',
      high: 'White text, brighter colors, stronger lines and solid panels behind every block of text.'
    },
    font: {
      classic: 'Newsreader, a book typeface.',
      easy: 'Atkinson Hyperlegible, made by the Braille Institute so every letter is easy to tell apart. Quotes become upright.'
    },
    spacing: {
      normal: 'The spacing of a printed book.',
      wide: 'More room between lines, words and paragraphs, and shorter lines.'
    },
    motion: {
      on: 'The background drifts and experiments start by themselves.',
      off: 'Nothing moves until you press Play: the background stands still, page animations stop and experiments wait for you.'
    },
    sound: {
      off: 'Silent. Nothing on this page makes a sound unless you press a play or hear button.',
      on: 'Soft clicks, chimes and pops for predictions, cards, the spinning years and chain reactions.'
    },
    keys: {
      on: 'Single keys like / and P work as shortcuts.',
      off: 'Only arrow keys, Esc and Ctrl+K do anything, so speech control or a stray key never triggers a shortcut.'
    }
  };

  // The one-tap preset.
  const EASY = { bg: 'off', motion: 'off', size: '3', contrast: 'high', font: 'easy', spacing: 'wide' };

  const EASY_FONT = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';

  function loadEasyFont() {
    if (document.getElementById('font-easy')) return;
    const link = document.createElement('link');
    link.id = 'font-easy';
    link.rel = 'stylesheet';
    link.href = EASY_FONT;
    (document.head || document.documentElement).appendChild(link);
  }

  // Canvas experiments read these colors as they draw.
  const BASE = Object.assign({}, PH.color);
  function paintColors() {
    const hi = PH.prefs.get('contrast') === 'high';
    PH.color.ink = hi ? '#ffffff' : BASE.ink;
    PH.color.muted = hi ? '#dcd8cf' : BASE.muted;
    PH.color.faint = hi ? 'rgba(235, 231, 223, 0.3)' : BASE.faint;
    PH.color.grid = hi ? 'rgba(235, 231, 223, 0.2)' : BASE.grid;
  }

  function isEasy() {
    return Object.keys(EASY).every(function (k) { return PH.prefs.get(k) === EASY[k]; });
  }

  PH.initDisplay = function () {
    const dlg = document.getElementById('display');
    const form = document.getElementById('display-form');
    if (!dlg || !form || !PH.prefs) return;
    const easyBtn = document.getElementById('display-easy');
    const status = document.getElementById('display-status');
    const easyState = document.getElementById('display-easy-state');
    const easyDefault = easyState.textContent;
    let opener = null;

    function sync() {
      const all = PH.prefs.all();
      Object.keys(all).forEach(function (name) {
        form.querySelectorAll('input[name="' + name + '"]').forEach(function (r) {
          r.checked = r.value === all[name];
        });
        const hint = form.querySelector('[data-hint="' + name + '"]');
        if (hint && HINTS[name]) PH.text(hint, HINTS[name][all[name]] || '');
      });
      const on = isEasy();
      easyBtn.setAttribute('aria-pressed', String(on));
      PH.text(easyState, on ? 'On. Tap again to go back to your device\'s settings.' : easyDefault);
    }

    // Without WebGL2 there is no universe to set.
    const bgSet = document.getElementById('opt-bg');
    function checkBg() {
      if (PH.cosmos) return;
      bgSet.disabled = true;
      const hint = bgSet.querySelector('.opt-hint');
      hint.removeAttribute('data-hint');
      PH.text(hint, 'This browser can\'t draw the 3D universe, so the page already uses a plain background.');
    }

    if ('speechSynthesis' in window) document.getElementById('opt-rate').hidden = false;

    function open(e) {
      opener = (e && e.currentTarget) || document.activeElement;
      checkBg();
      sync();
      loadEasyFont();
      if (typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
    }

    function close() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
    }

    dlg.addEventListener('close', function () {
      if (opener && opener.focus && document.contains(opener) && opener.getClientRects().length) opener.focus();
      else {
        const b = document.getElementById('display-open');
        if (b) b.focus();
      }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

    form.addEventListener('change', function (e) {
      const t = e.target;
      if (t && t.name && PH.prefs.choices[t.name]) PH.prefs.set(t.name, t.value);
    });

    // One short announcement per change for screen readers (the radio
    // itself already says what was picked).
    let quiet = false;
    function announce(text) {
      status.textContent = '';
      setTimeout(function () { status.textContent = text; }, 60);
    }

    easyBtn.addEventListener('click', function () {
      quiet = true;
      if (isEasy()) {
        PH.prefs.reset();
        announce('Easiest reading is off. Back to your device\'s settings.');
      } else {
        Object.keys(EASY).forEach(function (k) { PH.prefs.set(k, EASY[k]); });
        announce('Easiest reading is on: larger text, high contrast, the easy-to-read typeface, wide spacing, and no motion.');
      }
      quiet = false;
    });

    document.getElementById('display-reset').addEventListener('click', function () {
      quiet = true;
      PH.prefs.reset();
      quiet = false;
      announce('Reset to your device\'s settings.');
    });

    document.querySelectorAll('[data-display-open]').forEach(function (b) {
      b.addEventListener('click', open);
    });

    PH.prefs.on(function (name, value) {
      if (name === 'font' && value === 'easy') loadEasyFont();
      if (name === 'contrast') paintColors();
      if (name === 'motion' && value === 'off' && PH.stillAll) PH.stillAll();
      // Canvases size themselves to their boxes; let them re-measure after
      // text size or spacing changes the layout.
      if (name === 'size' || name === 'spacing' || name === 'font') {
        requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
      }
      if (dlg.open) {
        sync();
        if (!quiet && HINTS[name] && HINTS[name][value]) announce(HINTS[name][value]);
      }
    });

    if (PH.prefs.get('font') === 'easy') loadEasyFont();
    paintColors();
    PH.display = { open: open, close: close };
  };
})();
