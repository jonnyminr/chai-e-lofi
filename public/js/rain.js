/**
 * Lightweight canvas rain — respects prefers-reduced-motion.
 */
(function (global) {
  'use strict';

  var canvas = null;
  var ctx = null;
  var drops = [];
  var raf = 0;
  var intensity = 'heavy'; // none | light | heavy
  var reduced = false;
  var running = false;
  var dpr = 1;

  function prefersReduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function countFor(mode) {
    if (mode === 'none') return 0;
    if (reduced) return mode === 'heavy' ? 40 : 20;
    return mode === 'heavy' ? 160 : 70;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    rebuild();
  }

  function rebuild() {
    var n = countFor(intensity);
    drops = [];
    for (var i = 0; i < n; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: (reduced ? 8 : 12 + Math.random() * 14) * dpr,
        speed: (reduced ? 4 : 6 + Math.random() * 10) * dpr,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }
  }

  function frame() {
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (intensity === 'none' || drops.length === 0) {
      raf = requestAnimationFrame(frame);
      return;
    }

    ctx.strokeStyle = 'rgba(200, 220, 240, 0.55)';
    ctx.lineWidth = Math.max(1, dpr);
    ctx.lineCap = 'round';

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      ctx.globalAlpha = d.opacity;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1.5 * dpr, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      d.x -= d.speed * 0.15;
      if (d.y > canvas.height) {
        d.y = -d.len;
        d.x = Math.random() * canvas.width;
      }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function start(el) {
    canvas = el;
    ctx = canvas.getContext('2d');
    reduced = prefersReduced();
    resize();
    running = true;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
    window.addEventListener('resize', resize, { passive: true });

    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
        reduced = e.matches;
        rebuild();
      });
    }
  }

  function setIntensity(mode) {
    intensity = mode === 'none' || mode === 'light' || mode === 'heavy' ? mode : 'heavy';
    if (canvas) {
      canvas.classList.toggle('is-on', intensity !== 'none');
      rebuild();
    }
    document.body.setAttribute('data-rain', intensity);
  }

  global.ChaiRain = Object.freeze({
    start: start,
    setIntensity: setIntensity,
  });
})(window);
