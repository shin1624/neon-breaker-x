// ============================================================
// GameOverScreen.js
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

export default class GameOverScreen {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {InputSystem}  input
   * @param {SaveSystem}   save
   */
  constructor(ctx, input, save) {
    this.ctx   = ctx;
    this.input = input;
    this.save  = save;
    this._time  = 0;
    this._isNewRecord = false;
  }

  reset(score, mode) {
    this._time    = 0;
    this._score   = score;
    this._mode    = mode;
    this._hiScore = this.save.getHighScore(mode);
    this._isNewRecord = this.save.setHighScore(mode, score);
  }

  update(dt) { this._time += dt; }

  /**
   * @returns {'retry'|'title'|null}
   */
  draw(mouseState = null) {
    const ctx  = this.ctx;
    const cx   = CANVAS_WIDTH  / 2;
    const cy   = CANVAS_HEIGHT / 2;

    // Dim background
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.82)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    // GAME OVER
    const pulse = 1 + 0.05 * Math.sin(this._time * 4);
    ctx.save();
    ctx.scale(pulse, pulse);
    RenderSystem.glowText(ctx, 'GAME OVER', cx / pulse, (cy - 80) / pulse, COLORS.NEON_RED, 44, 'center', 30);
    ctx.restore();

    // Scores
    RenderSystem.glowText(ctx, `SCORE: ${(this._score ?? 0).toLocaleString()}`, cx, cy - 20, COLORS.NEON_YELLOW, 20);

    if (this._isNewRecord) {
      const flash = Math.abs(Math.sin(this._time * 5));
      RenderSystem.glowText(ctx, '★ NEW RECORD! ★', cx, cy + 14, COLORS.GOLD, 16);
    } else {
      ctx.save();
      ctx.font         = '13px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#888899';
      ctx.fillText(`BEST: ${(this._hiScore ?? 0).toLocaleString()}`, cx, cy + 14);
      ctx.restore();
    }

    // Buttons
    const btnW  = 160;
    const btnH  = 38;
    const gap   = 20;
    const bx1   = cx - btnW - gap / 2;
    const bx2   = cx + gap / 2;
    const by    = cy + 55;

    const h1 = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, bx1, by, btnW, btnH);
    const h2 = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, bx2, by, btnW, btnH);

    RenderSystem.drawButton(ctx, bx1, by, btnW, btnH, 'RETRY', COLORS.NEON_GREEN,  !!h1);
    RenderSystem.drawButton(ctx, bx2, by, btnW, btnH, 'TITLE', COLORS.NEON_CYAN,   !!h2);

    // Keyboard hints
    if (this.input.wasJustPressed('KeyR') || this.input.wasJustPressed('Enter')) return 'retry';
    if (this.input.wasJustPressed('Escape') || this.input.wasJustPressed('KeyT'))  return 'title';

    return null;
  }

  handleClick(mx, my) {
    const cx   = CANVAS_WIDTH  / 2;
    const cy   = CANVAS_HEIGHT / 2;
    const btnW = 160, btnH = 38, gap = 20;
    const bx1  = cx - btnW - gap / 2;
    const bx2  = cx + gap / 2;
    const by   = cy + 55;

    if (RenderSystem.hitTest(mx, my, bx1, by, btnW, btnH)) return 'retry';
    if (RenderSystem.hitTest(mx, my, bx2, by, btnW, btnH)) return 'title';
    return null;
  }
}
