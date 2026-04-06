// ============================================================
// MusicSystem.js — Procedural dynamic music via Web Audio API
// ============================================================

const SCALES = {
  pentatonic: [0, 2, 4, 7, 9],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  major:      [0, 2, 4, 5, 7, 9, 11],
  chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
};

const ROOT_FREQ = 110; // A2

function noteFreq(semitone) {
  return ROOT_FREQ * Math.pow(2, semitone / 12);
}

export default class MusicSystem {
  /**
   * @param {AudioSystem} audioSystem
   */
  constructor(audioSystem) {
    this._audio  = audioSystem;
    this._ctx    = null;
    this._master = null;

    this._playing = false;
    this._tempo   = 120; // BPM
    this._beat    = 0;
    this._scale   = SCALES.pentatonic;

    this._bassNote     = 0;
    this._leadNote     = 4;
    this._harmonyNote  = 7;

    this._nextBeatTime = 0;
    this._timerId      = null;

    this.musicVolume = 0.25;

    // Track volumes
    this._bassVol    = 0.18;
    this._leadVol    = 0.12;
    this._harmVol    = 0.08;
    this._drumVol    = 0.14;

    // State
    this._mode = 'normal'; // 'normal' | 'boss' | 'intense'
  }

  /** Call after AudioSystem.init() */
  start() {
    if (!this._audio._initialized) return;
    if (this._playing) return;
    this._ctx    = this._audio.ctx;
    this._master = this._ctx.createGain();
    this._master.gain.setValueAtTime(this.musicVolume, this._ctx.currentTime);
    this._master.connect(this._ctx.destination);

    this._playing      = true;
    this._nextBeatTime = this._ctx.currentTime + 0.1;
    this._schedule();
  }

  stop() {
    this._playing = false;
    if (this._timerId) clearTimeout(this._timerId);
    if (this._master) {
      try { this._master.disconnect(); } catch {}
      this._master = null;
    }
  }

  setMode(mode) {
    this._mode = mode;
    switch (mode) {
      case 'boss':    this._tempo = 160; this._scale = SCALES.minor;      break;
      case 'intense': this._tempo = 180; this._scale = SCALES.chromatic;  break;
      case 'victory': this._tempo = 140; this._scale = SCALES.major;      break;
      default:        this._tempo = 120; this._scale = SCALES.pentatonic;  break;
    }
  }

  /** Boost music energy (combo feedback). */
  boost() {
    if (!this._master) return;
    const now = this._ctx.currentTime;
    this._master.gain.cancelScheduledValues(now);
    this._master.gain.setValueAtTime(this.musicVolume * 1.6, now);
    this._master.gain.linearRampToValueAtTime(this.musicVolume, now + 2);
  }

  _schedule() {
    if (!this._playing || !this._ctx) return;

    const secondsPerBeat = 60 / this._tempo;
    const lookAhead      = 0.2; // schedule 200ms ahead

    while (this._nextBeatTime < this._ctx.currentTime + lookAhead) {
      this._scheduleBeat(this._nextBeatTime);
      this._beat++;
      this._nextBeatTime += secondsPerBeat;
    }

    this._timerId = setTimeout(() => this._schedule(), 50);
  }

  _scheduleBeat(time) {
    const beat = this._beat % 16;

    // Bass — every beat
    if (beat % 4 === 0) {
      const idx = this._scale[this._bassNote % this._scale.length];
      this._playNote(noteFreq(idx), time, 0.35, 'triangle', this._bassVol * this.musicVolume);
      this._bassNote = (this._bassNote + (beat === 0 ? 5 : 2)) % this._scale.length;
    }

    // Lead melody — every 2 beats, offbeat
    if (beat % 2 === 1) {
      const idx = this._scale[this._leadNote % this._scale.length];
      this._playNote(noteFreq(idx + 12), time, 0.25, 'sine', this._leadVol * this.musicVolume);
      this._leadNote = (this._leadNote + [1, 2, 1, 3][beat % 4]) % this._scale.length;
    }

    // Harmony — every 8 beats
    if (beat % 8 === 4) {
      const idx = this._scale[this._harmonyNote % this._scale.length];
      this._playNote(noteFreq(idx + 7), time, 0.45, 'sine', this._harmVol * this.musicVolume);
      this._harmonyNote = (this._harmonyNote + 3) % this._scale.length;
    }

    // Drums
    if (beat % 4 === 0) this._playKick(time);
    if (beat % 4 === 2) this._playSnare(time);
    if (beat % 2 === 1) this._playHihat(time);
  }

  _playNote(freq, time, duration, type, vol) {
    if (!this._ctx || !this._master) return;
    try {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain);
      gain.connect(this._master);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  _playKick(time) {
    if (!this._ctx || !this._master) return;
    try {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.connect(gain);
      gain.connect(this._master);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);

      const v = this._drumVol * this.musicVolume;
      gain.gain.setValueAtTime(v, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.start(time);
      osc.stop(time + 0.25);
    } catch {}
  }

  _playSnare(time) {
    if (!this._ctx || !this._master) return;
    try {
      const buf  = this._ctx.createBuffer(1, this._ctx.sampleRate * 0.1, this._ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const src  = this._ctx.createBufferSource();
      const gain = this._ctx.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(this._master);

      const v = this._drumVol * 0.5 * this.musicVolume;
      gain.gain.setValueAtTime(v, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      src.start(time);
    } catch {}
  }

  _playHihat(time) {
    if (!this._ctx || !this._master) return;
    try {
      const buf  = this._ctx.createBuffer(1, this._ctx.sampleRate * 0.04, this._ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

      const src    = this._ctx.createBufferSource();
      const filter = this._ctx.createBiquadFilter();
      const gain   = this._ctx.createGain();

      filter.type            = 'highpass';
      filter.frequency.value = 8000;

      src.buffer = buf;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this._master);

      const v = this._drumVol * 0.3 * this.musicVolume;
      gain.gain.setValueAtTime(v, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      src.start(time);
    } catch {}
  }

  setVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this._master) {
      this._master.gain.setValueAtTime(this.musicVolume, this._ctx.currentTime);
    }
  }
}
