/**
 * Make My Night — shareable card (canvas) + copy text.
 * No personal data collected.
 */
(function (global) {
  'use strict';

  var QUOTES = Object.freeze([
    'Some nights are meant to be quiet.',
    'One cutting chai. One more song.',
    'Rain outside. Music inside.',
    'The city can wait.',
    'Stay for one more cup.',
  ]);

  var CHAI_LABELS = Object.freeze({
    cutting: 'Cutting Chai',
    adrak: 'Adrak Chai',
    masala: 'Masala Chai',
    irani: 'Irani Chai',
  });

  var CITY_LABELS = Object.freeze({
    mumbai: 'Mumbai',
    delhi: 'Delhi',
    pune: 'Pune',
    bangalore: 'Bangalore',
    kolkata: 'Kolkata',
  });

  var RAIN_LABELS = Object.freeze({
    none: 'Clear night',
    light: 'Light rain',
    heavy: 'Rain',
  });

  /**
   * @param {{ city: string, chai: string, rain: string, preset?: string }} state
   */
  function buildText(state) {
    var now = new Date();
    var hours = now.getHours();
    var mins = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var h12 = hours % 12 || 12;
    var timeStr = h12 + ':' + String(mins).padStart(2, '0') + ' ' + ampm;
    var quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    return (
      'chai-e-lofi\n' +
      timeStr + '\n' +
      (CITY_LABELS[state.city] || 'Night') +
      '\n\n' +
      '☕ ' +
      (CHAI_LABELS[state.chai] || 'Chai') +
      '\n' +
      '🌧️ ' +
      (RAIN_LABELS[state.rain] || 'Rain') +
      '\n' +
      '🎵 Spotify\n\n' +
      '"' +
      quote +
      '"\n\n' +
      'Music powered by Spotify.'
    );
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ city: string, chai: string, rain: string }} state
   * @param {string} shareText
   */
  function drawCard(canvas, state, shareText) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    // Night background
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#02060c');
    grad.addColorStop(0.45, '#0a1520');
    grad.addColorStop(1, '#1a2030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Amber glow
    var glow = ctx.createRadialGradient(w * 0.5, h * 0.28, 20, w * 0.5, h * 0.28, 220);
    glow.addColorStop(0, 'rgba(232, 165, 75, 0.35)');
    glow.addColorStop(1, 'rgba(232, 165, 75, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Soft rain lines
    if (state.rain !== 'none') {
      ctx.strokeStyle = 'rgba(200, 220, 240, 0.2)';
      ctx.lineWidth = 2;
      var n = state.rain === 'heavy' ? 50 : 24;
      for (var i = 0; i < n; i++) {
        var x = (i * 97) % w;
        var y = (i * 53) % h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 28);
        ctx.stroke();
      }
    }

    // Brand
    ctx.fillStyle = '#f2e8d5';
    ctx.font = 'bold 52px "Palatino Linotype", Palatino, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('chai-e-lofi', w / 2, 120);

    ctx.fillStyle = '#e8a54b';
    ctx.font = 'italic 26px "Palatino Linotype", Palatino, Georgia, serif';
    ctx.fillText('One cutting chai. One more song.', w / 2, 170);

    // Parse first lines of share text for layout
    var lines = shareText.split('\n');
    var timeLine = lines[1] || '';
    var cityLine = lines[2] || '';

    ctx.fillStyle = '#a89880';
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.fillText(timeLine, w / 2, 250);

    ctx.fillStyle = '#f2e8d5';
    ctx.font = 'bold 40px "Palatino Linotype", Palatino, Georgia, serif';
    ctx.fillText(cityLine, w / 2, 310);

    // Chai glass silhouette
    ctx.save();
    ctx.translate(w / 2, 430);
    ctx.strokeStyle = 'rgba(200, 210, 220, 0.7)';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(-28, -40);
    ctx.lineTo(28, -40);
    ctx.lineTo(22, 40);
    ctx.lineTo(-22, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#f2e8d5';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('☕ ' + (CHAI_LABELS[state.chai] || 'Chai'), w / 2, 520);
    ctx.fillText('🌧️ ' + (RAIN_LABELS[state.rain] || 'Rain'), w / 2, 565);
    ctx.fillText('🎵 Spotify', w / 2, 610);

    var quote = '';
    for (var q = 0; q < lines.length; q++) {
      if (lines[q].charAt(0) === '"') {
        quote = lines[q];
        break;
      }
    }

    ctx.fillStyle = '#e8a54b';
    ctx.font = 'italic 26px "Palatino Linotype", Palatino, Georgia, serif';
    wrapText(ctx, quote, w / 2, 700, w - 100, 34);

    ctx.fillStyle = '#a89880';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('Music powered by Spotify.', w / 2, h - 48);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var yy = y;
    for (var n = 0; n < words.length; n++) {
      var test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, yy);
        line = words[n] + ' ';
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, yy);
  }

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  function downloadImage(canvas, filename) {
    var safeName = String(filename || 'chai-e-lofi-night.png').replace(/[^\w.\-]+/g, '_');
    var link = document.createElement('a');
    link.download = safeName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  global.ChaiShare = Object.freeze({
    buildText: buildText,
    drawCard: drawCard,
    copyText: copyText,
    downloadImage: downloadImage,
    CHAI_LABELS: CHAI_LABELS,
    CITY_LABELS: CITY_LABELS,
  });
})(window);
