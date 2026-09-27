/* §5: primes in polar coordinates. Each prime p sits at distance p and angle
   p radians; zooming out reveals spirals, then rays. */
(function () {
  'use strict';

  const SN = window.SN;

  const LIMIT = 300000;
  const R_MIN = 24, R_MAX = 200000;
  const OTHER = '#4a5d8a';

  // Pixel values for ImageData (little-endian ABGR).
  const PX_PLATE = 0xff120d0b;
  const PX_PRIME = 0xff2cb9f2;
  const PX_OTHER = 0xff8a5d4a;

  let composite = null;

  // Sieve of Eratosthenes: composite[n] is 1 when n is not prime.
  function sieve() {
    const s = new Uint8Array(LIMIT + 1);
    s[0] = 1;
    s[1] = 1;
    for (let i = 2; i * i <= LIMIT; i++) {
      if (s[i]) continue;
      for (let j = i * i; j <= LIMIT; j += i) s[j] = 1;
    }
    return s;
  }

  function radiusFor(v) {
    return R_MIN * Math.pow(R_MAX / R_MIN, v / 1000);
  }

  SN.initPrimes = function () {
    const stage = document.getElementById('primes-stage');
    if (!stage) return;
    const canvas = document.getElementById('primes-canvas');
    const ctx = canvas.getContext('2d');
    const zoomIn = document.getElementById('primes-zoom');
    const zoomOut = document.getElementById('primes-zoom-out');
    const playBtn = document.getElementById('primes-play');
    const modeBtns = Array.from(document.querySelectorAll('[data-primes-mode]'));
    const rangeOut = document.getElementById('primes-range');
    const countOut = document.getElementById('primes-count');
    const patternOut = document.getElementById('primes-pattern');
    const otherLegend = document.getElementById('primes-legend-other');

    composite = composite || sieve();

    let v = parseFloat(zoomIn.value);
    let mode = 'primes';

    function pattern(R) {
      if (R < 180) return 'Close in: 6 arms, and every prime above 3 sits on just 2 of them (numbers of the form 6k ± 1).';
      if (R < 25000) return '44 spirals, and primes fill only 20 of them.';
      return '710 nearly straight rays, and primes fill only 280 of them.';
    }

    function draw() {
      const size = SN.fitCanvas(canvas);
      const w = size.w, h = size.h;
      const R = radiusFor(v);
      const half = Math.min(w, h) / 2 - 6;
      const s = half / R;
      const cx = w / 2, cy = h / 2;
      const maxN = Math.min(LIMIT, Math.ceil((R * Math.hypot(w, h)) / (2 * half)) + 2);
      const dot = SN.clamp(s * 0.6, R > 60000 ? 1.4 : 2.2, 6);
      const showAll = mode === 'all';

      if (dot * size.dpr <= 2.2) {
        // Tiny dots: write pixels directly, which is much faster than paths.
        const W = canvas.width, H = canvas.height, k = size.dpr;
        const img = ctx.createImageData(W, H);
        const buf = new Uint32Array(img.data.buffer);
        buf.fill(PX_PLATE);
        const fat = dot * k > 1.5;
        const plot = function (n, px) {
          const X = ((cx + n * s * Math.cos(n)) * k) | 0;
          const Y = ((cy - n * s * Math.sin(n)) * k) | 0;
          if (X < 0 || Y < 0 || X >= W - 1 || Y >= H - 1) return;
          const o = Y * W + X;
          buf[o] = px;
          if (fat) {
            buf[o + 1] = px;
            buf[o + W] = px;
            buf[o + W + 1] = px;
          }
        };
        if (showAll) {
          for (let n = 1; n <= maxN; n++) if (composite[n]) plot(n, PX_OTHER);
        }
        for (let n = 2; n <= maxN; n++) if (!composite[n]) plot(n, PX_PRIME);
        ctx.putImageData(img, 0, 0);
      } else {
        ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        ctx.fillStyle = SN.color.plate;
        ctx.fillRect(0, 0, w, h);
        const r = dot / 2;
        if (showAll) {
          ctx.fillStyle = OTHER;
          ctx.beginPath();
          for (let n = 1; n <= maxN; n++) {
            if (!composite[n]) continue;
            const x = cx + n * s * Math.cos(n), y = cy - n * s * Math.sin(n);
            ctx.moveTo(x + r, y);
            ctx.arc(x, y, r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.fillStyle = SN.color.yellow;
        ctx.beginPath();
        for (let n = 2; n <= maxN; n++) {
          if (composite[n]) continue;
          const x = cx + n * s * Math.cos(n), y = cy - n * s * Math.sin(n);
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();

        // Close in, label the numbers themselves.
        if (R <= 70) {
          ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          for (let n = 1; n <= maxN; n++) {
            const prime = !composite[n];
            if (!prime && !showAll) continue;
            const x = cx + n * s * Math.cos(n), y = cy - n * s * Math.sin(n);
            if (x < -20 || y < -10 || x > w + 20 || y > h + 10) continue;
            ctx.fillStyle = prime ? SN.color.ink : SN.color.muted;
            ctx.fillText(String(n), x + r + 3, y);
          }
        }
      }

      // Count only primes that are actually inside the plate's circle of view.
      const within = Math.min(maxN, Math.floor(R));
      let shown = 0;
      for (let n = 2; n <= within; n++) if (!composite[n]) shown++;

      zoomOut.textContent = SN.formatInt(R);
      rangeOut.textContent = '1 to ' + SN.formatInt(within);
      countOut.textContent = SN.formatInt(shown);
      const p = pattern(R);
      if (patternOut.textContent !== p) patternOut.textContent = p;
    }

    const loop = new SN.Loop(stage, function (dt) {
      v = Math.min(1000, v + dt * 55);
      zoomIn.value = String(Math.round(v));
      draw();
      if (v >= 1000) stop();
    });

    function stop() {
      loop.pause();
      playBtn.textContent = 'Zoom out';
      playBtn.setAttribute('aria-pressed', 'false');
    }

    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.addEventListener('click', function () {
      if (loop.running) {
        stop();
        return;
      }
      if (v >= 999) v = 0;
      loop.play();
      playBtn.textContent = 'Pause';
      playBtn.setAttribute('aria-pressed', 'true');
    });

    zoomIn.addEventListener('input', function () {
      stop();
      v = parseFloat(zoomIn.value);
      draw();
    });

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.dataset.primesMode;
        SN.setPressed(modeBtns, btn);
        otherLegend.hidden = mode !== 'all';
        if (!loop.running) draw();
      });
    });

    SN.onResize(stage, draw);
    draw();
  };
})();
