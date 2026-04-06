// ============================================================
// InputSystem.js — Keyboard / Mouse / Touch input
// ============================================================
import { CANVAS_WIDTH } from '../config/constants.js';

export default class InputSystem {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {EventBus} eventBus
   */
  constructor(canvas, eventBus) {
    this._canvas   = canvas;
    this._eventBus = eventBus;

    this._keys     = new Set();
    this._justDown = new Set();
    this._justUp   = new Set();

    this.mouseX      = CANVAS_WIDTH / 2;
    this.mouseActive = false;

    this._touchX    = CANVAS_WIDTH / 2;

    this._bindListeners();
  }

  _bindListeners() {
    // Keyboard
    window.addEventListener('keydown', e => {
      if (!this._keys.has(e.code)) this._justDown.add(e.code);
      this._keys.add(e.code);
      // prevent scroll
      if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      this._keys.delete(e.code);
      this._justUp.add(e.code);
    });

    // Mouse
    this._canvas.addEventListener('mousemove', e => {
      const rect   = this._canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      this.mouseX      = (e.clientX - rect.left) * scaleX;
      this.mouseActive = true;
    });
    this._canvas.addEventListener('mouseleave', () => {
      this.mouseActive = false;
    });
    this._canvas.addEventListener('click', e => {
      e.preventDefault();
      this._eventBus.emit('click', this._getCanvasPos(e));
    });

    // Touch
    this._canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const touch = e.touches[0];
      this._updateTouch(touch);
      this.mouseActive = true;
      this._eventBus.emit('tap', this._getTouchCanvasPos(touch));
    }, { passive: false });

    this._canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const touch = e.touches[0];
      this._updateTouch(touch);
      this.mouseActive = true;
    }, { passive: false });

    this._canvas.addEventListener('touchend', e => {
      e.preventDefault();
    }, { passive: false });
  }

  _getCanvasPos(e) {
    const rect   = this._canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    return { x: (e.clientX - rect.left) * scaleX };
  }

  _getTouchCanvasPos(touch) {
    const rect   = this._canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    return { x: (touch.clientX - rect.left) * scaleX };
  }

  _updateTouch(touch) {
    const rect   = this._canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    this.mouseX  = (touch.clientX - rect.left) * scaleX;
  }

  // ── Per-frame helpers ─────────────────────────────────────

  /** Is key currently held? */
  isDown(code) { return this._keys.has(code); }

  /** Was key just pressed this frame? */
  wasJustPressed(code) { return this._justDown.has(code); }

  /** Was key just released this frame? */
  wasJustReleased(code) { return this._justUp.has(code); }

  /** Call at END of each frame to clear just-pressed sets. */
  flush() {
    this._justDown.clear();
    this._justUp.clear();
  }
}
