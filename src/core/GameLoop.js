// ============================================================
// GameLoop.js — Fixed-timestep game loop with timeScale support
// ============================================================
import { FIXED_DT, MAX_ACCUMULATOR } from '../config/constants.js';

export default class GameLoop {
  /**
   * @param {Function} update  fn(fixedDt)
   * @param {Function} draw    fn(interpolation)
   */
  constructor(update, draw) {
    this._update = update;
    this._draw   = draw;

    this._rafId       = null;
    this._lastTime    = null;
    this._accumulator = 0;

    /** Slow-motion multiplier (1 = normal, 0.5 = half speed). */
    this.timeScale = 1;

    this._running = false;
    this._boundTick = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running  = true;
    this._lastTime = performance.now();
    this._rafId    = requestAnimationFrame(this._boundTick);
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick(timestamp) {
    if (!this._running) return;

    const rawDelta = Math.min((timestamp - this._lastTime) / 1000, MAX_ACCUMULATOR);
    this._lastTime = timestamp;

    // Apply time scale
    this._accumulator += rawDelta * this.timeScale;

    while (this._accumulator >= FIXED_DT) {
      this._update(FIXED_DT);
      this._accumulator -= FIXED_DT;
    }

    const interp = this._accumulator / FIXED_DT;
    this._draw(interp);

    this._rafId = requestAnimationFrame(this._boundTick);
  }
}
