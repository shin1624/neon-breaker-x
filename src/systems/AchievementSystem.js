// ============================================================
// AchievementSystem.js — 22 achievements
// ============================================================
import { COLORS } from '../config/constants.js';

export const ACHIEVEMENTS = [
  { id: 'first_blood',     name: 'First Blood',      desc: '初めてブロックを破壊',           color: COLORS.NEON_RED    },
  { id: 'combo_10',        name: 'Combo Master',      desc: '10コンボを達成',                 color: COLORS.NEON_YELLOW },
  { id: 'combo_50',        name: 'Combo King',        desc: '50コンボを達成',                 color: COLORS.GOLD        },
  { id: 'speed_run',       name: 'Speed Runner',      desc: '60秒以内にレベルクリア',         color: COLORS.NEON_GREEN  },
  { id: 'untouchable',     name: 'Untouchable',       desc: 'ミスなしでレベルクリア',         color: COLORS.NEON_CYAN   },
  { id: 'multi_master',    name: 'Multi Master',      desc: '3球同時飛行',                    color: COLORS.NEON_BLUE   },
  { id: 'boss_slayer',     name: 'Boss Slayer',       desc: 'ボスを初撃破',                   color: COLORS.NEON_RED    },
  { id: 'boss_crusher',    name: 'Boss Crusher',      desc: 'ボス5体撃破',                    color: COLORS.NEON_PINK   },
  { id: 'collector',       name: 'Collector',         desc: '全15種パワーアップを取得',        color: COLORS.NEON_PURPLE },
  { id: 'shopaholic',      name: 'Shopaholic',        desc: 'ショップで5回購入',              color: COLORS.GOLD        },
  { id: 'centurion',       name: 'Centurion',         desc: 'ブロック100個破壊',              color: COLORS.NEON_CYAN   },
  { id: 'destroyer',       name: 'Destroyer',         desc: 'ブロック1000個破壊',             color: COLORS.NEON_ORANGE },
  { id: 'millionaire',     name: 'Millionaire',       desc: 'スコア1,000,000達成',            color: COLORS.GOLD        },
  { id: 'level_10',        name: 'Veteran',           desc: 'レベル10クリア',                 color: COLORS.NEON_GREEN  },
  { id: 'level_20',        name: 'Elite',             desc: 'レベル20クリア',                 color: COLORS.NEON_BLUE   },
  { id: 'time_attack',     name: 'Clock Beater',      desc: 'Time Attackモードクリア',        color: COLORS.NEON_YELLOW },
  { id: 'endless_10',      name: 'Endless Runner',    desc: 'Endlessモードでレベル10',        color: COLORS.NEON_PINK   },
  { id: 'no_powerup',      name: 'Purist',            desc: 'パワーアップなしでレベルクリア', color: COLORS.NEON_WHITE  },
  { id: 'explosive_chain', name: 'Chain Reaction',    desc: '爆発ブロック5連鎖',              color: COLORS.NEON_ORANGE },
  { id: 'all_clear',       name: 'Perfectionist',     desc: '全ブロック破壊でレベルクリア',   color: COLORS.NEON_GREEN  },
  { id: 'rainbow_hunter',  name: 'Rainbow Hunter',    desc: 'RAINBOWブロック10個破壊',        color: COLORS.NEON_PURPLE },
  { id: 'upgrade_master',  name: 'Upgrade Master',    desc: '永続アップグレードを全MAX',       color: COLORS.GOLD        },
];

export default class AchievementSystem {
  /**
   * @param {SaveSystem} saveSystem
   * @param {EventBus}   eventBus
   */
  constructor(saveSystem, eventBus) {
    this._save     = saveSystem;
    this._eventBus = eventBus;

    /** Session stats (reset per run). */
    this.session = {
      blocksDestroyed:      0,
      bossesDefeated:       0,
      shopPurchases:        0,
      highestLevel:         0,
      maxCombo:             0,
      powerupTypes:         new Set(),
      timeAttackCompleted:  false,
      endlessMaxLevel:      0,
      levelLivesLost:       0,
      levelNoPowerup:       true,
      levelAllClear:        false,
      explosionChain:       0,
      maxExplosionChain:    0,
      rainbowDestroyed:     0,
      score:                0,
      levelTime:            0,
    };

    // Listen for newly unlocked achievements to notify UI
    this._newlyUnlocked = [];
  }

  // ── Check and unlock ─────────────────────────────────────

