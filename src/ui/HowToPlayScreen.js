// ============================================================
// HowToPlayScreen.js
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

export default class HowToPlayScreen {
  constructor(ctx, input) {
    this.ctx   = ctx;
    this.input = input;
    this._scrollY = 0;
    this._time    = 0;
  }

  update(dt) {
    this._time += dt;
    if (this.input.wasJustPressed('ArrowDown') || this.input.wasJustPressed('KeyS')) this._scrollY = Math.min(this._scrollY + 20, 300);
    if (this.input.wasJustPressed('ArrowUp')   || this.input.wasJustPressed('KeyW')) this._scrollY = Math.max(this._scrollY - 20, 0);
  }

  draw(mouseState = null) {
    const ctx = this.ctx;
    const cx  = CANVAS_WIDTH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.93)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    RenderSystem.glowText(ctx, 'HOW TO PLAY', cx, 28, COLORS.NEON_CYAN, 22, 'center', 14);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 50, CANVAS_WIDTH, CANVAS_HEIGHT - 90);
    ctx.clip();

    const lines = [
      ['', COLORS.NEON_CYAN],
      ['【操作方法】', COLORS.NEON_YELLOW],
      ['マウス / タッチ : パドル移動', '#ffffff'],
      ['← → / A D : キーボード移動', '#ffffff'],
      ['クリック / タップ / Space : ボール発射', '#ffffff'],
      ['P / ESC : ポーズ', '#ffffff'],
      ['', ''],
      ['【ゲームモード】', COLORS.NEON_YELLOW],
      ['CLASSIC    全レベルクリアを目指す', '#ffffff'],
      ['ENDLESS    無限にランダム生成されるレベル', '#ffffff'],
      ['TIME ATTACK 5分以内に最高スコアを狙う', '#ffffff'],
      ['BOSS RUSH  ボスのみを連続撃破', '#ffffff'],
      ['', ''],
      ['【ブロックの種類】', COLORS.NEON_YELLOW],
      ['水色    NORMAL   1ヒットで破壊', '#00ffff'],
      ['青      TOUGH    複数ヒット必要', '#0088ff'],
      ['橙      EXPLOSIVE 破壊で周囲爆発', '#ff6600'],
      ['灰      BARRIER  貫通ボール以外無効', '#888888'],
      ['緑      REGEN    時間で回復する', '#00ff88'],
      ['黄      ELECTRIC ヒットで方向変化', '#ffff00'],
      ['紫      CRYSTAL  必ずパワーアップドロップ', '#aa00ff'],
      ['レインボー RAINBOW 高スコア・色変化', '#ff00ff'],
      ['', ''],
      ['【ショップ】', COLORS.NEON_YELLOW],
      ['レベルクリア後にコインで強化できます', '#ffffff'],
      ['永続アップグレードはセーブされます', '#aaaaaa'],
      ['', ''],
      ['【コンボ】', COLORS.NEON_YELLOW],
      ['連続ヒットでスコア倍率が上がります', '#ffffff'],
      ['3秒間隔が空くとリセットされます', '#aaaaaa'],
    ];

    const lineH  = 18;
    const startY = 60 - this._scrollY;
    lines.forEach(([text, col], i) => {
      if (!text) return;
      ctx.fillStyle    = col;
      ctx.shadowBlur   = col !== '#ffffff' && col !== '#aaaaaa' ? 6 : 0;
      ctx.shadowColor  = col;
      ctx.font         = col === COLORS.NEON_YELLOW ? 'bold 12px monospace' : '11px monospace';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 20, startY + i * lineH);
    });

    ctx.restore();

    // Back button
    const btnW = 140, btnH = 32;
    const btnX = cx - btnW / 2;
    const btnY = CANVAS_HEIGHT - 36;
    const hover = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, btnX, btnY, btnW, btnH);
    RenderSystem.drawButton(ctx, btnX, btnY, btnW, btnH, '◀ BACK', COLORS.NEON_CYAN, !!hover);

    if (this.input.wasJustPressed('Escape') || this.input.wasJustPressed('KeyB')) return 'back';
    return null;
  }

  handleClick(mx, my) {
    const cx = CANVAS_WIDTH / 2;
    const btnW = 140, btnH = 32;
    const btnX = cx - btnW / 2;
    const btnY = CANVAS_HEIGHT - 36;
    if (RenderSystem.hitTest(mx, my, btnX, btnY, btnW, btnH)) return 'back';
    return null;
  }
}
