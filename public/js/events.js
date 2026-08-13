/**
 * Subtle random environment events — peaceful, not noisy.
 */
(function (global) {
  'use strict';

  var timer = null;
  var active = false;

  var RADIO_LINES = Object.freeze([
    "It's 12:47 AM.",
    'Another cup?',
    'Some nights are better with chai.',
    'To everyone studying tonight... keep going.',
    'Rain outside. Music inside.',
    'The kettle remembers every night.',
    'Sit a little longer.',
    'One more song.',
  ]);

  function announce(msg) {
    var el = document.getElementById('sr-announce');
    if (el) el.textContent = msg;
  }

  function passVehicle(id, kind) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('passing');
    void el.offsetWidth;
    el.classList.add('passing');
    if (global.ChaiAmbience) {
      global.ChaiAmbience.playPassBy(kind);
    }
    announce(kind === 'auto' ? 'An auto-rickshaw passes by.' : 'A scooter passes by.');
  }

  function flickerLight() {
    var lights = document.querySelectorAll('.street-light[data-flicker]');
    if (!lights.length) return;
    var light = lights[Math.floor(Math.random() * lights.length)];
    light.classList.add('is-flickering');
    setTimeout(function () {
      light.classList.remove('is-flickering');
    }, 1200);
    announce('A street light flickers.');
  }

  function walkPast() {
    var el = document.getElementById('event-walker');
    if (!el) return;
    el.classList.remove('passing');
    void el.offsetWidth;
    el.classList.add('passing');
    announce('Someone walks past the tapri.');
  }

  function bumpRain() {
    if (!global.ChaiRain) return;
    var current = document.body.getAttribute('data-rain') || 'heavy';
    if (current === 'none') return;
    global.ChaiRain.setIntensity('heavy');
    if (global.ChaiAmbience) {
      global.ChaiAmbience.setLevel('rain', 80);
      var rainSlider = document.getElementById('vol-rain');
      if (rainSlider) {
        rainSlider.value = '80';
        rainSlider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    announce('The rain grows heavier.');
  }

  function triggerRandom() {
    if (!active) return;
    var roll = Math.random();
    if (roll < 0.18) {
      passVehicle('event-scooter', 'scooter');
    } else if (roll < 0.32) {
      passVehicle('event-auto', 'auto');
    } else if (roll < 0.42) {
      if (global.ChaiAmbience) global.ChaiAmbience.playTrainHorn();
      announce('A distant train horn.');
    } else if (roll < 0.52) {
      if (global.ChaiAmbience) global.ChaiAmbience.playChaiPour();
      announce('Chai is poured.');
    } else if (roll < 0.6) {
      if (global.ChaiAmbience) global.ChaiAmbience.playDogBark();
      announce('A dog barks in the distance.');
    } else if (roll < 0.7) {
      bumpRain();
    } else if (roll < 0.8) {
      flickerLight();
    } else if (roll < 0.9) {
      walkPast();
    } else {
      if (global.ChaiAmbience) global.ChaiAmbience.playShutter();
      announce('A shop shutter closes nearby.');
    }

    schedule();
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    // 28–70 seconds between events
    var wait = 28000 + Math.random() * 42000;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wait *= 1.5;
    }
    timer = setTimeout(triggerRandom, wait);
  }

  function start() {
    active = true;
    schedule();
  }

  function stop() {
    active = false;
    if (timer) clearTimeout(timer);
  }

  function randomRadioLine() {
    return RADIO_LINES[Math.floor(Math.random() * RADIO_LINES.length)];
  }

  global.ChaiEvents = Object.freeze({
    start: start,
    stop: stop,
    randomRadioLine: randomRadioLine,
    RADIO_LINES: RADIO_LINES,
  });
})(window);
