// ============================================================
// PowerUp.js — Falling power-up capsule
// ============================================================
import { POWERUP_TYPES, POWERUP_COLORS, POWERUP_LABELS } from '../config/constants.js';

const FALL_SPEED = 120; // px/s

export default class PowerUp {
  /**
   * @param {string} type  POWERUP_TYPES value
   * @param {number} x
   * @param {number} y
   */
  constructor(type, x, y) {
    this.type   = type;
    this.x      = x;
    this.y      = y;
    this.width  = 28;
    this.height = 20;
    this.active = true;

    this.color = POWERUP_COLORS[type] ?? '#ffffff';
    this.label = POWERUP_LABELS[type] ?? '??';

    this._pulse = Math.random() * Math.PI * 2;
    this._wobble = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.y      += FALL_SPEED * dt;
    this._pulse  += dt * 4;
    this._wobble += dt * 2.5;
  }

  /** Check if this powerup has fallen off screen. */
  get offScreen() {
    return this.y > 620;
  }

  draw(ctx) {
    if (!this.active) return;

    const { x, y, width: w, height: h, color } = this;
    const cx    = x + w / 2;
    const cy    = y + h / 2;
    const pulse = 0.7 + 0.3 * Math.sin(this._pulse);
    const wobble= Math.sin(this._wobble) * 2;

    ctx.save();

    // Outer glow
    ctx.shadowBlur  = 14 * pulse;
    ctx.shadowColor = color;

    // Capsule background
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this._capsule(ctx, x + wobble * 0.3, y, w, h, h / 2);
    ctx.fill();

    // Capsule border
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    this._capsule(ctx, x + wobble * 0.3, y, w, h, h / 2);
    ctx.stroke();

    // Label
    ctx.shadowBlur   = 0;
    ctx.fillStyle    = color;
    ctx.font         = `bold 10px 'Courier New', monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, cx + wobble * 0.3, cy);

    ctx.restore();
  }

  _capsule(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.closePath();
  }
}
