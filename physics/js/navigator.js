/* Getting around: the chain map, exhibit mode (one physicist at a time),
   "built on / led to" links in every chapter, and Find, which searches by
   name, by discovery, or by what a discovery gave us. */
(function () {
  'use strict';

  const PH = window.PH;

  // Branches of physics, one lane each on the map (validated palette, dark steps).
  const LANES = [
    { name: 'Motion & gravity', color: '#3987e5' },
    { name: 'Space & time', color: '#d95926' },
    { name: 'Electricity & light', color: '#199e70' },
    { name: 'Atoms & nuclei', color: '#c98500' },
    { name: 'Quantum', color: '#d55181' }
  ];

  // Every chapter, with the words people might search for and why each fits.
  const CH = [
    { id: 'galileo', year: 1638, name: 'Galileo Galilei', short: 'Galileo', lane: 0, idea: 'Everything falls the same way', terms: [
      ['falling, fall, gravity, heavy, weight, free fall', 'Showed that heavy and light things fall at the same rate. Only air holds a feather back.'],
      ['pendulum, clock, clocks, time', 'Found that a pendulum keeps steady time, which led to the first pendulum clocks.'],
      ['moon, hammer, feather, apollo', 'In 1971 an astronaut dropped a hammer and a feather on the Moon. They landed together, as Galileo said.'],
      ['pisa, tower, leaning tower', 'The Leaning Tower of Pisa story probably never happened. He rolled balls down ramps instead.'],
      ['experiment, scientific method, aristotle', 'Tested ideas with careful experiments instead of trusting old authorities like Aristotle.'],
      ['telescope, church, house arrest, sun, earth moves', 'Spent his last years under house arrest for teaching that the Earth moves around the Sun.']
    ] },
    { id: 'newton', year: 1687, name: 'Isaac Newton', short: 'Newton', lane: 0, idea: 'The Moon is falling', terms: [
      ['gravity, apple, falling', 'Showed that the pull that drops an apple also holds the Moon in orbit.'],
      ['orbit, orbits, satellite, satellites, sputnik, space station, iss', 'Explained orbits: a satellite is falling around the Earth and always missing.'],
      ['moon landing, apollo, rocket, rockets, space, nasa', 'Apollo 11 was steered to the Moon using Newton\'s laws.'],
      ['tides, tide, ocean', 'Explained the tides as the Moon\'s pull on the oceans.'],
      ['comet, halley, planet, planets, neptune', 'Halley used Newton\'s laws to predict a comet\'s return, and later the math found Neptune.'],
      ['motion, force, f=ma, laws of motion, accelerometer, motion sensor, screen rotation, step counter, phone, smartphone', 'His laws of motion are inside the sensor that rotates your phone\'s screen.']
    ] },
    { id: 'faraday', year: 1831, name: 'Michael Faraday', short: 'Faraday', lane: 2, idea: 'Magnets make electricity', terms: [
      ['electricity, generator, generators, power station, power plant, dynamo, power', 'Found that a moving magnet makes electricity. Nearly every power station works this way.'],
      ['induction, magnet, magnets, coil, electromagnet, magnetism', 'Discovered electromagnetic induction in 1831.'],
      ['wireless charging, charger, charging, phone charger, induction cooker, induction hob, phone, smartphone', 'Wireless phone chargers and induction cookers use his discovery.'],
      ['transformer, mains, alternating current, national grid, grid', 'The transformers that carry power across the country rely on induction.'],
      ['electric guitar, guitar, pickup, microphone', 'Electric guitar pickups work by induction: a vibrating string changes the magnetic field in a coil.'],
      ['bookbinder, school, poor, self taught, self-taught', 'Left school at 13 and taught himself science while working as a bookbinder.']
    ] },
    { id: 'maxwell', year: 1865, name: 'James Clerk Maxwell', short: 'Maxwell', lane: 2, idea: 'Light is an electromagnetic wave', terms: [
      ['light, electromagnetic wave, electromagnetism, spectrum, speed of light', 'Showed that light is a wave of electric and magnetic fields.'],
      ['radio, tv, television, broadcast', 'Predicted the invisible waves that carry radio and TV.'],
      ['wi-fi, wifi, bluetooth, 5g, 4g, mobile network, phone signal, antenna, internet, phone, smartphone', 'Wi-Fi, Bluetooth and mobile signals are Maxwell\'s waves.'],
      ['microwave, microwave oven, radar', 'Microwave ovens and radar use waves his equations predicted.'],
      ['x-ray, x-rays, xray, ultraviolet, uv, infrared, thermal camera, sunburn', 'X-rays, UV and infrared are all the same kind of wave at different lengths.'],
      ['jagadish chandra bose, j c bose, bose, kolkata', 'Jagadish Chandra Bose used Maxwell\'s waves to ring a bell at a distance in 1895.'],
      ['color photograph, colour photograph, photo', 'Maxwell also took the first color photograph, in 1861.']
    ] },
    { id: 'curie', year: 1898, name: 'Marie Skłodowska-Curie', short: 'Curie', lane: 3, idea: 'Atoms are not forever', terms: [
      ['radioactivity, radiation, radioactive, radium, polonium, uranium', 'Discovered radium and polonium, and named radioactivity.'],
      ['cancer, radiotherapy, radiation therapy, treatment, hospital, medicine', 'Radiation therapy for cancer grew out of her work.'],
      ['carbon dating, radiocarbon, dating, archaeology, fossils, half-life, half life, age', 'Steady radioactive decay lets scientists date ancient objects.'],
      ['x-ray van, war, world war, little curies', 'Drove X-ray vans to the front line in World War I.'],
      ['woman, women, girl, nobel, two nobels, poland, polish, marie', 'The first woman to win a Nobel Prize, and the only person with Nobels in two different sciences.']
    ] },
    { id: 'einstein', year: 1905, name: 'Albert Einstein', short: 'Einstein', lane: 1, idea: 'Moving clocks run slow', terms: [
      ['gps, satellite navigation, sat nav, maps, google maps, location, navigation', 'GPS satellite clocks are corrected for relativity, or your location would drift about 10 km a day.'],
      ['relativity, time dilation, time travel, speed of light, twin, time', 'Showed that moving clocks run slow: time itself stretches.'],
      ['e=mc2, emc2, e = mc2, e=mc², mass, energy', 'E = mc² showed that mass is a huge store of energy.'],
      ['camera, photo, photoelectric, solar panel, solar, sensor, phone, smartphone', 'His photoelectric effect is how camera sensors and solar panels turn light into electricity.'],
      ['laser, lasers', 'In 1917 he described stimulated emission, the idea behind every laser.'],
      ['eclipse, bending light, curved space, general relativity', 'His theory of gravity predicted bending starlight, seen during the 1919 eclipse.'],
      ['patent office, bern, miracle year, genius', 'Wrote four world-changing papers in 1905 while working at a patent office.']
    ] },
    { id: 'rutherford', year: 1911, name: 'Ernest Rutherford', short: 'Rutherford', lane: 3, idea: 'The atom is almost empty', terms: [
      ['atom, atoms, nucleus, nuclear, empty space, gold foil, gold', 'Discovered that every atom has a tiny, heavy nucleus and is almost all empty space.'],
      ['particle accelerator, cern, lhc, large hadron collider, higgs, higgs boson', 'Particle accelerators like CERN\'s LHC descend from his experiments. The LHC found the Higgs boson in 2012.'],
      ['neutron, chadwick', 'The neutron was discovered in his lab in 1932.'],
      ['splitting the atom, alchemy, transmutation', 'Made the first nuclear reaction by people, turning nitrogen into oxygen.'],
      ['new zealand', 'Born in New Zealand, and later won a Nobel Prize in Chemistry.']
    ] },
    { id: 'bohr', year: 1913, name: 'Niels Bohr', short: 'Bohr', lane: 4, idea: 'Electrons jump', terms: [
      ['spectrum, spectroscopy, colors, colours, prism, barcode, rainbow', 'Explained why every element glows with its own colors.'],
      ['stars, star, sun, helium, what stars are made of', 'Spectra tell us what the Sun and the stars are made of.'],
      ['laser, lasers', 'Lasers work by making many electrons drop between energy levels together.'],
      ['led, leds, screen, display, oled, neon, fireworks, lighting, phone, smartphone', 'Every LED and phone-screen pixel glows when electrons drop between energy levels.'],
      ['quantum, quantum mechanics, energy levels, electron, electrons', 'His jumping electrons started quantum mechanics.'],
      ['nobel medal, nazi, nazis, gold dissolved, acid', 'At his institute, two Nobel medals were dissolved in acid to hide them from the Nazis.'],
      ['exoplanet, exoplanets, planet atmosphere, jwst, james webb, telescope', 'The James Webb telescope reads planets\' air using the same spectral barcodes.']
    ] },
    { id: 'debroglie', year: 1924, name: 'Louis de Broglie', short: 'de Broglie', lane: 4, idea: 'Matter is a wave', terms: [
      ['quantum, wave, waves, particle, wave-particle, double slit, double-slit, interference', 'Showed that particles like electrons are also waves.'],
      ['transistor, transistors, computer, computers, chip, chips, processor, microchip, semiconductor, laptop, phone, smartphone', 'Transistors in every computer chip rely on the wave nature of electrons.'],
      ['electron microscope, virus, viruses, microscope', 'Electron microscopes use electron waves to see things as small as viruses.'],
      ['quantum computer, quantum computers, quantum computing', 'Quantum computers are built on the same strange wave behavior.'],
      ['history, phd, thesis', 'Studied history first. His PhD idea won him the 1929 Nobel Prize.']
    ] },
    { id: 'raman', year: 1928, name: 'C. V. Raman', short: 'Raman', lane: 2, idea: 'Light can change color', terms: [
      ['india, indian, calcutta, kolkata, national science day', 'India\'s National Science Day, 28 February, celebrates his discovery.'],
      ['sea, blue sea, why is the sea blue, ocean, mediterranean', 'Wondered why the sea is blue, and discovered a new effect of light.'],
      ['mars, perseverance, rover, life on mars', 'NASA\'s Perseverance rover carries a Raman instrument that searches for signs of life on Mars.'],
      ['fake medicine, medicines, drugs, airport, explosives, security, art, painting, paint', 'Handheld Raman scanners check medicines, luggage and old paintings.'],
      ['diamond, fingerprint, molecule, molecules, chemistry, scattering', 'Every substance scatters light with its own color fingerprint.'],
      ['asia, asian, first asian', 'The first Asian to win a Nobel Prize in science.'],
      ['boson, bosons, s n bose, satyendra, chandrasekhar, white dwarf', 'His chapter also features S. N. Bose (bosons) and Chandrasekhar (the limit for dead stars).']
    ] },
    { id: 'meitner', year: 1938, name: 'Lise Meitner', short: 'Meitner', lane: 3, idea: 'The nucleus splits', terms: [
      ['nuclear power, nuclear energy, power plant, power station, reactor, reactors', 'Nuclear power stations run on the fission she explained.'],
      ['atomic bomb, atom bomb, bomb, nuclear weapon, hiroshima, nagasaki, war', 'The same discovery made atomic bombs. She refused to help build one.'],
      ['fission, chain reaction, uranium, splitting the atom', 'Explained nuclear fission in 1938: a uranium nucleus splitting in two.'],
      ['meitnerium, element 109, element', 'Element 109, meitnerium, is named after her.'],
      ['woman, women, girl, refugee, jewish, exile, nobel', 'Fled Nazi Germany. The Nobel Prize for fission went to her colleague alone.']
    ] },
    { id: 'ligo', year: 2015, name: 'Weiss, Thorne & Barish (LIGO)', short: 'LIGO', lane: 1, idea: 'Space itself shakes', terms: [
      ['black hole, black holes', 'Heard two black holes colliding 1.3 billion light-years away.'],
      ['gravitational wave, gravitational waves, ripples, spacetime, space-time, space', 'First detected ripples in space itself, in 2015.'],
      ['gold, neutron star, neutron stars, kilonova', 'Caught two neutron stars colliding: an explosion that forges gold.'],
      ['sound, chirp, hear, listen', 'The collision\'s signal can be played as sound: a rising chirp.'],
      ['laser, interferometer, mirror', 'Measures a stretch smaller than a proton with lasers bouncing along 4 km arms.'],
      ['weiss, thorne, barish, kip thorne, rainer weiss, lisa', 'Rainer Weiss, Kip Thorne and Barry Barish shared the 2017 Nobel Prize.']
    ] }
  ];

  // Who built on whom, and how.
  const EDGES = [
    ['galileo', 'newton', 'turned falling objects into laws of motion'],
    ['newton', 'einstein', 'rebuilt Newton\'s ideas of space, time and gravity'],
    ['faraday', 'maxwell', 'turned Faraday\'s lines of force into equations'],
    ['maxwell', 'einstein', 'the fixed speed of light came from Maxwell\'s equations'],
    ['curie', 'rutherford', 'used radioactive atoms as a source of alpha particles'],
    ['rutherford', 'bohr', 'put electrons around Rutherford\'s tiny nucleus'],
    ['einstein', 'debroglie', 'if light can act as a particle, matter can act as a wave'],
    ['bohr', 'debroglie', 'matter waves explained why Bohr\'s orbits are special'],
    ['maxwell', 'raman', 'light is a wave that molecules can scatter'],
    ['bohr', 'raman', 'molecules vibrate in fixed energy steps'],
    ['curie', 'meitner', 'spent 30 years studying radioactivity'],
    ['rutherford', 'meitner', 'the nucleus, and the neutron found in his lab'],
    ['einstein', 'meitner', 'used E = mc² to work out the energy of fission'],
    ['einstein', 'ligo', 'predicted gravitational waves in 1916']
  ];

  const byId = {};
  CH.forEach(function (c, i) { c.index = i; byId[c.id] = c; });

  function builtOn(id) { return EDGES.filter(function (e) { return e[1] === id; }); }
  function ledTo(id) { return EDGES.filter(function (e) { return e[0] === id; }); }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function norm(t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9=²+ -]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* ---------- Exhibit mode: one physicist at a time ---------- */

  function initExhibit() {
    const body = document.body;
    const bar = document.getElementById('exhibit-bar');
    const prevBtn = document.getElementById('ex-prev');
    const nextBtn = document.getElementById('ex-next');
    const prevLabel = document.getElementById('ex-prev-label');
    const nextLabel = document.getElementById('ex-next-label');
    const dots = document.getElementById('ex-dots');
    const yearOut = document.getElementById('now-year');
    const nameOut = document.getElementById('now-name');
    let current = null;

    CH.forEach(function (c) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = c.id;
      b.dataset.tip = c.year + ' ' + c.short;
      b.setAttribute('aria-label', c.year + ', ' + c.name);
      b.addEventListener('click', function () { open(c.id); });
      li.appendChild(b);
      dots.appendChild(li);
    });
    const dotBtns = Array.from(dots.querySelectorAll('button'));

    function label(c) {
      return c ? '<b>' + c.year + '</b> ' + esc(c.short) : '';
    }

    function open(id) {
      const c = byId[id];
      if (!c) return;
      const was = current ? byId[current] : null;
      current = id;
      body.classList.add('is-exhibit');
      bar.hidden = false;
      CH.forEach(function (o) {
        const el = document.getElementById(o.id);
        const on = o.id === id;
        el.classList.toggle('is-current', on);
        el.classList.remove('is-entering');
        if (on) el.classList.add('is-lit');
      });
      const el = document.getElementById(id);
      el.dataset.dir = was && was.index > c.index ? 'prev' : 'next';
      void el.offsetWidth;
      el.classList.add('is-entering');

      const prev = CH[c.index - 1], next = CH[c.index + 1];
      prevBtn.disabled = !prev;
      nextBtn.disabled = !next;
      prevLabel.innerHTML = prev ? label(prev) : 'Start';
      nextLabel.innerHTML = next ? label(next) : 'The end';
      prevBtn.setAttribute('aria-label', prev ? 'Previous: ' + prev.year + ', ' + prev.name : 'No earlier exhibit');
      nextBtn.setAttribute('aria-label', next ? 'Next: ' + next.year + ', ' + next.name : 'No later exhibit');
      dotBtns.forEach(function (b, i) {
        b.classList.toggle('is-done', i < c.index);
        if (i === c.index) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      PH.text(yearOut, String(c.year));
      PH.text(nameOut, c.name);
      try { history.replaceState(null, '', '#exhibit-' + id); } catch (err) { /* the frame may refuse; the page still works */ }
      const h = el.querySelector('h2');
      if (h) {
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
      // An explicit "instant" beats the page's smooth scrolling, so each
      // exhibit opens at its top straight away.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Leave exhibit mode. With a target, jump to that part of the page.
    function close(target) {
      if (!current) return;
      current = null;
      body.classList.remove('is-exhibit');
      bar.hidden = true;
      CH.forEach(function (o) { document.getElementById(o.id).classList.remove('is-current', 'is-entering'); });
      if (target) {
        const t = document.getElementById(target);
        if (t) t.scrollIntoView({ block: 'start', behavior: 'instant' });
        try { history.replaceState(null, '', '#' + target); } catch (err) { /* ignore */ }
      }
      window.dispatchEvent(new Event('scroll'));
    }

    function step(d) {
      if (!current) return;
      const c = CH[byId[current].index + d];
      if (c) open(c.id);
    }

    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });
    document.getElementById('ex-close').addEventListener('click', function () { close('map'); });

    document.addEventListener('keydown', function (e) {
      if (!current || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target;
      if (t && (t.closest('input, textarea, select, dialog, [contenteditable="true"]') || t.closest('.stage'))) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'Escape') { e.preventDefault(); close('map'); }
    });

    // In exhibit mode, links to a chapter switch exhibits; any other link on
    // the page first returns to the full story, then follows the link.
    document.addEventListener('click', function (e) {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || !current) return;
      const id = a.getAttribute('href').slice(1);
      if (byId[id]) {
        e.preventDefault();
        open(id);
      } else {
        e.preventDefault();
        close(id || 'top');
      }
    }, true);

    return {
      open: open,
      close: close,
      get current() { return current; }
    };
  }

  /* ---------- "Built on" and "Led to" links in every chapter ---------- */

  function initLineage() {
    function chip(id, why, kind) {
      const t = byId[id];
      return '<a class="chip chip--' + kind + '" href="#' + id + '" title="' + esc(why) + '"><b>' + t.year + '</b>' + esc(t.short) + '</a>';
    }
    CH.forEach(function (c) {
      const meta = document.querySelector('#' + c.id + ' .meta');
      if (!meta) return;
      const ins = builtOn(c.id), outs = ledTo(c.id);
      if (!ins.length && !outs.length) return;
      const wrap = document.createElement('div');
      wrap.className = 'lineage';
      let html = '';
      if (ins.length) {
        html += '<div><p class="label">Built on</p><div class="chips">' +
          ins.map(function (e) { return chip(e[0], e[2], 'in'); }).join('') + '</div></div>';
      }
      if (outs.length) {
        html += '<div><p class="label">Led to</p><div class="chips">' +
          outs.map(function (e) { return chip(e[1], e[2], 'out'); }).join('') + '</div></div>';
      }
      wrap.innerHTML = html;
      meta.appendChild(wrap);
    });
  }

  /* ---------- The chain map ---------- */

  function initMap(nav) {
    const map = document.getElementById('chainmap');
    if (!map) return;
    const sec = document.getElementById('map');
    const svg = document.getElementById('chainmap-lines');
    const legend = document.getElementById('map-legend');
    const miYear = document.getElementById('mi-year');
    const miName = document.getElementById('mi-name');
    const miIdea = document.getElementById('mi-idea');
    const miLinks = document.getElementById('mi-links');
    const miOpen = document.getElementById('mi-open');
    const nodes = {};
    const laneLabels = [];
    let shown = 'galileo';

    LANES.forEach(function (l) {
      const d = document.createElement('div');
      d.className = 'lane-label';
      d.style.color = l.color;
      d.textContent = l.name;
      map.appendChild(d);
      laneLabels.push(d);
      legend.insertAdjacentHTML('beforeend', '<span><i style="background:' + l.color + '"></i>' + esc(l.name) + '</span>');
    });

    CH.forEach(function (c) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'node';
      b.dataset.id = c.id;
      b.style.setProperty('--lane', LANES[c.lane].color);
      b.innerHTML = '<span class="n-year">' + c.year + '</span><span class="n-dot"></span>' +
        '<span class="n-text"><span class="n-name">' + esc(c.short) + '</span><span class="n-idea">' + esc(c.idea) + '</span></span>';
      b.setAttribute('aria-label', c.year + ', ' + c.name + ': ' + c.idea + '. Open exhibit.');
      b.addEventListener('click', function () { nav.open(c.id); });
      b.addEventListener('mouseenter', function () { preview(c.id); });
      b.addEventListener('focus', function () { preview(c.id); });
      map.appendChild(b);
      nodes[c.id] = b;
    });
    map.addEventListener('mouseleave', function () { highlight(null); });

    function describe(id) {
      const ins = builtOn(id).map(function (e) { return byId[e[0]].short; });
      const outs = ledTo(id).map(function (e) { return byId[e[1]].short; });
      const parts = [];
      if (ins.length) parts.push('<span>Built on</span> ' + esc(ins.join(', ')));
      if (outs.length) parts.push('<span>Led to</span> ' + esc(outs.join(', ')));
      return parts.join('<em>·</em>');
    }

    function preview(id) {
      highlight(id);
      if (!id) return;
      shown = id;
      const c = byId[id];
      miYear.textContent = c.year;
      miYear.style.color = LANES[c.lane].color;
      miName.textContent = c.name;
      miIdea.textContent = c.idea;
      miLinks.innerHTML = describe(id);
      miOpen.textContent = 'Open ' + c.short + ' →';
    }

    miOpen.addEventListener('click', function () { nav.open(shown); });

    function highlight(id) {
      const hot = new Set();
      if (id) {
        hot.add(id);
        EDGES.forEach(function (e) {
          if (e[0] === id || e[1] === id) { hot.add(e[0]); hot.add(e[1]); }
        });
      }
      Object.keys(nodes).forEach(function (k) {
        nodes[k].classList.toggle('is-hot', !!id && hot.has(k));
        nodes[k].classList.toggle('is-dim', !!id && !hot.has(k));
      });
      svg.querySelectorAll('.edge').forEach(function (p) {
        const on = !!id && (p.dataset.from === id || p.dataset.to === id);
        p.classList.toggle('is-hot', on);
        p.classList.toggle('is-dim', !!id && !on);
      });
    }

    function layout() {
      const w = map.clientWidth;
      if (!w) return;
      const vertical = w < 860;
      sec.classList.toggle('is-vertical', vertical);
      map.classList.toggle('is-v', vertical);
      map.classList.toggle('is-h', !vertical);
      const pos = {};
      let height;
      if (!vertical) {
        const gutter = w > 1100 ? 150 : 124, colW = (w - gutter - 12) / CH.length;
        const rowH = 84, top = 50;
        CH.forEach(function (c, i) { pos[c.id] = { x: gutter + (i + 0.5) * colW, y: top + c.lane * rowH }; });
        height = top + (LANES.length - 1) * rowH + 56;
        map.style.setProperty('--cw', colW.toFixed(1));
        laneLabels.forEach(function (d, i) {
          d.style.top = (top + i * rowH) + 'px';
          d.style.width = (gutter - 22) + 'px';
          d.hidden = false;
        });
      } else {
        const track = function (lane) { return 18 + lane * 14; };
        const rowH = 66, top = 30;
        CH.forEach(function (c, i) { pos[c.id] = { x: track(c.lane), y: top + i * rowH }; });
        height = top + (CH.length - 1) * rowH + 40;
        laneLabels.forEach(function (d) { d.hidden = true; });
      }
      map.style.height = height + 'px';
      CH.forEach(function (c) {
        nodes[c.id].style.setProperty('--x', pos[c.id].x.toFixed(1));
        nodes[c.id].style.setProperty('--y', pos[c.id].y.toFixed(1));
      });

      // Lane lines through each lane's first and last node, then the links.
      let out = '';
      LANES.forEach(function (l, li) {
        const members = CH.filter(function (c) { return c.lane === li; });
        if (members.length < 2) return;
        const a = pos[members[0].id], b = pos[members[members.length - 1].id];
        out += '<line class="lane-line" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + l.color + '"></line>';
      });
      EDGES.forEach(function (e) {
        const a = pos[e[0]], b = pos[e[1]];
        const color = LANES[byId[e[0]].lane].color;
        let d;
        if (!vertical) {
          const dx = (b.x - a.x) * 0.5;
          d = 'M' + a.x + ' ' + a.y + ' C' + (a.x + dx) + ' ' + a.y + ' ' + (b.x - dx) + ' ' + b.y + ' ' + b.x + ' ' + b.y;
        } else {
          const dy = (b.y - a.y) * 0.5;
          d = 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + (a.y + dy) + ' ' + b.x + ' ' + (b.y - dy) + ' ' + b.x + ' ' + b.y;
        }
        out += '<path class="edge" data-from="' + e[0] + '" data-to="' + e[1] + '" d="' + d + '" stroke="' + color + '"><title>' +
          esc(byId[e[1]].short + ' built on ' + byId[e[0]].short + ': ' + e[2]) + '</title></path>';
      });
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + height);
      svg.innerHTML = out;
      map.classList.add('is-ready');
    }

    PH.onResize(map, layout);
    layout();
    preview('galileo');
    highlight(null);
  }

  /* ---------- Find: search by name, discovery or consequence ---------- */

  function search(query) {
    const q = norm(query);
    if (!q) return CH.map(function (c) { return { c: c, why: c.idea, score: 1 }; });
    const tokens = q.split(' ').filter(function (t) { return t.length > 2; });
    const results = [];
    CH.forEach(function (c) {
      let score = 0, why = c.idea;
      const names = norm(c.name + ' ' + c.short);
      if (names.split(' ').some(function (w) { return w.indexOf(q) === 0; }) || names.indexOf(q) >= 0) score = 100;
      if (String(c.year).indexOf(q) === 0) score = Math.max(score, 90);
      const consider = function (s, text) {
        if (s > score) { score = s; why = text; }
      };
      c.terms.forEach(function (t) {
        t[0].split(',').forEach(function (raw) {
          const k = norm(raw);
          if (!k) return;
          if (k === q) consider(80, t[1]);
          else if (k.indexOf(q) === 0) consider(70, t[1]);
          else if (q.length > 2 && k.indexOf(q) >= 0) consider(60, t[1]);
          else if (k.length > 2 && (' ' + q + ' ').indexOf(' ' + k + ' ') >= 0) consider(55, t[1]);
        });
      });
      if (!score && norm(c.idea).indexOf(q) >= 0) score = 40;
      // Several words: count how many land somewhere in this chapter.
      if (!score && tokens.length) {
        const hay = norm(c.name + ' ' + c.idea + ' ' + c.terms.map(function (t) { return t[0]; }).join(' '));
        const hits = tokens.filter(function (t) { return hay.indexOf(t) >= 0; }).length;
        if (hits) {
          score = 20 + hits * 5;
          const t = c.terms.find(function (tt) { return tokens.some(function (tok) { return norm(tt[0]).indexOf(tok) >= 0; }); });
          if (t) why = t[1];
        }
      }
      if (score) results.push({ c: c, why: why, score: score });
    });
    results.sort(function (a, b) { return b.score - a.score || a.c.year - b.c.year; });
    return results.slice(0, 8);
  }

  function initFinder(nav) {
    const dlg = document.getElementById('finder');
    if (!dlg) return;
    const input = document.getElementById('finder-input');
    const list = document.getElementById('finder-results');
    const suggest = document.getElementById('finder-suggest');
    const form = document.getElementById('finder-form');
    let results = [], active = 0;

    ['GPS', 'Wi-Fi', 'cancer', 'black holes', 'your phone', 'Mars', 'nuclear power', 'India'].forEach(function (s) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = s;
      b.addEventListener('click', function () {
        input.value = s;
        run();
        input.focus();
      });
      suggest.appendChild(b);
    });

    function run() {
      results = search(input.value);
      active = 0;
      render();
    }

    function render() {
      list.innerHTML = '';
      if (!results.length) {
        const li = document.createElement('li');
        li.className = 'finder-empty';
        li.textContent = 'Nothing matches "' + input.value + '". Try a name, or something from everyday life like "radio" or "X-ray".';
        list.appendChild(li);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      results.forEach(function (r, i) {
        const li = document.createElement('li');
        li.id = 'finder-opt-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === active));
        const b = document.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        b.style.setProperty('--lane', LANES[r.c.lane].color);
        b.innerHTML = '<span class="res-year">' + r.c.year + '</span><span class="res-name">' + esc(r.c.name) + '</span><span class="res-why">' + esc(r.why) + '</span>';
        b.addEventListener('click', function () { choose(r.c.id); });
        b.addEventListener('mousemove', function () {
          if (active !== i) { active = i; mark(); }
        });
        li.appendChild(b);
        list.appendChild(li);
      });
      mark();
    }

    function mark() {
      Array.from(list.children).forEach(function (li, i) { li.setAttribute('aria-selected', String(i === active)); });
      const cur = list.children[active];
      if (cur && cur.id) {
        input.setAttribute('aria-activedescendant', cur.id);
        cur.scrollIntoView({ block: 'nearest' });
      }
    }

    function choose(id) {
      close();
      nav.open(id);
    }

    function open() {
      input.value = '';
      run();
      if (typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
      input.focus();
    }

    function close() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
    }

    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(results.length - 1, active + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); mark(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[active]) choose(results[active].c.id);
      }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });

    ['find-open', 'find-open-2'].forEach(function (id) {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', open);
    });

    document.addEventListener('keydown', function (e) {
      const typing = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
      if (dlg.open) return;
      if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))) {
        e.preventDefault();
        open();
      }
    });
  }

  /* ---------- Start ---------- */

  PH.initNavigator = function () {
    initLineage();
    const nav = initExhibit();
    PH.nav = nav;
    initMap(nav);
    initFinder(nav);

    // The Map button: from an exhibit, go back to the map.
    const mapBtn = document.getElementById('map-open');
    if (mapBtn) {
      mapBtn.addEventListener('click', function (e) {
        if (nav.current) {
          e.preventDefault();
          e.stopPropagation();
          nav.close('map');
        }
      }, true);
    }

    // A shared link to an exhibit opens it directly.
    const m = /^#exhibit-([a-z]+)$/.exec(location.hash || '');
    if (m && byId[m[1]]) nav.open(m[1]);
  };
})();
