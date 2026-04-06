// ============================================================
// Paddle.js — Player paddle with effects and input handling
// ============================================================
import {
  CANVAS_WIDTH, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_Y,
  PADDLE_SPEED, COLORS,
} from '../config/constants.js';

export default class Paddle {
  constructor() {
    this.baseWidth = PADDLE_WIDTH;
    this.width     = PADDLE_WIDTH;
    this.height    = PADDLE_HEIGHT;
    this.x         = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    this.y         = PADDLE_Y;

    // Effect flags (managed by PowerUpSystem)
    this.magnetic = false;
    this.shielded = false; // bottom shield active
    this.shieldY  = 0;     // shield bar Y

    // Laser state
    this.laserActive  = false;
    this.laserTimer   = 0;
    this.laserCooldown = 0;

    // Width multiplier from upgrades / powerups
    this._widthMult = 1;

    // Visual pulse
    this._pulse = 0;
  }

  get centerX() { return this.x + this.width / 2; }

  /** Update paddle position from input. */
  update(dt, inputSystem) {
    this._pulse += dt * 3;

    // Mouse / touch sets position
    if (inputSystem.mouseActive) {
      this.x = inputSystem.mouseX - this.width / 2;
    }
    // Keyboard ALWAYS works (additive on top of mouse)
    if (inputSystem.isDown('ArrowLeft') || inputSystem.isDown('KeyA')) {
      this.x -= PADDLE_SPEED * dt;
      inputSystem.mouseActive = false; // キー押下時はマウス優先を解除
    }
    if (inputSystem.isDown('ArrowRight') || inputSystem.isDown('KeyD')) {
      this.x += PADDLE_SPEED * dt;
      inputSystem.mouseActive = false;
    }

    // Clamp
    this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.x));

    // Laser cooldown
    if (this.laserCooldown > 0) this.laserCooldown -= dt;
  }

  /**
   * Apply width multiplier (from powerups + upgrades).
   * Call whenever either changes.
   * @param {number} mult  e.g. 1.5
   */
  applyWidthMult(mult) {
    this._widthMult = mult;
    this.width = Math.round(this.baseWidth * mult);
  }

  draw(ctx) {
    const mid   = this.x + this.width / 2;
    const cy    = this.y + this.height / 2;
    const pulse = 0.7 + 0.3 * Math.sin(this._pulse);

    ctx.save();

    // Glow
    ctx.shadowBlur  = 18 * pulse;
    ctx.shadowColor = this.shielded ? COLORS.NEON_CYAN : COLORS.NEON_GREEN;

    // Body gradient
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, this.shielded ? '#00ffff' : '#00ff88');
    grad.addColorStop(1, this.shielded ? '#005577' : '#005533');
    ctx.fillStyle = grad;

    // Rounded rect
    const r = this.height / 2;
    ctx.beginPath();
    ctx.moveTo(this.x + r, this.y);
    ctx.lineTo(this.x + this.width - r, this.y);
    ctx.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + this.height, r);
    ctx.lineTo(this.x + r, this.y + this.height);
    ctx.arcTo(this.x, this.y + this.height, this.x, this.y, r);
    ctx.closePath();
    ctx.fill();

    // Centre highlight line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + 8, cy);
    ctx.lineTo(this.x + this.width - 8, cy);
    ctx.stroke();

    // Magnetic field indicator
    if (this.magnetic) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = COLORS.NEON_PURPLE;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = COLORS.NEON_PURPLE;
      ctx.beginPath();
      ctx.ellipse(mid, cy, this.width * 0.7, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shield bar
    if (this.shielded) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = COLORS.NEON_CYAN;
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 12;
      ctx.shadowColor = COLORS.NEON_CYAN;
      const sy = this.y + this.height + 10;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(CANVAS_WIDTH, sy);
      ctx.stroke();
    }

    ctx.restore();
  }
}
