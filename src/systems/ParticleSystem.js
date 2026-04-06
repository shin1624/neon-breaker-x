// ============================================================
// ParticleSystem.js — All visual particle effects
// ============================================================
import { COLORS } from '../config/constants.js';

// ── Particle base class ──────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.dead = false;
  }
  update(dt) {}
  draw(ctx) {}
}

// Spark (block destroy)
class Spark extends Particle {
  constructor(x, y, color) {
    super(x, y);
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    this.vx    = Math.cos(angle) * speed;
    this.vy    = Math.sin(angle) * speed;
    this.color = color;
    this.life  = 0.5 + Math.random() * 0.4;
    this.maxLife = this.life;
    this.radius = 2 + Math.random() * 3;
    this.gravity = 120;
  }
  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    const r     = this.radius * alpha;
    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.shadowBlur   = 6;
    ctx.shadowColor  = this.color;
    ctx.fillStyle    = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Explosion shockwave ring
class ShockWave extends Particle {
  constructor(x, y, maxRadius, color) {
    super(x, y);
    this.radius    = 0;
    this.maxRadius = maxRadius;
    this.color     = color;
    this.life      = 0.5;
    this.maxLife   = 0.5;
  }
  update(dt) {
    this.radius += (this.maxRadius / this.maxLife) * dt;
    this.life   -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const alpha = (this.life / this.maxLife) * 0.8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 3 * (this.life / this.maxLife);
    ctx.shadowBlur  = 12;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Lightning bolt (electric block)
class Lightning extends Particle {
  constructor(x, y, color) {
    super(x, y);
    this.color  = color;
    this.life   = 0.25;
    this.maxLife= 0.25;
    this._segments = this._gen(x, y);
  }
  _gen(sx, sy) {
    const segs = [];
    let cx = sx, cy = sy;
    for (let i = 0; i < 6; i++) {
      const nx = cx + (Math.random() - 0.5) * 30;
      const ny = cy + 8 + Math.random() * 12;
      segs.push([cx, cy, nx, ny]);
      cx = nx; cy = ny;
    }
    return segs;
  }
  update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of this._segments) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// Floating text (combo / score)
class FloatText extends Particle {
  constructor(x, y, text, color, size = 16) {
    super(x, y);
    this.text     = text;
    this.color    = color;
    this.size     = size;
    this.vy       = -60;
    this.life     = 1.0;
    this.maxLife  = 1.0;
  }
  update(dt) {
    this.y    += this.vy * dt;
    this.vy   *= 0.95;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha  = alpha;
    ctx.shadowBlur   = 12;
    ctx.shadowColor  = this.color;
    ctx.fillStyle    = this.color;
    ctx.font         = `bold ${this.size}px 'Courier New', monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// ── ParticleSystem ───────────────────────────────────────────
export default class ParticleSystem {
  constructor() {
    this._pool = [];
  }

  // ── Factories ────────────────────────────────────────────────

  createBlockDestroy(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      this._pool.push(new Spark(x, y, color));
    }
    this._pool.push(new ShockWave(x, y, 28, color));
  }

  createExplosion(x, y, radius, color = COLORS.NEON_ORANGE) {
    for (let i = 0; i < 20; i++) {
      this._pool.push(new Spark(x, y, color));
    }
    this._pool.push(new ShockWave(x, y, radius, color));
    this._pool.push(new ShockWave(x, y, radius * 0.6, '#ffffff'));
  }

  createElectric(x, y) {
    for (let i = 0; i < 4; i++) {
      this._pool.push(new Lightning(x + (Math.random() - 0.5) * 20, y, COLORS.NEON_YELLOW));
    }
  }

  createComboText(x, y, text, color = COLORS.NEON_YELLOW) {
    this._pool.push(new FloatText(x, y, text, color, 20));
  }

  createScoreText(x, y, score, color = COLORS.NEON_WHITE) {
    this._pool.push(new FloatText(x, y, `+${score}`, color, 13));
  }

  createBossHit(x, y) {
    for (let i = 0; i < 8; i++) {
      this._pool.push(new Spark(x, y, COLORS.NEON_RED));
    }
    this._pool.push(new ShockWave(x, y, 40, COLORS.NEON_RED));
  }

  // ── Update / Draw ────────────────────────────────────────────

  update(dt) {
    for (const p of this._pool) p.update(dt);
    // Remove dead particles
    for (let i = this._pool.length - 1; i >= 0; i--) {
      if (this._pool[i].dead) this._pool.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this._pool) p.draw(ctx);
  }

  clear() { this._pool.length = 0; }

  get count() { return this._pool.length; }
}
