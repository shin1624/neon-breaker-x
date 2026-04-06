// ============================================================
// RenderSystem.js — Background, stars, screen effects
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';

export default class RenderSystem {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {ParticleSystem}           particles
   */
  constructor(ctx, particles) {
    this.ctx       = ctx;
    this.particles = particles;

    // Screen shake
    this._shakeIntensity = 0;
    this._shakeDuration  = 0;
    this._shakeTimer     = 0;
    this._shakeX         = 0;
    this._shakeY         = 0;

    // Flash
    this._flashColor     = '#ffffff';
    this._flashAlpha     = 0;

    // Starfield
    this._stars = this._genStars(110);

    this._scanlineOffset = 0;
    this._time = 0;
  }

  // ── Screen effects ────────────────────────────────────────

  shake(intensity, duration) {
    this._shakeIntensity = Math.max(this._shakeIntensity, intensity);
    this._shakeDuration  = duration;
    this._shakeTimer     = duration;
  }

  flash(color, alpha = 0.35) {
    this._flashColor = color;
    this._flashAlpha = Math.max(this._flashAlpha, alpha);
  }

  // ── Update ────────────────────────────────────────────────

  update(dt) {
    this._time += dt;

    // Stars
    for (const s of this._stars) {
      s.y += s.speed * dt;
      if (s.y > CANVAS_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * CANVAS_WIDTH;
      }
    }

    // Shake
    if (this._shakeTimer > 0) {
      this._shakeTimer -= dt;
      const ratio   = this._shakeTimer / this._shakeDuration;
      const mag     = this._shakeIntensity * ratio;
      this._shakeX  = (Math.random() * 2 - 1) * mag;
      this._shakeY  = (Math.random() * 2 - 1) * mag;
      if (this._shakeTimer <= 0) {
        this._shakeX = 0;
        this._shakeY = 0;
        this._shakeIntensity = 0;
      }
    }

    // Flash fade
    if (this._flashAlpha > 0) {
      this._flashAlpha -= dt * 3;
      if (this._flashAlpha < 0) this._flashAlpha = 0;
    }

    this._scanlineOffset = (this._scanlineOffset + 0.5) % 4;
  }

  // ── Rendering passes ─────────────────────────────────────

  begin() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this._shakeX, this._shakeY);
  }

  end() {
    this.ctx.restore();
    this._drawFlash();
    this._drawScanlines();
  }

  drawBackground() {
    const ctx = this.ctx;

    // Deep space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, '#000018');
    grad.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    for (const s of this._stars) {
      const alpha = 0.3 + s.brightness * 0.7;
      ctx.fillStyle   = `rgba(200,220,255,${alpha})`;
      ctx.shadowBlur  = s.size > 1.5 ? 4 : 0;
      ctx.shadowColor = '#aaddff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.shadowBlur = 0;
  }

  _drawFlash() {
    if (this._flashAlpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = this._flashAlpha;
    ctx.fillStyle   = this._flashColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  _drawScanlines() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle   = '#000000';
    for (let y = this._scanlineOffset; y < CANVAS_HEIGHT; y += 4) {
      ctx.fillRect(0, y, CANVAS_WIDTH, 2);
    }
    ctx.restore();
  }

  // ── Helpers ───────────────────────────────────────────────

  _genStars(count) {
    return Array.from({ length: count }, () => ({
      x:          Math.random() * CANVAS_WIDTH,
      y:          Math.random() * CANVAS_HEIGHT,
      size:       0.5 + Math.random() * 2,
      speed:      8 + Math.random() * 30,
      brightness: Math.random(),
    }));
  }

  /**
   * Draw a glowing text line (utility used by UI classes).
   */
  static glowText(ctx, text, x, y, color, size, align = 'center', blur = 16) {
    ctx.save();
    ctx.font         = `bold ${size}px 'Courier New', monospace`;
    ctx.textAlign    = align;
    ctx.textBaseline = 'middle';
    ctx.shadowBlur   = blur;
    ctx.shadowColor  = color;
    ctx.fillStyle    = color;
    ctx.fillText(text, x, y);
    ctx.shadowBlur   = blur * 0.5;
    ctx.fillStyle    = '#ffffff';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Draw a rounded button with hover state.
   */
  static drawButton(ctx, x, y, w, h, label, color, hover = false, r = 8) {
    ctx.save();
    const alpha = hover ? 1 : 0.75;
    ctx.globalAlpha = alpha;
    ctx.shadowBlur  = hover ? 18 : 8;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.fillStyle   = hover ? `${color}33` : 'rgba(0,0,0,0.5)';

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur   = 10;
    ctx.shadowColor  = color;
    ctx.fillStyle    = hover ? '#ffffff' : color;
    ctx.font         = `bold 14px 'Courier New', monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);

    ctx.restore();
  }

  /**
   * Returns true if point (px, py) is inside rect.
   */
  static hitTest(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
