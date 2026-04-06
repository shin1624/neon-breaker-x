// ============================================================
// LevelCompleteScreen.js
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

export default class LevelCompleteScreen {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {InputSystem} input
   */
  constructor(ctx, input) {
    this.ctx   = ctx;
    this.input = input;
    this._time = 0;
    this._data = null;
    this._reveal = 0; // score reveal timer
  }

  /**
   * @param {object} data
   *  level, baseScore, bonus: {total, timeBonus, missBonus, clearBonus, comboBonus},
   *  coins, mode
   */
  reset(data) {
    this._time   = 0;
    this._reveal = 0;
    this._data   = data;
  }

  update(dt) {
    this._time   += dt;
    this._reveal += dt;
  }

  /**
   * @returns {'next'|'shop'|null}
   */
  draw(mouseState = null) {
    if (!this._data) return null;
    const ctx = this.ctx;
    const cx  = CANVAS_WIDTH  / 2;
    const cy  = CANVAS_HEIGHT / 2;
    const d   = this._data;

    // Dim
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.82)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    // LEVEL CLEAR!
    const pulse = 1 + 0.04 * Math.sin(this._time * 3);
    ctx.save();
    ctx.scale(pulse, pulse);
    RenderSystem.glowText(ctx, 'LEVEL CLEAR!', cx / pulse, (cy - 100) / pulse, COLORS.NEON_GREEN, 36, 'center', 24);
    ctx.restore();

    // Score breakdown
    const lineH = 26;
    const startY = cy - 55;
    const rows = [];

    if (this._reveal > 0.3) rows.push({ label: 'Base Score', value: d.baseScore, color: COLORS.NEON_CYAN   });
    if (this._reveal > 0.7) rows.push({ label: 'Time Bonus',  value: d.bonus.timeBonus, color: COLORS.NEON_YELLOW });
    if (this._reveal > 1.0) rows.push({ label: 'No Miss',     value: d.bonus.missBonus,  color: COLORS.NEON_GREEN  });
    if (this._reveal > 1.3) rows.push({ label: 'All Clear',   value: d.bonus.clearBonus, color: COLORS.NEON_BLUE   });
    if (this._reveal > 1.6) rows.push({ label: 'Combo Bonus', value: d.bonus.comboBonus, color: COLORS.NEON_PINK   });

    ctx.save();
    ctx.font         = '13px monospace';
    ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      ctx.shadowBlur  = 6;
      ctx.shadowColor = r.color;
      ctx.fillStyle   = r.color;
      ctx.textAlign   = 'left';
      ctx.fillText(r.label, cx - 130, startY + i * lineH);
      ctx.textAlign   = 'right';
      ctx.fillText(`+${r.value.toLocaleString()}`, cx + 130, startY + i * lineH);
    });

    if (this._reveal > 2.0) {
      const totalY = startY + rows.length * lineH + 8;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = COLORS.GOLD;
      ctx.fillStyle   = COLORS.GOLD;
      ctx.font        = 'bold 16px monospace';
      ctx.textAlign   = 'left';
      ctx.fillText('Total', cx - 130, totalY);
      ctx.textAlign   = 'right';
      const total = (d.baseScore + d.bonus.total);
      ctx.fillText(total.toLocaleString(), cx + 130, totalY);

      // Coins
      ctx.font        = '13px monospace';
      ctx.fillStyle   = COLORS.GOLD;
      ctx.shadowColor = COLORS.GOLD;
      ctx.textAlign   = 'center';
      ctx.fillText(`🪙 +${d.coins} coins`, cx, totalY + 28);
    }
    ctx.restore();

    // Buttons
    if (this._reveal > 2.5) {
      const btnW  = 160;
      const btnH  = 38;
      const gap   = 20;
      const bx1   = cx - btnW - gap / 2;
      const bx2   = cx + gap / 2;
      const by    = cy + 110;

      const h1 = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, bx1, by, btnW, btnH);
      const h2 = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, bx2, by, btnW, btnH);

      RenderSystem.drawButton(ctx, bx1, by, btnW, btnH, 'NEXT LEVEL', COLORS.NEON_GREEN, !!h1);
      RenderSystem.drawButton(ctx, bx2, by, btnW, btnH, 'SHOP 🛒',   COLORS.NEON_CYAN,  !!h2);

      if (this.input.wasJustPressed('Enter') || this.input.wasJustPressed('KeyN')) return 'next';
      if (this.input.wasJustPressed('KeyS'))  return 'shop';
    }

    return null;
  }

  handleClick(mx, my) {
    if (this._reveal <= 2.5) return null;
    const cx   = CANVAS_WIDTH  / 2;
    const cy   = CANVAS_HEIGHT / 2;
    const btnW = 160, btnH = 38, gap = 20;
    const bx1  = cx - btnW - gap / 2;
    const bx2  = cx + gap / 2;
    const by   = cy + 110;

    if (RenderSystem.hitTest(mx, my, bx1, by, btnW, btnH)) return 'next';
    if (RenderSystem.hitTest(mx, my, bx2, by, btnW, btnH)) return 'shop';
    return null;
  }
}
