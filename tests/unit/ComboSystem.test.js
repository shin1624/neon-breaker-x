import { describe, it, expect, beforeEach, vi } from 'vitest';
import ComboSystem from '../../src/systems/ComboSystem.js';

// モック
const mockEventBus = { emit: vi.fn() };
const mockAudio    = { playCombo: vi.fn() };

describe('ComboSystem', () => {
  let combo;

  beforeEach(() => {
    vi.clearAllMocks();
    combo = new ComboSystem(mockEventBus, mockAudio);
  });

  // ── 初期状態 ──────────────────────────────────────────────

  it('初期状態: comboCount=0, maxCombo=0', () => {
    expect(combo.comboCount).toBe(0);
    expect(combo.maxCombo).toBe(0);
  });

  it('初期multiplier: 1', () => {
    expect(combo.multiplier).toBe(1);
  });

  // ── onHit ─────────────────────────────────────────────────

  it('onHit: comboCount が増加する', () => {
    combo.onHit();
    expect(combo.comboCount).toBe(1);
    combo.onHit();
    expect(combo.comboCount).toBe(2);
  });

  it('onHit: maxCombo が更新される', () => {
    combo.onHit();
    combo.onHit();
    combo.onHit();
    expect(combo.maxCombo).toBe(3);
  });

  it('onHit: audio.playCombo が呼ばれる', () => {
    combo.onHit();
    expect(mockAudio.playCombo).toHaveBeenCalledWith(1);
  });

  it('onHit×5: combo_milestone イベントが emit される', () => {
    for (let i = 0; i < 5; i++) combo.onHit();
    expect(mockEventBus.emit).toHaveBeenCalledWith('combo_milestone', expect.objectContaining({ count: 5 }));
  });

  it('onHit×3: combo_milestone は emit されない', () => {
    for (let i = 0; i < 3; i++) combo.onHit();
    expect(mockEventBus.emit).not.toHaveBeenCalledWith('combo_milestone', expect.anything());
  });

  // ── multiplier ────────────────────────────────────────────

  it('multiplier: コンボ5で2になる', () => {
    for (let i = 0; i < 5; i++) combo.onHit();
    expect(combo.multiplier).toBe(2);
  });

  it('multiplier: コンボ10で3になる', () => {
    for (let i = 0; i < 10; i++) combo.onHit();
    expect(combo.multiplier).toBe(3);
  });

  it('multiplier: 最大10でキャップされる', () => {
    for (let i = 0; i < 100; i++) combo.onHit();
    expect(combo.multiplier).toBe(10);
  });

  // ── タイムアウト ──────────────────────────────────────────

  it('update: タイムアウト前はコンボが維持される', () => {
    combo.onHit();
    combo.update(1.0); // 3秒タイムアウトなので1秒後はまだ有効
    expect(combo.comboCount).toBe(1);
  });

  it('update: タイムアウト後にcomboCountがリセットされる', () => {
    combo.onHit();
    combo.update(4.0); // 3秒を超える
    expect(combo.comboCount).toBe(0);
  });

  it('update: タイムアウト後もmaxComboは保持される', () => {
    combo.onHit();
    combo.onHit();
    combo.update(4.0);
    expect(combo.maxCombo).toBe(2);
  });

  // ── reset ─────────────────────────────────────────────────

  it('reset: comboCount が 0 に戻る', () => {
    combo.onHit(); combo.onHit(); combo.onHit();
    combo.reset();
    expect(combo.comboCount).toBe(0);
  });

  it('reset: maxCombo はリセットされない', () => {
    combo.onHit(); combo.onHit();
    combo.reset();
    expect(combo.maxCombo).toBe(2);
  });

  // ── bonusTimeout ─────────────────────────────────────────

  it('bonusTimeout: タイムアウトが延長される', () => {
    combo.bonusTimeout = 2; // 3 + 2 = 5秒
    combo.onHit();
    combo.update(4.0); // 5秒タイムアウトなので4秒後はまだ有効
    expect(combo.comboCount).toBe(1);
  });
});
