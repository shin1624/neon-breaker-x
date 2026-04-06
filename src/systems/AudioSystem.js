// ============================================================
// AudioSystem.js — Web Audio API sound effects
// ============================================================
import { BLOCK_TYPES } from '../config/constants.js';

export default class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterVolume = 0.7;
    this.sfxVolume    = 0.8;
    this._initialized = false;
  }

  /** Must be called after a user gesture (click/tap). */
  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available', e);
    }
  }

  /** Resume if suspended (browser policy). */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ── Internal synth helpers ─────────────────────────────────

  /**
   * Play a simple tone.
   * @param {number} freq Hz
   * @param {number} duration seconds
   * @param {string} type oscillator type
   * @param {number} vol  0-1
   * @param {number} attack  seconds
   * @param {number} decay   seconds
   */
  _tone(freq, duration, type = 'square', vol = 0.3, attack = 0.01, decay = 0.1) {
    if (!this._initialized || !this.ctx) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type      = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const masterVol = vol * this.masterVolume * this.sfxVolume;
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(masterVol, this.ctx.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + decay);
    } catch {}
  }

  /**
   * Play a frequency sweep.
   */
  _sweep(freqStart, freqEnd, duration, type = 'sawtooth', vol = 0.25) {
    if (!this._initialized || !this.ctx) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);

      const v = vol * this.masterVolume * this.sfxVolume;
      gain.gain.setValueAtTime(v, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + duration + 0.05);
    } catch {}
  }

  // ── Public sound effects ────────────────────────────────────

  playBlockHit(blockType = BLOCK_TYPES.NORMAL) {
    const freqMap = {
      [BLOCK_TYPES.NORMAL]:    440,
      [BLOCK_TYPES.TOUGH]:     330,
      [BLOCK_TYPES.EXPLOSIVE]: 220,
      [BLOCK_TYPES.BARRIER]:   880,
      [BLOCK_TYPES.REGEN]:     528,
      [BLOCK_TYPES.ELECTRIC]:  660,
      [BLOCK_TYPES.MIRROR]:    550,
      [BLOCK_TYPES.MOVING]:    495,
      [BLOCK_TYPES.BOMB]:      110,
      [BLOCK_TYPES.GHOST]:     392,
      [BLOCK_TYPES.DIAMOND]:   740,
      [BLOCK_TYPES.CRYSTAL]:   630,
      [BLOCK_TYPES.STEEL]:     280,
      [BLOCK_TYPES.FROZEN]:    370,
      [BLOCK_TYPES.RAINBOW]:   587,
    };
    this._tone(freqMap[blockType] ?? 440, 0.12, 'square', 0.25);
  }

  playPaddleHit() {
    this._tone(330, 0.08, 'triangle', 0.3);
  }

  playPowerUp() {
    // Ascending arpeggio
    if (!this._initialized || !this.ctx) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.15, 'sine', 0.3), i * 60);
    });
  }

  playExtraLife() {
    const notes = [523, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.2, 'sine', 0.4), i * 80);
    });
  }

  playBossHit() {
    this._sweep(300, 150, 0.2, 'sawtooth', 0.3);
  }

  playExplosion() {
    this._sweep(200, 50, 0.35, 'sawtooth', 0.4);
    setTimeout(() => this._sweep(180, 40, 0.3, 'square', 0.2), 50);
  }

  playLevelComplete() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.3, 'sine', 0.35), i * 100);
    });
  }

  playGameOver() {
    const notes = [440, 349, 294, 220, 165];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.4, 'sawtooth', 0.3), i * 130);
    });
  }

  playCombo(comboCount) {
    // Pitch rises with combo
    const base = 440;
    const semitones = Math.min(comboCount / 5, 12);
    const freq = base * Math.pow(2, semitones / 12);
    this._tone(freq, 0.1, 'square', 0.25);
  }

  playElectric() {
    this._sweep(800, 1200, 0.15, 'sawtooth', 0.2);
  }

  playBallLost() {
    this._sweep(440, 110, 0.5, 'sawtooth', 0.4);
  }

  playBossDefeat() {
    const notes = [330, 440, 550, 660, 880, 1100, 1320];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.35, 'sine', 0.4), i * 70);
    });
  }

  playShopBuy() {
    this._tone(880, 0.12, 'sine', 0.3);
    setTimeout(() => this._tone(1100, 0.12, 'sine', 0.3), 80);
  }

  setMasterVolume(v) { this.masterVolume = Math.max(0, Math.min(1, v)); }
  setSfxVolume(v)    { this.sfxVolume    = Math.max(0, Math.min(1, v)); }
}
