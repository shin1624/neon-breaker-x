// ============================================================
// PowerUpSystem.js — Active powerup management
// ============================================================
import { POWERUP_TYPES, BALL_SPEED, COLORS } from '../config/constants.js';
import Ball from '../entities/Ball.js';
import PowerUp from '../entities/PowerUp.js';

const DURATIONS = {
  [POWERUP_TYPES.WIDE_PADDLE]:   12,
  [POWERUP_TYPES.NARROW_PADDLE]:  8,
  [POWERUP_TYPES.FAST_BALL]:     10,
  [POWERUP_TYPES.SLOW_BALL]:     10,
  [POWERUP_TYPES.PIERCE]:        12,
  [POWERUP_TYPES.MAGNETIC]:      10,
  [POWERUP_TYPES.FIREBALL]:      12,
  [POWERUP_TYPES.SLOW_TIME]:      5,
  [POWERUP_TYPES.SCORE_BOOST]:   30,
  [POWERUP_TYPES.LASER]:          5,
  [POWERUP_TYPES.GHOST_BALL]:    10,
};

export default class PowerUpSystem {
  /**
   * @param {EventBus}     eventBus
   * @param {AudioSystem}  audio
   * @param {GameLoop}     gameLoop   (for timeScale)
   */
  constructor(eventBus, audio, gameLoop) {
    this._eventBus = eventBus;
    this._audio    = audio;
    this._gameLoop = gameLoop;

    /** Active effects: Map<type, { timer, maxTimer }> */
    this._active = new Map();

    this.scoreMultiplier = 1;
    this._laserTimer     = 0;
    this._laserCooldown  = 0;
  }

  // ── Collect a power-up ────────────────────────────────────

  /**
   * Apply powerup effect to game state.
   * @param {string}   type
   * @param {Ball[]}   balls
   * @param {Paddle}   paddle
   * @param {object}   gameState  { lives, score }  (mutable)
   */
  collect(type, balls, paddle, gameState) {
    this._audio.init();
    this._audio.resume();

    if (type === POWERUP_TYPES.EXTRA_LIFE) {
      gameState.lives = Math.min(gameState.lives + 1, 9);
      this._audio.playExtraLife();
      this._eventBus.emit('powerup_extra_life');
      return;
    }
    if (type === POWERUP_TYPES.BOMB_BALL) {
      for (const b of balls) if (b.active) b.bombNext = true;
      return;
    }

    this._audio.playPowerUp();

    const dur = DURATIONS[type] ?? 10;
    this._active.set(type, { timer: dur, maxTimer: dur });

    // Immediate effects
    switch (type) {
      case POWERUP_TYPES.MULTI_BALL:
        this._spawnMultiBall(balls, paddle);
        this._active.delete(type); // instant
        break;
      case POWERUP_TYPES.SHIELD:
        paddle.shielded = true;
        this._active.delete(type); // shield stays until ball lost
        break;
      case POWERUP_TYPES.SLOW_TIME:
        if (this._gameLoop) this._gameLoop.timeScale = 0.45;
        break;
      case POWERUP_TYPES.SCORE_BOOST:
        this.scoreMultiplier = 2;
        break;
    }

    this._eventBus.emit('powerup_collected', { type });
  }

  _spawnMultiBall(balls, paddle) {
    const activeBalls = balls.filter(b => b.active && !b.onPaddle);
    if (activeBalls.length === 0) return;

    const ref   = activeBalls[0];
    const speed = ref.speed || BALL_SPEED;

    for (let i = 0; i < 2; i++) {
      if (balls.filter(b => b.active).length >= 5) break;
      const angle = (Math.random() - 0.5) * Math.PI * 0.5;
      const vx    = Math.sin(angle) * speed;
      const vy    = -Math.cos(angle) * speed;
      balls.push(new Ball(ref.x, ref.y, vx, vy));
    }
  }

  // ── Update ────────────────────────────────────────────────

  /**
   * @param {number} dt
   * @param {Ball[]} balls
   * @param {Paddle} paddle
   */
  update(dt, balls, paddle) {
    for (const [type, state] of this._active) {
      state.timer -= dt;
      if (state.timer <= 0) {
        this._deactivate(type, balls, paddle);
        this._active.delete(type);
      }
    }

    // Apply continuous effects
    this._applyBallEffects(balls);
    this._applyPaddleEffects(paddle);
  }

