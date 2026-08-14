/**
 * chai-e-lofi — main experience orchestrator
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'chai-lofi-settings-v3';
  var OTHER_CHANNELS = ['traffic', 'train', 'fan', 'street', 'chai'];

  function getDefaultRainVolume() {
    var config = window.CHAI_LOFI_CONFIG;
    var v = config && config.defaultRainVolume;
    return typeof v === 'number' && v >= 0 && v <= 100 ? Math.round(v) : 27;
  }

  function setRainSliderValue(value) {
    var input = $('vol-rain');
    if (!input) return;
    var level = Math.max(0, Math.min(100, Math.round(Number(value))));
    input.value = String(level);
    syncSliderLabels();
  }

  var state = {
    seated: false,
    backgroundPaused: false,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function announce(msg) {
    var el = $('sr-announce');
    if (el) el.textContent = msg;
  }

  function loadSettings() {
    var defaultVol = getDefaultRainVolume();
    setRainSliderValue(defaultVol);

    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;

      var rainVol = data.rainVolume;
      if (typeof rainVol === 'number' && rainVol >= 0 && rainVol <= 100) {
        setRainSliderValue(rainVol);
      }
    } catch (e) {
      setRainSliderValue(defaultVol);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rainVolume: getRainSliderLevel(),
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

  function getRainSliderLevel() {
    var input = $('vol-rain');
    if (!input) return getDefaultRainVolume();
    var level = Number(input.value);
    return Number.isFinite(level) ? level : getDefaultRainVolume();
  }

  function setEffectiveRain(level) {
    ChaiAmbience.setLevel('rain', level);
    syncRainVisual(level);
  }

  function applyRainVolume() {
    syncSliderLabels();
    saveSettings();
    if (!state.backgroundPaused) {
      setEffectiveRain(getRainSliderLevel());
    }
  }

  function pauseRainForBackground() {
    if (state.backgroundPaused || !state.seated) return;
    state.backgroundPaused = true;
    setEffectiveRain(0);
  }

  async function resumeRainFromBackground() {
    if (!state.backgroundPaused || !state.seated) return;
    state.backgroundPaused = false;
    await ChaiAmbience.unlock();
    setEffectiveRain(getRainSliderLevel());
  }

  function handlePageVisibility() {
    if (document.hidden) pauseRainForBackground();
    else resumeRainFromBackground();
  }

  function mountYoutube() {
    var mount = $('youtube-mount');
    var config = window.CHAI_LOFI_CONFIG;
    if (!mount || !config) {
      if (mount) ChaiYoutube.showError(mount, 'Configuration missing.');
      return;
    }
    var result = ChaiYoutube.validatePlaylistUrl(config.youtubePlaylistUrl);
    if (!result.ok) {
      ChaiYoutube.showError(mount, result.error + ' Music powered by YouTube.');
      return;
    }
    ChaiYoutube.mountEmbed(mount, result);
    
    function formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      var m = Math.floor(seconds / 60);
      var s = Math.floor(seconds % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    var playBtn = $('yt-play-btn');
    var prevBtn = $('yt-prev-btn');
    var nextBtn = $('yt-next-btn');
    var volBtn = $('yt-vol-btn');
    var progressBar = $('yt-progress-bar');
    
    if (playBtn) playBtn.addEventListener('click', function() { ChaiYoutube.togglePlay(); });
    if (prevBtn) prevBtn.addEventListener('click', function() { ChaiYoutube.previousVideo(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { ChaiYoutube.nextVideo(); });
    if (volBtn) volBtn.addEventListener('click', function() { 
      var isMuted = ChaiYoutube.toggleMute();
      if (isMuted) volBtn.classList.add('is-muted');
      else volBtn.classList.remove('is-muted');
    });

    var isScrubbing = false;
    if (progressBar) {
      progressBar.addEventListener('input', function() {
        isScrubbing = true;
        var dur = ChaiYoutube.getDuration();
        var el = $('yt-time-current');
        if (el) el.textContent = formatTime((progressBar.value / 100) * dur);
      });
      progressBar.addEventListener('change', function() {
        isScrubbing = false;
        var dur = ChaiYoutube.getDuration();
        ChaiYoutube.seekTo((progressBar.value / 100) * dur);
      });
    }

    var progressTimer = null;
    function updateProgress() {
      if (isScrubbing) return;
      var curr = ChaiYoutube.getCurrentTime();
      var dur = ChaiYoutube.getDuration();
      if (dur > 0) {
        var elC = $('yt-time-current');
        var elT = $('yt-time-total');
        if (elC) elC.textContent = formatTime(curr);
        if (elT) elT.textContent = formatTime(dur);
        if (progressBar) progressBar.value = (curr / dur) * 100;
      }
    }

    ChaiYoutube.setOnStateChange(function (isPlaying, state) {
      if (playBtn) {
        if (isPlaying) playBtn.classList.add('is-playing');
        else playBtn.classList.remove('is-playing');
      }
      
      if (isPlaying) {
        if (!progressTimer) progressTimer = setInterval(updateProgress, 1000);
      } else {
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }
      }
      
      // Update info when unstarted (-1) or playing (1) as tracks change
      if (state === 1 || state === -1) {
        setTimeout(function() {
          var data = ChaiYoutube.getVideoData();
          if (data && data.title) {
            var elTitle = $('yt-title');
            var elAuthor = $('yt-author');
            if (elTitle) elTitle.textContent = data.title;
            if (elAuthor) elAuthor.textContent = data.author || '';
          }
        }, 500);
      }
    });

    ChaiYoutube.setOnReady(function() {
      var data = ChaiYoutube.getVideoData();
      if (data && data.title) {
        var elTitle = $('yt-title');
        var elAuthor = $('yt-author');
        if (elTitle) elTitle.textContent = data.title;
        if (elAuthor) elAuthor.textContent = data.author || '';
      }
      updateProgress();
    });
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

      mountYoutube();

      var controls = $('controls');
      if (controls) controls.hidden = false;

      ChaiEvents.start();
      announce('YouTube playlist is ready. Adjust rain at the bottom.');
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

    document.addEventListener('visibilitychange', handlePageVisibility);
    window.addEventListener('pagehide', pauseRainForBackground);
    window.addEventListener('pageshow', function () {
      resumeRainFromBackground();
    });
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
