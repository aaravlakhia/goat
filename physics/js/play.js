/* Chain Reaction: play along. Before every experiment the reader makes a
   call, a prediction, and then tests it. Every call unlocks that
   physicist's card; a right first guess makes it a foil card. Collect all
   twelve for a certificate. Progress stays in this browser. */
(function () {
  'use strict';

  const PH = window.PH;
  const KEY = 'ph-deck';

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const click = function (sel) { const b = $(sel); if (b) b.click(); return b; };
  const ensurePlaying = function (id) {
    const b = document.getElementById(id);
    if (b && /play/i.test(b.textContent)) b.click();
  };

  // One question per discovery. `a` is the right option; `act` sets the
  // experiment up to test the answer and returns the control to focus.
  const CALLS = {
    galileo: {
      q: 'On the Moon, an astronaut drops a hammer and a feather at the same moment. Which hits the ground first?',
      opts: ['The hammer', 'The feather', 'They land together'],
      a: 2,
      why: 'There is no air on the Moon, so nothing holds the feather back. Gravity speeds everything up at the same rate, heavy or light. Astronaut David Scott tried it in 1971.',
      label: 'Drop them on the Moon',
      act: function () { return click('[data-gal-world="moon"]'); }
    },
    newton: {
      q: 'Why doesn\'t the Moon fall down onto the Earth?',
      opts: ['There is no gravity out in space', 'It is falling, but moves sideways so fast that it keeps missing', 'The Sun\'s pull holds it up'],
      a: 1,
      why: 'The Moon is falling all the time. It also moves sideways at about 1 km every second, so the Earth curves away beneath it as fast as it falls. That is an orbit.',
      label: 'Fire at orbit speed',
      act: function () { return click('[data-new-v="7.82"]'); }
    },
    faraday: {
      q: 'A strong magnet sits perfectly still inside a coil of wire. How much electricity flows in the wire?',
      opts: ['A lot, because the magnet is right inside', 'A little', 'None at all'],
      a: 2,
      why: 'Electricity only flows while the magnetic field through the coil is changing. A magnet that isn\'t moving makes none, however strong it is.',
      label: 'Try it: move the magnet',
      act: function () { return $('#far-stage'); }
    },
    maxwell: {
      q: 'Which one of these is NOT a kind of light?',
      opts: ['Radio waves', 'X-rays', 'Sound', 'Wi-Fi signals'],
      a: 2,
      why: 'Radio, Wi-Fi and X-rays are all electromagnetic waves, the same kind of wave as light but with different lengths. Sound is air being squeezed and stretched, so it can\'t cross empty space.',
      label: 'Tune to Wi-Fi',
      act: function () { return click('[data-max-f="2.4e9"]'); }
    },
    curie: {
      q: 'You have 400 radioactive atoms with a half-life of one hour. About how many are left after two hours?',
      opts: ['None', '100', '200'],
      a: 1,
      why: 'In every half-life, half of what is left decays: 400 becomes 200 after one hour, then 100 after two.',
      label: 'Watch 400 atoms decay',
      act: function () { const b = click('#cur-restart'); ensurePlaying('cur-play'); return b; }
    },
    einstein: {
      q: 'One twin stays on Earth. The other flies to a star and back at 86.6% of the speed of light. When they meet again, who is younger?',
      opts: ['The twin who stayed home', 'The twin who travelled', 'They are the same age'],
      a: 1,
      why: 'Moving clocks run slow. At 86.6% of light speed the traveller\'s clocks, heart and body tick at half the rate, so the traveller comes home younger.',
      label: 'Set the ship to 86.6%',
      act: function () { const b = click('[data-ein-v="866"]'); ensurePlaying('ein-play'); return b; }
    },
    rutherford: {
      q: 'Fire tiny, heavy alpha particles at gold foil far thinner than a hair. What do most of them do?',
      opts: ['Bounce straight back', 'Get stuck in the gold', 'Go straight through'],
      a: 2,
      why: 'Almost all of them go straight through, because an atom is almost entirely empty space. Only about 1 in 8,000 comes close enough to the tiny nucleus to bounce back.',
      label: 'Fire at the gold',
      act: function () { const b = click('[data-ruth-model="rutherford"]'); click('#ruth-reset'); ensurePlaying('ruth-play'); return b; }
    },
    bohr: {
      q: 'Heat hydrogen gas until it glows, then pass its light through a prism. What do you see?',
      opts: ['A full rainbow', 'A few thin lines of color', 'Plain white light'],
      a: 1,
      why: 'Electrons in hydrogen can only jump between fixed levels, so the gas gives out only a few exact colors: four thin visible lines, red, cyan, blue and violet.',
      label: 'Heat the gas',
      act: function () { const b = $('#bohr-heat'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return b; }
    },
    debroglie: {
      q: 'Electrons are fired one at a time at a wall with two narrow slits. After thousands have landed on the screen, what pattern do you see?',
      opts: ['Two bands, one behind each slit', 'Many stripes', 'One blurry blob'],
      a: 1,
      why: 'Many stripes: an interference pattern, which only waves can make. Each electron behaves like a wave that goes through both slits at once.',
      label: 'Start with a clear screen',
      act: function () { click('#dbg-reset'); return click('[data-dbg-rate="40"]'); }
    },
    raman: {
      q: 'A green laser shines on a diamond. What color is the light that scatters off it?',
      opts: ['All green', 'Almost all green, plus a tiny bit of a new color', 'All red'],
      a: 1,
      why: 'Nearly all of it stays green. About 1 photon in 10 million comes out a slightly different color, shifted by the vibrations of the diamond\'s atoms. That was Raman\'s discovery.',
      label: 'Shine the laser on diamond',
      act: function () { const b = click('[data-ram-sample="diamond"]'); ensurePlaying('ram-play'); return b; }
    },
    meitner: {
      q: 'One split causes 2 more, those cause 4, then 8. After 10 doublings, about how many nuclei split at once?',
      opts: ['20', 'About 1,000', 'About a million'],
      a: 1,
      why: 'Ten doublings make 1,024. Twenty make about a million, and 80 doublings would split roughly every atom in half a kilogram of uranium. That runaway growth is a chain reaction.',
      label: 'Pull the control rods out',
      act: function () {
        const r = $('#mei-rods');
        if (r) {
          r.value = '20';
          r.dispatchEvent(new Event('input', { bubbles: true }));
        }
        ensurePlaying('mei-play');
        return click('#mei-fire');
      }
    },
    ligo: {
      q: 'In 2015 a gravitational wave from two colliding black holes passed through the Earth. How much did it stretch LIGO\'s 4 km arms?',
      opts: ['About a millimeter', 'About the width of a hair', 'Less than a ten-thousandth of the width of a proton'],
      a: 2,
      why: 'Less than a ten-thousandth of the width of a proton, measured with lasers bouncing along the arms. It is one of the smallest measurements ever made.',
      label: 'Replay the collision',
      act: function () { return click('#ligo-replay'); }
    }
  };

  // Age at discovery, for the cards (the LIGO team is a thousand people).
  const AGE = { galileo: 74, newton: 44, faraday: 39, maxwell: 34, curie: 31, einstein: 26, rutherford: 39, bohr: 27, debroglie: 32, raman: 39, meitner: 60 };
  const LETTERS = 'ABCD';

  /* ---------- Saved progress ---------- */

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || '{}');
      return d && typeof d === 'object' ? d : {};
    } catch (err) {
      return {};
    }
  }

  let deck = load();
  Object.keys(deck).forEach(function (k) { if (!CALLS[k] || typeof deck[k].pick !== 'number') delete deck[k]; });

  function save() {
    try {
      if (Object.keys(deck).length) localStorage.setItem(KEY, JSON.stringify(deck));
      else localStorage.removeItem(KEY);
    } catch (err) { /* storage can be blocked; progress lasts until the page closes */ }
  }

  function counts() {
    const ids = Object.keys(deck);
    return { got: ids.length, foil: ids.filter(function (k) { return deck[k].right; }).length };
  }

  function sound(name) {
    if (PH.sound) PH.sound.play(name);
  }

  function moving() {
    return !PH.reducedMotion();
  }

  PH.initPlay = function () {
    const story = PH.story;
    if (!story) return;
    const byId = story.byId;
    const order = story.chapters.map(function (c) { return c.id; });
    const lanes = story.lanes;
    const callEls = {};

    function chapterInfo(id) {
      const c = byId[id];
      return { c: c, n: c.index + 1, lane: lanes[c.lane].name, name: c.name, short: c.short };
    }

    /* ---------- "Your call" in every chapter ---------- */

    function buildCall(id) {
      const ch = document.getElementById(id);
      const fig = ch && ch.querySelector('.main .fig');
      const spec = CALLS[id];
      if (!fig || !spec) return;
      const sec = document.createElement('section');
      sec.className = 'call';
      sec.setAttribute('aria-labelledby', 'call-' + id + '-q');
      sec.innerHTML =
        '<p class="call-kicker"><span class="call-tag">Your call</span><span class="call-note">Predict first, then test it below</span></p>' +
        '<p class="call-q" id="call-' + id + '-q"></p>' +
        '<div class="call-opts" role="group" aria-labelledby="call-' + id + '-q"></div>' +
        '<div class="call-result" role="status"></div>' +
        '<p class="call-actions" hidden></p>';
      sec.querySelector('.call-q').textContent = spec.q;
      const opts = sec.querySelector('.call-opts');
      spec.opts.forEach(function (text, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'call-opt';
        b.innerHTML = '<span class="call-letter" aria-hidden="true">' + LETTERS[i] + '</span><span class="call-text"></span><span class="call-mark"></span>';
        b.querySelector('.call-text').textContent = text;
        b.addEventListener('click', function () { answer(id, i, b); });
        opts.appendChild(b);
      });
      fig.insertAdjacentElement('beforebegin', sec);
      callEls[id] = sec;
      paintCall(id, false);
    }

    function paintCall(id, fresh) {
      const sec = callEls[id];
      if (!sec) return;
      const spec = CALLS[id], st = deck[id];
      const buttons = Array.from(sec.querySelectorAll('.call-opt'));
      const result = sec.querySelector('.call-result');
      const actions = sec.querySelector('.call-actions');
      sec.classList.toggle('is-done', !!st);
      sec.classList.toggle('is-right', !!(st && st.right));
      sec.classList.toggle('is-fresh', !!fresh);
      buttons.forEach(function (b, i) {
        const mark = b.querySelector('.call-mark');
        b.disabled = !!st;
        b.classList.toggle('is-answer', !!st && i === spec.a);
        b.classList.toggle('is-miss', !!st && i === st.pick && i !== spec.a);
        b.classList.toggle('is-picked', !!st && i === st.pick);
        mark.textContent = !st ? '' : i === spec.a ? (i === st.pick ? '✓ Your call, and right' : '✓ Right answer') : i === st.pick ? '✗ Your call' : '';
      });
      if (!st) {
        result.textContent = '';
        actions.hidden = true;
        actions.textContent = '';
        return;
      }
      const verdict = st.right ? 'Right! ' : 'Not quite. ';
      result.innerHTML = '<p class="call-verdict"><b></b><span></span></p>';
      result.querySelector('b').textContent = verdict;
      result.querySelector('span').textContent = spec.why;
      actions.hidden = false;
      actions.innerHTML = '';
      const test = document.createElement('button');
      test.type = 'button';
      test.className = 'btn btn--solid call-test';
      test.innerHTML = '<span></span> <span aria-hidden="true">↓</span>';
      test.firstChild.textContent = 'Test it: ' + spec.label;
      test.addEventListener('click', function () { testIt(id); });
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'btn call-card';
      card.textContent = st.right ? 'See your foil card' : 'See your card';
      card.addEventListener('click', function (e) { openDeck(e, id); });
      actions.append(test, card);
    }

    function answer(id, i, btn) {
      if (deck[id]) return;
      const spec = CALLS[id];
      const right = i === spec.a;
      deck[id] = { pick: i, right: right };
      save();
      paintCall(id, true);
      const test = callEls[id].querySelector('.call-test');
      // The pressed option is disabled now, so keep focus nearby.
      if (test && (document.activeElement === btn || document.activeElement === document.body)) test.focus({ preventScroll: true });
      sound(right ? 'right' : 'wrong');
      updateCount();
      renderDeck();
      setTimeout(function () { toast(id, right); }, 700);
      if (counts().got === order.length) setTimeout(celebrate, 1600);
    }

    function testIt(id) {
      const fig = document.querySelector('#' + id + ' .fig');
      if (!fig) return;
      fig.scrollIntoView({ block: 'center', behavior: moving() ? 'smooth' : 'auto' });
      setTimeout(function () {
        let target = null;
        try { target = CALLS[id].act(); } catch (err) { console.error(err); }
        if (target && target.focus) target.focus({ preventScroll: true });
      }, moving() ? 450 : 0);
    }

    /* ---------- The deck button in the top bar ---------- */

    const deckBtn = document.getElementById('deck-open');
    const deckCount = document.getElementById('deck-count');
    let shown = -1;
    function updateCount() {
      const k = counts();
      // The deck button gives a little hop when a card lands in it.
      if (deckBtn && shown >= 0 && k.got > shown && moving()) {
        deckBtn.classList.remove('is-bump');
        void deckBtn.offsetWidth;
        deckBtn.classList.add('is-bump');
      }
      shown = k.got;
      if (deckCount) PH.text(deckCount, k.got + '/' + order.length);
      if (deckBtn) {
        deckBtn.setAttribute('aria-label', 'Deck, ' + k.got + ' of ' + order.length + ' cards collected');
        deckBtn.classList.toggle('has-cards', k.got > 0);
        deckBtn.classList.toggle('is-full', k.got === order.length);
      }
    }

    /* ---------- Cards ---------- */

    // A card lives inside a button, so it is built from spans only.
    function cardFaces(id) {
      const info = chapterInfo(id), st = deck[id];
      const no = 'No. ' + String(info.n).padStart(2, '0');
      const stat = AGE[id] ? 'Age ' + AGE[id] : '1,000+ people';
      return '<span class="card-faces">' +
        '<span class="card-face card-front" aria-hidden="true">' +
          '<span class="card-top"><span class="card-no">' + no + '</span><span class="card-lane"></span></span>' +
          '<span class="card-art">' + PH.emblem(id) + '</span>' +
          '<span class="card-year">' + info.c.year + '</span>' +
          '<span class="card-name"></span>' +
          '<span class="card-idea"></span>' +
          '<span class="card-foot"><span>' + stat + '</span><span class="card-badge">' + (st.right ? '★ Foil' : 'Card') + '</span></span>' +
        '</span>' +
        '<span class="card-face card-back" aria-hidden="true">' +
          '<span class="card-back-kicker">Your call</span>' +
          '<span class="card-back-q"></span>' +
          '<span class="card-back-a"></span>' +
          '<span class="card-back-why"></span>' +
          '<span class="card-back-hint">Tap to turn back</span>' +
        '</span>' +
      '</span>';
    }

    function fillText(el, id) {
      const info = chapterInfo(id), spec = CALLS[id], st = deck[id];
      el.querySelector('.card-lane').textContent = info.lane;
      el.querySelector('.card-name').textContent = info.name;
      el.querySelector('.card-idea').textContent = info.c.idea;
      el.querySelector('.card-back-q').textContent = spec.q;
      el.querySelector('.card-back-a').textContent = 'You said: ' + spec.opts[st.pick] + (st.right ? '. Right!' : '. The answer: ' + spec.opts[spec.a] + '.');
      el.querySelector('.card-back-why').textContent = spec.why;
    }

    // Tilt toward the pointer, and move the foil's shine with it.
    function tilt(card) {
      if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
      card.addEventListener('pointermove', function (e) {
        if (!moving()) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 22).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 22).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        card.classList.add('is-tilting');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.classList.remove('is-tilting');
      });
    }

    function makeCard(id) {
      const st = deck[id];
      const info = chapterInfo(id);
      const wrap = document.createElement('li');
      wrap.className = 'deck-item';
      wrap.dataset.lane = info.c.lane;
      if (!st) {
        wrap.innerHTML =
          '<div class="card is-locked">' +
            '<div class="card-face card-front">' +
              '<div class="card-top"><span class="card-no">No. ' + String(info.n).padStart(2, '0') + '</span><span class="card-lane"></span></div>' +
              '<div class="card-art">' + PH.emblem(id) + '<span class="card-q" aria-hidden="true">?</span></div>' +
              '<p class="card-year">' + info.c.year + '</p>' +
              '<p class="card-lock">Make your call in this chapter to unlock the card.</p>' +
              '<button class="btn card-go" type="button"></button>' +
            '</div>' +
          '</div>';
        wrap.querySelector('.card-lane').textContent = info.lane;
        const go = wrap.querySelector('.card-go');
        go.textContent = 'Go to ' + info.short;
        go.setAttribute('aria-label', 'Go to ' + info.name + ' to unlock card ' + info.n);
        go.addEventListener('click', function () { goTo(id); });
        return wrap;
      }
      const spec = CALLS[id];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card' + (st.right ? ' is-foil' : '');
      card.setAttribute('aria-pressed', 'false');
      card.setAttribute('aria-label', info.name + ', ' + info.c.year + (st.right ? ', foil card' : ', card') + '. Turn over');
      card.setAttribute('aria-describedby', 'card-desc-' + id);
      card.innerHTML = cardFaces(id);
      fillText(card, id);
      card.addEventListener('click', function () {
        card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
        sound('flip');
      });
      tilt(card);
      const desc = document.createElement('span');
      desc.id = 'card-desc-' + id;
      desc.hidden = true;
      desc.textContent = info.c.idea + '. Your call: ' + spec.q + ' You said ' + spec.opts[st.pick] + (st.right ? ', which is right.' : '. The answer is ' + spec.opts[spec.a] + '.');
      wrap.append(card, desc);
      return wrap;
    }

    /* ---------- The deck ---------- */

    const dlg = document.getElementById('deck');
    const grid = document.getElementById('deck-grid');
    const summary = document.getElementById('deck-summary');
    const meter = document.getElementById('deck-meter');
    const certBox = document.getElementById('deck-cert');
    let opener = null;

    if (meter) {
      order.forEach(function (id) {
        const i = document.createElement('i');
        i.dataset.lane = byId[id].lane;
        meter.appendChild(i);
      });
    }

    function renderDeck() {
      if (!grid) return;
      const k = counts();
      grid.textContent = '';
      order.forEach(function (id) { grid.appendChild(makeCard(id)); });
      if (summary) {
        PH.text(summary, k.got === 0
          ? 'No cards yet. Make your call in any chapter to win its card; call it right and it\'s a foil.'
          : k.got + ' of ' + order.length + ' cards · ' + k.foil + ' foil' + (k.got === order.length ? ' · the chain is complete!' : ''));
      }
      if (meter) {
        Array.from(meter.children).forEach(function (i, n) {
          const st = deck[order[n]];
          i.className = st ? (st.right ? 'is-foil' : 'is-got') : '';
        });
      }
      if (certBox) certBox.hidden = k.got !== order.length;
      const reset = document.getElementById('deck-reset');
      if (reset) reset.hidden = k.got === 0;
    }

    function openDeck(e, focusId) {
      if (!dlg) return;
      opener = (e && e.currentTarget) || document.activeElement;
      renderDeck();
      if (typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
      sound('whoosh');
      if (focusId) {
        const idx = order.indexOf(focusId);
        const item = grid.children[idx];
        const target = item && item.querySelector('.card, .card-go');
        if (target) {
          target.focus({ preventScroll: true });
          item.scrollIntoView({ block: 'center' });
        }
      }
    }

    function closeDeck() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
    }

    function goTo(id) {
      closeDeck();
      if (PH.nav && PH.nav.current) PH.nav.open(id);
      else {
        const call = callEls[id] || document.getElementById(id);
        if (call) call.scrollIntoView({ block: 'center', behavior: moving() ? 'smooth' : 'auto' });
        const first = call && call.querySelector('.call-opt:not(:disabled)');
        if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, moving() ? 500 : 0);
      }
    }

    if (dlg) {
      dlg.addEventListener('close', function () {
        if (opener && opener.focus && document.contains(opener) && opener.getClientRects().length) opener.focus();
        else if (deckBtn) deckBtn.focus();
      });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDeck(); });
      const x = document.getElementById('deck-close');
      if (x) x.addEventListener('click', closeDeck);
      // Starting over takes two presses, so a stray tap can't wipe the deck.
      const reset = document.getElementById('deck-reset');
      if (reset) {
        let armed = false, t = 0;
        reset.addEventListener('click', function () {
          if (!armed) {
            armed = true;
            reset.textContent = 'Press again to clear all 12';
            t = setTimeout(function () { armed = false; reset.textContent = 'Start over'; }, 4000);
            return;
          }
          clearTimeout(t);
          armed = false;
          reset.textContent = 'Start over';
          deck = {};
          save();
          order.forEach(function (id) { paintCall(id, false); });
          updateCount();
          renderDeck();
          const status = document.getElementById('deck-status');
          if (status) PH.text(status, 'Your deck is empty again. Every call is open.');
          const close = document.getElementById('deck-close');
          if (close) close.focus();
        });
      }
    }
    if (deckBtn) deckBtn.addEventListener('click', function (e) { openDeck(e); });

    /* ---------- A card arrives ---------- */

    const toastBox = document.createElement('div');
    toastBox.className = 'toast';
    toastBox.id = 'toast';
    toastBox.hidden = true;
    const toastLive = document.createElement('p');
    toastLive.className = 'sr-only';
    toastLive.setAttribute('role', 'status');
    document.body.append(toastBox, toastLive);
    let toastTimer = 0, toastHold = false;

    function hideToast() {
      toastBox.classList.remove('is-in');
      setTimeout(function () { if (!toastBox.classList.contains('is-in')) toastBox.hidden = true; }, moving() ? 400 : 0);
    }

    function armToast() {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { if (!toastHold) hideToast(); else armToast(); }, 7000);
    }

    function toast(id, right) {
      const info = chapterInfo(id);
      const all = counts().got === order.length;
      toastBox.dataset.lane = info.c.lane;
      toastBox.innerHTML =
        '<div class="toast-card' + (right ? ' is-foil' : '') + '" aria-hidden="true"><span class="toast-art">' + PH.emblem(id) + '</span></div>' +
        '<div class="toast-body"><p class="toast-kicker"></p><p class="toast-name"></p><p class="toast-sub"></p>' +
        '<p class="toast-actions"><button class="btn btn--solid" type="button" data-t="open">Open your deck</button><button class="btn toast-x" type="button" data-t="close" aria-label="Dismiss">×</button></p></div>';
      toastBox.querySelector('.toast-kicker').textContent = right ? '★ Foil card' : 'New card';
      toastBox.querySelector('.toast-name').textContent = info.name;
      toastBox.querySelector('.toast-sub').textContent = all
        ? 'That\'s all twelve! Your certificate is waiting in the deck.'
        : counts().got + ' of ' + order.length + ' collected' + (right ? '. You called it right.' : '.');
      toastBox.querySelector('[data-t="open"]').addEventListener('click', function (e) { hideToast(); openDeck(e, id); });
      toastBox.querySelector('[data-t="close"]').addEventListener('click', hideToast);
      toastBox.hidden = false;
      void toastBox.offsetWidth;
      toastBox.classList.add('is-in');
      toastLive.textContent = '';
      setTimeout(function () {
        toastLive.textContent = (right ? 'Foil card unlocked: ' : 'Card unlocked: ') + info.name + '. ' + counts().got + ' of ' + order.length + ' collected.';
      }, 60);
      sound('card');
      armToast();
    }
    toastBox.addEventListener('pointerenter', function () { toastHold = true; });
    toastBox.addEventListener('pointerleave', function () { toastHold = false; });
    toastBox.addEventListener('focusin', function () { toastHold = true; });
    toastBox.addEventListener('focusout', function () { toastHold = false; });

    // All twelve: the universe answers with a burst of chain reactions.
    function celebrate() {
      if (!moving() || !PH.cosmos || document.body.classList.contains('is-cinema')) return;
      const w = window.innerWidth, h = window.innerHeight;
      [[0.5, 0.45], [0.3, 0.35], [0.7, 0.4], [0.45, 0.65], [0.6, 0.25]].forEach(function (p, i) {
        setTimeout(function () { PH.cosmos.shock(w * p[0], h * p[1]); sound('pop'); }, i * 420);
      });
    }

    /* ---------- The certificate ---------- */

    const certName = document.getElementById('cert-name');
    const certMake = document.getElementById('cert-make');
    const certOut = document.getElementById('cert-out');
    let downloads = null;
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('downloads').then(function (d) { downloads = d; }).catch(function () { downloads = null; });
    }

    function loadImage(src) {
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { resolve(null); };
        img.src = src;
      });
    }

    function laneColor(i) {
      return ['#6aaeff', '#ff8a5c', '#3ddc9a', '#ffb454', '#ff7fb0'][i];
    }

    async function drawCertificate(name) {
      const W = 1600, H = 1130;
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const g = cv.getContext('2d');
      try {
        if (document.fonts && document.fonts.load) {
          await Promise.all([
            document.fonts.load('900 120px "Big Shoulders Display"'),
            document.fonts.load('500 90px "Newsreader"'),
            document.fonts.load('italic 400 40px "Newsreader"'),
            document.fonts.load('500 24px "IBM Plex Mono"')
          ]);
        }
      } catch (err) { /* fall back to system fonts */ }
      const display = '"Big Shoulders Display", "Arial Narrow", Impact, sans-serif';
      const serif = '"Newsreader", Georgia, serif';
      const mono = '"IBM Plex Mono", ui-monospace, monospace';

      // Film-black paper with a scatter of particles.
      g.fillStyle = '#07090c';
      g.fillRect(0, 0, W, H);
      let seed = 7;
      const rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (let i = 0; i < 420; i++) {
        const lane = Math.floor(rnd() * 5);
        g.fillStyle = laneColor(lane);
        g.globalAlpha = 0.08 + rnd() * 0.3;
        g.beginPath();
        g.arc(rnd() * W, rnd() * H, 0.6 + rnd() * 1.8, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;

      // Double frame and colored corner marks.
      g.strokeStyle = 'rgba(235, 231, 223, 0.35)';
      g.lineWidth = 2;
      g.strokeRect(40, 40, W - 80, H - 80);
      g.strokeStyle = 'rgba(235, 231, 223, 0.14)';
      g.strokeRect(56, 56, W - 112, H - 112);
      [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]].forEach(function (c, i) {
        g.strokeStyle = laneColor(i);
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(c[0], c[1] + c[3] * 60);
        g.lineTo(c[0], c[1]);
        g.lineTo(c[0] + c[2] * 60, c[1]);
        g.stroke();
      });

      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.fillStyle = '#5cc2ff';
      g.font = '500 22px ' + mono;
      if ('letterSpacing' in g) g.letterSpacing = '6px';
      g.fillText('A HISTORY OF PHYSICS IN TWELVE DISCOVERIES', W / 2, 140);
      if ('letterSpacing' in g) g.letterSpacing = '0px';

      g.font = '900 150px ' + display;
      const w1 = g.measureText('CHAIN ').width, w2 = g.measureText('REACTION').width;
      const x0 = W / 2 - (w1 + w2) / 2;
      g.textAlign = 'left';
      g.fillStyle = '#ebe7df';
      g.fillText('CHAIN', x0, 290);
      g.strokeStyle = '#ebe7df';
      g.lineWidth = 3;
      g.strokeText('REACTION', x0 + w1, 290);

      g.textAlign = 'center';
      g.fillStyle = '#a29e95';
      g.font = '500 24px ' + mono;
      if ('letterSpacing' in g) g.letterSpacing = '8px';
      g.fillText('CERTIFICATE OF DISCOVERY', W / 2, 360);
      if ('letterSpacing' in g) g.letterSpacing = '0px';

      g.fillStyle = '#cfcac0';
      g.font = 'italic 400 36px ' + serif;
      g.fillText('This certifies that', W / 2, 440);

      let size = 96;
      g.font = '500 ' + size + 'px ' + serif;
      while (g.measureText(name).width > W - 360 && size > 40) {
        size -= 4;
        g.font = '500 ' + size + 'px ' + serif;
      }
      g.fillStyle = '#ffffff';
      g.fillText(name, W / 2, 540);
      g.strokeStyle = 'rgba(235, 231, 223, 0.3)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(W / 2 - 420, 572);
      g.lineTo(W / 2 + 420, 572);
      g.stroke();

      const k = counts();
      g.fillStyle = '#cfcac0';
      g.font = '400 34px ' + serif;
      g.fillText('made the call on all twelve discoveries, from Galileo\'s falling', W / 2, 634);
      g.fillText('hammer (1638) to LIGO\'s colliding black holes (2015),', W / 2, 680);
      g.fillStyle = '#ffffff';
      g.font = '500 34px ' + serif;
      g.fillText('and predicted ' + k.foil + ' of 12 correctly.', W / 2, 726);

      // The twelve emblems in a row, each in its branch's color.
      const imgs = await Promise.all(order.map(function (id) {
        const svg = PH.emblemDoc(id, laneColor(byId[id].lane));
        return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      }));
      const cellW = (W - 200) / 12;
      order.forEach(function (id, i) {
        const cx = 100 + cellW * (i + 0.5), top = 800;
        const img = imgs[i];
        g.globalAlpha = deck[id] && deck[id].right ? 1 : 0.55;
        if (img) g.drawImage(img, cx - 50, top, 100, 70);
        g.globalAlpha = 1;
        g.fillStyle = deck[id] && deck[id].right ? laneColor(byId[id].lane) : '#a29e95';
        g.font = '800 30px ' + display;
        g.fillText(String(byId[id].year), cx, top + 108);
        g.fillStyle = '#a29e95';
        g.font = '500 15px ' + mono;
        g.fillText(byId[id].short.toUpperCase(), cx, top + 132);
        if (deck[id] && deck[id].right) {
          g.fillStyle = laneColor(byId[id].lane);
          g.font = '500 18px ' + mono;
          g.fillText('★', cx, top - 10);
        }
      });

      g.font = '500 18px ' + mono;
      g.fillStyle = '#a29e95';
      g.textAlign = 'left';
      const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      g.fillText(date.toUpperCase(), 96, H - 88);
      g.textAlign = 'right';
      g.fillText('★ = CALLED IT RIGHT', W - 96, H - 88);
      return cv;
    }

    async function makeCertificate() {
      const name = (certName.value || '').trim().replace(/\s+/g, ' ').slice(0, 60) || 'A physicist in the making';
      certMake.disabled = true;
      PH.text(certMake, 'Making it…');
      try {
        const cv = await drawCertificate(name);
        const url = cv.toDataURL('image/png');
        certOut.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Certificate of discovery for ' + name + ', who made the call on all twelve discoveries and predicted ' + counts().foil + ' of 12 correctly.';
        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'btn btn--solid';
        save.textContent = 'Save the certificate';
        const note = document.createElement('p');
        note.className = 'cert-note';
        note.setAttribute('role', 'status');
        save.addEventListener('click', function () {
          const file = 'chain-reaction-certificate.png';
          if (downloads) {
            cv.toBlob(function (blob) {
              downloads.save({ filename: file, data: blob })
                .then(function () { PH.text(note, 'Saved.'); })
                .catch(function (err) {
                  PH.text(note, err && err.code === 'declined' ? 'Not saved.' : 'This page can\'t save files here. Right-click or long-press the picture to save it.');
                });
            }, 'image/png');
          } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = file;
            document.body.appendChild(a);
            a.click();
            a.remove();
            PH.text(note, 'If nothing downloaded, right-click or long-press the picture to save it.');
          }
        });
        certOut.append(img, save, note);
        sound('card');
        save.focus();
      } catch (err) {
        console.error('[certificate]', err);
        PH.text(certOut, 'Sorry, the certificate could not be drawn in this browser.');
      } finally {
        certMake.disabled = false;
        PH.text(certMake, 'Make my certificate');
      }
    }

    if (certMake) certMake.addEventListener('click', makeCertificate);
    if (certName) certName.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); makeCertificate(); }
    });

    order.forEach(buildCall);
    updateCount();
    PH.play = { open: openDeck, calls: CALLS, get deck() { return deck; } };
  };
})();
