// ============================================================
// ComboSystem.js — Combo tracking and score multiplier
// ============================================================

const BASE_TIMEOUT = 3.0; // seconds before combo resets

export default class ComboSystem {
  /**
   * @param {EventBus} eventBus
   * @param {AudioSystem} audio
   */
  constructor(eventBus, audio) {
    this._eventBus = eventBus;
    this._audio    = audio;

    this.comboCount = 0;
    this.maxCombo   = 0;
    this._timer     = 0;
    this._timeout   = BASE_TIMEOUT;

    /** Extra timeout from upgrades (seconds). */
    this.bonusTimeout = 0;
  }

  get timeout() { return BASE_TIMEOUT + this.bonusTimeout; }

  /**
   * Score multiplier: every 5 combos adds 1×, capped at 10×.
   */
  get multiplier() {
    return Math.min(10, 1 + Math.floor(this.comboCount / 5));
  }

  /** Call each time the ball hits a block. */
  onHit() {
    this.comboCount++;
    this._timer = this.timeout;

    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    // Audio feedback — pitch rises every 5 combos
    this._audio.playCombo(this.comboCount);

    // Emit events for visual feedback
    if (this.comboCount >= 5 && this.comboCount % 5 === 0) {
      this._eventBus.emit('combo_milestone', {
        count: this.comboCount,
        multiplier: this.multiplier,
      });
    }
  }

  /** Call when a ball is lost (resets combo). */
  reset() {
    this.comboCount = 0;
    this._timer     = 0;
  }

  update(dt) {
    if (this.comboCount > 0 && this._timer > 0) {
      this._timer -= dt;
      if (this._timer <= 0) {
        this.comboCount = 0;
        this._timer     = 0;
      }
    }
  }

  /**
   * Data for HUD display.
   * @returns {{ count: number, multiplier: number, timerRatio: number }}
   */
  getDisplayInfo() {
    return {
      count:      this.comboCount,
      multiplier: this.multiplier,
      timerRatio: this._timer / this.timeout,
    };
  }
}
