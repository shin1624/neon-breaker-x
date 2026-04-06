// ============================================================
// Block.js — Block entity with 15 types
// ============================================================
import {
  BLOCK_TYPES, BLOCK_COLORS, BLOCK_HP, BLOCK_SCORE,
  COLORS, CANVAS_WIDTH,
} from '../config/constants.js';

export default class Block {
  /**
   * @param {string} type   BLOCK_TYPES value
   * @param {number} col
   * @param {number} row
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  constructor(type, col, row, x, y, w, h) {
    this.type  = type;
    this.col   = col;
    this.row   = row;
    this.x     = x;
    this.y     = y;
    this.width  = w;
    this.height = h;

    this.maxHp = BLOCK_HP[type] ?? 1;
    this.hp    = this.maxHp;
    this.score = BLOCK_SCORE[type] ?? 100;
    this.alive = true;

    this.color = BLOCK_COLORS[type] ?? COLORS.NEON_CYAN;

    // Per-type state
    this._regenTimer   = 0;       // REGEN
    this._moveDir      = 1;       // MOVING / BOMB
    this._moveSpeed    = 55;      // MOVING
    this._rainbowHue   = Math.random() * 360;
    this._glowPulse    = Math.random() * Math.PI * 2;
    this._hitFlash     = 0;       // flash on hit (0-1)
  }

  get centerX() { return this.x + this.width  / 2; }
  get centerY() { return this.y + this.height / 2; }

  // ── Update ────────────────────────────────────────────────

  update(dt) {
    if (!this.alive) return;

    this._glowPulse += dt * 2.5;
    if (this._hitFlash > 0) this._hitFlash = Math.max(0, this._hitFlash - dt * 5);

    switch (this.type) {
      case BLOCK_TYPES.REGEN:
        this._regenTimer += dt;
        if (this._regenTimer >= 3 && this.hp < this.maxHp) {
          this.hp++;
          this._regenTimer = 0;
        }
        break;

      case BLOCK_TYPES.MOVING:
        this.x += this._moveDir * this._moveSpeed * dt;
        if (this.x <= 0) { this.x = 0; this._moveDir = 1; }
        if (this.x + this.width >= CANVAS_WIDTH) { this.x = CANVAS_WIDTH - this.width; this._moveDir = -1; }
        break;

      case BLOCK_TYPES.RAINBOW:
        this._rainbowHue = (this._rainbowHue + 120 * dt) % 360;
        this.color = `hsl(${this._rainbowHue},100%,60%)`;
        break;
    }
  }

  /**
   * Apply one hit to this block.
   * @param {boolean} piercing
   * @param {boolean} fire
   * @returns {{ destroyed: boolean, special: string|null }}
   */
  hit(piercing = false, fire = false) {
    if (!this.alive) return { destroyed: false, special: null };
    if (this.type === BLOCK_TYPES.BARRIER && !piercing) {
      return { destroyed: false, special: 'barrier_bounce' };
    }
    if (this.type === BLOCK_TYPES.GHOST && Math.random() < 0.30) {
      return { destroyed: false, special: 'ghost_pass' };
    }

    this._hitFlash = 1;
    this.hp -= 1;

    if (this.hp <= 0) {
      this.alive = false;
      return { destroyed: true, special: this._getDestroySpecial() };
    }
    return { destroyed: false, special: this._getHitSpecial() };
  }

  _getDestroySpecial() {
    switch (this.type) {
      case BLOCK_TYPES.EXPLOSIVE: return 'explode_3x3';
      case BLOCK_TYPES.BOMB:      return 'explode_5x5';
      case BLOCK_TYPES.CRYSTAL:   return 'drop_powerup';
      case BLOCK_TYPES.ELECTRIC:  return 'electric';
      case BLOCK_TYPES.RAINBOW:   return 'rainbow_bonus';
      default: return null;
    }
  }

  _getHitSpecial() {
    switch (this.type) {
      case BLOCK_TYPES.ELECTRIC: return 'electric_redirect';
      case BLOCK_TYPES.MIRROR:   return 'mirror_reflect';
      case BLOCK_TYPES.FROZEN:   return 'freeze_ball';
      default: return null;
    }
  }

