import { describe, it, expect, beforeEach } from 'vitest';
import LevelSystem from '../../src/systems/LevelSystem.js';
import { BLOCK_TYPES, GAME_MODES } from '../../src/config/constants.js';

describe('LevelSystem', () => {
  let levelSys;

  beforeEach(() => {
    levelSys = new LevelSystem();
  });

  // ── generateLevel ─────────────────────────────────────────

  describe('generateLevel', () => {
    it('通常レベル: blocks が生成される', () => {
      const { blocks, boss } = levelSys.generateLevel(1);
      expect(blocks.length).toBeGreaterThan(0);
      expect(boss).toBeNull();
    });

    it('ボスレベル(5の倍数): boss が生成される', () => {
      const { blocks, boss } = levelSys.generateLevel(5);
      expect(boss).not.toBeNull();
      expect(blocks.length).toBe(0);
    });

    it('ボスレベル(10): boss が生成される', () => {
      const { blocks, boss } = levelSys.generateLevel(10);
      expect(boss).not.toBeNull();
    });

    it('BOSS_RUSH モード: 全レベルでボスが生成される', () => {
      const { boss } = levelSys.generateLevel(1, GAME_MODES.BOSS_RUSH);
      expect(boss).not.toBeNull();
    });

    it('レベル1: NORMAL ブロックが含まれる', () => {
      const { blocks } = levelSys.generateLevel(1);
      const hasNormal = blocks.some(b => b.type === BLOCK_TYPES.NORMAL);
      expect(hasNormal).toBe(true);
    });

    it('レベル1: 爆発ブロックは含まれない', () => {
      // レベル1は基本ブロックのみのはず（複数回試行でも）
      let hasExplosive = false;
      for (let i = 0; i < 10; i++) {
        const { blocks } = levelSys.generateLevel(1);
        if (blocks.some(b => b.type === BLOCK_TYPES.EXPLOSIVE)) {
          hasExplosive = true;
          break;
        }
      }
      expect(hasExplosive).toBe(false);
    });

    it('レベル10+: 多様なブロックタイプが登場する', () => {
      // 複数回生成してタイプの多様性を確認
      const types = new Set();
      for (let i = 0; i < 5; i++) {
        const { blocks } = levelSys.generateLevel(12);
        blocks.forEach(b => types.add(b.type));
      }
      expect(types.size).toBeGreaterThan(3);
    });

    it('blocks の x/y 座標が有効範囲内', () => {
      const { blocks } = levelSys.generateLevel(1);
      for (const b of blocks) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.width).toBeGreaterThan(0);
        expect(b.height).toBeGreaterThan(0);
      }
    });

    it('高 difficulty: ブロック数が増える', () => {
      let totalLow = 0, totalHigh = 0;
      for (let i = 0; i < 5; i++) {
        totalLow  += levelSys.generateLevel(3, GAME_MODES.CLASSIC, 0.0).blocks.length;
        totalHigh += levelSys.generateLevel(3, GAME_MODES.CLASSIC, 1.0).blocks.length;
      }
      // 高難易度の方がブロック数が多い傾向
      expect(totalHigh).toBeGreaterThanOrEqual(totalLow);
    });
  });

  // ── isComplete ────────────────────────────────────────────

  describe('isComplete', () => {
    it('全ブロックが destroyed のとき true', () => {
      const blocks = [
        { alive: false, type: BLOCK_TYPES.NORMAL },
        { alive: false, type: BLOCK_TYPES.TOUGH },
      ];
      expect(levelSys.isComplete(blocks)).toBe(true);
    });

    it('生きているブロックがあるとき false', () => {
      const blocks = [
        { alive: true,  type: BLOCK_TYPES.NORMAL },
        { alive: false, type: BLOCK_TYPES.NORMAL },
      ];
      expect(levelSys.isComplete(blocks)).toBe(false);
    });

    it('BARRIER のみ残っているとき true（破壊不能なので完了扱い）', () => {
      const blocks = [
        { alive: true,  type: BLOCK_TYPES.BARRIER },
        { alive: false, type: BLOCK_TYPES.NORMAL },
      ];
      expect(levelSys.isComplete(blocks)).toBe(true);
    });

    it('空配列のとき true', () => {
      expect(levelSys.isComplete([])).toBe(true);
    });

    it('BARRIER + 通常ブロックが残っているとき false', () => {
      const blocks = [
        { alive: true, type: BLOCK_TYPES.BARRIER },
        { alive: true, type: BLOCK_TYPES.NORMAL },
      ];
      expect(levelSys.isComplete(blocks)).toBe(false);
    });
  });

  // ── levelTime ─────────────────────────────────────────────

  describe('update / levelTime', () => {
    it('update: levelTime が増加する', () => {
      levelSys.update(1.0);
      expect(levelSys.levelTime).toBeGreaterThan(0);
    });

    it('startLevel: levelTime が 0 にリセットされる', () => {
      levelSys.update(5.0);
      levelSys.startLevel(); // 実装は startLevel()
      expect(levelSys.levelTime).toBe(0);
    });
  });
});
