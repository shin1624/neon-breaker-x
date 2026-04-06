import { describe, it, expect, beforeEach } from 'vitest';
import SaveSystem from '../../src/core/SaveSystem.js';

describe('SaveSystem', () => {
  let save;

  beforeEach(() => {
    localStorage.clear();
    save = new SaveSystem();
  });

  // ── HighScore ─────────────────────────────────────────────

  it('初期ハイスコアは0', () => {
    expect(save.getHighScore('classic')).toBe(0);
    expect(save.getHighScore('endless')).toBe(0);
  });

  it('setHighScore: 高いスコアで更新される', () => {
    const updated = save.setHighScore('classic', 5000);
    expect(updated).toBe(true);
    expect(save.getHighScore('classic')).toBe(5000);
  });

  it('setHighScore: 低いスコアでは更新されない', () => {
    save.setHighScore('classic', 5000);
    const updated = save.setHighScore('classic', 3000);
    expect(updated).toBe(false);
    expect(save.getHighScore('classic')).toBe(5000);
  });

  it('setHighScore: 同スコアでは更新されない', () => {
    save.setHighScore('classic', 5000);
    const updated = save.setHighScore('classic', 5000);
    expect(updated).toBe(false);
  });

  it('複数モードのハイスコアが独立して管理される', () => {
    save.setHighScore('classic', 1000);
    save.setHighScore('endless', 2000);
    expect(save.getHighScore('classic')).toBe(1000);
    expect(save.getHighScore('endless')).toBe(2000);
  });

  // ── Coins ─────────────────────────────────────────────────

  it('初期コインは0', () => {
    expect(save.getCoins()).toBe(0);
  });

  it('addCoins: コインが増える', () => {
    save.addCoins(100);
    expect(save.getCoins()).toBe(100);
    save.addCoins(50);
    expect(save.getCoins()).toBe(150);
  });

  it('spendCoins: コインが減る', () => {
    save.addCoins(100);
    const ok = save.spendCoins(60);
    expect(ok).toBe(true);
    expect(save.getCoins()).toBe(40);
  });

  it('spendCoins: 残高不足の場合 false を返す', () => {
    save.addCoins(50);
    const ok = save.spendCoins(100);
    expect(ok).toBe(false);
    expect(save.getCoins()).toBe(50); // 変化しない
  });

  it('spendCoins: ちょうどの場合 true を返す', () => {
    save.addCoins(100);
    const ok = save.spendCoins(100);
    expect(ok).toBe(true);
    expect(save.getCoins()).toBe(0);
  });

  // ── Upgrades ─────────────────────────────────────────────

  it('初期アップグレードレベルは0', () => {
    expect(save.getUpgradeLevel('wider_paddle')).toBe(0);
  });

  it('setUpgradeLevel: レベルが保存される', () => {
    save.setUpgradeLevel('wider_paddle', 2);
    expect(save.getUpgradeLevel('wider_paddle')).toBe(2);
  });

  it('異なるアップグレードが独立して管理される', () => {
    save.setUpgradeLevel('wider_paddle', 3);
    save.setUpgradeLevel('faster_ball', 1);
    expect(save.getUpgradeLevel('wider_paddle')).toBe(3);
    expect(save.getUpgradeLevel('faster_ball')).toBe(1);
  });

  // ── Achievements ─────────────────────────────────────────

  it('初期状態では実績は解除されていない', () => {
    expect(save.isUnlocked('first_blood')).toBe(false);
  });

  it('unlock: 実績が解除される', () => {
    const isNew = save.unlock('first_blood');
    expect(isNew).toBe(true);
    expect(save.isUnlocked('first_blood')).toBe(true);
  });

  it('unlock: 既に解除済みなら false を返す', () => {
    save.unlock('first_blood');
    const isNew = save.unlock('first_blood');
    expect(isNew).toBe(false);
  });

  it('getUnlocked: 解除済み実績リストを返す', () => {
    save.unlock('first_blood');
    save.unlock('combo_10');
    const list = save.getUnlocked();
    expect(list).toContain('first_blood');
    expect(list).toContain('combo_10');
    expect(list.length).toBe(2);
  });

  // ── localStorage 永続化 ───────────────────────────────────

  it('データが localStorage に永続化され、再インスタンス化後も取得できる', () => {
    save.setHighScore('classic', 9999);
    save.addCoins(500);
    save.unlock('first_blood');

    // 新しいインスタンスで読み込み
    const save2 = new SaveSystem();
    expect(save2.getHighScore('classic')).toBe(9999);
    expect(save2.getCoins()).toBe(500);
    expect(save2.isUnlocked('first_blood')).toBe(true);
  });

  // ── reset ─────────────────────────────────────────────────

  it('reset: 全データが初期化される', () => {
    save.setHighScore('classic', 9999);
    save.addCoins(500);
    save.unlock('first_blood');
    save.reset();

    expect(save.getHighScore('classic')).toBe(0);
    expect(save.getCoins()).toBe(0);
    expect(save.isUnlocked('first_blood')).toBe(false);
  });

  // ── Powerup Types ─────────────────────────────────────────

  it('addPowerupType: タイプが記録される', () => {
    save.addPowerupType('multi_ball');
    expect(save.getPowerupTypesCount()).toBe(1);
  });

  it('addPowerupType: 重複は加算されない', () => {
    save.addPowerupType('multi_ball');
    save.addPowerupType('multi_ball');
    expect(save.getPowerupTypesCount()).toBe(1);
  });

  it('addPowerupType: 異なるタイプは加算される', () => {
    save.addPowerupType('multi_ball');
    save.addPowerupType('laser');
    expect(save.getPowerupTypesCount()).toBe(2);
  });
});
