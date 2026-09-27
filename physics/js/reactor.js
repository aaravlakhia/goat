/* A neutron chain reaction: the hero plate and Exp. 11 (Meitner).
   Uranium nuclei sit on a jittered grid. A neutron that comes close enough to
   an intact nucleus splits it, which frees two or three new neutrons. */
(function () {
  'use strict';

  const PH = window.PH;

  class Reactor {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({
        spacing: 30,       // grid spacing of nuclei, px
        hitR: 8,           // how close a neutron must pass to split a nucleus, px
        speed: 170,        // neutron speed, px/s
        yieldMin: 2,
        yieldMax: 3,
        absorb: 0,         // chance per second that a neutron is soaked up (control rods)
        regrow: 0,         // seconds before a split nucleus is replaced by fresh fuel (0 = never)
        rodDepth: 0,       // how far the drawn control rods reach down, 0-1
        maxNeutrons: 2000,
        background: PH.color.plate
      }, opts);
      this.neutrons = [];
      this.flashes = [];
      this.frags = [];
      this.marks = [];
      this.splitTimes = [];
      this.clock = 0;
      this.layout();
    }

    layout() {
      this.size = PH.fitCanvas(this.canvas, 2);
      const w = this.size.w, h = this.size.h, sp = this.o.spacing;
      this.cols = Math.max(1, Math.floor(w / sp));
      this.rows = Math.max(1, Math.floor(h / sp));
      this.ox = (w - this.cols * sp) / 2;
      this.oy = (h - this.rows * sp) / 2;
      const n = this.cols * this.rows;
      this.nx = new Float32Array(n);
      this.ny = new Float32Array(n);
      this.split = new Float32Array(n).fill(-1); // -1 = intact, otherwise seconds since it split
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const i = r * this.cols + c;
          this.nx[i] = this.ox + (c + 0.5 + (Math.random() - 0.5) * 0.5) * sp;
          this.ny[i] = this.oy + (r + 0.5 + (Math.random() - 0.5) * 0.5) * sp;
        }
      }
      this.neutrons = [];
      this.flashes = [];
      this.frags = [];
      this.marks = [];
    }

    refuel() {
      this.split.fill(-1);
    }

    // True when the canvas's on-screen size no longer matches the layout.
    resized() {
      const rect = this.canvas.getBoundingClientRect();
      return Math.abs(rect.width - this.size.w) > 1 || Math.abs(rect.height - this.size.h) > 1;
    }

    // Index of the nucleus nearest a point, or -1.
    nearest(x, y) {
      const c = PH.clamp(Math.floor((x - this.ox) / this.o.spacing), 0, this.cols - 1);
      const r = PH.clamp(Math.floor((y - this.oy) / this.o.spacing), 0, this.rows - 1);
      return r * this.cols + c;
    }

    fire(x, y, angle) {
      const a = angle === undefined ? Math.random() * Math.PI * 2 : angle;
      this.neutrons.push({ x: x, y: y, vx: Math.cos(a) * this.o.speed, vy: Math.sin(a) * this.o.speed });
    }

    fission(i, births) {
      const o = this.o;
      this.split[i] = 0;
      this.splitTimes.push(this.clock);
      const x = this.nx[i], y = this.ny[i];
      const k = o.yieldMin + Math.floor(Math.random() * (o.yieldMax - o.yieldMin + 1));
      for (let j = 0; j < k; j++) {
        const a = Math.random() * Math.PI * 2;
        const v = o.speed * (0.85 + Math.random() * 0.3);
        births.push({ x: x + Math.cos(a) * (o.hitR + 1), y: y + Math.sin(a) * (o.hitR + 1), vx: Math.cos(a) * v, vy: Math.sin(a) * v });
      }
      this.flashes.push({ x: x, y: y, age: 0 });
      const a = Math.random() * Math.PI;
      this.frags.push({ x: x, y: y, vx: Math.cos(a) * 55, vy: Math.sin(a) * 55, age: 0 });
      this.frags.push({ x: x, y: y, vx: -Math.cos(a) * 55, vy: -Math.sin(a) * 55, age: 0 });
    }

    step(dt) {
      const o = this.o, sp = o.spacing, hit2 = o.hitR * o.hitR;
      const w = this.size.w, h = this.size.h;
      this.clock += dt;

      if (o.regrow > 0) {
        for (let i = 0; i < this.split.length; i++) {
          if (this.split[i] >= 0) {
            this.split[i] += dt;
            if (this.split[i] > o.regrow) this.split[i] = -1;
          }
        }
      } else {
        for (let i = 0; i < this.split.length; i++) if (this.split[i] >= 0) this.split[i] += dt;
      }

      const next = [], births = [];
      for (let k = 0; k < this.neutrons.length; k++) {
        const n = this.neutrons[k];
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -4 || n.y < -4 || n.x > w + 4 || n.y > h + 4) continue;
        if (o.absorb > 0 && Math.random() < o.absorb * dt) {
          this.marks.push({ x: n.x, y: n.y, age: 0 });
          continue;
        }
        const c = Math.floor((n.x - this.ox) / sp), r = Math.floor((n.y - this.oy) / sp);
        let hit = -1;
        for (let dr = -1; dr <= 1 && hit < 0; dr++) {
          const rr = r + dr;
          if (rr < 0 || rr >= this.rows) continue;
          for (let dc = -1; dc <= 1; dc++) {
            const cc = c + dc;
            if (cc < 0 || cc >= this.cols) continue;
            const i = rr * this.cols + cc;
            if (this.split[i] >= 0) continue;
            const dx = this.nx[i] - n.x, dy = this.ny[i] - n.y;
            if (dx * dx + dy * dy < hit2) {
              hit = i;
              break;
            }
          }
        }
        if (hit >= 0) this.fission(hit, births);
        else next.push(n);
      }
      for (let i = 0; i < births.length && next.length < o.maxNeutrons; i++) next.push(births[i]);
      this.neutrons = next;

      const age = function (list, life) {
        for (let i = list.length - 1; i >= 0; i--) {
          list[i].age += dt;
          if (list[i].age > life) list.splice(i, 1);
        }
      };
      age(this.flashes, 0.6);
      age(this.marks, 0.5);
      for (let i = this.frags.length - 1; i >= 0; i--) {
        const f = this.frags[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.age += dt;
        if (f.age > 0.7) this.frags.splice(i, 1);
      }
      while (this.splitTimes.length && this.splitTimes[0] < this.clock - 1) this.splitTimes.shift();
    }

    splitsPerSecond() {
      return this.splitTimes.length;
    }

    draw() {
      const ctx = this.ctx;
      const s = PH.fitCanvas(this.canvas, 2);
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = this.o.background;
      ctx.fillRect(0, 0, s.w, s.h);

      // Control rods, drawn from the top.
      if (this.o.rodDepth > 0) {
        const count = 5, rw = 12, depth = this.o.rodDepth * s.h;
        ctx.fillStyle = 'rgba(235, 231, 223, 0.07)';
        ctx.strokeStyle = 'rgba(235, 231, 223, 0.32)';
        ctx.lineWidth = 1;
        for (let i = 0; i < count; i++) {
          const x = Math.round(((i + 1) / (count + 1)) * s.w - rw / 2) + 0.5;
          ctx.fillRect(x, 0, rw, depth);
          ctx.strokeRect(x, -1, rw, depth + 1);
        }
      }

      // Nuclei: intact fuel, and freshly split ones glowing as they cool.
      const intact = new Path2D(), spent = new Path2D();
      for (let i = 0; i < this.split.length; i++) {
        const x = this.nx[i], y = this.ny[i];
        if (this.split[i] < 0) {
          intact.moveTo(x + 2.3, y);
          intact.arc(x, y, 2.3, 0, Math.PI * 2);
        } else {
          spent.moveTo(x + 1.3, y);
          spent.arc(x, y, 1.3, 0, Math.PI * 2);
        }
      }
      ctx.fillStyle = 'rgba(235, 231, 223, 0.5)';
      ctx.fill(intact);
      ctx.fillStyle = 'rgba(255, 180, 84, 0.22)';
      ctx.fill(spent);

      ctx.globalCompositeOperation = 'lighter';
      const flash = PH.glowSprite('rgba(255, 180, 84, 0.9)');
      this.flashes.forEach(function (f) {
        const k = f.age / 0.6;
        const size = 18 + 70 * Math.sqrt(k);
        ctx.globalAlpha = Math.max(0, 1 - k) * 0.9;
        ctx.drawImage(flash, f.x - size / 2, f.y - size / 2, size, size);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = PH.color.amber;
      this.frags.forEach(function (f) {
        ctx.globalAlpha = Math.max(0, 1 - f.age / 0.7);
        ctx.beginPath();
        ctx.arc(f.x, f.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.strokeStyle = PH.color.glow;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      this.neutrons.forEach(function (n) {
        ctx.moveTo(n.x - n.vx * 0.05, n.y - n.vy * 0.05);
        ctx.lineTo(n.x, n.y);
      });
      ctx.stroke();
      ctx.fillStyle = '#dff3ff';
      ctx.beginPath();
      this.neutrons.forEach(function (n) {
        ctx.moveTo(n.x + 1.6, n.y);
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      });
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.strokeStyle = 'rgba(162, 158, 149, 0.8)';
      ctx.lineWidth = 1;
      this.marks.forEach(function (m) {
        ctx.globalAlpha = Math.max(0, 1 - m.age / 0.5);
        ctx.beginPath();
        ctx.moveTo(m.x - 3, m.y - 3);
        ctx.lineTo(m.x + 3, m.y + 3);
        ctx.moveTo(m.x + 3, m.y - 3);
        ctx.lineTo(m.x - 3, m.y + 3);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  }

  PH.Reactor = Reactor;

  /* ---------- Hero: a chain reaction that sweeps across the page ---------- */

  PH.initHero = function () {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const playBtn = document.getElementById('hero-play');
    const r = new Reactor(canvas, { spacing: 30, hitR: 8, speed: 165, background: '#07090c' });
    let idle = 0;

    function kick() {
      r.refuel();
      r.neutrons = [];
      const w = r.size.w, h = r.size.h;
      const target = r.nearest(w * (0.62 + Math.random() * 0.2), h * (0.3 + Math.random() * 0.4));
      r.fire(r.nx[target] - 40, r.ny[target], 0);
    }

    const loop = new PH.Loop(canvas, function (dt) {
      r.step(dt);
      r.draw();
      if (r.neutrons.length === 0) {
        idle += dt;
        if (idle > 1.4) {
          idle = 0;
          kick();
        }
      } else {
        idle = 0;
      }
    });

    PH.onResize(canvas, function () {
      if (!r.resized()) return;
      r.layout();
      kick();
      for (let i = 0; i < 90; i++) r.step(1 / 60);
      r.draw();
    });

    // Start mid-reaction, so the first frame already shows the cascade.
    kick();
    for (let i = 0; i < 90; i++) r.step(1 / 60);
    r.draw();

    const sync = PH.bindPlay(playBtn, loop);
    PH.autoplay(loop, sync);
  };

  /* ---------- Exp. 11: Meitner's reactor with control rods ---------- */

  PH.initMeitner = function () {
    const stage = document.getElementById('mei-stage');
    if (!stage) return;
    const canvas = document.getElementById('mei-canvas');
    const chart = document.getElementById('mei-chart');
    const cctx = chart.getContext('2d');
    const chartBox = document.getElementById('mei-chart-box');
    const rods = document.getElementById('mei-rods');
    const rodsOut = document.getElementById('mei-rods-out');
    const neutronsOut = document.getElementById('mei-neutrons');
    const rateOut = document.getElementById('mei-rate');
    const stateOut = document.getElementById('mei-state');
    const playBtn = document.getElementById('mei-play');

    const ABSORB_MAX = 4;     // rods fully in: each neutron is soaked up within about 0.25 s
    const WINDOW = 20;
    const r = new Reactor(canvas, { spacing: 26, hitR: 7, speed: 150, regrow: 2.5, maxNeutrons: 1500 });
    let history = [];
    let clock = 0, sample = 0, hoverX = null, quiet = 0;

    function setRods() {
      const v = parseInt(rods.value, 10) / 100;
      r.o.absorb = v * ABSORB_MAX;
      r.o.rodDepth = 0.15 + v * 0.85;
      rodsOut.textContent = Math.round(v * 100) + '% in';
    }

    function fireOne() {
      const i = r.nearest(r.size.w / 2, r.size.h / 2);
      r.fire(r.nx[i] - 30, r.ny[i], 0);
    }

    // Where the rods sit relative to the critical point (found by running this model).
    function state() {
      const v = parseInt(rods.value, 10) / 100;
      if (v < 0.4) return 'Supercritical: each split causes more than one more, so the reaction races until it runs short of fuel. In a bomb, nothing holds it back, and it all happens in about a millionth of a second.';
      if (v > 0.62) return 'Subcritical: the rods soak up too many neutrons, so every burst dies out. Pull them out a little.';
      return 'Critical: each split causes about one more, so the power holds steady. This is how a nuclear power station runs.';
    }

    function drawChart() {
      PH.chart(chart, cctx, {
        x: [clock - WINDOW, clock],
        y: [1, 2000],
        yLog: true,
        yTicks: [{ v: 1, label: '1' }, { v: 10, label: '10' }, { v: 100, label: '100' }, { v: 1000, label: '1,000' }],
        xTicks: [{ v: clock - 20, label: '20 s ago' }, { v: clock - 10, label: '10 s ago' }, { v: clock, label: 'now' }],
        series: [{ points: history.map(function (p) { return [p[0], Math.max(1, p[1])]; }), color: PH.color.amber, width: 2 }],
        hoverX: hoverX,
        hoverText: function (p) { return PH.formatInt(p[1]) + ' neutrons, ' + (clock - p[0]).toFixed(1) + ' s ago'; }
      });
    }

    function readout() {
      PH.text(neutronsOut, PH.formatInt(r.neutrons.length));
      PH.text(rateOut, PH.formatInt(r.splitsPerSecond()));
      PH.text(stateOut, state());
    }

    const loop = new PH.Loop(stage, function (dt) {
      r.step(dt);
      // Uranium fuel releases the odd stray neutron on its own, so a stopped
      // reaction gets a fresh chance to start.
      if (r.neutrons.length === 0) {
        quiet += dt;
        if (quiet > 1.2) {
          quiet = 0;
          fireOne();
        }
      } else {
        quiet = 0;
      }
      clock += dt;
      sample += dt;
      if (sample >= 0.1) {
        sample = 0;
        history.push([clock, r.neutrons.length]);
        while (history.length && history[0][0] < clock - WINDOW) history.shift();
        readout();
      }
      r.draw();
      drawChart();
    });

    rods.addEventListener('input', function () {
      setRods();
      readout();
      if (!loop.running) r.draw();
    });
    document.getElementById('mei-fire').addEventListener('click', function () {
      fireOne();
      if (!loop.running) {
        loop.play();
        sync();
      }
    });
    document.getElementById('mei-reset').addEventListener('click', function () {
      r.refuel();
      if (!loop.running) r.draw();
    });
    const sync = PH.bindPlay(playBtn, loop);

    PH.hoverChart(chartBox, function (x) {
      hoverX = x;
      if (!loop.running) drawChart();
    });

    PH.onResize(stage, function () {
      if (r.resized()) {
        r.layout();
        for (let i = 0; i < 4; i++) fireOne();
      }
      r.draw();
      drawChart();
    });

    // Start with a small reaction already running near balance.
    setRods();
    for (let i = 0; i < 4; i++) fireOne();
    for (let i = 0; i < 60; i++) {
      r.step(1 / 60);
      clock += 1 / 60;
      if (i % 6 === 0) history.push([clock, r.neutrons.length]);
    }
    r.draw();
    drawChart();
    readout();
    loop.onVisible = function () {
      if (r.neutrons.length === 0 && loop.running) for (let i = 0; i < 4; i++) fireOne();
    };
    PH.autoplay(loop, sync);
  };
})();
