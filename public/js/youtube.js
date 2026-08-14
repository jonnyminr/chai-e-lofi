/**
 * YouTube URL validation & official embed helpers using Iframe API.
 * Only developer-configured URLs from config.js are used.
 * Visitors cannot inject arbitrary embed URLs.
 */
(function (global) {
  'use strict';

  var ALLOWED_HOSTS = Object.freeze(['youtube.com', 'www.youtube.com', 'youtu.be']);
  var player = null;
  var apiReady = false;
  var onStateChangeCb = null;
  var onReadyCb = null;

  // Load Iframe API
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }

  global.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    if (global.ChaiYoutube._pendingMount) {
      global.ChaiYoutube._pendingMount();
      global.ChaiYoutube._pendingMount = null;
    }
  };

  /**
   * @param {string} url
   * @returns {{ ok: boolean, videoId?: string, listId?: string, error?: string }}
   */
  function validatePlaylistUrl(url) {
    if (typeof url !== 'string' || !url.trim()) {
      return { ok: false, error: 'YouTube URL is missing. Set it in config.js.' };
    }

    var trimmed = url.trim();
    var parsed;

    try {
      parsed = new URL(trimmed);
    } catch (e) {
      return { ok: false, error: 'Invalid YouTube URL format.' };
    }

    if (parsed.protocol !== 'https:') {
      return { ok: false, error: 'YouTube URL must use HTTPS.' };
    }

    if (ALLOWED_HOSTS.indexOf(parsed.hostname) === -1) {
      return { ok: false, error: 'URL must be on youtube.com or youtu.be.' };
    }

    var videoId = null;
    var listId = parsed.searchParams.get('list');

    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.substring(1);
    } else {
      videoId = parsed.searchParams.get('v');
    }

    if (!videoId && !listId) {
      return { ok: false, error: 'URL must contain a video ID (v) or playlist ID (list).' };
    }

    return { ok: true, videoId: videoId, listId: listId };
  }

  /**
   * Mount official YouTube iframe using the Iframe API.
   * @param {HTMLElement} mount
   * @param {Object} data { videoId, listId }
   */
  function mountEmbed(mount, data) {
    mount.textContent = '';
    
    // Create a div for the player to replace
    var playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-inner';
    // Style to match original iframe
    playerDiv.style.borderRadius = '8px';
    playerDiv.style.border = 'none';
    mount.appendChild(playerDiv);

    var initPlayer = function () {
      var playerVars = {
        controls: 0,
        disablekb: 1,
        rel: 0,
        modestbranding: 1
      };
      
      if (data.listId) {
        playerVars.listType = 'playlist';
        playerVars.list = data.listId;
      }

      player = new YT.Player('yt-player-inner', {
        height: '152',
        width: '100%',
        videoId: data.videoId || '',
        playerVars: playerVars,
        events: {
          'onStateChange': function (event) {
            if (onStateChangeCb) {
              var isPlaying = (event.data === YT.PlayerState.PLAYING);
              // Also pass the full event so we can check if it's UNSTARTED or ended
              onStateChangeCb(isPlaying, event.data);
            }
          },
          'onReady': function (event) {
            if (onReadyCb) {
              onReadyCb();
            }
          }
        }
      });
      // The API replaces our div with an iframe. We can style the iframe via css later.
    };

    if (apiReady) {
      initPlayer();
    } else {
      global.ChaiYoutube._pendingMount = initPlayer;
    }
  }
  
  function togglePlay() {
    if (!player || typeof player.getPlayerState !== 'function') return;
    var state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  function setOnStateChange(cb) {
    onStateChangeCb = cb;
  }

  function setOnReady(cb) {
    onReadyCb = cb;
  }

  function nextVideo() {
    if (player && typeof player.nextVideo === 'function') player.nextVideo();
  }

  function previousVideo() {
    if (player && typeof player.previousVideo === 'function') player.previousVideo();
  }

  function toggleMute() {
    if (!player || typeof player.isMuted !== 'function') return false;
    if (player.isMuted()) {
      player.unMute();
      return false;
    } else {
      player.mute();
      return true;
    }
  }

  function isMuted() {
    return player && typeof player.isMuted === 'function' ? player.isMuted() : false;
  }

  function seekTo(seconds) {
    if (player && typeof player.seekTo === 'function') player.seekTo(seconds, true);
  }

  function getCurrentTime() {
    return player && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
  }

  function getDuration() {
    return player && typeof player.getDuration === 'function' ? player.getDuration() : 0;
  }

  function getVideoData() {
    return player && typeof player.getVideoData === 'function' ? player.getVideoData() : null;
  }

  /**
   * @param {HTMLElement} mount
   * @param {string} message
   */
  function showError(mount, message) {
    mount.textContent = '';
    var p = document.createElement('p');
    p.className = 'youtube-error';
    p.textContent = message;
    mount.appendChild(p);
  }

  global.ChaiYoutube = {
    validatePlaylistUrl: validatePlaylistUrl,
    mountEmbed: mountEmbed,
    showError: showError,
    togglePlay: togglePlay,
    setOnStateChange: setOnStateChange,
    setOnReady: setOnReady,
    nextVideo: nextVideo,
    previousVideo: previousVideo,
    toggleMute: toggleMute,
    isMuted: isMuted,
    seekTo: seekTo,
    getCurrentTime: getCurrentTime,
    getDuration: getDuration,
    getVideoData: getVideoData
  };
})(window);
