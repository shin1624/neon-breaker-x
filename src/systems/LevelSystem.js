// ============================================================
// LevelSystem.js — Level generation and completion logic
// ============================================================
import {
  BLOCK_TYPES, BLOCK_COLS, BLOCK_ROWS,
  BLOCK_OFFSET_X, BLOCK_OFFSET_Y, BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_PAD,
  GAME_MODES,
} from '../config/constants.js';
import Block from '../entities/Block.js';
import Boss  from '../entities/Boss.js';

export default class LevelSystem {
  constructor() {
    this._levelTimer = 0;
  }

  /**
   * Generate blocks for a level.
   * @param {number} levelNum   1-based
   * @param {string} mode       GAME_MODES value
   * @param {number} difficulty 0-1 (from adaptive system)
   * @returns {{ blocks: Block[], boss: Boss|null }}
   */
  generateLevel(levelNum, mode = GAME_MODES.CLASSIC, difficulty = 0.5) {
    const isBossLevel = levelNum % 5 === 0 || mode === GAME_MODES.BOSS_RUSH;
    if (isBossLevel) {
      return { blocks: [], boss: new Boss(Math.ceil(levelNum / 5)) };
    }

    const blocks = [];

    // Tier pool — what block types are available at this level
    const pool = this._getTierPool(levelNum, mode);

    for (let row = 0; row < BLOCK_ROWS; row++) {
      for (let col = 0; col < BLOCK_COLS; col++) {
        const x = BLOCK_OFFSET_X + col * (BLOCK_WIDTH + BLOCK_PAD);
        const y = BLOCK_OFFSET_Y + row * (BLOCK_HEIGHT + BLOCK_PAD);

        // Skip some blocks for visual variety (higher levels = fewer gaps)
        const fillRate = 0.75 + difficulty * 0.2 + levelNum * 0.01;
        if (Math.random() > Math.min(fillRate, 0.98)) continue;

        const type = this._pickType(pool, row, col, levelNum);
        blocks.push(new Block(type, col, row, x, y, BLOCK_WIDTH, BLOCK_HEIGHT));
      }
    }

    return { blocks, boss: null };
  }

  /**
   * Returns true when all destroyable blocks are gone.
   * @param {Block[]} blocks
   */
  isComplete(blocks) {
    return blocks.every(b => !b.alive || b.type === BLOCK_TYPES.BARRIER);
  }

  _getTierPool(level, mode) {
    const pool = [BLOCK_TYPES.NORMAL];

    if (level >= 2)  pool.push(BLOCK_TYPES.TOUGH);
    if (level >= 3)  pool.push(BLOCK_TYPES.MOVING);
    if (level >= 4)  pool.push(BLOCK_TYPES.EXPLOSIVE, BLOCK_TYPES.ELECTRIC);
    if (level >= 5)  pool.push(BLOCK_TYPES.REGEN, BLOCK_TYPES.FROZEN);
    if (level >= 6)  pool.push(BLOCK_TYPES.MIRROR, BLOCK_TYPES.GHOST);
    if (level >= 7)  pool.push(BLOCK_TYPES.BOMB, BLOCK_TYPES.CRYSTAL);
    if (level >= 8)  pool.push(BLOCK_TYPES.BARRIER);
    if (level >= 9)  pool.push(BLOCK_TYPES.DIAMOND, BLOCK_TYPES.STEEL);
    if (level >= 12) pool.push(BLOCK_TYPES.RAINBOW);

    if (mode === GAME_MODES.ENDLESS) {
      pool.push(...pool); // double probability for harder feel
    }

    return pool;
  }

  _pickType(pool, row, col, level) {
    // First rows are easier
    if (row < 2 && level <= 4) {
      return Math.random() < 0.7 ? BLOCK_TYPES.NORMAL : pool[Math.floor(Math.random() * pool.length)];
    }

    // BARRIER only in middle rows
    const filteredPool = pool.filter(t => {
      if (t === BLOCK_TYPES.BARRIER && row < 2) return false;
      return true;
    });

    // Weighted: NORMAL is more common
    const roll = Math.random();
    if (roll < 0.40) return BLOCK_TYPES.NORMAL;
    return filteredPool[Math.floor(Math.random() * filteredPool.length)];
  }

  /** Update timer tracking for speed bonuses. */
  update(dt) {
    this._levelTimer += dt;
  }

  startLevel() {
    this._levelTimer = 0;
  }

  get levelTime() { return this._levelTimer; }

  /**
   * Coins earned for completing a level.
   * @param {number} level
   * @param {number} time  seconds taken
   * @param {boolean} noMiss
   * @param {boolean} allClear
   * @param {number}  maxCombo
   */
  calculateCoins(level, time, noMiss, allClear, maxCombo) {
    let coins = 5 + level * 2;
    if (noMiss)   coins += 10;
    if (allClear) coins += 8;
    if (time < 60)  coins += 5;
    if (time < 30)  coins += 5;
    if (maxCombo >= 20) coins += 5;
    return coins;
  }

  /**
   * Bonus score for completing a level.
   */
  calculateBonusScore(level, time, noMiss, allClear, maxCombo) {
    let bonus = 0;
    const timeBonus = Math.max(0, Math.floor((90 - time) * 50));
    const missBonus = noMiss ? 5000 : 0;
    const clearBonus= allClear ? 3000 : 0;
    const comboBonus= maxCombo * 100;
    bonus = timeBonus + missBonus + clearBonus + comboBonus;
    return { total: bonus, timeBonus, missBonus, clearBonus, comboBonus };
  }
}
