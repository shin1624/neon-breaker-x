// ============================================================
// ShopScreen.js — In-game upgrade shop
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

export default class ShopScreen {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {InputSystem}  input
   * @param {ShopSystem}   shop
   */
  constructor(ctx, input, shop) {
    this.ctx   = ctx;
    this.input = input;
    this.shop  = shop;

    this._selectedIndex = 0;
    this._message       = '';
    this._messageTimer  = 0;
  }

  update(dt) {
    if (this._messageTimer > 0) this._messageTimer -= dt;

    const items = this.shop.getAllItems();

    if (this.input.wasJustPressed('ArrowDown') || this.input.wasJustPressed('KeyS')) {
      this._selectedIndex = (this._selectedIndex + 1) % items.length;
    }
    if (this.input.wasJustPressed('ArrowUp') || this.input.wasJustPressed('KeyW')) {
      this._selectedIndex = (this._selectedIndex + items.length - 1) % items.length;
    }
    if (this.input.wasJustPressed('Enter') || this.input.wasJustPressed('Space')) {
      const id = items[this._selectedIndex]?.id;
      if (id) this._doBuy(id);
    }
  }

  _doBuy(id) {
    const result = this.shop.buy(id);
    this._message      = result.message;
    this._messageTimer = 2.5;
  }

  /**
   * @param {object} mouseState {x,y}
   * @returns {'continue'|null}
   */
  draw(mouseState = null) {
    const ctx = this.ctx;
    const cx  = CANVAS_WIDTH / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    RenderSystem.glowText(ctx, 'SHOP', cx, 35, COLORS.GOLD, 30, 'center', 20);

    // Coins
    ctx.save();
    ctx.font         = 'bold 16px monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = COLORS.GOLD;
    ctx.shadowBlur   = 8;
    ctx.shadowColor  = COLORS.GOLD;
    ctx.fillText(`🪙 ${this.shop.getCoins()} coins`, CANVAS_WIDTH - 16, 35);
    ctx.restore();

    const items  = this.shop.getAllItems();
    const startY = 72;
    const rowH   = 48;
    const cols   = 2;
    const colW   = CANVAS_WIDTH / cols - 12;

    let action = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      const x    = 8 + col * (colW + 12);
      const y    = startY + row * rowH;
      const w    = colW;
      const h    = rowH - 6;

      const isSelected = i === this._selectedIndex;
      const isHover = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, x, y, w, h);
      if (isHover) this._selectedIndex = i;

      const col2   = item.maxed ? '#444455' : item.canAfford ? item.color : '#663333';
      const alpha  = item.maxed ? 0.4 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = isSelected ? 14 : 4;
      ctx.shadowColor = col2;
      ctx.strokeStyle = col2;
      ctx.lineWidth   = isSelected ? 2 : 1;
      ctx.fillStyle   = isSelected ? `${col2}22` : 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      // Icon
      ctx.fillStyle    = item.maxed ? '#666677' : item.color;
      ctx.font         = '16px monospace';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur   = 0;
      ctx.fillText(item.icon, x + 8, y + h / 2);

      // Name
      ctx.fillStyle    = item.maxed ? '#888899' : '#ffffff';
      ctx.font         = `bold 11px monospace`;
      ctx.textAlign    = 'left';
      ctx.fillText(item.name, x + 28, y + h / 2 - 8);

      // Desc
      ctx.fillStyle = '#888899';
      ctx.font      = '9px monospace';
      ctx.fillText(item.desc, x + 28, y + h / 2 + 7);

      // Cost / level
      ctx.textAlign    = 'right';
      ctx.font         = 'bold 11px monospace';
      if (item.maxed) {
        ctx.fillStyle = '#888899';
        ctx.fillText('MAX', x + w - 8, y + h / 2 - 6);
      } else if (item.pending) {
        ctx.fillStyle = COLORS.NEON_GREEN;
        ctx.fillText('READY', x + w - 8, y + h / 2 - 6);
      } else {
        ctx.fillStyle = item.canAfford ? COLORS.GOLD : '#994433';
        ctx.fillText(`🪙${item.nextCost}`, x + w - 8, y + h / 2 - 6);
      }

      if (item.type === 'persistent' && item.maxLevel > 1) {
        // Level pips
        const pipY = y + h - 6;
        for (let p = 0; p < item.maxLevel; p++) {
          ctx.fillStyle = p < item.currentLevel ? item.color : '#333344';
          ctx.fillRect(x + w - 8 - (item.maxLevel - p) * 10, pipY, 7, 3);
        }
      }

      ctx.restore();
    }

    // Message
    if (this._messageTimer > 0) {
      ctx.save();
      ctx.globalAlpha  = Math.min(1, this._messageTimer);
      ctx.font         = 'bold 14px monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = COLORS.NEON_GREEN;
      ctx.shadowBlur   = 10;
      ctx.shadowColor  = COLORS.NEON_GREEN;
      ctx.fillText(this._message, cx, CANVAS_HEIGHT - 52);
      ctx.restore();
    }

    // Continue button
    const btnW = 180, btnH = 36;
    const btnX = cx - btnW / 2;
    const btnY = CANVAS_HEIGHT - 34;
    const btnHover = mouseState && RenderSystem.hitTest(mouseState.x, mouseState.y, btnX, btnY, btnW, btnH);
    RenderSystem.drawButton(ctx, btnX, btnY, btnW, btnH, 'CONTINUE ▶', COLORS.NEON_GREEN, !!btnHover);

    if (this.input.wasJustPressed('Escape') || this.input.wasJustPressed('KeyC')) return 'continue';

    return action;
  }

  handleClick(mx, my) {
    const cx   = CANVAS_WIDTH / 2;
    const btnW = 180, btnH = 36;
    const btnX = cx - btnW / 2;
    const btnY = CANVAS_HEIGHT - 34;

    if (RenderSystem.hitTest(mx, my, btnX, btnY, btnW, btnH)) return 'continue';

    // Check item clicks
    const items  = this.shop.getAllItems();
    const startY = 72;
    const rowH   = 48;
    const cols   = 2;
    const colW   = CANVAS_WIDTH / cols - 12;

    for (let i = 0; i < items.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = 8 + col * (colW + 12);
      const y   = startY + row * rowH;
      const w   = colW;
      const h   = rowH - 6;

      if (RenderSystem.hitTest(mx, my, x, y, w, h)) {
        this._doBuy(items[i].id);
        return null;
      }
    }
    return null;
  }
}
