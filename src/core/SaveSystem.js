// ============================================================
// SaveSystem.js — localStorage persistence layer
// ============================================================
const KEY = 'neon_breaker_x_save';

const DEFAULT_SAVE = {
  // High-scores per game mode
  highScores: {
    classic:     0,
    endless:     0,
    time_attack: 0,
    boss_rush:   0,
  },
  // Unlocked achievement IDs
  achievements: [],
  // Permanent upgrade levels  { id: level }
  upgrades: {},
  // Accumulated coins (persistent across runs)
  coins: 0,
  // Statistics for achievement checking
  stats: {
    totalBlocksDestroyed: 0,
    totalBossesDefeated:  0,
    totalShopPurchases:   0,
    highestLevel:         0,
    maxComboEver:         0,
    powerupTypesCollected: new Set(),
    timeAttackCompleted:  false,
    endlessMaxLevel:      0,
  },
};

export default class SaveSystem {
  constructor() {
    this._data = this._load();
  }

  // ── Public getters ──────────────────────────────────────────

  getHighScore(mode) {
    return this._data.highScores[mode] ?? 0;
  }

  setHighScore(mode, score) {
    if (score > (this._data.highScores[mode] ?? 0)) {
      this._data.highScores[mode] = score;
      this._persist();
      return true; // new record
    }
    return false;
  }

  getCoins() { return this._data.coins; }

  addCoins(amount) {
    this._data.coins = Math.max(0, this._data.coins + amount);
    this._persist();
  }

  spendCoins(amount) {
    if (this._data.coins < amount) return false;
    this._data.coins -= amount;
    this._persist();
    return true;
  }

  // ── Upgrades ───────────────────────────────────────────────

  getUpgradeLevel(id) {
    return this._data.upgrades[id] ?? 0;
  }

  setUpgradeLevel(id, level) {
    this._data.upgrades[id] = level;
    this._persist();
  }

  // ── Achievements ───────────────────────────────────────────

  isUnlocked(id) {
    return this._data.achievements.includes(id);
  }

  unlock(id) {
    if (!this.isUnlocked(id)) {
      this._data.achievements.push(id);
      this._persist();
      return true; // newly unlocked
    }
    return false;
  }

  getUnlocked() { return [...this._data.achievements]; }

  // ── Stats ─────────────────────────────────────────────────

  getStats() { return this._data.stats; }

  updateStats(patch) {
    Object.assign(this._data.stats, patch);
    // Sets don't serialise; handle separately
    this._persist();
  }

  addPowerupType(type) {
    if (!Array.isArray(this._data.stats.powerupTypesCollected)) {
      this._data.stats.powerupTypesCollected = [];
    }
    if (!this._data.stats.powerupTypesCollected.includes(type)) {
      this._data.stats.powerupTypesCollected.push(type);
      this._persist();
    }
  }

  getPowerupTypesCount() {
    const p = this._data.stats.powerupTypesCollected;
    return Array.isArray(p) ? p.length : 0;
  }

  // ── Internal ───────────────────────────────────────────────

  _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return this._deepClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      // Merge defaults so new fields appear on old saves
      return this._merge(this._deepClone(DEFAULT_SAVE), parsed);
    } catch {
      return this._deepClone(DEFAULT_SAVE);
    }
  }

  _persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('SaveSystem: could not persist.', e);
    }
  }

  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  _merge(base, patch) {
    for (const [k, v] of Object.entries(patch)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && typeof base[k] === 'object') {
        this._merge(base[k], v);
      } else {
        base[k] = v;
      }
    }
    return base;
  }

  /** Wipe all save data (debug). */
  reset() {
    this._data = this._deepClone(DEFAULT_SAVE);
    this._persist();
  }
}
