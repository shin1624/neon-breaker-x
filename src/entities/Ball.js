// ============================================================
// Ball.js — Ball entity with trail, neon glow, and effects
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, BALL_SPEED, COLORS } from '../config/constants.js';

export default class Ball {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} [vx]
   * @param {number} [vy]
   */
  constructor(x, y, vx = 0, vy = -BALL_SPEED) {
    this.x  = x;
    this.y  = y;
    this.vx = vx;
    this.vy = vy;

    this.radius   = BALL_RADIUS;
    this.active   = true;
    this.onPaddle = false; // waiting on paddle before launch

    // Visual trail — array of {x,y}
    this.trail = [];
    this.maxTrail = 14;

    // Special states
    this.piercing  = false;
    this.fire      = false;
    this.ghost     = false;   // passes through blocks (ghost block exception handled elsewhere)
    this.bombNext  = false;   // explodes on next block hit

    // Slow timer (from FROZEN blocks)
    this._slowTimer = 0;

    // Colour (can be overridden for effects)
    this.color = COLORS.NEON_CYAN;
  }

  // ── Update ────────────────────────────────────────────────

  update(dt) {
    if (!this.active) return;

    // Update slow timer
    if (this._slowTimer > 0) {
      this._slowTimer -= dt;
    }

    if (this.onPaddle) return;

    const speedMult = this._slowTimer > 0 ? 0.45 : 1;

    this.x += this.vx * dt * speedMult;
    this.y += this.vy * dt * speedMult;

    // Wall bounces (left / right / top)
    if (this.x - this.radius < 0) {
      this.x  = this.radius;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius > CANVAS_WIDTH) {
      this.x  = CANVAS_WIDTH - this.radius;
      this.vx = -Math.abs(this.vx);
    }
    if (this.y - this.radius < 0) {
      this.y  = this.radius;
      this.vy = Math.abs(this.vy);
    }

    // Bottom — ball lost
    if (this.y - this.radius > CANVAS_HEIGHT) {
      this.active = false;
    }

    // Record trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }
  }

  /** Apply a slow effect for [duration] seconds. */
  applySlow(duration) {
    this._slowTimer = Math.max(this._slowTimer, duration);
  }

  /** Normalise speed to [target] px/s. */
  normaliseSpeed(target) {
    const spd = Math.hypot(this.vx, this.vy);
    if (spd === 0) return;
    this.vx = (this.vx / spd) * target;
    this.vy = (this.vy / spd) * target;
  }

  /** Get current speed. */
  get speed() { return Math.hypot(this.vx, this.vy); }

  // ── Draw ──────────────────────────────────────────────────

  draw(ctx) {
    if (!this.active) return;

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t     = i / this.trail.length;
      const alpha = t * 0.6;
      const r     = this.radius * (0.3 + t * 0.6);
      const pt    = this.trail[i];

      ctx.save();
      ctx.globalAlpha  = alpha;
      ctx.shadowBlur   = 8;
      ctx.shadowColor  = this.fire ? COLORS.NEON_ORANGE : this.color;
      ctx.fillStyle    = this.fire ? COLORS.NEON_ORANGE : this.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Main ball glow
    ctx.save();
    const col = this._getBallColor();
    ctx.shadowBlur  = 20;
    ctx.shadowColor = col;
    ctx.fillStyle   = col;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.shadowBlur   = 0;
    ctx.globalAlpha  = 0.6;
    ctx.fillStyle    = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.25, this.y - this.radius * 0.25, this.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _getBallColor() {
    if (this.fire)     return COLORS.NEON_ORANGE;
    if (this.ghost)    return '#aaaacc';
    if (this.piercing) return COLORS.NEON_PINK;
    if (this.bombNext) return COLORS.NEON_RED;
    return COLORS.NEON_CYAN;
  }
}
