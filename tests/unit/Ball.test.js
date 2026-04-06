import { describe, it, expect, beforeEach } from 'vitest';
import Ball from '../../src/entities/Ball.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, BALL_SPEED } from '../../src/config/constants.js';

describe('Ball', () => {
  let ball;

  beforeEach(() => {
    ball = new Ball(400, 300);
  });

  // ── 初期状態 ──────────────────────────────────────────────

  it('初期状態: active=true, onPaddle=false', () => {
    expect(ball.active).toBe(true);
    expect(ball.onPaddle).toBe(false);
  });

  it('初期速度はデフォルトで上方向 (vy < 0)', () => {
    expect(ball.vy).toBeLessThan(0);
  });

  it('radiusが正しい', () => {
    expect(ball.radius).toBe(BALL_RADIUS);
  });

  // ── 移動 ──────────────────────────────────────────────────

  it('update: onPaddle=true のとき移動しない', () => {
    ball.onPaddle = true;
    ball.vx = 100; ball.vy = -BALL_SPEED;
    const prevX = ball.x; const prevY = ball.y;
    ball.update(1 / 60);
    expect(ball.x).toBe(prevX);
    expect(ball.y).toBe(prevY);
  });

  it('update: active=false のとき処理をスキップ', () => {
    ball.active = false;
    const prevX = ball.x;
    ball.update(1 / 60);
    expect(ball.x).toBe(prevX);
  });

  it('update: 正しく移動する', () => {
    ball.vx = 100; ball.vy = -100;
    ball.update(1);
    expect(ball.x).toBeCloseTo(500);
    expect(ball.y).toBeCloseTo(200);
  });

  // ── 壁バウンス ────────────────────────────────────────────

  it('左壁: vx が正になり、x >= radius になる', () => {
    ball.x = 2; ball.vx = -200; ball.vy = -100;
    ball.update(1 / 60);
    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.x).toBeGreaterThanOrEqual(ball.radius);
  });

  it('右壁: vx が負になり、x <= CANVAS_WIDTH - radius になる', () => {
    ball.x = CANVAS_WIDTH - 2; ball.vx = 200; ball.vy = -100;
    ball.update(1 / 60);
    expect(ball.vx).toBeLessThan(0);
    expect(ball.x).toBeLessThanOrEqual(CANVAS_WIDTH - ball.radius);
  });

  it('上壁: vy が正になる', () => {
    ball.y = 2; ball.vy = -200; ball.vx = 0;
    ball.update(1 / 60);
    expect(ball.vy).toBeGreaterThan(0);
  });

  // ── ボールロスト ──────────────────────────────────────────

  it('画面下を通過したら active=false になる', () => {
    ball.y = CANVAS_HEIGHT + ball.radius + 10;
    ball.vy = 100; ball.vx = 0;
    ball.update(1 / 60);
    expect(ball.active).toBe(false);
  });

  it('画面下ギリギリでは active=true のまま', () => {
    ball.y = CANVAS_HEIGHT - ball.radius - 1;
    ball.vy = 10; ball.vx = 0;
    ball.update(1 / 60);
    expect(ball.active).toBe(true);
  });

  // ── スペシャルステート ─────────────────────────────────────

  it('applySlow: slowTimer がセットされ移動が遅くなる', () => {
    ball.vx = 0; ball.vy = -BALL_SPEED;
    ball.applySlow(2);
    const dt = 1 / 60;
    ball.update(dt);
    const normalMove = BALL_SPEED * dt;
    const slowMove   = BALL_SPEED * 0.45 * dt;
    // 実際の移動量は slowMove に近いはず
    expect(Math.abs(ball.y - 300)).toBeCloseTo(slowMove, 1);
  });

  // ── normaliseSpeed ────────────────────────────────────────

  it('normaliseSpeed: 速度を指定値に正規化する', () => {
    ball.vx = 300; ball.vy = -400;
    ball.normaliseSpeed(BALL_SPEED);
    expect(ball.speed).toBeCloseTo(BALL_SPEED, 1);
  });

  it('normaliseSpeed: vx=vy=0 でもクラッシュしない', () => {
    ball.vx = 0; ball.vy = 0;
    expect(() => ball.normaliseSpeed(BALL_SPEED)).not.toThrow();
  });

  // ── Trail ─────────────────────────────────────────────────

  it('trail: 移動すると履歴が蓄積される', () => {
    ball.vx = 0; ball.vy = -BALL_SPEED;
    for (let i = 0; i < 5; i++) ball.update(1 / 60);
    expect(ball.trail.length).toBeGreaterThan(0);
  });

  it('trail: maxTrail を超えない', () => {
    ball.vx = 0; ball.vy = -BALL_SPEED;
    for (let i = 0; i < 100; i++) ball.update(1 / 60);
    expect(ball.trail.length).toBeLessThanOrEqual(ball.maxTrail);
  });
});
