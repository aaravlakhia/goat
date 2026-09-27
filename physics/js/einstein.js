/* Exp. 6: Einstein's light clocks. Light moves at the same speed for both
   clocks, so the moving clock's slanted path makes each tick take longer. */
(function () {
  'use strict';

  const PH = window.PH;

  PH.initEinstein = function () {
    const stage = document.getElementById('ein-stage');
    if (!stage) return;
    const canvas = document.getElementById('ein-canvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('ein-speed');
    const sliderOut = document.getElementById('ein-speed-out');
    const gammaOut = document.getElementById('ein-gamma');
    const restOut = document.getElementById('ein-rest');
    const shipOut = document.getElementById('ein-ship');
    const msg = document.getElementById('ein-msg');
    const playBtn = document.getElementById('ein-play');

    const REST = PH.color.markBlue, SHIP = PH.color.markAmber;
    let restPhase = 0, shipPhase = 0, shipX = null, trail = [];
    let geo = null;

    function beta() {
      return parseInt(slider.value, 10) / 1000;
    }

    function gamma() {
      const b = beta();
      return 1 / Math.sqrt(1 - b * b);
    }

    function layout() {
      const s = PH.fitCanvas(canvas);
      const laneH = s.h / 2;
      const H = laneH * 0.56;
      geo = { w: s.w, h: s.h, laneH: laneH, H: H, c: H / 0.5, mirror: 46 };
      if (shipX === null) shipX = s.w * 0.2;
    }

    function resetTicks() {
      restPhase = 0;
      shipPhase = 0;
      trail = [];
    }

    function readout() {
      const b = beta(), g = gamma();
      sliderOut.textContent = (b * 100).toFixed(1) + '% of c';
      gammaOut.textContent = '×' + g.toFixed(2);
      restOut.textContent = Math.floor(restPhase) + ' ticks';
      shipOut.textContent = Math.floor(shipPhase) + ' ticks';
      let text;
      if (b === 0) text = 'Standing still: both clocks keep exactly the same time.';
      else if (g < 1.05) text = 'At ' + (b * 100).toFixed(0) + '% of light speed the ship\'s clock is only ' + ((g - 1) * 100).toFixed(1) + '% slow. At everyday speeds the effect is far smaller still.';
      else text = 'At ' + (b * 100).toFixed(1) + '% of light speed, 1 year on the ship is ' + g.toFixed(g < 10 ? 2 : 1) + ' years on Earth.';
      PH.text(msg, text);
    }

    // Height of a photon in its clock (0 = bottom mirror, 1 = top) for a phase.
    function bounce(phase) {
      const f = phase - Math.floor(phase);
      return f < 0.5 ? f * 2 : 2 - f * 2;
    }

    function step(dt) {
      const b = beta(), g = gamma();
      restPhase += (dt * geo.c) / (2 * geo.H);
      shipPhase += (dt * geo.c) / (2 * geo.H * g);
      const oldX = shipX;
      shipX += b * geo.c * dt;
      const wrap = shipX > geo.w + geo.mirror;
      if (wrap) shipX = -geo.mirror;
      const yTop = geo.laneH + (geo.laneH - geo.H) / 2;
      const py = yTop + geo.H * (1 - bounce(shipPhase));
      trail.push({ x: shipX, y: py, cut: wrap || oldX > shipX });
      if (trail.length > 240) trail.shift();
    }

    function drawClock(x, top, phase, color, label) {
      const H = geo.H, m = geo.mirror;
      ctx.strokeStyle = PH.color.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - m / 2, top);
      ctx.lineTo(x + m / 2, top);
      ctx.moveTo(x - m / 2, top + H);
      ctx.lineTo(x + m / 2, top + H);
      ctx.stroke();
      const py = top + H * (1 - bounce(phase));
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(PH.glowSprite(color), x - 14, py - 14, 28, 28);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff8ea';
      ctx.beginPath();
      ctx.arc(x, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PH.color.muted;
      ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x, top + H + 10);
    }

    function draw() {
      PH.begin(canvas, ctx);
      const w = geo.w, laneH = geo.laneH, H = geo.H;
      const restTop = (laneH - H) / 2, shipTop = laneH + (laneH - H) / 2;

      // Lane divider and labels.
      ctx.strokeStyle = PH.color.faint;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, laneH + 0.5);
      ctx.lineTo(w, laneH + 0.5);
      ctx.stroke();
      ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = REST;
      ctx.fillText('ON EARTH · ' + Math.floor(restPhase) + ' TICKS', 14, 12);
      ctx.fillStyle = SHIP;
      ctx.fillText('ON THE SHIP · ' + Math.floor(shipPhase) + ' TICKS', 14, laneH + 12);

      // The rest clock's light path is a straight up-and-down line.
      const rx = w * 0.5;
      ctx.strokeStyle = REST;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, restTop);
      ctx.lineTo(rx, restTop + H);
      ctx.stroke();
      ctx.globalAlpha = 1;
      drawClock(rx, restTop, restPhase, REST, 'AT REST');

      // The ship's light path zigzags: longer, at the same speed of light.
      ctx.strokeStyle = SHIP;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      trail.forEach(function (p, i) {
        if (i === 0 || p.cut) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // A simple ship hull around the moving clock.
      const sx = shipX;
      ctx.strokeStyle = 'rgba(235, 231, 223, 0.3)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx - geo.mirror / 2 - 18, shipTop - 12);
      ctx.lineTo(sx + geo.mirror / 2 + 6, shipTop - 12);
      ctx.quadraticCurveTo(sx + geo.mirror / 2 + 40, shipTop + H / 2, sx + geo.mirror / 2 + 6, shipTop + H + 12);
      ctx.lineTo(sx - geo.mirror / 2 - 18, shipTop + H + 12);
      ctx.closePath();
      ctx.stroke();
      drawClock(sx, shipTop, shipPhase, SHIP, 'MOVING');
    }

    const loop = new PH.Loop(stage, function (dt) {
      step(dt);
      readout();
      draw();
    });
    const sync = PH.bindPlay(playBtn, loop);

    slider.addEventListener('input', function () {
      resetTicks();
      readout();
      if (!loop.running) draw();
    });
    document.querySelectorAll('[data-ein-v]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        slider.value = btn.dataset.einV;
        resetTicks();
        readout();
        if (!loop.running) draw();
      });
    });

    PH.onResize(stage, function () {
      layout();
      trail = [];
      draw();
    });

    layout();
    // Run a few seconds ahead so the first frame shows the zigzag.
    for (let i = 0; i < 150; i++) step(1 / 60);
    readout();
    draw();
    PH.autoplay(loop, sync);
  };
})();