  /**
   * Run all checks and unlock any new achievements.
   * @returns {string[]} newly unlocked IDs this call
   */
  check() {
    const s    = this.session;
    const save = this._save;
    const news = [];

    const conditions = {
      first_blood:     s.blocksDestroyed >= 1,
      combo_10:        s.maxCombo >= 10,
      combo_50:        s.maxCombo >= 50,
      speed_run:       s.levelTime <= 60 && s.levelTime > 0,
      untouchable:     s.levelLivesLost === 0,
      multi_master:    s.maxBallsActive >= 3,
      boss_slayer:     save.getStats().totalBossesDefeated >= 1 || s.bossesDefeated >= 1,
      boss_crusher:    (save.getStats().totalBossesDefeated ?? 0) + s.bossesDefeated >= 5,
      collector:       s.powerupTypes.size >= 15,
      shopaholic:      (save.getStats().totalShopPurchases ?? 0) + s.shopPurchases >= 5,
      centurion:       (save.getStats().totalBlocksDestroyed ?? 0) + s.blocksDestroyed >= 100,
      destroyer:       (save.getStats().totalBlocksDestroyed ?? 0) + s.blocksDestroyed >= 1000,
      millionaire:     s.score >= 1000000,
      level_10:        s.highestLevel >= 10,
      level_20:        s.highestLevel >= 20,
      time_attack:     s.timeAttackCompleted,
      endless_10:      s.endlessMaxLevel >= 10,
      no_powerup:      s.levelNoPowerup,
      explosive_chain: s.maxExplosionChain >= 5,
      all_clear:       s.levelAllClear,
      rainbow_hunter:  s.rainbowDestroyed >= 10,
      upgrade_master:  this._allUpgradesMaxed(),
    };

    for (const [id, cond] of Object.entries(conditions)) {
      if (cond && save.unlock(id)) {
        news.push(id);
        this._newlyUnlocked.push(id);
        this._eventBus.emit('achievement_unlocked', { id, name: this._getName(id) });
      }
    }

    return news;
  }

  /** After level ends — persist session deltas to save. */
  persistSession() {
    const s    = this.session;
    const save = this._save;
    const prev = save.getStats();

    save.updateStats({
      totalBlocksDestroyed: (prev.totalBlocksDestroyed ?? 0) + s.blocksDestroyed,
      totalBossesDefeated:  (prev.totalBossesDefeated  ?? 0) + s.bossesDefeated,
      totalShopPurchases:   (prev.totalShopPurchases   ?? 0) + s.shopPurchases,
      highestLevel:         Math.max(prev.highestLevel ?? 0, s.highestLevel),
      maxComboEver:         Math.max(prev.maxComboEver ?? 0, s.maxCombo),
      timeAttackCompleted:  prev.timeAttackCompleted || s.timeAttackCompleted,
      endlessMaxLevel:      Math.max(prev.endlessMaxLevel ?? 0, s.endlessMaxLevel),
    });

    for (const type of s.powerupTypes) {
      save.addPowerupType(type);
    }
  }

  resetSession() {
    this.session = {
      blocksDestroyed: 0, bossesDefeated: 0, shopPurchases: 0,
      highestLevel: 0, maxCombo: 0, powerupTypes: new Set(),
      timeAttackCompleted: false, endlessMaxLevel: 0,
      levelLivesLost: 0, levelNoPowerup: true, levelAllClear: false,
      explosionChain: 0, maxExplosionChain: 0, rainbowDestroyed: 0,
      score: 0, levelTime: 0, maxBallsActive: 0,
    };
    this._newlyUnlocked = [];
  }

  resetLevelSession() {
    this.session.levelLivesLost = 0;
    this.session.levelNoPowerup = true;
    this.session.levelAllClear  = false;
    this.session.explosionChain = 0;
    this.session.levelTime      = 0;
  }

  popNewlyUnlocked() {
    const list = [...this._newlyUnlocked];
    this._newlyUnlocked = [];
    return list;
  }

  // ── Data for UI ───────────────────────────────────────────

  /** Returns all achievements with unlocked status. */
  getAllWithStatus() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: this._save.isUnlocked(a.id),
    }));
  }

  // ── Internal helpers ─────────────────────────────────────

  _getName(id) {
    return ACHIEVEMENTS.find(a => a.id === id)?.name ?? id;
  }

  _allUpgradesMaxed() {
    const save = this._save;
    const maxLevels = { paddle_width: 3, ball_speed: 3, extra_life: 1, combo_time: 2, start_shield: 1 };
    return Object.entries(maxLevels).every(([id, max]) => save.getUpgradeLevel(id) >= max);
  }
}
