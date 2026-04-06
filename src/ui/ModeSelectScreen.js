// ============================================================
// ModeSelectScreen.js — Game mode selection
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GAME_MODES } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

const MODES = [
  {
    id:    GAME_MODES.CLASSIC,
    label: 'CLASSIC',
    desc:  '全レベルクリアを目指す王道モード',
    color: COLORS.NEON_CYAN,
  },
  {
    id:    GAME_MODES.ENDLESS,
    label: 'ENDLESS',
    desc:  '無限に続くランダム生成レベル',
    color: COLORS.NEON_GREEN,
  },
  {
    id:    GAME_MODES.TIME_ATTACK,
    label: 'TIME ATTACK',
    desc:  '5分以内に最高スコアを狙え！',
    color: COLORS.NEON_YELLOW,
  },
  {
    id:    GAME_MODES.BOSS_RUSH,
    label: 'BOSS RUSH',
    desc:  'ボスのみを連続撃破するモード',
    color: COLORS.NEON_RED,
  },
];

export default class ModeSelectScreen {
  constructor(ctx, input) {
    this.ctx   = ctx;
    this.input = input;
    this._selectedIndex = 0;
    this._time = 0;
  }

  update(dt) {
    this._time += dt;
    if (this.input.wasJustPressed('ArrowDown') || this.input.wasJustPressed('KeyS')) {
      this._selectedIndex = (this._selectedIndex + 1) % MODES.length;
    }
    if (this.input.wasJustPressed('ArrowUp') || this.input.wasJustPressed('KeyW')) {
      this._selectedIndex = (this._selectedIndex + MODES.length - 1) % MODES.length;
    }
    if (this.input.wasJustPressed('Enter') || this.input.wasJustPressed('Space')) {
      return MODES[this._selectedIndex].id;
    }
    if (this.input.wasJustPressed('Escape')) return 'back';
    return null;
  }

  draw(mouseState = null) {
    const ctx = this.ctx;
    const cx  = CANVAS_WIDTH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.88)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    RenderSystem.glowText(ctx, 'SELECT MODE', cx, 40, COLORS.NEON_CYAN, 26, 'center', 18);

    const btnW  = 320, btnH = 60, gap = 14;
    const startY = CANVAS_HEIGHT * 0.25;

    for (let i = 0; i < MODES.length; i++) {
      const m    = MODES[i];
      const x    = cx - btnW / 2;
      const y    = startY + i * (btnH + gap);
      const isHover = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, x, y, btnW, btnH);
      const sel  = i === this._selectedIndex || !!isHover;

      if (isHover) this._selectedIndex = i;

      ctx.save();
      ctx.shadowBlur  = sel ? 16 : 4;
      ctx.shadowColor = m.color;
      ctx.strokeStyle = m.color;
      ctx.lineWidth   = sel ? 2 : 1;
      ctx.fillStyle   = sel ? `${m.color}20` : 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, y, btnW, btnH);
      ctx.strokeRect(x, y, btnW, btnH);

      ctx.shadowBlur   = 8;
      ctx.shadowColor  = m.color;
      ctx.fillStyle    = sel ? '#ffffff' : m.color;
      ctx.font         = `bold 18px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, cx, y + 22);

      ctx.shadowBlur  = 0;
      ctx.fillStyle   = '#888899';
      ctx.font        = '11px monospace';
      ctx.fillText(m.desc, cx, y + 42);
      ctx.restore();
    }

    // Back
    const bw = 140, bh = 32;
    const bx = cx - bw / 2, by = CANVAS_HEIGHT - 42;
    const bHover = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, bx, by, bw, bh);
    RenderSystem.drawButton(ctx, bx, by, bw, bh, '◀ BACK', COLORS.NEON_CYAN, !!bHover);

    return null;
  }

  handleClick(mx, my) {
    const cx = CANVAS_WIDTH / 2;
    const btnW = 320, btnH = 60, gap = 14;
    const startY = CANVAS_HEIGHT * 0.25;

    for (let i = 0; i < MODES.length; i++) {
      const x = cx - btnW / 2;
      const y = startY + i * (btnH + gap);
      if (RenderSystem.hitTest(mx, my, x, y, btnW, btnH)) return MODES[i].id;
    }

    const bw = 140, bh = 32;
    const bx = cx - bw / 2, by = CANVAS_HEIGHT - 42;
    if (RenderSystem.hitTest(mx, my, bx, by, bw, bh)) return 'back';

    return null;
  }
}
