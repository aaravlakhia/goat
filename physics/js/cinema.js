/* Present mode: the story as full-screen slides over the 3D universe, for
   showing on a projector. A title, the twelve discoveries and a last word.
   Arrow keys, clicks, swipes or autoplay move through them; each slide flies
   the background to that discovery's formation. */
(function () {
  'use strict';

  const PH = window.PH;

  // One fact to say out loud, and what the discovery set off, for each slide.
  // Both come from the chapters on the page.
  const EXTRA = {
    galileo: {
      fact: 'In equal moments, a falling object covers 1, then 3, then 5, then 7 units. Heavy or light, everything speeds up the same way.',
      gave: ['Pendulum clocks', 'Newton\'s laws of motion', 'A hammer and a feather, dropped on the Moon']
    },
    newton: {
      fact: 'The pull that drops an apple also holds the Moon in orbit. A satellite is always falling, and always missing the Earth.',
      gave: ['Satellites', 'The Moon landings', 'Neptune, found by math']
    },
    faraday: {
      fact: 'He left school at 13. Nearly every power station on Earth still makes electricity his way: by moving magnets past coils.',
      gave: ['Power stations', 'Transformers', 'Wireless phone chargers']
    },
    maxwell: {
      fact: 'Using only lab measurements of magnets and charges, he worked out how fast his waves travel. The answer was almost exactly the speed of light.',
      gave: ['Radio and TV', 'Wi-Fi and mobile networks', 'Radar and X-ray scans']
    },
    curie: {
      fact: 'The first woman to win a Nobel Prize, and still the only person with Nobel Prizes in two different sciences.',
      gave: ['Radiation therapy for cancer', 'Carbon dating', 'X-ray vans on the front line']
    },
    einstein: {
      fact: 'GPS satellite clocks gain 38 microseconds a day. Without Einstein\'s correction, your phone\'s map would drift about 10 km a day.',
      gave: ['GPS', 'Lasers', 'Solar panels and camera sensors']
    },
    rutherford: {
      fact: 'About 1 alpha particle in 8,000 bounced back. The nucleus is about 100,000 times smaller than the atom around it.',
      gave: ['The neutron', 'Particle accelerators', 'The Higgs boson']
    },
    bohr: {
      fact: 'Electrons can only sit on certain levels. Every jump down gives out one exact color, so every element glows with its own barcode.',
      gave: ['Lasers', 'LEDs and phone screens', 'Reading the air of other planets']
    },
    debroglie: {
      fact: 'Fire electrons one at a time at two slits and they still build up stripes, the pattern only waves can make.',
      gave: ['Electron microscopes', 'Transistors', 'Every computer chip']
    },
    raman: {
      fact: 'About 1 photon in 10 million comes back a new color, and the change is a fingerprint of the molecule it hit.',
      gave: ['Fake-medicine scanners', 'Checking old paintings', 'The search for life on Mars']
    },
    meitner: {
      fact: 'She refused to work on the atomic bomb. The Nobel Prize for fission went to her colleague alone.',
      gave: ['Nuclear power', 'The atomic bomb', 'Element 109, meitnerium']
    },
    ligo: {
      fact: 'A passing wave stretched LIGO\'s 4 km arms by less than a ten-thousandth of the width of a proton.',
      gave: ['Hearing black holes collide', 'Gold, forged when neutron stars crash', 'LISA, a detector in space']
    }
  };

  const AUTO = 9000;      // milliseconds per slide on autoplay
  const AUTO_FIRST = 5000;

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  PH.initCinema = function () {
    const root = document.getElementById('cinema');
    const story = PH.story;
    if (!root || !story) return;
    const body = document.body;
    const stage = document.getElementById('cin-stage');
    const countOut = document.getElementById('cin-count');
    const progress = document.getElementById('cin-progress');
    const prevBtn = document.getElementById('cin-prev');
    const nextBtn = document.getElementById('cin-next');
    const autoBtn = document.getElementById('cin-auto');
    const fullBtn = document.getElementById('cin-full');
    const exitBtn = document.getElementById('cin-exit');

    const slides = [{ kind: 'title', scene: 'hero', label: 'Chain Reaction' }];
    story.chapters.forEach(function (c) {
      const h2 = document.querySelector('#' + c.id + ' h2');
      slides.push({ kind: 'chapter', scene: c.id, c: c, line: h2 ? h2.textContent : c.idea, label: c.year + ', ' + c.name });
    });
    slides.push({ kind: 'end', scene: 'galaxy', label: 'The next link' });

    let index = 0, isOpen = false, auto = false, timer = 0, lastFocus = null, enteredFull = false;
    let shownYear = null, swiped = false, down = null;

    slides.forEach(function (s, i) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + s.label);
      b.addEventListener('click', function () { go(i); });
      li.appendChild(b);
      progress.appendChild(li);
    });
    const segs = Array.from(progress.querySelectorAll('button'));

    function render(s, dir) {
      let html;
      if (s.kind === 'title') {
        html = '<div class="cin-slide cin-slide--title">' +
          '<p class="cin-kicker">A history of physics in twelve discoveries</p>' +
          '<h2 class="cin-title"><span>Chain</span><span class="outline">Reaction</span></h2>' +
          '<p class="cin-lede">Twelve people. Twelve ideas. Each one set off the next, and together they built the world in your pocket.</p>' +
          '<p class="cin-hint">Press <kbd>→</kbd> or tap to begin</p></div>';
      } else if (s.kind === 'end') {
        html = '<div class="cin-slide cin-slide--end">' +
          '<p class="cin-kicker">1638 → today</p>' +
          '<h2 class="cin-title cin-title--end">The next link <span>is yours.</span></h2>' +
          '<p class="cin-lede">Every discovery here began with someone noticing something that didn\'t fit. Dark matter, dark energy and quantum gravity still don\'t. Einstein was 26. Bohr was 27. Marsden was 20.</p>' +
          '<div class="cin-actions"><button class="cin-go" type="button" data-go="map">Explore the chain map →</button>' +
          '<button class="cin-go cin-go--ghost" type="button" data-go="restart">Start again</button></div></div>';
      } else {
        const c = s.c, lane = story.lanes[c.lane], x = EXTRA[c.id] || {};
        html = '<div class="cin-slide" style="--lane:' + lane.color + '">' +
          '<p class="cin-kicker"><span class="cin-lane">' + esc(lane.name) + '</span><span>Discovery ' + (c.index + 1) + ' of 12</span></p>' +
          '<p class="cin-year"><span class="cin-year-num">' + c.year + '</span></p>' +
          '<h2 class="cin-name">' + esc(c.name) + '</h2>' +
          '<p class="cin-line">' + esc(s.line) + '</p>' +
          (x.fact ? '<p class="cin-fact">' + esc(x.fact) + '</p>' : '') +
          (x.gave ? '<div class="cin-gave"><p class="label">It set off</p><ul>' +
            x.gave.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></div>' : '') +
          '<button class="cin-go" type="button" data-go="' + c.id + '">Open the exhibit →</button></div>';
      }
      stage.innerHTML = html;
      const slide = stage.firstChild;
      slide.dataset.dir = dir < 0 ? 'prev' : 'next';
      if (s.kind === 'chapter') {
        // The year counts from the last one shown, like a time machine.
        const num = slide.querySelector('.cin-year-num');
        if (shownYear !== null && shownYear !== s.c.year) {
          num.textContent = String(shownYear);
          PH.rollYear(num, String(s.c.year));
        }
        shownYear = s.c.year;
      }
    }

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      const dir = i >= index ? 1 : -1;
      const changed = i !== index;
      index = i;
      const s = slides[i];
      render(s, dir);
      countOut.textContent = String(i + 1).padStart(2, '0') + ' / ' + slides.length;
      segs.forEach(function (b, k) {
        b.classList.toggle('is-done', k < i);
        if (k === i) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
      if (PH.cosmos) {
        if (changed) PH.cosmos.warp(dir);
        PH.cosmos.scene(s.scene);
      }
      schedule();
    }

    function schedule() {
      clearTimeout(timer);
      if (!auto || !isOpen) return;
      if (index >= slides.length - 1) {
        setAuto(false);
        return;
      }
      const wait = index === 0 ? AUTO_FIRST : AUTO;
      root.style.setProperty('--auto', wait + 'ms');
      timer = setTimeout(function () { go(index + 1); }, wait);
    }

    function setAuto(on) {
      auto = !!on;
      autoBtn.setAttribute('aria-pressed', String(auto));
      root.classList.toggle('is-auto', auto);
      // Restart the current bar's fill from the beginning.
      const curSeg = segs[index];
      if (curSeg) {
        curSeg.removeAttribute('aria-current');
        void curSeg.offsetWidth;
        curSeg.setAttribute('aria-current', 'step');
      }
      schedule();
    }

    function setInert(on) {
      Array.from(body.children).forEach(function (el) {
        if (el === root || el.id === 'cosmos' || el.tagName === 'SCRIPT') return;
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    }

    function open(start) {
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      const finder = document.getElementById('finder');
      if (finder && finder.open && typeof finder.close === 'function') finder.close();
      root.hidden = false;
      body.classList.add('is-cinema');
      PH.hush = true;
      setInert(true);
      if (PH.cosmos) {
        PH.cosmos.hold(true);
        PH.cosmos.place('cinema');
      }
      shownYear = null;
      index = typeof start === 'number' ? start : 0;
      go(index);
      root.focus({ preventScroll: true });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      setAuto(false);
      root.hidden = true;
      body.classList.remove('is-cinema');
      PH.hush = false;
      setInert(false);
      if (enteredFull && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function () { /* already left */ });
      }
      enteredFull = false;
      if (PH.cosmos) {
        PH.cosmos.hold(false);
        PH.cosmos.direct();
      }
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }

    // Begin at the exhibit being read, if there is one.
    function startIndex() {
      const cur = PH.nav && PH.nav.current;
      return cur && story.byId[cur] ? story.byId[cur].index + 1 : 0;
    }

    ['present-open', 'present-open-2'].forEach(function (id) {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', function () { open(startIndex()); });
    });
    exitBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { go(index - 1); });
    nextBtn.addEventListener('click', function () { go(index + 1); });
    autoBtn.addEventListener('click', function () { setAuto(!auto); });

    const canFull = !!(document.documentElement.requestFullscreen && document.fullscreenEnabled);
    if (!canFull) fullBtn.hidden = true;
    fullBtn.addEventListener('click', function () {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () { /* ignore */ });
      } else {
        document.documentElement.requestFullscreen().then(function () { enteredFull = true; }).catch(function () { /* refused */ });
      }
    });
    document.addEventListener('fullscreenchange', function () {
      fullBtn.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    });

    // Buttons on the slides themselves.
    stage.addEventListener('click', function (e) {
      const b = e.target.closest && e.target.closest('[data-go]');
      if (b) {
        const where = b.dataset.go;
        if (where === 'restart') {
          go(0);
          return;
        }
        close();
        if (where === 'map') {
          if (PH.nav && PH.nav.current) PH.nav.close('map');
          else {
            const m = document.getElementById('map');
            if (m) m.scrollIntoView({ block: 'start', behavior: 'instant' });
          }
        } else if (PH.nav) {
          PH.nav.open(where);
        }
        return;
      }
      if (swiped) {
        swiped = false;
        return;
      }
      if (e.target.closest('button, a')) return;
      if (e.clientX < window.innerWidth * 0.3) go(index - 1);
      else go(index + 1);
    });

    // Swipe on touch screens.
    root.addEventListener('pointerdown', function (e) {
      down = e.isPrimary ? { x: e.clientX, y: e.clientY } : null;
    });
    root.addEventListener('pointerup', function (e) {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        swiped = true;
        go(index + (dx < 0 ? 1 : -1));
        setTimeout(function () { swiped = false; }, 400);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      const typing = t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]');
      if (!isOpen) {
        // P starts Present mode from anywhere on the page.
        const finder = document.getElementById('finder');
        if ((e.key === 'p' || e.key === 'P') && !typing && !(finder && finder.open) && !(t && t.closest && t.closest('.stage'))) {
          e.preventDefault();
          open(startIndex());
        }
        return;
      }
      const onButton = t && t.closest && t.closest('button');
      let used = true;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'n' || ((e.key === ' ' || e.key === 'Enter') && !onButton)) go(index + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') go(index - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(slides.length - 1);
      else if (e.key === 'Escape') close();
      else if (e.key === 'a' || e.key === 'A') setAuto(!auto);
      else if ((e.key === 'f' || e.key === 'F') && canFull) fullBtn.click();
      else used = false;
      if (used) e.preventDefault();
    });

    PH.present = { open: open, close: close };
  };
})();