  // ── Draw ──────────────────────────────────────────────────

  draw(ctx) {
    if (!this.alive) return;

    const { x, y, width: w, height: h } = this;
    const pulse = 0.6 + 0.4 * Math.sin(this._glowPulse);
    const col   = this.color;

    ctx.save();

    // Hit flash overlay
    if (this._hitFlash > 0) {
      ctx.fillStyle   = `rgba(255,255,255,${this._hitFlash * 0.7})`;
      ctx.shadowBlur  = 0;
      ctx.fillRect(x, y, w, h);
    }

    // Main glow
    ctx.shadowBlur  = 10 * pulse;
    ctx.shadowColor = col;

    // Body gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, col);
    grad.addColorStop(1, this._darken(col, 0.4));
    ctx.fillStyle = grad;

    this._roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 3);
    ctx.fill();

    // Border
    ctx.shadowBlur   = 0;
    ctx.strokeStyle  = col;
    ctx.lineWidth    = 1;
    this._roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 3);
    ctx.stroke();

    // Type-specific extras
    this._drawExtra(ctx);

    // HP bar for multi-hit blocks
    if (this.maxHp > 1 && this.type !== BLOCK_TYPES.BARRIER) {
      const ratio = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 2, y + h - 5, w - 4, 3);
      ctx.fillStyle = ratio > 0.5 ? COLORS.NEON_GREEN : ratio > 0.25 ? COLORS.NEON_YELLOW : COLORS.NEON_RED;
      ctx.fillRect(x + 2, y + h - 5, (w - 4) * ratio, 3);
    }

    ctx.restore();
  }

  _drawExtra(ctx) {
    const { x, y, width: w, height: h } = this;
    const cx = x + w / 2;
    const cy = y + h / 2;

    switch (this.type) {
      case BLOCK_TYPES.EXPLOSIVE:
        ctx.fillStyle   = COLORS.NEON_RED;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = COLORS.NEON_RED;
        ctx.font        = `bold ${h * 0.55}px monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText('💥', cx, cy);
        break;
      case BLOCK_TYPES.BOMB:
        ctx.fillStyle   = '#ff0000';
        ctx.font        = `bold ${h * 0.6}px monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText('💣', cx, cy);
        break;
      case BLOCK_TYPES.CRYSTAL:
        ctx.fillStyle   = COLORS.NEON_PURPLE;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = COLORS.NEON_PURPLE;
        ctx.font        = `bold ${h * 0.6}px monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText('💎', cx, cy);
        break;
      case BLOCK_TYPES.ELECTRIC:
        ctx.strokeStyle  = COLORS.NEON_YELLOW;
        ctx.lineWidth    = 1.5;
        ctx.shadowBlur   = 5;
        ctx.shadowColor  = COLORS.NEON_YELLOW;
        ctx.beginPath();
        ctx.moveTo(cx - 4, y + 3);
        ctx.lineTo(cx + 1, cy);
        ctx.lineTo(cx - 2, cy);
        ctx.lineTo(cx + 4, y + h - 3);
        ctx.stroke();
        break;
      case BLOCK_TYPES.FROZEN:
        ctx.fillStyle   = '#88ddff';
        ctx.font        = `${h * 0.6}px monospace`;
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        ctx.fillText('❄', cx, cy);
        break;
      case BLOCK_TYPES.BARRIER:
        ctx.strokeStyle = '#aaaacc';
        ctx.lineWidth   = 1;
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x, y + h * i / 3);
          ctx.lineTo(x + w, y + h * i / 3);
          ctx.stroke();
        }
        break;
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /** Darken a hex colour by factor (0-1). */
  _darken(hex, factor) {
    if (!hex.startsWith('#')) return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = Math.floor(((n >> 16) & 0xff) * (1 - factor));
    const g = Math.floor(((n >>  8) & 0xff) * (1 - factor));
    const b = Math.floor(( n        & 0xff) * (1 - factor));
    return `rgb(${r},${g},${b})`;
  }
}
