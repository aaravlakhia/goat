/* Chain Reaction: the reader's display choices. This file loads in the head,
   so the page paints with them from the very first frame. Anything the
   reader hasn't chosen follows their device (reduced motion, more contrast)
   and keeps following it if the device setting changes later. */
(function () {
  'use strict';

  const PH = (window.PH = window.PH || {});
  const KEY = 'ph-display';
  const root = document.documentElement;

  const CHOICES = {
    bg: ['vivid', 'calm', 'off'],
    motion: ['on', 'off'],
    size: ['1', '2', '3', '4'],
    contrast: ['standard', 'high'],
    font: ['classic', 'easy'],
    spacing: ['normal', 'wide'],
    rate: ['slow', 'normal', 'fast'],
    keys: ['on', 'off'],
    sound: ['off', 'on']
  };

  const media = function (q) {
    return window.matchMedia ? window.matchMedia(q) : { matches: false };
  };
  const sysMotion = media('(prefers-reduced-motion: reduce)');
  const sysContrast = media('(prefers-contrast: more)');

  function fallback(name) {
    if (name === 'motion') return sysMotion.matches ? 'off' : 'on';
    if (name === 'contrast') return sysContrast.matches ? 'high' : 'standard';
    return { bg: 'calm', size: '1', font: 'classic', spacing: 'normal', rate: 'normal', keys: 'on', sound: 'off' }[name];
  }

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    // The older pause button kept its own key.
    const old = localStorage.getItem('ph-motion');
    if (old && !saved.motion) saved.motion = old === 'off' ? 'off' : 'on';
  } catch (err) {
    saved = {};
  }

  function get(name) {
    const v = saved[name];
    return CHOICES[name] && CHOICES[name].indexOf(v) >= 0 ? v : fallback(name);
  }

  function all() {
    const out = {};
    Object.keys(CHOICES).forEach(function (n) { out[n] = get(n); });
    return out;
  }

  function apply() {
    const c = root.classList;
    CHOICES.bg.forEach(function (v) { c.toggle('bg-' + v, get('bg') === v); });
    CHOICES.size.forEach(function (v) { c.toggle('ts-' + v, v !== '1' && get('size') === v); });
    c.toggle('motion-off', get('motion') === 'off');
    c.toggle('contrast-high', get('contrast') === 'high');
    c.toggle('font-easy', get('font') === 'easy');
    c.toggle('spacing-wide', get('spacing') === 'wide');
    c.toggle('keys-off', get('keys') === 'off');
  }

  function store() {
    try {
      if (Object.keys(saved).length) localStorage.setItem(KEY, JSON.stringify(saved));
      else localStorage.removeItem(KEY);
      localStorage.removeItem('ph-motion');
    } catch (err) { /* storage can be blocked; the choice still applies until the page closes */ }
  }

  // Apply the choices, then tell everyone listening what changed.
  const listeners = [];
  let snap = all();
  function commit() {
    apply();
    const before = snap;
    snap = all();
    Object.keys(CHOICES).forEach(function (n) {
      if (before[n] !== snap[n]) listeners.forEach(function (fn) { fn(n, snap[n]); });
    });
  }

  function set(name, value) {
    if (!CHOICES[name] || CHOICES[name].indexOf(value) < 0) return;
    saved[name] = value;
    store();
    commit();
  }

  function reset() {
    saved = {};
    store();
    commit();
  }

  [sysMotion, sysContrast].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', commit);
  });

  // Single-key shortcuts (like / or P) are skipped while typing, inside a
  // dialog or an experiment, or when the reader has turned them off.
  function shortcutsOK(e) {
    if (get('keys') === 'off' || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return false;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], .stage, dialog')) return false;
    if (document.querySelector('dialog[open]')) return false;
    return !(document.body && document.body.classList.contains('is-cinema'));
  }

  PH.prefs = {
    choices: CHOICES,
    get: get,
    set: set,
    all: all,
    reset: reset,
    custom: function () { return Object.keys(saved).length > 0; },
    on: function (fn) { listeners.push(fn); },
    shortcutsOK: shortcutsOK
  };

  apply();
})();
