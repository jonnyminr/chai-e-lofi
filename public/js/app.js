/**
 * chai-e-lofi — main experience orchestrator
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'chai-lofi-settings-v1';
  var OTHER_CHANNELS = ['traffic', 'train', 'fan', 'street', 'chai'];

  var state = {
    seated: false,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function announce(msg) {
    var el = $('sr-announce');
    if (el) el.textContent = msg;
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;

      var rainVol = data.rainVolume;
      if (typeof rainVol === 'number' && rainVol >= 0 && rainVol <= 100) {
        var input = $('vol-rain');
        if (input) input.value = String(Math.round(rainVol));
      }
    } catch (e) {
      // ignore corrupt storage
    }
  }

  function saveSettings() {
    try {
      var input = $('vol-rain');
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rainVolume: input ? Number(input.value) : 70,
        })
      );
    } catch (e) {
      // private mode etc.
    }
  }

  function timeMessage() {
    var h = new Date().getHours();
    if (h >= 22 || h < 1) return 'The night is just starting.';
    if (h >= 1 && h < 2) return 'The city is quieter now.';
    if (h >= 2 && h < 4) return 'Why are you still awake?';
    if (h >= 4 && h < 6) return 'The city is about to wake up.';
    if (h >= 6 && h < 12) return 'Morning chai hits different.';
    if (h >= 12 && h < 18) return 'A quiet pause in the day.';
    return 'Evening is settling in.';
  }

  function syncSliderLabels() {
    document.querySelectorAll('.slider-val').forEach(function (el) {
      var id = el.getAttribute('data-for');
      var input = id ? $(id) : null;
      if (input) {
        el.textContent = input.value + '%';
        input.setAttribute('aria-valuetext', input.value + ' percent');
      }
    });
  }

  function syncRainVisual(level) {
    var mode = 'none';
    if (level > 40) mode = 'heavy';
    else if (level > 0) mode = 'light';
    ChaiRain.setIntensity(mode);
  }

  function silenceOtherAmbience() {
    OTHER_CHANNELS.forEach(function (ch) {
      ChaiAmbience.setLevel(ch, 0);
    });
  }

  function applyRainVolume() {
    var input = $('vol-rain');
    if (!input) return;
    var level = Number(input.value);
    ChaiAmbience.setLevel('rain', level);
    syncRainVisual(level);
    syncSliderLabels();
    saveSettings();
  }

  function mountSpotify() {
    var mount = $('spotify-mount');
    var config = window.CHAI_LOFI_CONFIG;
    if (!mount || !config) {
      if (mount) ChaiSpotify.showError(mount, 'Configuration missing.');
      return;
    }
    var result = ChaiSpotify.validatePlaylistUrl(config.spotifyPlaylistUrl);
    if (!result.ok) {
      ChaiSpotify.showError(mount, result.error + ' Music powered by Spotify.');
      return;
    }
    ChaiSpotify.mountEmbed(mount, result.embedUrl);
    var dock = $('player-dock');
    if (dock) dock.classList.add('is-active');
  }

  async function sitDown() {
    if (state.seated) return;
    state.seated = true;

    await ChaiAmbience.unlock();
    silenceOtherAmbience();
    applyRainVolume();

    var intro = $('intro');
    if (intro) intro.classList.add('is-leaving');

    setTimeout(function () {
      if (intro) intro.hidden = true;

      var experience = $('experience');
      if (experience) experience.hidden = false;

      var scene = $('main');
      if (scene) scene.setAttribute('data-phase', 'seated');

      mountSpotify();

      var controls = $('controls');
      if (controls) controls.hidden = false;

      ChaiEvents.start();
      announce('Spotify playlist is ready. Adjust rain at the bottom.');
    }, 900);
  }

  function bind() {
    var sit = $('sit-down');
    if (sit) sit.addEventListener('click', sitDown);

    var timeEl = $('time-message');
    if (timeEl) timeEl.textContent = timeMessage();

    var rainInput = $('vol-rain');
    if (rainInput) {
      rainInput.addEventListener('input', applyRainVolume);
    }
  }

  function applyBranding() {
    var config = window.CHAI_LOFI_CONFIG;
    if (!config) return;

    var brandEl = $('brand-title');
    var experienceBrand = $('experience-brand');
    var experienceTagline = $('experience-tagline');

    if (brandEl && config.brand) brandEl.textContent = config.brand;
    if (experienceBrand && config.brand) experienceBrand.textContent = config.brand;
    if (experienceTagline && config.tagline) {
      experienceTagline.innerHTML = config.tagline.replace('. ', '.<br />');
    }

    if (config.brand) document.title = config.brand + ' — ' + (config.tagline || '');
  }

  function init() {
    loadSettings();
    applyBranding();
    bind();

    var rainCanvas = $('rain-canvas');
    if (rainCanvas) ChaiRain.start(rainCanvas);

    document.body.setAttribute('data-rain', 'none');
    syncSliderLabels();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
