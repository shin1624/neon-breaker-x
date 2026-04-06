// ============================================================
// Boss.js — 3-phase boss with projectile patterns
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';

// A boss projectile
class Projectile {
  constructor(x, y, vx, vy, color = COLORS.NEON_RED) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color  = color;
    this.radius = 5;
    this.active = true;
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT + 20) {
      this.active = false;
    }
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.shadowBlur  = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle   = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export default class Boss {
  constructor(level = 1) {
    this.level = level;

    // Scale HP with level
    this.maxHp = 150 + level * 30;
    this.hp    = this.maxHp;

    this.width  = 120;
    this.height = 55;
    this.x      = CANVAS_WIDTH / 2 - this.width / 2;
    this.y      = 55;

    this.alive  = true;

    // Movement
    this._moveDir  = 1;
    this._moveSpeed = 80 + level * 8;

    // Attack timers
    this._attackTimer = 0;
    this._attackRate  = 1.4;   // seconds between attacks
    this._angle       = 0;     // rotating angle for phase2

    // Shield (phase 2)
    this.shielded     = false;
    this._shieldTimer = 0;

    this.projectiles  = [];
    this._pulse       = 0;
    this._hitFlash    = 0;
  }

  // Phase: 0→phase1  hp>66%   1→phase2 66-33%   2→phase3 <33%
  get phase() {
    const ratio = this.hp / this.maxHp;
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 2;
    return 3;
  }

  update(dt) {
    if (!this.alive) return;
    this._pulse += dt * 3;
    if (this._hitFlash > 0) this._hitFlash = Math.max(0, this._hitFlash - dt * 4);

    // Movement
    this.x += this._moveDir * this._moveSpeed * dt;
    if (this.x <= 10) { this.x = 10; this._moveDir = 1; }
    if (this.x + this.width >= CANVAS_WIDTH - 10) { this.x = CANVAS_WIDTH - 10 - this.width; this._moveDir = -1; }

    // Shield timer (phase 2)
    if (this.phase >= 2) {
      this._shieldTimer += dt;
      this.shielded = Math.sin(this._shieldTimer * 1.2) > 0;
    } else {
      this.shielded = false;
    }

    // Attack
    this._attackTimer += dt;
    const rate = this._attackRate * (this.phase === 3 ? 0.55 : this.phase === 2 ? 0.75 : 1);
    if (this._attackTimer >= rate) {
      this._attackTimer = 0;
      this._firePattern();
    }
    this._angle += dt * 1.8;

    // Update projectiles
    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => p.active);
  }

  _firePattern() {
    const cx = this.x + this.width  / 2;
    const cy = this.y + this.height;

    switch (this.phase) {
      case 1: this._fanShot(cx, cy, 5, 180, 200); break;
      case 2: this._rotatingShot(cx, cy, 8, 220); break;
      case 3: this._allDirections(cx, cy, 12, 280); break;
    }
  }

  _fanShot(cx, cy, count, spreadDeg, speed) {
    const startAngle = 90 - (spreadDeg / 2);
    for (let i = 0; i < count; i++) {
      const deg = startAngle + (spreadDeg / (count - 1)) * i;
      const rad = deg * Math.PI / 180;
      this.projectiles.push(new Projectile(cx, cy, Math.cos(rad) * speed, Math.sin(rad) * speed, COLORS.NEON_RED));
    }
  }

  _rotatingShot(cx, cy, count, speed) {
    for (let i = 0; i < count; i++) {
      const rad = (i / count) * Math.PI * 2 + this._angle;
      this.projectiles.push(new Projectile(cx, cy, Math.cos(rad) * speed, Math.sin(rad) * speed, COLORS.NEON_ORANGE));
    }
  }

  _allDirections(cx, cy, count, speed) {
    for (let i = 0; i < count; i++) {
      const rad = (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(cx, cy, Math.cos(rad) * speed, Math.sin(rad) * speed, COLORS.NEON_PINK));
    }
  }

  /**
   * Hit the boss with one ball.
   * @returns {boolean} was destroyed?
   */
  hit(piercing = false) {
    if (this.shielded && !piercing) return false;
    this._hitFlash = 1;
    this.hp -= 10;
    if (this.hp <= 0) {
      this.hp    = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) return;

    const { x, y, width: w, height: h } = this;
    const pulse = 0.7 + 0.3 * Math.sin(this._pulse);
    const phaseColors = [null, COLORS.NEON_RED, COLORS.NEON_ORANGE, COLORS.NEON_PINK];
    const col = phaseColors[this.phase];

    ctx.save();

    // Hit flash
    if (this._hitFlash > 0) {
      ctx.globalAlpha = 0.4 * this._hitFlash;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
      ctx.globalAlpha = 1;
    }

    // Main body glow
    ctx.shadowBlur  = 22 * pulse;
    ctx.shadowColor = col;

    // Body
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, col);
    grad.addColorStop(0.5, this._darken(col, 0.3));
    grad.addColorStop(1, this._darken(col, 0.6));
    ctx.fillStyle = grad;

    this._hexPath(ctx, x, y, w, h);
    ctx.fill();

    // Border
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2;
    this._hexPath(ctx, x, y, w, h);
    ctx.stroke();

    // Eyes
    const eyeY = y + h * 0.35;
    const eyeR = 7;
    for (const ex of [x + w * 0.3, x + w * 0.7]) {
      ctx.fillStyle   = '#ffffff';
      ctx.shadowBlur  = 10;
      ctx.shadowColor = col;
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(ex + Math.sin(this._pulse) * 2, eyeY, eyeR * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase label
    ctx.shadowBlur   = 0;
    ctx.fillStyle    = 'rgba(255,255,255,0.8)';
    ctx.font         = 'bold 11px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`PHASE ${this.phase}`, x + w / 2, y + h * 0.72);

    // Shield aura
    if (this.shielded) {
      ctx.globalAlpha  = 0.4;
      ctx.strokeStyle  = COLORS.NEON_CYAN;
      ctx.lineWidth    = 3;
      ctx.shadowBlur   = 16;
      ctx.shadowColor  = COLORS.NEON_CYAN;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w * 0.7, h * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar
    const barW  = w;
    const ratio = this.hp / this.maxHp;
    ctx.globalAlpha = 1;
    ctx.fillStyle   = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, y - 14, barW, 8);
    ctx.fillStyle   = ratio > 0.5 ? COLORS.NEON_GREEN : ratio > 0.25 ? COLORS.NEON_YELLOW : COLORS.NEON_RED;
    ctx.fillRect(x, y - 14, barW * ratio, 8);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x, y - 14, barW, 8);

    ctx.restore();

    // Projectiles
    for (const p of this.projectiles) p.draw(ctx);
  }

  _hexPath(ctx, x, y, w, h) {
    const inset = 12;
    ctx.beginPath();
    ctx.moveTo(x + inset, y);
    ctx.lineTo(x + w - inset, y);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.lineTo(x + w - inset, y + h);
    ctx.lineTo(x + inset, y + h);
    ctx.lineTo(x, y + h * 0.5);
    ctx.closePath();
  }

  _darken(hex, f) {
    if (!hex.startsWith('#')) return hex;
    const n = parseInt(hex.slice(1), 16);
    const r = Math.floor(((n >> 16) & 0xff) * (1 - f));
    const g = Math.floor(((n >>  8) & 0xff) * (1 - f));
    const b = Math.floor(( n        & 0xff) * (1 - f));
    return `rgb(${r},${g},${b})`;
  }
}