  _deactivate(type, balls, paddle) {
    switch (type) {
      case POWERUP_TYPES.WIDE_PADDLE:
      case POWERUP_TYPES.NARROW_PADDLE:
        paddle.applyWidthMult(1.0); // reset (upgrades re-applied in Game)
        break;
      case POWERUP_TYPES.FAST_BALL:
      case POWERUP_TYPES.SLOW_BALL:
        for (const b of balls) if (b.active) b.normaliseSpeed(BALL_SPEED);
        break;
      case POWERUP_TYPES.PIERCE:
        for (const b of balls) b.piercing = false;
        break;
      case POWERUP_TYPES.MAGNETIC:
        paddle.magnetic = false;
        break;
      case POWERUP_TYPES.FIREBALL:
        for (const b of balls) b.fire = false;
        break;
      case POWERUP_TYPES.SLOW_TIME:
        if (this._gameLoop) this._gameLoop.timeScale = 1;
        break;
      case POWERUP_TYPES.SCORE_BOOST:
        this.scoreMultiplier = 1;
        break;
      case POWERUP_TYPES.GHOST_BALL:
        for (const b of balls) b.ghost = false;
        break;
      case POWERUP_TYPES.LASER:
        paddle.laserActive = false;
        break;
    }
    this._eventBus.emit('powerup_expired', { type });
  }

  _applyBallEffects(balls) {
    const pierce  = this._active.has(POWERUP_TYPES.PIERCE);
    const fire    = this._active.has(POWERUP_TYPES.FIREBALL);
    const ghost   = this._active.has(POWERUP_TYPES.GHOST_BALL);
    const fast    = this._active.has(POWERUP_TYPES.FAST_BALL);
    const slow    = this._active.has(POWERUP_TYPES.SLOW_BALL);

    for (const b of balls) {
      if (!b.active) continue;
      b.piercing = pierce;
      b.fire     = fire;
      b.ghost    = ghost;

      // Speed normalisation (applied once on timer change — handled in deactivate)
    }

    // Apply speed on activation
    if (fast) {
      for (const b of balls) if (b.active) b.normaliseSpeed(BALL_SPEED * 1.3);
    } else if (slow) {
      for (const b of balls) if (b.active) b.normaliseSpeed(BALL_SPEED * 0.7);
    }
  }

  _applyPaddleEffects(paddle) {
    paddle.magnetic    = this._active.has(POWERUP_TYPES.MAGNETIC);
    paddle.laserActive = this._active.has(POWERUP_TYPES.LASER);

    // Width
    let wMult = 1;
    if (this._active.has(POWERUP_TYPES.WIDE_PADDLE))   wMult = 1.55;
    if (this._active.has(POWERUP_TYPES.NARROW_PADDLE)) wMult = 0.6;
    // External upgrade mult applied by Game.js
    return wMult;
  }

  // ── Laser ─────────────────────────────────────────────────

  /**
   * Attempt to fire laser.
   * @returns {{ x: number, y: number }|null} laser origin or null
   */
  fireLaser(paddle) {
    if (!this._active.has(POWERUP_TYPES.LASER)) return null;
    if (this._laserCooldown > 0) return null;
    this._laserCooldown = 0.22;
    return { x: paddle.centerX, y: paddle.y };
  }

  updateLaserCooldown(dt) {
    if (this._laserCooldown > 0) this._laserCooldown -= dt;
  }

  // ── Queries ───────────────────────────────────────────────

  isActive(type) { return this._active.has(type); }

  /** Array of { type, timer, maxTimer } for HUD. */
  getActiveList() {
    return [...this._active.entries()].map(([type, s]) => ({
      type, timer: s.timer, maxTimer: s.maxTimer,
    }));
  }

  clearAll(balls, paddle) {
    for (const type of this._active.keys()) {
      this._deactivate(type, balls, paddle);
    }
    this._active.clear();
    this.scoreMultiplier = 1;
  }

  // ── Powerup drop helper ───────────────────────────────────

  /**
   * Possibly drop a random powerup at (x, y).
   * @param {number} chance  0-1
   * @returns {PowerUp|null}
   */
  static maybeDropPowerUp(x, y, chance = 0.18) {
    if (Math.random() > chance) return null;
    const types = Object.values(POWERUP_TYPES).filter(t => t !== POWERUP_TYPES.NARROW_PADDLE);
    const type  = types[Math.floor(Math.random() * types.length)];
    return new PowerUp(type, x - 14, y);
  }
}
