// ============================================================
// HUD.js — In-game heads-up display
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, POWERUP_COLORS, POWERUP_LABELS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

export default class HUD {
  /** @param {CanvasRenderingContext2D} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /**
   * Draw the full HUD.
   * @param {object} state
   *   lives, score, highScore, level, mode,
   *   combo: {count, multiplier, timerRatio},
   *   activePowerups: [{type, timer, maxTimer}],
   *   timeLeft: number|null,
   *   coins: number
   */
  draw(state) {
    const ctx = this.ctx;
    const {
      lives = 3, score = 0, highScore = 0, level = 1, mode,
      combo = { count: 0 }, activePowerups = [],
      timeLeft = null, coins = 0,
    } = state;

    // ── Background band ─────────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40);
    ctx.restore();

    // ── Lives (left) ────────────────────────────────────────
    this._drawLives(lives);

    // ── Level (centre) ──────────────────────────────────────
    RenderSystem.glowText(ctx, `LEVEL ${level}`, CANVAS_WIDTH / 2, 18, COLORS.NEON_CYAN, 14);

    // ── Score / HiScore (right) ──────────────────────────────
    this._drawScore(score, highScore);

    // ── Coins (right of score) ───────────────────────────────
    ctx.save();
    ctx.font         = '11px monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = COLORS.GOLD;
    ctx.shadowBlur   = 6;
    ctx.shadowColor  = COLORS.GOLD;
    ctx.fillText(`🪙${coins}`, CANVAS_WIDTH - 8, 32);
    ctx.restore();

    // ── Active powerup bar (bottom-left) ────────────────────
    this._drawPowerups(activePowerups);

    // ── Combo display (centre) ───────────────────────────────
    this._drawCombo(combo);

    // ── Timer (Time Attack mode) ─────────────────────────────
    if (timeLeft !== null) {
      this._drawTimer(timeLeft);
    }
  }

  _drawLives(lives) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font         = '14px monospace';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur   = 8;
    ctx.shadowColor  = COLORS.NEON_RED;

    let x = 10;
    for (let i = 0; i < Math.min(lives, 9); i++) {
      ctx.fillStyle = i < lives ? COLORS.NEON_RED : '#333344';
      ctx.fillText('♥', x, 18);
      x += 18;
    }
    ctx.restore();
  }

  _drawScore(score, highScore) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 13px monospace';
    ctx.shadowBlur   = 8;
    ctx.shadowColor  = COLORS.NEON_YELLOW;
    ctx.fillStyle    = COLORS.NEON_YELLOW;
    ctx.fillText(score.toLocaleString(), CANVAS_WIDTH - 8, 12);

    ctx.font      = '9px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.shadowBlur= 0;
    ctx.fillText(`HI:${highScore.toLocaleString()}`, CANVAS_WIDTH - 8, 24);
    ctx.restore();
  }

  _drawPowerups(active) {
    if (active.length === 0) return;
    const ctx = this.ctx;
    const y   = CANVAS_HEIGHT - 30;
    let x     = 8;

    for (const pu of active) {
      const col   = POWERUP_COLORS[pu.type] ?? '#ffffff';
      const label = POWERUP_LABELS[pu.type] ?? '??';
      const ratio = pu.timer / pu.maxTimer;
      const w     = 42;
      const h     = 22;

      ctx.save();
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeStyle= col;
      ctx.lineWidth  = 1;
      ctx.shadowBlur = 4;
      ctx.shadowColor= col;
      ctx.strokeRect(x, y, w, h);

      // Timer bar
      ctx.fillStyle = `${col}44`;
      ctx.fillRect(x, y + h - 4, w * ratio, 4);

      // Label
      ctx.shadowBlur   = 0;
      ctx.fillStyle    = col;
      ctx.font         = 'bold 10px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2 - 2);

      ctx.restore();
      x += w + 4;
    }
  }

  _drawCombo(combo) {
    if (combo.count < 3) return;
    const ctx  = this.ctx;
    const cx   = CANVAS_WIDTH / 2;
    const cy   = CANVAS_HEIGHT / 2;

    const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 150);
    const col   = combo.count >= 20 ? COLORS.GOLD :
                  combo.count >= 10 ? COLORS.NEON_PINK : COLORS.NEON_YELLOW;

    ctx.save();
    ctx.globalAlpha = Math.min(1, combo.count / 5) * 0.9;
    ctx.font        = `bold ${Math.min(42, 18 + combo.count) * pulse}px monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.shadowBlur  = 22;
    ctx.shadowColor = col;
    ctx.fillStyle   = col;
    ctx.fillText(`COMBO ×${combo.multiplier}!`, cx, 70);

    // Thin bar showing time remaining
    const barW = 120;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle   = '#333';
    ctx.fillRect(cx - barW / 2, 82, barW, 3);
    ctx.fillStyle   = col;
    ctx.fillRect(cx - barW / 2, 82, barW * combo.timerRatio, 3);

    ctx.restore();
  }

  _drawTimer(timeLeft) {
    const ctx = this.ctx;
    const col = timeLeft < 10 ? COLORS.NEON_RED : COLORS.NEON_CYAN;
    ctx.save();
    ctx.font         = `bold 18px monospace`;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur   = 10;
    ctx.shadowColor  = col;
    ctx.fillStyle    = col;
    const mins = Math.floor(timeLeft / 60);
    const secs = Math.floor(timeLeft % 60);
    ctx.fillText(`${mins}:${secs.toString().padStart(2,'0')}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT / 2);
    ctx.restore();
  }

  /** Draw PAUSED overlay. */
  drawPaused() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.65)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    RenderSystem.glowText(ctx, 'PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, COLORS.NEON_CYAN, 36);
    ctx.font         = '14px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#aaaaaa';
    ctx.fillText('Press P or ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24);
    ctx.restore();
  }
}
