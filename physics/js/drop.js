/* Chain Reaction: drop the headline. In the Galileo chapter the headline's
   letters fall under gravity, big ones and small ones together, and all
   land at the same moment, as Galileo said they would with no air in the
   way. Grab and throw them; put them back with the button or Esc. */
(function () {
  'use strict';

  const PH = window.PH;
  const G = 2600;          // px/s², so a fall across the screen takes about half a second
  const BOUNCE = 0.34;

  PH.initDrop = function () {
    const ch = document.getElementById('galileo');
    const h = ch && ch.querySelector('h2');
    if (!h) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drop-btn';
    btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v10M3.5 8 8 12.5 12.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg><span class="drop-label">Drop this headline</span>';
    const label = btn.querySelector('.drop-label');
    h.insertAdjacentElement('afterend', btn);

    const live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    btn.insertAdjacentElement('afterend', live);

    let layer = null, letters = [], raf = 0, last = 0, landed = false, restoring = false, back = null;

    // Every visible character of the headline, with where it sits now.
    function glyphs() {
      const out = [];
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        for (let i = 0; i < text.length; i++) {
          if (!text[i].trim()) continue;
          const r = document.createRange();
          r.setStart(node, i);
          r.setEnd(node, i + 1);
          const b = r.getBoundingClientRect();
          if (b.width && b.height) out.push({ ch: text[i], x: b.left, y: b.top, w: b.width, h: b.height });
        }
      }
      return out;
    }

    function place(l) {
      l.el.style.transform = 'translate(' + l.x.toFixed(1) + 'px,' + l.y.toFixed(1) + 'px) rotate(' + l.a.toFixed(3) + 'rad)';
    }

    function drop() {
      if (layer || PH.reducedMotion()) return;
      const cs = getComputedStyle(h);
      const found = glyphs();
      if (!found.length) return;
      layer = document.createElement('div');
      layer.className = 'drop-layer';
      letters = found.map(function (g) {
        const el = document.createElement('span');
        el.className = 'drop-l';
        el.setAttribute('aria-hidden', 'true');
        el.textContent = g.ch;
        el.style.width = g.w + 'px';
        el.style.height = g.h + 'px';
        el.style.lineHeight = g.h + 'px';
        el.style.fontFamily = cs.fontFamily;
        el.style.fontSize = cs.fontSize;
        el.style.fontWeight = cs.fontWeight;
        el.style.fontStyle = cs.fontStyle;
        layer.appendChild(el);
        const l = { el: el, x: g.x, y: g.y, w: g.w, h: g.h, vx: 0, vy: 0, a: 0, va: 0, hit: false, drag: null };
        place(l);
        grab(l);
        return l;
      });
      back = document.createElement('button');
      back.type = 'button';
      back.className = 'drop-back btn btn--solid';
      back.textContent = 'Put the headline back';
      back.addEventListener('click', restore);
      const note = document.createElement('p');
      note.className = 'drop-note';
      note.setAttribute('aria-hidden', 'true');   // the live region says it
      layer.append(back, note);
      document.body.appendChild(layer);
      h.classList.add('is-dropped');
      PH.text(label, 'Put the headline back');
      landed = false;
      restoring = false;
      last = 0;
      raf = requestAnimationFrame(step);
      if (PH.sound) PH.sound.play('whoosh');
    }

    // Letters can be picked up and thrown.
    function grab(l) {
      l.el.addEventListener('pointerdown', function (e) {
        if (restoring) return;
        e.preventDefault();
        l.el.setPointerCapture(e.pointerId);
        l.drag = { id: e.pointerId, dx: e.clientX - l.x, dy: e.clientY - l.y, px: e.clientX, py: e.clientY, t: performance.now() };
        l.vx = l.vy = 0;
        l.el.classList.add('is-held');
      });
      l.el.addEventListener('pointermove', function (e) {
        if (!l.drag || l.drag.id !== e.pointerId) return;
        const now = performance.now(), dt = Math.max(1, now - l.drag.t) / 1000;
        l.vx = (e.clientX - l.drag.px) / dt;
        l.vy = (e.clientY - l.drag.py) / dt;
        l.drag.px = e.clientX;
        l.drag.py = e.clientY;
        l.drag.t = now;
        l.x = e.clientX - l.drag.dx;
        l.y = e.clientY - l.drag.dy;
        place(l);
      });
      const release = function (e) {
        if (!l.drag || l.drag.id !== e.pointerId) return;
        l.drag = null;
        l.el.classList.remove('is-held');
        l.vx = Math.max(-2600, Math.min(2600, l.vx));
        l.vy = Math.max(-2600, Math.min(2600, l.vy));
        l.va = l.vx / 400;
        l.hit = false;
        kick();
      };
      l.el.addEventListener('pointerup', release);
      l.el.addEventListener('pointercancel', release);
    }

    function kick() {
      if (!raf && layer) {
        last = 0;
        raf = requestAnimationFrame(step);
      }
    }

    function step(now) {
      raf = 0;
      if (!layer || restoring) return;
      const dt = last ? Math.min(0.033, (now - last) / 1000) : 1 / 60;
      last = now;
      const W = window.innerWidth, Hh = window.innerHeight;
      let moving = false, firstHits = 0;
      letters.forEach(function (l) {
        if (l.drag) {
          moving = true;
          return;
        }
        l.vy += G * dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        l.a += l.va * dt;
        const floor = Hh - l.h - 6;
        if (l.y > floor) {
          l.y = floor;
          if (!l.hit) {
            l.hit = true;
            firstHits++;
            l.va += (Math.random() - 0.5) * 3;
          }
          l.vy = Math.abs(l.vy) > 90 ? -l.vy * BOUNCE : 0;
          l.vx *= 0.82;
          l.va *= 0.72;
          if (Math.abs(l.vx) < 8) l.vx = 0;
          if (Math.abs(l.va) < 0.05) l.va = 0;
        }
        if (l.x < 0) { l.x = 0; l.vx = -l.vx * 0.5; }
        if (l.x + l.w > W) { l.x = W - l.w; l.vx = -l.vx * 0.5; }
        if (l.y < -l.h * 4) { l.y = -l.h * 4; l.vy = 0; }
        if (l.vx || l.vy || l.va || l.y < floor) moving = true;
        place(l);
      });
      if (firstHits && PH.sound) PH.sound.play('thud');
      if (!landed && letters.every(function (l) { return l.hit; })) {
        landed = true;
        const text = 'Every letter, big or small, hit the ground at the same moment. Only air could have held the little ones back.';
        PH.text(layer.querySelector('.drop-note'), text);
        live.textContent = 'The headline fell. ' + text + ' Press Escape or Put the headline back to restore it.';
      }
      if (moving) raf = requestAnimationFrame(step);
    }

    // Fly every letter home, then show the real headline again.
    function restore() {
      if (!layer || restoring) return;
      restoring = true;
      cancelAnimationFrame(raf);
      raf = 0;
      const home = glyphs();
      const from = letters.map(function (l) { return { x: l.x, y: l.y, a: l.a }; });
      const t0 = performance.now(), dur = PH.reducedMotion() ? 0 : 650;
      const finish = function () {
        if (layer) layer.remove();
        layer = null;
        letters = [];
        h.classList.remove('is-dropped');
        PH.text(label, 'Drop this headline');
        live.textContent = 'The headline is back.';
        if (document.activeElement === document.body || !document.activeElement) btn.focus({ preventScroll: true });
      };
      if (!dur) {
        finish();
        return;
      }
      const tick = function (now) {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        letters.forEach(function (l, i) {
          const to = home[i] || from[i];
          l.x = from[i].x + (to.x - from[i].x) * e;
          l.y = from[i].y + (to.y - from[i].y) * e;
          l.a = from[i].a * (1 - e);
          place(l);
        });
        if (k < 1) requestAnimationFrame(tick);
        else finish();
      };
      requestAnimationFrame(tick);
    }

    btn.addEventListener('click', function () {
      if (layer) restore();
      else drop();
    });
    // Capture phase, so Esc puts the letters back before anything else
    // (such as exhibit mode) acts on it.
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && layer) {
        e.preventDefault();
        restore();
      }
    }, true);
    if (PH.prefs) PH.prefs.on(function (name, value) { if (name === 'motion' && value === 'off' && layer) restore(); });
    window.addEventListener('resize', kick);
  };
})();
