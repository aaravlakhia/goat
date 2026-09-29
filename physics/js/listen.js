/* Chain Reaction: read a chapter aloud with the browser's own voice,
   highlighting each paragraph as it is read. Speech goes one sentence at a
   time (some browsers cut off long passages) and "pause" remembers the
   sentence, so it works the same everywhere. */
(function () {
  'use strict';

  const PH = window.PH;
  const RATE = { slow: 0.82, normal: 1, fast: 1.25 };
  const WPM = 165;

  function words(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  // Split on sentence ends, but not after initials like "C. V." or numbers.
  function sentences(text) {
    const out = [];
    const re = /[^.!?]+(?:[.!?]+["'”’)]*|$)/g;
    let buf = '';
    (text.match(re) || [text]).forEach(function (part) {
      buf += part;
      const trimmed = buf.trim();
      if (/\b[A-Z]\.$/.test(trimmed) || /\d\.$/.test(trimmed) || trimmed.length < 24) return;
      out.push(trimmed);
      buf = '';
    });
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function clean(text) {
    return text.replace(/\s+/g, ' ').replace(/→/g, ' to ').trim();
  }

  // What to read in a chapter, in order, each with the element to highlight.
  function blocks(ch) {
    const out = [];
    const add = function (el, text) {
      if (!el) return;
      text = clean(text === undefined ? el.textContent : text);
      if (text) out.push({ el: el, text: text });
    };
    add(ch.querySelector('.who'), ch.dataset.year + '. ' + ch.dataset.name + '.');
    add(ch.querySelector('h2'));
    ch.querySelectorAll('.main .story p, .main .quote, .main .call, .main .fig figcaption, .main .setoff h3, .main .setoff li').forEach(function (el) {
      if (el.matches('.call')) {
        // The prediction, read as a question with its choices.
        const q = el.querySelector('.call-q');
        const opts = Array.from(el.querySelectorAll('.call-text')).map(function (o, i) { return 'ABCD'[i] + ': ' + o.textContent + '.'; });
        add(el, 'Your call. ' + (q ? q.textContent : '') + ' ' + opts.join(' '));
      } else if (el.matches('.quote')) {
        const q = el.querySelector('p'), who = el.querySelector('footer');
        add(el, (q ? q.textContent : '') + (who ? ' That was ' + who.textContent + '.' : ''));
      } else if (el.matches('li')) {
        const when = el.querySelector('.when'), what = el.querySelector('.what');
        add(el, (when ? when.textContent + '. ' : '') + (what ? what.textContent : el.textContent));
      } else if (el.matches('figcaption')) {
        add(el, 'The experiment. ' + el.textContent.replace(/^\s*Exp\.\s*\d+\.\s*/, ''));
      } else {
        add(el);
      }
    });
    return out;
  }

  PH.initListen = function () {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    const synth = window.speechSynthesis;
    const chapters = Array.from(document.querySelectorAll('.chapter'));
    if (!chapters.length) return;

    let voice = null;
    function pickVoice() {
      const list = synth.getVoices().filter(function (v) { return /^en([-_]|$)/i.test(v.lang); });
      voice = list.find(function (v) { return /natural|neural/i.test(v.name); }) ||
        list.find(function (v) { return /google (uk|us) english/i.test(v.name); }) ||
        list.find(function (v) { return v.default; }) ||
        list.find(function (v) { return v.localService; }) || list[0] || null;
    }
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);

    /* ---------- The floating player ---------- */

    const bar = document.createElement('div');
    bar.className = 'player';
    bar.id = 'player';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Read aloud');
    bar.hidden = true;
    bar.innerHTML =
      '<button class="pl-btn" type="button" id="pl-prev" aria-label="Previous paragraph"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3v10M13 3.5v9L6 8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path></svg></button>' +
      '<button class="pl-btn pl-main" type="button" id="pl-toggle" aria-label="Pause reading"><svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></path></svg><svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10l8-5z" fill="currentColor"></path></svg></button>' +
      '<button class="pl-btn" type="button" id="pl-next" aria-label="Next paragraph"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12 3v10M3 3.5v9L10 8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path></svg></button>' +
      '<p class="pl-what"><b id="pl-name"></b><span id="pl-pos"></span></p>' +
      '<button class="pl-btn pl-rate" type="button" id="pl-rate" aria-label="Reading speed"></button>' +
      '<button class="pl-btn" type="button" id="pl-stop" aria-label="Stop reading"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg></button>' +
      '<p class="pl-note" id="pl-note" role="status"></p>';
    document.body.appendChild(bar);
    const $ = function (id) { return document.getElementById(id); };
    const toggle = $('pl-toggle'), nameOut = $('pl-name'), posOut = $('pl-pos'), rateBtn = $('pl-rate'), note = $('pl-note');

    /* ---------- State ---------- */

    let chapter = null, list = [], queue = [], qi = 0, playing = false, token = 0, marked = null, started = 0;
    const buttons = new Map();

    function blockIndex() {
      return queue[qi] ? queue[qi].b : list.length - 1;
    }

    function mark(el) {
      if (marked === el) return;
      if (marked) marked.classList.remove('is-reading');
      marked = el;
      if (!el) return;
      el.classList.add('is-reading');
      // Keep the paragraph being read in view.
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      if (r.top < 90 || r.bottom > vh - 110) {
        el.scrollIntoView({ block: 'center', behavior: PH.reducedMotion() ? 'auto' : 'smooth' });
      }
    }

    function syncUI() {
      bar.hidden = !chapter;
      bar.classList.toggle('is-playing', playing);
      toggle.setAttribute('aria-label', playing ? 'Pause reading' : 'Resume reading');
      if (chapter) {
        PH.text(nameOut, chapter.dataset.name);
        PH.text(posOut, 'Part ' + (blockIndex() + 1) + ' of ' + list.length);
      }
      const rate = PH.prefs ? PH.prefs.get('rate') : 'normal';
      const shown = rate === 'slow' ? '0.8×' : rate === 'fast' ? '1.25×' : '1×';
      PH.text(rateBtn, shown);
      rateBtn.setAttribute('aria-label', shown + ' speed. Change reading speed');
      buttons.forEach(function (btn, ch) {
        const on = ch === chapter && playing;
        btn.classList.toggle('is-on', ch === chapter);
        PH.text(btn.querySelector('.listen-label'), on ? 'Pause' : ch === chapter ? 'Resume' : 'Listen');
      });
    }

    function load(ch) {
      chapter = ch;
      list = blocks(ch);
      queue = [];
      list.forEach(function (b, i) {
        sentences(b.text).forEach(function (s) { queue.push({ b: i, text: s }); });
      });
      qi = 0;
    }

    function speak() {
      if (!playing) return;
      if (!chapter || !chapter.offsetHeight || PH.hush) {
        // The chapter was hidden (another exhibit, or Present mode).
        pause();
        return;
      }
      if (qi >= queue.length) {
        finish();
        return;
      }
      const item = queue[qi];
      mark(list[item.b].el);
      syncUI();
      const u = new SpeechSynthesisUtterance(item.text);
      u.lang = voice ? voice.lang : 'en-GB';
      if (voice) u.voice = voice;
      u.rate = RATE[PH.prefs ? PH.prefs.get('rate') : 'normal'] || 1;
      const my = ++token;
      started = performance.now();
      u.onend = function () {
        if (my !== token) return;
        qi++;
        speak();
      };
      u.onerror = function (e) {
        if (my !== token) return;
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        // No voice at all, or the browser refused: say so instead of failing silently.
        if (performance.now() - started < 400 && (e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable' || e.error === 'voice-unavailable' || e.error === 'not-allowed')) {
          playing = false;
          PH.text(note, e.error === 'not-allowed' ? 'Tap play to start reading.' : 'This browser has no voice installed for reading aloud.');
          syncUI();
          return;
        }
        qi++;
        speak();
      };
      synth.speak(u);
    }

    function play(ch, from) {
      if (ch !== chapter) load(ch);
      if (from !== undefined) qi = from;
      playing = true;
      PH.text(note, '');
      token++;
      synth.cancel();
      // Some browsers drop a speak() that follows cancel() too closely.
      setTimeout(speak, 60);
      syncUI();
    }

    function pause() {
      playing = false;
      token++;
      synth.cancel();
      syncUI();
    }

    function stop() {
      pause();
      mark(null);
      chapter = null;
      syncUI();
    }

    function finish() {
      playing = false;
      token++;
      qi = 0;
      mark(null);
      PH.text(note, 'Finished ' + chapter.dataset.name + '.');
      syncUI();
    }

    // Jump a whole paragraph back or forward.
    function jump(d) {
      if (!chapter) return;
      const target = PH.clamp(blockIndex() + d, 0, list.length - 1);
      const at = queue.findIndex(function (q) { return q.b === target; });
      if (playing) play(chapter, at);
      else {
        qi = at;
        mark(list[target].el);
        syncUI();
      }
    }

    /* ---------- A Listen button in every chapter ---------- */

    chapters.forEach(function (ch) {
      const who = ch.querySelector('.who');
      if (!who) return;
      const mins = Math.max(1, Math.round(blocks(ch).reduce(function (n, b) { return n + words(b.text); }, 0) / WPM));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'listen';
      // The visible word (Listen, Pause, Resume) starts the button's name.
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.5l3.5-3v10l-3.5-3h-2.5z" fill="currentColor"></path><path d="M10.8 5.2a4 4 0 0 1 0 5.6M12.7 3.4a6.5 6.5 0 0 1 0 9.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path></svg><span class="listen-label">Listen</span><span class="sr-only">, ' + ch.dataset.name.replace(/&/g, 'and').replace(/[<>]/g, '') + ' chapter read aloud, about </span><span class="listen-time">' + mins + ' min</span>';
      btn.addEventListener('click', function () {
        if (chapter === ch && playing) pause();
        else play(ch);
      });
      who.insertAdjacentElement('afterend', btn);
      buttons.set(ch, btn);
    });

    toggle.addEventListener('click', function () {
      if (!chapter) return;
      if (playing) pause();
      else play(chapter);
    });
    $('pl-stop').addEventListener('click', stop);
    $('pl-prev').addEventListener('click', function () { jump(-1); });
    $('pl-next').addEventListener('click', function () { jump(1); });
    rateBtn.addEventListener('click', function () {
      if (!PH.prefs) return;
      const r = PH.prefs.get('rate');
      PH.prefs.set('rate', r === 'normal' ? 'fast' : r === 'fast' ? 'slow' : 'normal');
    });
    if (PH.prefs) PH.prefs.on(function (name) { if (name === 'rate') syncUI(); });

    window.addEventListener('pagehide', function () { synth.cancel(); });
    synth.cancel();
    PH.listen = { play: play, pause: pause, stop: stop, get playing() { return playing; }, get chapter() { return chapter; } };
  };
})();
