// ============================================================
// TitleScreen.js — Animated title screen with menu
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, BLOCK_TYPES, BLOCK_COLORS } from '../config/constants.js';
import RenderSystem from '../systems/RenderSystem.js';

const MENU_ITEMS = [
  { label: 'PLAY',         action: 'play'         },
  { label: 'ACHIEVEMENTS', action: 'achievements' },
  { label: 'HOW TO PLAY',  action: 'howtoplay'    },
];

export default class TitleScreen {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {InputSystem}              input
   */
  constructor(ctx, input) {
    this.ctx   = ctx;
    this.input = input;

    this._selectedIndex = 0;
    this._time          = 0;

    // Falling block decorations
    this._bgBlocks = this._genBgBlocks(24);
    this._hoverBtn  = -1;

    // Queued action from click/tap
    this._pendingAction = null;

    this._setupListeners();
  }

  _setupListeners() {
    const handler = ({ x }) => {
      const mouseY = CANVAS_HEIGHT / 2 - 10; // approximate; use real hit area in draw
      // Handled per-frame in draw using stored mouse pos
      this._clickX = x;
      this._clickY = null; // will be overridden if we track Y
    };
    // Use eventBus click events forwarded from InputSystem
  }

  update(dt) {
    this._time += dt;

    // Keyboard nav
    if (this.input.wasJustPressed('ArrowDown') || this.input.wasJustPressed('KeyS')) {
      this._selectedIndex = (this._selectedIndex + 1) % MENU_ITEMS.length;
    }
    if (this.input.wasJustPressed('ArrowUp') || this.input.wasJustPressed('KeyW')) {
      this._selectedIndex = (this._selectedIndex + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
    }
    if (this.input.wasJustPressed('Enter') || this.input.wasJustPressed('Space')) {
      this._pendingAction = MENU_ITEMS[this._selectedIndex].action;
    }

    // Falling blocks
    for (const b of this._bgBlocks) {
      b.y += b.speed * dt;
      b.rot += b.rotSpeed * dt;
      if (b.y > CANVAS_HEIGHT + 30) {
        b.y = -30;
        b.x = Math.random() * CANVAS_WIDTH;
      }
    }
  }

  /**
   * Draw the title screen. Returns an action string if the user clicked something.
   * @param {object} [mouseState] { x, y } in canvas coords
   * @returns {string|null}
   */
  draw(mouseState = null) {
    const ctx = this.ctx;
    this._hoverBtn = -1;

    // Background (already drawn by RenderSystem.drawBackground)

    // Falling blocks
    this._drawBgBlocks();

    // Title
    const titleY  = CANVAS_HEIGHT * 0.27;
    const t       = this._time;
    const pulse   = 1 + 0.04 * Math.sin(t * 2.5);
    ctx.save();
    ctx.scale(pulse, pulse);
    const cx = CANVAS_WIDTH / 2 / pulse;
    const cy = titleY / pulse;
    RenderSystem.glowText(ctx, 'NEON', cx - 130, cy, COLORS.NEON_CYAN,  52, 'center', 28);
    RenderSystem.glowText(ctx, 'BREAKER', cx, cy, COLORS.NEON_PINK, 52, 'center', 28);
    RenderSystem.glowText(ctx, 'X', cx + 140, cy, COLORS.NEON_YELLOW, 52, 'center', 28);
    ctx.restore();

    RenderSystem.glowText(ctx, 'THE ULTIMATE BLOCK BREAKER', CANVAS_WIDTH / 2, titleY + 44, COLORS.NEON_GREEN, 13, 'center', 8);

    // Menu items
    const menuStartY = CANVAS_HEIGHT * 0.54;
    const btnH       = 38;
    const btnW       = 220;
    const btnX       = CANVAS_WIDTH / 2 - btnW / 2;

    let action = null;
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const y    = menuStartY + i * (btnH + 12);
      const item = MENU_ITEMS[i];

      const isSelected = i === this._selectedIndex;
      let hover = isSelected;

      if (mouseState) {
        if (RenderSystem.hitTest(mouseState.x, mouseState.y, btnX, y, btnW, btnH)) {
          hover = true;
          this._hoverBtn = i;
        }
      }

      RenderSystem.drawButton(ctx, btnX, y, btnW, btnH, item.label, COLORS.NEON_CYAN, hover);

      // Check click this frame
      if (this._pendingAction === null && this._clickX !== undefined) {
        // approximate — full mouse Y tracking handled in Game.js
      }
    }

    // Pop pending action (keyboard)
    if (this._pendingAction) {
      const a = this._pendingAction;
      this._pendingAction = null;
      return a;
    }

    // Version
    ctx.save();
    ctx.font         = '9px monospace';
    ctx.fillStyle    = '#444466';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v1.0.0 — Neon Breaker X', CANVAS_WIDTH - 8, CANVAS_HEIGHT - 5);
    ctx.restore();

    return action;
  }

  /**
   * Check mouse click against menu items.
   * @param {number} mx
   * @param {number} my
   * @returns {string|null}
   */
  handleClick(mx, my) {
    const menuStartY = CANVAS_HEIGHT * 0.54;
    const btnH       = 38;
    const btnW       = 220;
    const btnX       = CANVAS_WIDTH / 2 - btnW / 2;

    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const y = menuStartY + i * (btnH + 12);
      if (RenderSystem.hitTest(mx, my, btnX, y, btnW, btnH)) {
        return MENU_ITEMS[i].action;
      }
    }
    return null;
  }

  _drawBgBlocks() {
    const ctx = this.ctx;
    for (const b of this._bgBlocks) {
      ctx.save();
      ctx.translate(b.x + b.size / 2, b.y + b.size / 2);
      ctx.rotate(b.rot);
      ctx.globalAlpha  = b.alpha;
      ctx.shadowBlur   = 6;
      ctx.shadowColor  = b.color;
      ctx.strokeStyle  = b.color;
      ctx.lineWidth    = 1;
      ctx.strokeRect(-b.size / 2, -b.size / 2, b.size, b.size);
      ctx.restore();
    }
  }

  _genBgBlocks(count) {
    const types  = Object.values(BLOCK_TYPES);
    const colors = Object.values(BLOCK_COLORS);
    return Array.from({ length: count }, () => ({
      x:       Math.random() * CANVAS_WIDTH,
      y:       Math.random() * CANVAS_HEIGHT,
      size:    10 + Math.random() * 25,
      speed:   15 + Math.random() * 40,
      rot:     Math.random() * Math.PI * 2,
      rotSpeed:(Math.random() - 0.5) * 1.5,
      color:   colors[Math.floor(Math.random() * colors.length)],
      alpha:   0.08 + Math.random() * 0.12,
    }));
  }
}
