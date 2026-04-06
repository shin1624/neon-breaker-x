// ============================================================
// ShopSystem.js — Persistent and temporary upgrades
// ============================================================

export const SHOP_ITEMS = [
  // ── Persistent upgrades ──
  {
    id:       'paddle_width',
    name:     'Wider Paddle',
    desc:     'パドル幅 +15%',
    type:     'persistent',
    maxLevel: 3,
    costs:    [50, 100, 200],
    icon:     '▬',
    color:    '#00ff88',
  },
  {
    id:       'ball_speed',
    name:     'Faster Ball',
    desc:     'ボール速度 +8%',
    type:     'persistent',
    maxLevel: 3,
    costs:    [75, 150, 300],
    icon:     '▶',
    color:    '#ffff00',
  },
  {
    id:       'extra_life',
    name:     'Extra Life',
    desc:     '最大残機 +1',
    type:     'persistent',
    maxLevel: 1,
    costs:    [100],
    icon:     '♥',
    color:    '#ff0044',
  },
  {
    id:       'combo_time',
    name:     'Combo Extend',
    desc:     'コンボタイムアウト +1秒',
    type:     'persistent',
    maxLevel: 2,
    costs:    [80, 160],
    icon:     '⏱',
    color:    '#aa00ff',
  },
  {
    id:       'start_shield',
    name:     'Start Shield',
    desc:     'レベル開始時シールド',
    type:     'persistent',
    maxLevel: 1,
    costs:    [150],
    icon:     '🛡',
    color:    '#00ffff',
  },
  // ── Temporary items (one-shot, next level) ──
  {
    id:       'temp_multi_ball',
    name:     'Multi Ball',
    desc:     '次レベル開始: マルチボール',
    type:     'temp',
    maxLevel: 1,
    costs:    [30],
    icon:     '×3',
    color:    '#00ffff',
  },
  {
    id:       'temp_laser',
    name:     'Laser Start',
    desc:     '次レベル開始: レーザー',
    type:     'temp',
    maxLevel: 1,
    costs:    [25],
    icon:     'LZ',
    color:    '#ff0044',
  },
  {
    id:       'temp_score_boost',
    name:     'Score Boost',
    desc:     '次レベル: スコア×2',
    type:     'temp',
    maxLevel: 1,
    costs:    [40],
    icon:     '×2',
    color:    '#ffd700',
  },
];

export default class ShopSystem {
  /**
   * @param {SaveSystem} saveSystem
   */
  constructor(saveSystem) {
    this._save = saveSystem;

    /** Temporary items queued for next level. */
    this._pendingTemps = new Set();
  }

  // ── Queries ───────────────────────────────────────────────

  getCoins() { return this._save.getCoins(); }

  /**
   * Get current level of an upgrade.
   * @param {string} id
   */
  getLevel(id) { return this._save.getUpgradeLevel(id); }

  /**
   * Cost of next level for an item.
   * @param {string} id
   * @returns {number|null} null if maxed
   */
  getNextCost(id) {
    const item = this._getItem(id);
    if (!item) return null;
    const level = this.getLevel(id);
    if (level >= item.maxLevel) return null;
    return item.costs[level] ?? null;
  }

  canAfford(id) {
    const cost = this.getNextCost(id);
    return cost !== null && this._save.getCoins() >= cost;
  }

  isMaxed(id) {
    const item = this._getItem(id);
    return item ? this._save.getUpgradeLevel(id) >= item.maxLevel : true;
  }

  // ── Purchase ──────────────────────────────────────────────

  /**
   * @param {string} id
   * @returns {{ success: boolean, message: string }}
   */
  buy(id) {
    const item = this._getItem(id);
    if (!item) return { success: false, message: 'Unknown item' };

    if (this.isMaxed(id)) return { success: false, message: 'Already maxed!' };

    const cost = this.getNextCost(id);
    if (!this._save.spendCoins(cost)) return { success: false, message: 'Not enough coins!' };

    if (item.type === 'persistent') {
      const cur = this._save.getUpgradeLevel(id);
      this._save.setUpgradeLevel(id, cur + 1);
    } else {
      this._pendingTemps.add(id);
    }

    return { success: true, message: `${item.name} purchased!` };
  }

  // ── Apply upgrades to game state ─────────────────────────

  /**
   * Returns width multiplier from upgrade.
   */
  getPaddleWidthMult() {
    const lvl = this.getLevel('paddle_width');
    return 1 + lvl * 0.15;
  }

  /**
   * Returns ball speed multiplier from upgrade.
   */
  getBallSpeedMult() {
    const lvl = this.getLevel('ball_speed');
    return 1 + lvl * 0.08;
  }

  /** Extra lives from upgrade. */
  getBonusLives() { return this.getLevel('extra_life'); }

  /** Bonus combo timeout seconds. */
  getBonusComboTime() { return this.getLevel('combo_time'); }

  /** Does this player start with a shield? */
  hasStartShield() { return this.getLevel('start_shield') > 0; }

  // ── Temp items ────────────────────────────────────────────

  hasPending(id) { return this._pendingTemps.has(id); }

  consumePending(id) { this._pendingTemps.delete(id); }

  getPendingTemps() { return [...this._pendingTemps]; }

  clearPendingTemps() { this._pendingTemps.clear(); }

  // ── UI data ───────────────────────────────────────────────

  /** All items with their current state for rendering. */
  getAllItems() {
    return SHOP_ITEMS.map(item => ({
      ...item,
      currentLevel: this.getLevel(item.id),
      nextCost:     this.getNextCost(item.id),
      canAfford:    this.canAfford(item.id),
      maxed:        this.isMaxed(item.id),
      pending:      this._pendingTemps.has(item.id),
    }));
  }

  _getItem(id) { return SHOP_ITEMS.find(i => i.id === id) ?? null; }
}
