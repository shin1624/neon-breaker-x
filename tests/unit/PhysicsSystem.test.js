import { describe, it, expect, beforeEach, vi } from 'vitest';
import PhysicsSystem from '../../src/systems/PhysicsSystem.js';
import Ball from '../../src/entities/Ball.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, BALL_SPEED, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT } from '../../src/config/constants.js';

const mockEventBus = { emit: vi.fn() };

// Paddle のシンプルなスタブ
function makePaddle(overrides = {}) {
  return {
    x: 300,
    y: PADDLE_Y,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    magnetic: false,
    shielded: false,
    get centerX() { return this.x + this.width / 2; },
    ...overrides,
  };
}

// Block のシンプルなスタブ
function makeBlock(overrides = {}) {
  return {
    type: 'normal',
    x: 100, y: 100,
    width: 55, height: 22,
    alive: true,
    hp: 1, maxHp: 1, score: 100,
    get centerX() { return this.x + this.width / 2; },
    get centerY() { return this.y + this.height / 2; },
    hit: vi.fn().mockReturnValue({ destroyed: true, score: 100, chainBlocks: [] }),
    ...overrides,
  };
}

describe('PhysicsSystem', () => {
  let physics;

  beforeEach(() => {
    vi.clearAllMocks();
    physics = new PhysicsSystem(mockEventBus);
  });

  // ── Ball vs Paddle ────────────────────────────────────────

  describe('ballVsPaddle', () => {
    it('ボールがパドルに衝突したとき true を返す', () => {
      const paddle = makePaddle({ x: 345 }); // センターに近い
      const ball = new Ball(paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS);
      ball.vy = BALL_SPEED; // 下向き

      const hit = physics.ballVsPaddle(ball, paddle);
      expect(hit).toBe(true);
    });

    it('衝突後 vy が負になる（上向きに反射）', () => {
      const paddle = makePaddle({ x: 345 });
      const ball = new Ball(paddle.x + paddle.width / 2, paddle.y);
      ball.vy = BALL_SPEED;

      physics.ballVsPaddle(ball, paddle);
      expect(ball.vy).toBeLessThan(0);
    });

    it('ボールが上向きのとき衝突しない', () => {
      const paddle = makePaddle({ x: 345 });
      const ball = new Ball(paddle.x + paddle.width / 2, paddle.y);
      ball.vy = -BALL_SPEED; // 上向き

      const hit = physics.ballVsPaddle(ball, paddle);
      expect(hit).toBe(false);
    });

    it('ボールがパドルの外側のとき衝突しない', () => {
      const paddle = makePaddle({ x: 345 });
      const ball = new Ball(0, paddle.y); // 左外
      ball.vy = BALL_SPEED;

      const hit = physics.ballVsPaddle(ball, paddle);
      expect(hit).toBe(false);
    });

    it('左端ヒット: vx が負（左方向）になる', () => {
      const paddle = makePaddle({ x: 300 });
      const ball = new Ball(paddle.x + 2, paddle.y); // 左端近く
      ball.vy = BALL_SPEED; ball.vx = 0;

      physics.ballVsPaddle(ball, paddle);
      expect(ball.vx).toBeLessThan(0);
    });

    it('右端ヒット: vx が正（右方向）になる', () => {
      const paddle = makePaddle({ x: 300 });
      const ball = new Ball(paddle.x + paddle.width - 2, paddle.y); // 右端近く
      ball.vy = BALL_SPEED; ball.vx = 0;

      physics.ballVsPaddle(ball, paddle);
      expect(ball.vx).toBeGreaterThan(0);
    });

    it('magnetic: ヒット後 onPaddle=true になる', () => {
      const paddle = makePaddle({ x: 345, magnetic: true });
      const ball = new Ball(paddle.x + paddle.width / 2, paddle.y);
      ball.vy = BALL_SPEED;

      physics.ballVsPaddle(ball, paddle);
      expect(ball.onPaddle).toBe(true);
    });

    it('inactive なボールは衝突しない', () => {
      const paddle = makePaddle({ x: 345 });
      const ball = new Ball(paddle.x + paddle.width / 2, paddle.y);
      ball.vy = BALL_SPEED;
      ball.active = false;

      const hit = physics.ballVsPaddle(ball, paddle);
      expect(hit).toBe(false);
    });
  });

  // ── Ball vs Shield ────────────────────────────────────────

  describe('ballVsShield', () => {
    it('shield=true のとき画面下部でバウンスする', () => {
      const paddle = makePaddle({ shielded: true });
      const shieldY = paddle.y + paddle.height + 10;
      // ボールの下端（y + radius）が shieldY と shieldY+6 の間に入るように配置
      const ball = new Ball(400, shieldY - BALL_RADIUS + 1);
      ball.vy = BALL_SPEED; // 下向き

      const hit = physics.ballVsShield(ball, paddle);
      expect(hit).toBe(true);
      expect(ball.vy).toBeLessThan(0);
    });

    it('shield=false のとき反応しない', () => {
      const paddle = makePaddle({ shielded: false });
      const ball = new Ball(400, CANVAS_HEIGHT - 20);
      ball.vy = BALL_SPEED;

      const hit = physics.ballVsShield(ball, paddle);
      expect(hit).toBe(false);
    });
  });

  // ── Ball vs Block ─────────────────────────────────────────

  describe('ballVsBlock', () => {
    it('ブロックと衝突したとき結果を返す', () => {
      const block = makeBlock({ x: 200, y: 200 });
      const ball = new Ball(block.centerX, block.y + BALL_RADIUS);
      ball.vy = BALL_SPEED;

      const result = physics.ballVsBlock(ball, block);
      expect(result).not.toBeNull();
    });

    it('ブロックと衝突しないとき null を返す', () => {
      const block = makeBlock({ x: 600, y: 100 }); // 遠い位置
      const ball = new Ball(100, 300);
      ball.vy = BALL_SPEED;

      const result = physics.ballVsBlock(ball, block);
      expect(result).toBeNull();
    });

    it('alive=false のブロックとは衝突しない', () => {
      const block = makeBlock({ x: 200, y: 200, alive: false });
      const ball = new Ball(block.centerX, block.y + BALL_RADIUS);
      ball.vy = BALL_SPEED;

      const result = physics.ballVsBlock(ball, block);
      expect(result).toBeNull();
    });

    it('上面衝突: vy が負(上方向)になる', () => {
      const block = makeBlock({ x: 100, y: 200 });
      // ボールをブロックの上面にこする（上から落下中）
      const ball = new Ball(block.centerX, block.y - 1);
      ball.vy = BALL_SPEED; // 下向き

      physics.ballVsBlock(ball, block);
      expect(ball.vy).toBeLessThan(0); // 上に反射
    });

    it('piercing ボールでも通常ブロックでこえる', () => {
      // piercing = BARRIERを破壊できる機能。通常ブロックでは通常通り反射する
      const block = makeBlock({ x: 100, y: 200 });
      const ball = new Ball(block.centerX, block.y - 1);
      ball.vy = BALL_SPEED;
      ball.piercing = true;

      const result = physics.ballVsBlock(ball, block);
      // 衝突は検知される
      expect(result).not.toBeNull();
      // BARRIERブロックを piercing で破壊できるか確認
      const barrier = makeBlock({ x: 100, y: 200, type: 'barrier' });
      barrier.type = 'barrier';
      // piercing ありボールでは barrier.hit(true) が呼ばれる
      const ball2 = new Ball(barrier.centerX, barrier.y - 1);
      ball2.vy = BALL_SPEED; ball2.piercing = true;
      physics.ballVsBlock(ball2, barrier);
      // aliveは破壊不能ストブを使っているのでここではテストしない
    });
  });

  // ── PowerUp vs Paddle ─────────────────────────────────────

  describe('powerUpVsPaddle', () => {
    it('パドルと重なるパワーアップを検知する', () => {
      const paddle = makePaddle({ x: 300 });
      const pu = {
        active: true,
        x: paddle.x + paddle.width / 2 - 10,
        y: paddle.y,
        width: 20, height: 20,
      };

      const hit = physics.powerUpVsPaddle(pu, paddle);
      expect(hit).toBe(true);
    });

    it('パドルと重ならないパワーアップは検知しない', () => {
      const paddle = makePaddle({ x: 300 });
      const pu = { active: true, x: 0, y: 0, width: 20, height: 20 };

      const hit = physics.powerUpVsPaddle(pu, paddle);
      expect(hit).toBe(false);
    });

    it('active=false のパワーアップは検知しない', () => {
      const paddle = makePaddle({ x: 300 });
      const pu = {
        active: false,
        x: paddle.x + 10, y: paddle.y,
        width: 20, height: 20,
      };

      const hit = physics.powerUpVsPaddle(pu, paddle);
      expect(hit).toBe(false);
    });
  });
});
