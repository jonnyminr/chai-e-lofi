/**
 * Spotify playlist URL validation & official embed helpers.
 * Only developer-configured URLs from config.js are used.
 * Visitors cannot inject arbitrary embed URLs.
 */
(function (global) {
  'use strict';

  var ALLOWED_HOSTS = Object.freeze(['open.spotify.com', 'www.open.spotify.com']);

  /**
   * @param {string} url
   * @returns {{ ok: boolean, playlistId?: string, embedUrl?: string, error?: string }}
   */
  function validatePlaylistUrl(url) {
    if (typeof url !== 'string' || !url.trim()) {
      return { ok: false, error: 'Playlist URL is missing. Set it in config.js.' };
    }

    var trimmed = url.trim();
    var parsed;

    try {
      parsed = new URL(trimmed);
    } catch (e) {
      return { ok: false, error: 'Invalid playlist URL format.' };
    }

    if (parsed.protocol !== 'https:') {
      return { ok: false, error: 'Playlist URL must use HTTPS.' };
    }

    if (ALLOWED_HOSTS.indexOf(parsed.hostname) === -1) {
      return { ok: false, error: 'Playlist URL must be on open.spotify.com.' };
    }

    // /playlist/{id} optionally with query/hash
    var match = parsed.pathname.match(/^\/playlist\/([A-Za-z0-9]{10,32})\/?$/);
    if (!match) {
      return { ok: false, error: 'URL must be an official Spotify playlist link.' };
    }

    var playlistId = match[1];
    var embedUrl =
      'https://open.spotify.com/embed/playlist/' +
      encodeURIComponent(playlistId) +
      '?utm_source=generator&theme=0';

    return { ok: true, playlistId: playlistId, embedUrl: embedUrl };
  }

  /**
   * Mount official Spotify iframe into a container.
   * @param {HTMLElement} mount
   * @param {string} embedUrl
   */
  function mountEmbed(mount, embedUrl) {
    mount.textContent = '';

    var iframe = document.createElement('iframe');
    iframe.title = 'Spotify playlist player';
    iframe.src = embedUrl;
    iframe.width = '100%';
    iframe.height = '152';
    iframe.allow =
      'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.borderRadius = '8px';
    // Never set sandbox that blocks Spotify; rely on CSP frame-src

    mount.appendChild(iframe);
  }

  /**
   * @param {HTMLElement} mount
   * @param {string} message
   */
  function showError(mount, message) {
    mount.textContent = '';
    var p = document.createElement('p');
    p.className = 'spotify-error';
    p.textContent = message;
    mount.appendChild(p);
  }

  global.ChaiSpotify = Object.freeze({
    validatePlaylistUrl: validatePlaylistUrl,
    mountEmbed: mountEmbed,
    showError: showError,
  });
})(window);
