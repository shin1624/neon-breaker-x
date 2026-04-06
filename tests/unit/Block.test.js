import { describe, it, expect, beforeEach } from 'vitest';
import Block from '../../src/entities/Block.js';
import { BLOCK_TYPES, BLOCK_WIDTH, BLOCK_HEIGHT } from '../../src/config/constants.js';

function makeBlock(type = BLOCK_TYPES.NORMAL) {
  return new Block(type, 0, 0, 100, 100, BLOCK_WIDTH, BLOCK_HEIGHT);
}

describe('Block', () => {
  // ── NORMAL ────────────────────────────────────────────────

  describe('NORMAL', () => {
    it('初期状態: alive=true, hp=1', () => {
      const b = makeBlock(BLOCK_TYPES.NORMAL);
      expect(b.alive).toBe(true);
      expect(b.hp).toBe(1);
    });

    it('hit: 1回で destroyed=true', () => {
      const b = makeBlock(BLOCK_TYPES.NORMAL);
      const result = b.hit();
      expect(result.destroyed).toBe(true);
      expect(b.alive).toBe(false);
    });
  });

  // ── TOUGH ─────────────────────────────────────────────────

  describe('TOUGH', () => {
    it('初期状態: hp > 1', () => {
      const b = makeBlock(BLOCK_TYPES.TOUGH);
      expect(b.maxHp).toBeGreaterThan(1);
    });

    it('hit: maxHp-1 回では破壊されない', () => {
      const b = makeBlock(BLOCK_TYPES.TOUGH);
      for (let i = 0; i < b.maxHp - 1; i++) b.hit();
      expect(b.alive).toBe(true);
    });

    it('hit: maxHp 回で破壊される', () => {
      const b = makeBlock(BLOCK_TYPES.TOUGH);
      for (let i = 0; i < b.maxHp; i++) b.hit();
      expect(b.alive).toBe(false);
    });
  });

  // ── BARRIER ───────────────────────────────────────────────

  describe('BARRIER', () => {
    it('何度 hit しても alive のまま（貫通ボール以外）', () => {
      const b = makeBlock(BLOCK_TYPES.BARRIER);
      for (let i = 0; i < 10; i++) b.hit({ piercing: false });
      expect(b.alive).toBe(true);
    });
  });

  // ── DIAMOND ───────────────────────────────────────────────

  describe('DIAMOND', () => {
    it('スコアが NORMAL より高い', () => {
      const normal  = makeBlock(BLOCK_TYPES.NORMAL);
      const diamond = makeBlock(BLOCK_TYPES.DIAMOND);
      expect(diamond.score).toBeGreaterThan(normal.score);
    });
  });

  // ── REGEN ─────────────────────────────────────────────────

  describe('REGEN', () => {
    it('ダメージを受けた後、3秒経つと HP が回復する', () => {
      const b = makeBlock(BLOCK_TYPES.REGEN);
      b.hit(); // hp を 1 減らす
      const hpAfterHit = b.hp;
      b.update(3.5); // 3秒以上経過
      expect(b.hp).toBeGreaterThan(hpAfterHit);
    });
  });

  // ── EXPLOSIVE ─────────────────────────────────────────────

  describe('EXPLOSIVE', () => {
    it('hit: special が explode_3x3 を返す', () => {
      const b = makeBlock(BLOCK_TYPES.EXPLOSIVE);
      // maxHp まで hit して破壊
      for (let i = 0; i < b.maxHp - 1; i++) b.hit();
      const result = b.hit();
      expect(result.special).toBe('explode_3x3');
    });
  });

  // ── MOVING ────────────────────────────────────────────────

  describe('MOVING', () => {
    it('update: x 座標が変化する', () => {
      const b = makeBlock(BLOCK_TYPES.MOVING);
      const initialX = b.x;
      b.update(0.5);
      expect(b.x).not.toBe(initialX);
    });
  });

  // ── RAINBOW ───────────────────────────────────────────────

  describe('RAINBOW', () => {
    it('スコアが NORMAL の 3 倍', () => {
      const normal  = makeBlock(BLOCK_TYPES.NORMAL);
      const rainbow = makeBlock(BLOCK_TYPES.RAINBOW);
      // RAINBOWはNORMALの3倍スコア
      expect(rainbow.score).toBe(normal.score * 3);
    });
  });

  // ── CRYSTAL ───────────────────────────────────────────────

  describe('CRYSTAL', () => {
    it('hit: special が drop_powerup を返す', () => {
      const b = makeBlock(BLOCK_TYPES.CRYSTAL);
      // maxHp まで hit して破壊
      for (let i = 0; i < b.maxHp - 1; i++) b.hit();
      const result = b.hit();
      expect(result.special).toBe('drop_powerup');
    });
  });

  // ── 共通 ──────────────────────────────────────────────────

  describe('共通', () => {
    it('centerX, centerY が正しく計算される', () => {
      const b = makeBlock();
      expect(b.centerX).toBe(b.x + b.width / 2);
      expect(b.centerY).toBe(b.y + b.height / 2);
    });

    it('alive=false のとき update は何もしない', () => {
      const b = makeBlock();
      b.hit(); // alive=false に
      const prevX = b.x;
      b.update(1);
      expect(b.x).toBe(prevX);
    });
  });
});
