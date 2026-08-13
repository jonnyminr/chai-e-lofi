/**
 * Original ambient soundscape via Web Audio API.
 * Synthesized on-device — no copyrighted recordings.
 * Does NOT touch, process, or route Spotify audio.
 */
(function (global) {
  'use strict';

  var ctx = null;
  var master = null;
  var muted = false;
  var started = false;

  /** @type {Record<string, { gain: GainNode, level: number }>} */
  var buses = {};

  var CHANNELS = ['rain', 'traffic', 'train', 'fan', 'street', 'chai'];

  function ensureContext() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);

    CHANNELS.forEach(function (name) {
      var g = ctx.createGain();
      g.gain.value = 0;
      g.connect(master);
      buses[name] = { gain: g, level: 0 };
    });

    return ctx;
  }

  function noiseBuffer(seconds) {
    var sampleRate = ctx.sampleRate;
    var length = Math.floor(sampleRate * seconds);
    var buffer = ctx.createBuffer(1, length, sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function createNoiseSource(buffer, loop) {
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = !!loop;
    return src;
  }

  function bandpassNoise(input, freq, q) {
    var filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    input.connect(filter);
    return filter;
  }

  function lowpass(input, freq) {
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    input.connect(filter);
    return filter;
  }

  function startLoops() {
    if (!ctx || started) return;
    started = true;

    var longNoise = noiseBuffer(3);

    // Rain — filtered noise
    (function () {
      var src = createNoiseSource(longNoise, true);
      var bp = bandpassNoise(src, 1200, 0.6);
      var lp = lowpass(bp, 4000);
      var g = ctx.createGain();
      g.gain.value = 0.35;
      lp.connect(g);
      g.connect(buses.rain.gain);
      src.start();
    })();

    // Traffic — low rumble + occasional filtered bursts via LFO-ish gain
    (function () {
      var src = createNoiseSource(longNoise, true);
      var lp = lowpass(src, 280);
      var g = ctx.createGain();
      g.gain.value = 0.22;
      lp.connect(g);
      g.connect(buses.traffic.gain);
      src.start();

      // Soft engine-like oscillator bed
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      var og = ctx.createGain();
      og.gain.value = 0.015;
      var olp = ctx.createBiquadFilter();
      olp.type = 'lowpass';
      olp.frequency.value = 120;
      osc.connect(olp);
      olp.connect(og);
      og.connect(buses.traffic.gain);
      osc.start();
    })();

    // Train — distant low pulse + hiss
    (function () {
      var src = createNoiseSource(longNoise, true);
      var bp = bandpassNoise(src, 200, 2);
      var g = ctx.createGain();
      g.gain.value = 0.12;
      bp.connect(g);
      g.connect(buses.train.gain);
      src.start();

      var osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 90;
      var lfo = ctx.createOscillator();
      lfo.frequency.value = 0.35;
      var lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      var og = ctx.createGain();
      og.gain.value = 0.02;
      osc.connect(og);
      og.connect(buses.train.gain);
      osc.start();
      lfo.start();
    })();

    // Fan — steady mid noise whir
    (function () {
      var src = createNoiseSource(longNoise, true);
      var bp = bandpassNoise(src, 450, 4);
      var g = ctx.createGain();
      g.gain.value = 0.18;
      bp.connect(g);
      g.connect(buses.fan.gain);
      src.start();

      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 120;
      var og = ctx.createGain();
      og.gain.value = 0.008;
      osc.connect(og);
      og.connect(buses.fan.gain);
      osc.start();
    })();

    // Street — soft broadband bed
    (function () {
      var src = createNoiseSource(longNoise, true);
      var bp = bandpassNoise(src, 800, 0.8);
      var g = ctx.createGain();
      g.gain.value = 0.1;
      bp.connect(g);
      g.connect(buses.street.gain);
      src.start();
    })();

    // Chai — quiet kettle hiss bed (pour is one-shot)
    (function () {
      var src = createNoiseSource(longNoise, true);
      var bp = bandpassNoise(src, 2400, 1.2);
      var g = ctx.createGain();
      g.gain.value = 0.05;
      bp.connect(g);
      g.connect(buses.chai.gain);
      src.start();
    })();
  }

  /**
   * @param {string} channel
   * @param {number} percent 0–100
   */
  function setLevel(channel, percent) {
    ensureContext();
    if (!buses[channel]) return;
    var p = Math.max(0, Math.min(100, Number(percent) || 0));
    buses[channel].level = p;
    var target = muted ? 0 : p / 100;
    var g = buses[channel].gain.gain;
    if (ctx) {
      g.cancelScheduledValues(ctx.currentTime);
      g.linearRampToValueAtTime(target, ctx.currentTime + 0.15);
    }
  }

  function setLevels(map) {
    Object.keys(map).forEach(function (k) {
      setLevel(k, map[k]);
    });
  }

  function setMuted(value) {
    muted = !!value;
    CHANNELS.forEach(function (c) {
      setLevel(c, buses[c] ? buses[c].level : 0);
    });
    if (master && ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.7, ctx.currentTime + 0.1);
    }
  }

  function isMuted() {
    return muted;
  }

  async function unlock() {
    var c = ensureContext();
    if (!c) return false;
    if (c.state === 'suspended') {
      try {
        await c.resume();
      } catch (e) {
        return false;
      }
    }
    startLoops();
    return true;
  }

  /** One-shot pour / spoon — original synthesis */
  function playChaiPour() {
    if (!ctx || muted) return;
    var t = ctx.currentTime;
    var noise = createNoiseSource(noiseBuffer(0.8), false);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.25 * (buses.chai.level / 100 || 0.4), t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    noise.connect(bp);
    bp.connect(g);
    g.connect(buses.chai.gain);
    noise.start(t);
    noise.stop(t + 0.75);

    // Glass clink
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.25);
    var og = ctx.createGain();
    og.gain.setValueAtTime(0.001, t + 0.05);
    og.gain.exponentialRampToValueAtTime(0.08, t + 0.07);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(og);
    og.connect(buses.chai.gain);
    osc.start(t + 0.05);
    osc.stop(t + 0.4);
  }

  /** Soft train horn one-shot */
  function playTrainHorn() {
    if (!ctx || muted) return;
    var t = ctx.currentTime;
    var level = (buses.train.level / 100) * 0.12;
    if (level < 0.01) level = 0.04;

    [280, 320].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      var g = ctx.createGain();
      var start = t + i * 0.15;
      g.gain.setValueAtTime(0.001, start);
      g.gain.exponentialRampToValueAtTime(level, start + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, start + 1.8);
      osc.connect(lp);
      lp.connect(g);
      g.connect(buses.train.gain);
      osc.start(start);
      osc.stop(start + 2);
    });
  }

  /** Scooter / auto pass whoosh */
  function playPassBy(kind) {
    if (!ctx || muted) return;
    var t = ctx.currentTime;
    var bus = kind === 'auto' ? buses.traffic : buses.street;
    var level = (bus.level / 100) * 0.2;
    if (level < 0.02) level = 0.05;

    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(kind === 'auto' ? 90 : 140, t);
    osc.frequency.exponentialRampToValueAtTime(kind === 'auto' ? 60 : 100, t + 1.8);

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.9);
    bp.frequency.exponentialRampToValueAtTime(300, t + 2);

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    osc.connect(bp);
    bp.connect(g);
    g.connect(bus.gain);
    osc.start(t);
    osc.stop(t + 2.3);
  }

  /** Distant dog bark — short noise blip, original */
  function playDogBark() {
    if (!ctx || muted) return;
    var t = ctx.currentTime;
    var noise = createNoiseSource(noiseBuffer(0.25), false);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 3;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.12 * (buses.street.level / 100 || 0.3), t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noise.connect(bp);
    bp.connect(g);
    g.connect(buses.street.gain);
    noise.start(t);
    noise.stop(t + 0.22);
  }

  /** Shop shutter rumble */
  function playShutter() {
    if (!ctx || muted) return;
    var t = ctx.currentTime;
    var noise = createNoiseSource(noiseBuffer(1.2), false);
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.1 * (buses.street.level / 100 || 0.3), t + 0.1);
    g.gain.linearRampToValueAtTime(0.001, t + 1.1);
    noise.connect(lp);
    lp.connect(g);
    g.connect(buses.street.gain);
    noise.start(t);
    noise.stop(t + 1.15);
  }

  global.ChaiAmbience = Object.freeze({
    unlock: unlock,
    setLevel: setLevel,
    setLevels: setLevels,
    setMuted: setMuted,
    isMuted: isMuted,
    playChaiPour: playChaiPour,
    playTrainHorn: playTrainHorn,
    playPassBy: playPassBy,
    playDogBark: playDogBark,
    playShutter: playShutter,
    CHANNELS: CHANNELS,
  });
})(window);
