// ============================================================
// AchievementsScreen.js
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

export default class AchievementsScreen {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {InputSystem}        input
   * @param {AchievementSystem}  achievements
   */
  constructor(ctx, input, achievements) {
    this.ctx          = ctx;
    this.input        = input;
    this.achievements = achievements;
    this._scrollY     = 0;
    this._time        = 0;
  }

  update(dt) {
    this._time   += dt;
    if (this.input.wasJustPressed('ArrowDown') || this.input.wasJustPressed('KeyS')) this._scrollY = Math.min(this._scrollY + 40, 999);
    if (this.input.wasJustPressed('ArrowUp')   || this.input.wasJustPressed('KeyW')) this._scrollY = Math.max(this._scrollY - 40, 0);
  }

  /**
   * @returns {'back'|null}
   */
  draw(mouseState = null) {
    const ctx  = this.ctx;
    const cx   = CANVAS_WIDTH / 2;
    const all  = this.achievements.getAllWithStatus();
    const unlocked = all.filter(a => a.unlocked).length;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    RenderSystem.glowText(ctx, 'ACHIEVEMENTS', cx, 30, COLORS.NEON_CYAN, 24, 'center', 16);

    ctx.save();
    ctx.font         = '12px monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = '#aaaaaa';
    ctx.fillText(`${unlocked} / ${all.length}`, CANVAS_WIDTH - 12, 30);
    ctx.restore();

    // Grid
    const cols   = 2;
    const colW   = CANVAS_WIDTH / cols - 14;
    const rowH   = 50;
    const startY = 55 - this._scrollY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 50, CANVAS_WIDTH, CANVAS_HEIGHT - 86);
    ctx.clip();

    for (let i = 0; i < all.length; i++) {
      const a     = all[i];
      const col   = i % cols;
      const row   = Math.floor(i / cols);
      const x     = 8 + col * (colW + 14);
      const y     = startY + row * (rowH + 4);
      const w     = colW;
      const h     = rowH;

      if (y + h < 50 || y > CANVAS_HEIGHT - 86) continue;

      const pulse = a.unlocked ? 0.7 + 0.3 * Math.sin(this._time * 2 + i) : 0;

      ctx.save();
      ctx.shadowBlur  = a.unlocked ? 12 * pulse : 0;
      ctx.shadowColor = a.unlocked ? a.color : '#000000';
      ctx.strokeStyle = a.unlocked ? a.color : '#333344';
      ctx.lineWidth   = a.unlocked ? 2 : 1;
      ctx.fillStyle   = a.unlocked ? `${a.color}18` : 'rgba(0,0,0,0.4)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.shadowBlur   = 0;
      ctx.font         = `bold 12px monospace`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = a.unlocked ? '#ffffff' : '#444455';
      ctx.fillText(a.unlocked ? a.name : '? ? ?', x + 8, y + h / 2 - 9);

      ctx.font      = '9px monospace';
      ctx.fillStyle = a.unlocked ? a.color : '#333344';
      ctx.fillText(a.unlocked ? a.desc : 'ロック中…', x + 8, y + h / 2 + 9);

      if (a.unlocked) {
        ctx.fillStyle   = a.color;
        ctx.font        = '18px monospace';
        ctx.textAlign   = 'right';
        ctx.fillText('✓', x + w - 8, y + h / 2);
      }
      ctx.restore();
    }

    ctx.restore();

    // Back button
    const btnW = 160, btnH = 34;
    const btnX = cx - btnW / 2;
    const btnY = CANVAS_HEIGHT - 38;
    const hover = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, btnX, btnY, btnW, btnH);
    RenderSystem.drawButton(ctx, btnX, btnY, btnW, btnH, '◀ BACK', COLORS.NEON_CYAN, !!hover);

    if (this.input.wasJustPressed('Escape') || this.input.wasJustPressed('KeyB')) return 'back';
    return null;
  }

  handleClick(mx, my) {
    const cx   = CANVAS_WIDTH / 2;
    const btnW = 160, btnH = 34;
    const btnX = cx - btnW / 2;
    const btnY = CANVAS_HEIGHT - 38;
    if (RenderSystem.hitTest(mx, my, btnX, btnY, btnW, btnH)) return 'back';
    return null;
  }
}
