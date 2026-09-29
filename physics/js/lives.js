/* Chain Reaction: the time machine. Every life in the story as a bar on one
   timeline, with its discovery marked, and a year you can drag through 450
   years to see who was alive, what had been discovered and what had just
   happened. Plus a small "how old are you?" comparison for the reader. */
(function () {
  'use strict';

  const PH = window.PH;
  const NS = 'http://www.w3.org/2000/svg';

  // Born and died. LIGO is a project, not a life: from Weiss's first sketch.
  const LIVES = {
    galileo: [1564, 1642], newton: [1643, 1727], faraday: [1791, 1867], maxwell: [1831, 1879],
    curie: [1867, 1934], einstein: [1879, 1955], rutherford: [1871, 1937], bohr: [1885, 1962],
    debroglie: [1892, 1987], raman: [1888, 1970], meitner: [1878, 1968], ligo: [1972, null]
  };
  // Age when they made the discovery (birthdays make it one less than the
  // difference of the years for some of them).
  const AGE_AT = { galileo: 74, newton: 44, faraday: 39, maxwell: 34, curie: 31, einstein: 26, rutherford: 39, bohr: 27, debroglie: 32, raman: 39, meitner: 60 };
  // Lane colors for marks (the chain map's validated palette).
  const MARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];
  const X0 = 1550, X1 = 2030, NOW = new Date().getFullYear();

  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  function moving() {
    return !PH.reducedMotion();
  }

  /* ---------- The time machine ---------- */

  function initMachine() {
    const box = document.getElementById('tm');
    const story = PH.story;
    if (!box || !story) return;
    const CH = story.chapters;

    // Everything that happened, from the chapters themselves: each
    // discovery, and every dated line of "What it set off".
    const events = [];
    CH.forEach(function (c) {
      const h = document.querySelector('#' + c.id + ' h2');
      events.push({ y: c.year, id: c.id, big: true, text: c.name + ': ' + (h ? h.textContent.trim() : c.idea) });
      document.querySelectorAll('#' + c.id + ' .links li').forEach(function (li) {
        const when = li.querySelector('.when'), what = li.querySelector('.what');
        const y = when && /^\d{4}$/.test(when.textContent.trim()) ? +when.textContent.trim() : null;
        if (y && what) events.push({ y: y, id: c.id, text: what.textContent.trim() });
      });
    });
    events.sort(function (a, b) { return a.y - b.y || (b.big ? 1 : 0) - (a.big ? 1 : 0); });

    box.innerHTML =
      '<div class="tm-bar">' +
        '<button class="btn btn--solid tm-play" type="button" id="tm-play"><svg class="i-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5v11l9-5.5z" fill="currentColor"></path></svg><svg class="i-pause" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 3.5v9M10.5 3.5v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg><span>Play 450 years</span></button>' +
        '<div class="tm-legend" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="tm-body">' +
        '<div class="tm-plot">' +
          '<div class="tm-chart" id="tm-chart"></div>' +
          '<label class="tm-scrub" for="tm-year"><span class="sr-only">Year</span><input type="range" id="tm-year" min="' + X0 + '" max="' + NOW + '" step="1" value="1831"></label>' +
          '<div class="tm-tip" id="tm-tip" hidden></div>' +
        '</div>' +
        '<div class="tm-read" id="tm-read">' +
          '<p class="tm-year" id="tm-year-out">1831</p>' +
          '<div class="tm-sofar"><p class="label">Discovered so far</p><p class="tm-count" id="tm-count"></p><ol class="tm-dots" id="tm-dots" aria-hidden="true"></ol></div>' +
          '<div class="tm-alive"><p class="label">Alive this year</p><ul id="tm-alive"></ul></div>' +
          '<div class="tm-news"><p class="label">Latest news</p><ul id="tm-news"></ul></div>' +
        '</div>' +
      '</div>' +
      '<details class="tm-table"><summary>Show the timeline as a table</summary><div class="tm-table-wrap"><table><caption class="sr-only">The twelve discoveries: lives and dates</caption><thead><tr><th scope="col">Who</th><th scope="col">Born</th><th scope="col">Died</th><th scope="col">Discovery</th><th scope="col">Age then</th></tr></thead><tbody id="tm-rows"></tbody></table></div></details>';

    const legend = box.querySelector('.tm-legend');
    story.lanes.forEach(function (l, i) {
      const s = document.createElement('span');
      s.innerHTML = '<i style="background:' + MARK[i] + '"></i>';
      s.appendChild(document.createTextNode(l.name));
      legend.appendChild(s);
    });

    const rows = document.getElementById('tm-rows');
    CH.forEach(function (c) {
      const life = LIVES[c.id];
      const tr = document.createElement('tr');
      const name = document.createElement('th');
      name.scope = 'row';
      const a = document.createElement('a');
      a.href = '#' + c.id;
      a.textContent = c.id === 'ligo' ? 'LIGO (Weiss, Thorne and Barish)' : c.name;
      name.appendChild(a);
      tr.appendChild(name);
      const cells = c.id === 'ligo'
        ? ['Sketched 1972', 'Still running', String(c.year), 'A team of more than 1,000']
        : [String(life[0]), String(life[1]), String(c.year), String(AGE_AT[c.id])];
      cells.forEach(function (t) {
        const td = document.createElement('td');
        td.textContent = t;
        tr.appendChild(td);
      });
      rows.appendChild(tr);
    });

    const dotsOut = document.getElementById('tm-dots');
    CH.forEach(function (c) {
      const li = document.createElement('li');
      li.style.setProperty('--c', MARK[c.lane]);
      dotsOut.appendChild(li);
    });

    const chart = document.getElementById('tm-chart');
    const input = document.getElementById('tm-year');
    const tip = document.getElementById('tm-tip');
    const playBtn = document.getElementById('tm-play');
    const playLabel = playBtn.querySelector('span');
    let year = 1831, geo = null, svg = null, parts = [], cursor = null, cursorTag = null, cursorText = null;

    function layout() {
      const w = chart.clientWidth;
      if (!w) return;
      const narrow = w < 560;
      const labelW = narrow ? 78 : 118, right = 14, rowH = narrow ? 24 : 28, top = 30;
      const plotW = w - labelW - right;
      const H = top + CH.length * rowH + 8;
      const X = function (y) { return labelW + ((y - X0) / (X1 - X0)) * plotW; };
      geo = { w: w, h: H, labelW: labelW, plotW: plotW, top: top, rowH: rowH, X: X, narrow: narrow };
      chart.textContent = '';
      svg = el('svg', { viewBox: '0 0 ' + w + ' ' + H, width: w, height: H, 'aria-hidden': 'true', class: 'tm-svg' }, chart);

      // Century and half-century lines, recessive.
      for (let y = 1600; y <= 2000; y += 50) {
        const x = Math.round(X(y)) + 0.5;
        el('line', { x1: x, x2: x, y1: top - 6, y2: H - 4, class: y % 100 ? 'tm-grid tm-grid--half' : 'tm-grid' }, svg);
        if (!narrow || y % 100 === 0) {
          const t = el('text', { x: x, y: top - 12, class: 'tm-tick', 'text-anchor': 'middle' }, svg);
          t.textContent = String(y);
        }
      }

      parts = CH.map(function (c, i) {
        const life = LIVES[c.id];
        const cy = top + i * rowH + rowH / 2;
        const g = el('g', { class: 'tm-row', 'data-id': c.id }, svg);
        el('rect', { x: 0, y: cy - rowH / 2, width: w, height: rowH, class: 'tm-hit' }, g);
        const label = el('text', { x: labelW - 12, y: cy + 4, class: 'tm-name', 'text-anchor': 'end' }, g);
        label.textContent = c.short.toUpperCase();
        const end = life[1] || X1;
        const x0 = X(life[0]), x1 = X(Math.min(end, X1));
        const bar = el('rect', { x: x0, y: cy - 5, width: Math.max(2, x1 - x0), height: 10, rx: 5, fill: MARK[c.lane], class: 'tm-life' + (life[1] ? '' : ' tm-life--open') }, g);
        const dot = el('circle', { cx: X(c.year), cy: cy, r: 5.5, class: 'tm-find', stroke: 'var(--plate)', 'stroke-width': 2 }, g);
        return { c: c, g: g, bar: bar, dot: dot, cy: cy, life: life };
      });

      cursor = el('line', { y1: top - 6, y2: H - 2, class: 'tm-cursor' }, svg);
      cursorTag = el('rect', { y: 2, height: 18, rx: 3, class: 'tm-cursor-tag' }, svg);
      cursorText = el('text', { y: 15, class: 'tm-cursor-text', 'text-anchor': 'middle' }, svg);

      // Align the scrubber with the plot so the thumb sits under the cursor.
      input.parentNode.style.paddingLeft = labelW + 'px';
      input.parentNode.style.paddingRight = right + 'px';
      draw();
    }

    function alive(life, y) {
      return y >= life[0] && (life[1] === null ? true : y <= life[1]);
    }

    function draw() {
      if (!geo) return;
      const x = geo.X(year);
      cursor.setAttribute('x1', x);
      cursor.setAttribute('x2', x);
      cursorText.textContent = String(year);
      const tw = 44;
      const tx = Math.max(geo.labelW + tw / 2, Math.min(geo.w - tw / 2 - 2, x));
      cursorTag.setAttribute('x', tx - tw / 2);
      cursorTag.setAttribute('width', tw);
      cursorText.setAttribute('x', tx);
      parts.forEach(function (p) {
        const on = alive(p.life, year);
        p.g.classList.toggle('is-alive', on);
        p.g.classList.toggle('is-found', year >= p.c.year);
      });
      readout();
    }

    let lastFound = -1;
    function readout() {
      PH.text(document.getElementById('tm-year-out'), String(year));
      const found = CH.filter(function (c) { return c.year <= year; });
      PH.text(document.getElementById('tm-count'), found.length + ' of ' + CH.length);
      Array.from(dotsOut.children).forEach(function (li, i) { li.classList.toggle('is-on', CH[i].year <= year); });
      if (found.length !== lastFound) {
        if (lastFound >= 0 && found.length > lastFound && PH.sound) PH.sound.play('tick');
        lastFound = found.length;
      }

      const aliveOut = document.getElementById('tm-alive');
      aliveOut.textContent = '';
      const living = CH.filter(function (c) { return alive(LIVES[c.id], year); });
      if (!living.length) {
        const li = document.createElement('li');
        li.className = 'tm-none';
        li.textContent = year < 1564 ? 'None of them yet. Galileo is born in 1564.' : 'None of the twelve.';
        aliveOut.appendChild(li);
      }
      living.forEach(function (c) {
        const li = document.createElement('li');
        const life = LIVES[c.id];
        li.style.setProperty('--c', MARK[c.lane]);
        const age = year - life[0];
        let note;
        if (c.id === 'ligo') note = year === life[0] ? 'first sketched' : 'running for ' + age + ' years';
        else if (year === life[0]) note = 'born this year';
        else if (year === life[1]) note = 'dies this year, aged about ' + age;
        else if (year === c.year) note = 'aged ' + AGE_AT[c.id] + ', makes the discovery';
        else note = 'aged about ' + age;
        li.innerHTML = '<b></b> <span></span>';
        li.querySelector('b').textContent = c.id === 'ligo' ? 'LIGO' : c.name;
        li.querySelector('span').textContent = note;
        aliveOut.appendChild(li);
      });

      const news = document.getElementById('tm-news');
      news.textContent = '';
      const past = events.filter(function (e) { return e.y <= year; }).slice(-3).reverse();
      if (!past.length) {
        const li = document.createElement('li');
        li.className = 'tm-none';
        li.textContent = 'Nothing yet. People still believe Aristotle: heavy things fall faster.';
        news.appendChild(li);
      }
      past.forEach(function (e) {
        const li = document.createElement('li');
        li.className = e.big ? 'is-big' : '';
        li.style.setProperty('--c', MARK[PH.story.byId[e.id].lane]);
        li.innerHTML = '<b></b> <span></span>';
        li.querySelector('b').textContent = String(e.y);
        li.querySelector('span').textContent = e.text;
        news.appendChild(li);
      });

      const summary = found.length + ' of 12 discovered, ' + living.length + ' alive';
      input.setAttribute('aria-valuetext', year + ': ' + summary);
    }

    function setYear(y) {
      y = Math.max(X0, Math.min(NOW, Math.round(y)));
      if (y === year) return;
      year = y;
      input.value = String(y);
      draw();
    }

    input.addEventListener('input', function () {
      stop();
      setYear(+input.value);
    });

    // Drag across the chart to scrub; hover a life for its details.
    function yearAt(e) {
      const r = chart.getBoundingClientRect();
      const x = e.clientX - r.left;
      return X0 + ((x - geo.labelW) / geo.plotW) * (X1 - X0);
    }
    let scrubbing = false;
    chart.addEventListener('pointerdown', function (e) {
      if (!geo) return;
      const row = e.target.closest && e.target.closest('.tm-row');
      const r = chart.getBoundingClientRect();
      if (e.clientX - r.left < geo.labelW && row) {
        if (PH.nav) PH.nav.open(row.dataset.id);
        return;
      }
      scrubbing = true;
      stop();
      chart.setPointerCapture(e.pointerId);
      setYear(yearAt(e));
    });
    chart.addEventListener('pointermove', function (e) {
      if (!geo) return;
      if (scrubbing) {
        setYear(yearAt(e));
        return;
      }
      const row = e.target.closest && e.target.closest('.tm-row');
      if (!row) {
        tip.hidden = true;
        return;
      }
      const p = parts.find(function (q) { return q.c.id === row.dataset.id; });
      const life = p.life;
      tip.innerHTML = '<b></b><span></span>';
      tip.querySelector('b').textContent = p.c.id === 'ligo' ? 'LIGO' : p.c.name;
      tip.querySelector('span').textContent = p.c.id === 'ligo'
        ? 'Sketched 1972 · detection ' + p.c.year
        : life[0] + '–' + life[1] + ' · discovery ' + p.c.year + ', aged ' + AGE_AT[p.c.id];
      tip.hidden = false;
      const r = chart.getBoundingClientRect();
      const tx = Math.min(r.width - 220, Math.max(0, e.clientX - r.left + 14));
      tip.style.transform = 'translate(' + tx + 'px,' + (p.cy + 12) + 'px)';
    });
    const endScrub = function () { scrubbing = false; };
    chart.addEventListener('pointerup', endScrub);
    chart.addEventListener('pointercancel', endScrub);
    chart.addEventListener('pointerleave', function () { tip.hidden = true; });

    // Play: 450 years in about 20 seconds.
    let raf = 0, lastT = 0, acc = 0;
    function frame(t) {
      const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0;
      lastT = t;
      acc += dt * 23;
      if (acc >= 1) {
        const step = Math.floor(acc);
        acc -= step;
        setYear(year + step);
      }
      if (year >= NOW) {
        stop();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (year >= NOW) setYear(X0);
      box.classList.add('is-playing');
      PH.text(playLabel, 'Pause');
      lastT = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      box.classList.remove('is-playing');
      PH.text(playLabel, year >= NOW ? 'Play again' : 'Play 450 years');
    }
    playBtn.addEventListener('click', function () {
      if (raf) stop();
      else play();
    });
    if (PH.onStill) PH.onStill(stop);

    PH.onResize(chart, layout);
    layout();
  }

  /* ---------- How old are you? ---------- */

  const AGES = [
    ['Subrahmanyan Chandrasekhar', 19, 'worked out the heaviest a dead star can be'],
    ['Ernest Marsden', 20, 'counted the alpha particles that bounced back'],
    ['Albert Einstein', 26, 'wrote four papers that changed physics'],
    ['Niels Bohr', 27, 'explained why atoms glow in fixed colors'],
    ['Marie Skłodowska-Curie', 31, 'found polonium and radium'],
    ['Louis de Broglie', 32, 'said that matter is a wave'],
    ['James Clerk Maxwell', 34, 'showed that light is an electromagnetic wave'],
    ['Ernest Rutherford', 39, 'found the nucleus'],
    ['C. V. Raman', 39, 'saw light change color'],
    ['Michael Faraday', 39, 'made electricity with a moving magnet'],
    ['Isaac Newton', 44, 'published his laws of motion and gravity'],
    ['Lise Meitner', 60, 'explained nuclear fission'],
    ['Galileo Galilei', 74, 'published how things fall']
  ];

  function initAge() {
    const box = document.getElementById('age');
    if (!box) return;
    const input = document.getElementById('age-in');
    const out = document.getElementById('age-out');
    const plot = document.getElementById('age-plot');
    const MAX = 80;

    // Drawn at the plot's real width, so the labels stay readable on a
    // phone; dots too close to share a row stack upward.
    let svg = null, dots = [], you = null, W = 0, X = null;
    function draw() {
      const w = Math.max(260, Math.round(plot.clientWidth));
      if (w === W) return;
      W = w;
      if (svg) svg.remove();
      svg = el('svg', { viewBox: '0 0 ' + W + ' 86', class: 'age-svg', 'aria-hidden': 'true' }, plot);
      X = function (a) { return 14 + (a / MAX) * (W - 28); };
      el('line', { x1: X(0), x2: X(MAX), y1: 52, y2: 52, class: 'age-axis' }, svg);
      for (let a = 0; a <= MAX; a += 10) {
        el('line', { x1: X(a), x2: X(a), y1: 48, y2: 56, class: 'age-axis' }, svg);
        const t = el('text', { x: X(a), y: 76, class: 'age-tick', 'text-anchor': 'middle' }, svg);
        t.textContent = String(a);
      }
      const rows = [];
      dots = AGES.slice().sort(function (a, b) { return a[1] - b[1]; }).map(function (p) {
        const x = X(p[1]);
        let k = 0;
        while (rows[k] !== undefined && x - rows[k] < 12) k++;
        rows[k] = x;
        const c = el('circle', { cx: x, cy: 52 - k * 12 - 0.5, r: 5.5, class: 'age-dot' }, svg);
        const title = el('title', {}, c);
        title.textContent = p[0] + ', ' + p[1];
        return { c: c, age: p[1] };
      });
      you = el('g', { class: 'age-you' }, svg);
      el('line', { x1: 0, x2: 0, y1: 8, y2: 58 }, you);
      const youText = el('text', { x: 0, y: 6, 'text-anchor': 'middle' }, you);
      youText.textContent = 'YOU';
      you.style.display = 'none';
      say();
    }

    function say() {
      const raw = input.value.trim();
      const y = Math.round(+raw);
      if (!raw || !isFinite(y) || y < 5 || y > 110) {
        you.style.display = 'none';
        dots.forEach(function (d) { d.c.classList.remove('is-younger'); });
        PH.text(out, raw ? 'Type an age from 5 to 110.' : 'The people in this story were between 19 and 74 when they did the work that made them famous.');
        return;
      }
      you.style.display = '';
      you.setAttribute('transform', 'translate(' + X(Math.min(MAX, y)) + ',0)');
      dots.forEach(function (d) { d.c.classList.toggle('is-younger', d.age <= y); });
      const done = AGES.filter(function (p) { return p[1] <= y; });
      const next = AGES.find(function (p) { return p[1] > y; });
      let text;
      if (!done.length) {
        const n = next[1] - y;
        text = 'At ' + next[1] + ', ' + next[0] + ' ' + next[2] + '. That is ' + n + ' year' + (n === 1 ? '' : 's') + ' from now for you. Plenty of time to find the next link.';
      } else if (!next) {
        text = 'Galileo was 74 when he published how things fall. It is never too late to notice something that doesn\'t fit.';
      } else {
        const names = done.map(function (p) { return p[0].split(' ').slice(-1)[0].replace('Skłodowska-Curie', 'Curie'); });
        const list = names.length > 3 ? names.slice(0, 3).join(', ') + ' and ' + (names.length - 3) + ' more' : names.join(names.length === 2 ? ' and ' : ', ');
        const n = next[1] - y;
        text = 'At ' + y + ', you are already as old as ' + list + ' were. Next: ' + next[0] + ' ' + next[2] + ' at ' + next[1] + (n ? ', ' + n + ' year' + (n === 1 ? '' : 's') + ' from now for you.' : '.');
      }
      PH.text(out, text);
    }
    input.addEventListener('input', say);
    draw();
    if (window.ResizeObserver) new ResizeObserver(draw).observe(plot);
  }

  PH.initLives = function () {
    try { initMachine(); } catch (err) { console.error('[time machine]', err); }
    try { initAge(); } catch (err) { console.error('[age]', err); }
  };
})();
