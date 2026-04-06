// ============================================================
// Game.js — Master game controller
// ============================================================
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  GAME_STATES, GAME_MODES, BLOCK_TYPES, POWERUP_TYPES,
  BALL_SPEED, COLORS,
} from './config/constants.js';

import EventBus         from './core/EventBus.js';
import GameLoop         from './core/GameLoop.js';
import GameState        from './core/GameState.js';
import SaveSystem       from './core/SaveSystem.js';

import Ball             from './entities/Ball.js';
import Paddle           from './entities/Paddle.js';
import PowerUp          from './entities/PowerUp.js';

import InputSystem      from './systems/InputSystem.js';
import AudioSystem      from './systems/AudioSystem.js';
import MusicSystem      from './systems/MusicSystem.js';
import ParticleSystem   from './systems/ParticleSystem.js';
import RenderSystem     from './systems/RenderSystem.js';
import PhysicsSystem    from './systems/PhysicsSystem.js';
import PowerUpSystem    from './systems/PowerUpSystem.js';
import ComboSystem      from './systems/ComboSystem.js';
import LevelSystem      from './systems/LevelSystem.js';
import AchievementSystem from './systems/AchievementSystem.js';
import ShopSystem       from './systems/ShopSystem.js';

import HUD              from './ui/HUD.js';
import TitleScreen      from './ui/TitleScreen.js';
import ModeSelectScreen from './ui/ModeSelectScreen.js';
import GameOverScreen   from './ui/GameOverScreen.js';
import LevelCompleteScreen from './ui/LevelCompleteScreen.js';
import ShopScreen       from './ui/ShopScreen.js';
import AchievementsScreen from './ui/AchievementsScreen.js';
import HowToPlayScreen  from './ui/HowToPlayScreen.js';

// Laser beam tracking
class Laser {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vy = -700;
    this.active = true;
    this.w = 4; this.h = 18;
  }
  update(dt) {
    this.y += this.vy * dt;
    if (this.y < -20) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.shadowBlur  = 10;
    ctx.shadowColor = COLORS.NEON_RED;
    ctx.fillStyle   = COLORS.NEON_RED;
    ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
    ctx.restore();
  }
}

export default class Game {
  constructor() {
    this.canvas      = document.getElementById('game-canvas');
    this.ctx         = this.canvas.getContext('2d');
    this.canvas.width  = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    // ── Core systems ──────────────────────────────────────────
    this.eventBus    = new EventBus();
    this.saveSystem  = new SaveSystem();
    this.gameState   = new GameState(GAME_STATES.TITLE);
    this.inputSystem = new InputSystem(this.canvas, this.eventBus);
    this.audio       = new AudioSystem();
    this.music       = new MusicSystem(this.audio);
    this.particles   = new ParticleSystem();
    this.renderer    = new RenderSystem(this.ctx, this.particles);

    // ── Game systems ─────────────────────────────────────────
    this.gameLoop    = new GameLoop(this._update.bind(this), this._draw.bind(this));
    this.physics     = new PhysicsSystem(this.eventBus);
    this.powerUpSys  = new PowerUpSystem(this.eventBus, this.audio, this.gameLoop);
    this.comboSys    = new ComboSystem(this.eventBus, this.audio);
    this.levelSys    = new LevelSystem();
    this.achievements= new AchievementSystem(this.saveSystem, this.eventBus);
    this.shop        = new ShopSystem(this.saveSystem);

    // ── UI ───────────────────────────────────────────────────
    this.hud          = new HUD(this.ctx);
    this.titleScreen  = new TitleScreen(this.ctx, this.inputSystem);
    this.modeSelect   = new ModeSelectScreen(this.ctx, this.inputSystem);
    this.gameOverUI   = new GameOverScreen(this.ctx, this.inputSystem, this.saveSystem);
    this.levelClearUI = new LevelCompleteScreen(this.ctx, this.inputSystem);
    this.shopUI       = new ShopScreen(this.ctx, this.inputSystem, this.shop);
    this.achieveUI    = new AchievementsScreen(this.ctx, this.inputSystem, this.achievements);
    this.howToUI      = new HowToPlayScreen(this.ctx, this.inputSystem);

    // ── Game data ─────────────────────────────────────────────
    this.balls    = [];
    this.paddle   = null;
    this.blocks   = [];
    this.powerUps = [];
    this.lasers   = [];
    this.boss     = null;

    this.score    = 0;
    this.lives    = 3;
    this.level    = 1;
    this.coins    = this.saveSystem.getCoins();
    this.mode     = GAME_MODES.CLASSIC;

    // Level-specific
    this._levelStartTime    = 0;
    this._levelMissCount    = 0;
    this._levelNoPowerup    = true;
    this._levelAllClear     = false;
    this._laserFireTimer    = 0;

    // Time Attack
    this._timeAttackLeft = 5 * 60;

    // Achievement notification queue
    this._achieveQueue   = [];
    this._achieveTimer   = 0;

    // Mouse state (canvas coords)
    this._mouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT };

    // Adaptive difficulty
    this._difficulty = 0.5;

    this._bindEvents();
  }

  // ── Boot ─────────────────────────────────────────────────

  start() {
    document.getElementById('loading').style.display = 'none';
    this.gameLoop.start();
  }

  // ── Event wiring ─────────────────────────────────────────

  _bindEvents() {
    // Canvas mouse tracking
    this.canvas.addEventListener('mousemove', e => {
      const rect   = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH  / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      this._mouse.x = (e.clientX - rect.left) * scaleX;
      this._mouse.y = (e.clientY - rect.top)  * scaleY;
    });

    // Click / tap routing
    const handleClick = (mx, my) => {
      this.audio.init();
      this.audio.resume();
      if (!this.music._playing) this.music.start();

      const state = this.gameState.current;

      if (state === GAME_STATES.TITLE) {
        const a = this.titleScreen.handleClick(mx, my);
        if (a) this._handleTitleAction(a);
      } else if (state === GAME_STATES.MODE_SELECT) {
        const a = this.modeSelect.handleClick(mx, my);
        if (a) this._handleModeSelectAction(a);
      } else if (state === GAME_STATES.PLAYING || state === GAME_STATES.BOSS) {
        this._launchBall();
      } else if (state === GAME_STATES.LEVEL_COMPLETE) {
        const a = this.levelClearUI.handleClick(mx, my);
        if (a) this._handleLevelClearAction(a);
      } else if (state === GAME_STATES.SHOP) {
        const a = this.shopUI.handleClick(mx, my);
        if (a) this._handleShopAction(a);
      } else if (state === GAME_STATES.GAME_OVER) {
        const a = this.gameOverUI.handleClick(mx, my);
        if (a) this._handleGameOverAction(a);
      } else if (state === GAME_STATES.ACHIEVEMENTS) {
        const a = this.achieveUI.handleClick(mx, my);
        if (a) this.gameState.set(GAME_STATES.TITLE);
      } else if (state === GAME_STATES.HOW_TO_PLAY) {
        const a = this.howToUI.handleClick(mx, my);
        if (a) this.gameState.set(GAME_STATES.TITLE);
      }
    };

    this.eventBus.on('click', ({ x }) => handleClick(x, this._mouse.y));
    this.eventBus.on('tap',   ({ x }) => handleClick(x, this._mouse.y));

    // Combo milestone → music boost
    this.eventBus.on('combo_milestone', () => this.music.boost());

    // Achievement unlocked → toast queue
    this.eventBus.on('achievement_unlocked', ({ name }) => {
      this._achieveQueue.push(name);
    });
  }

  // ── Main loop ─────────────────────────────────────────────

  _update(dt) {
    this.renderer.update(dt);
    this.particles.update(dt);

    const state = this.gameState.current;

    // Achievement toast
    this._updateAchieveToast(dt);

    switch (state) {
      case GAME_STATES.TITLE:
        this.titleScreen.update(dt);
        break;

      case GAME_STATES.MODE_SELECT:
        {
          const a = this.modeSelect.update(dt);
          if (a && typeof a === 'string') this._handleModeSelectAction(a);
        }
        break;

      case GAME_STATES.HOW_TO_PLAY:
        this.howToUI.update(dt);
        break;

      case GAME_STATES.PLAYING:
      case GAME_STATES.BOSS:
        this._updatePlaying(dt);
        break;

      case GAME_STATES.PAUSED:
        this._checkPauseToggle();
        break;

      case GAME_STATES.LEVEL_COMPLETE:
        this.levelClearUI.update(dt);
        break;

      case GAME_STATES.SHOP:
        this.shopUI.update(dt);
        break;

      case GAME_STATES.GAME_OVER:
        this.gameOverUI.update(dt);
        break;

      case GAME_STATES.ACHIEVEMENTS:
        this.achieveUI.update(dt);
        break;
    }

    // Flush input at end of update frame
    // (Not called here — called once in _draw via the RAF loop)
  }

  // ── Playing update ────────────────────────────────────────

  _updatePlaying(dt) {
    // Pause toggle
    if (this.inputSystem.wasJustPressed('KeyP') || this.inputSystem.wasJustPressed('Escape')) {
      this.gameState.set(GAME_STATES.PAUSED);
      return;
    }

    // Time Attack countdown
    if (this.mode === GAME_MODES.TIME_ATTACK) {
      this._timeAttackLeft -= dt;
      if (this._timeAttackLeft <= 0) {
        this._timeAttackLeft = 0;
        this._triggerGameOver();
        return;
      }
    }

    // Update paddle
    this.paddle.update(dt, this.inputSystem);

    // Ball launch
    if (this.inputSystem.wasJustPressed('Space') || this.inputSystem.wasJustPressed('Enter')) {
      this._launchBall();
    }

    // Update balls
    for (const ball of this.balls) {
      if (ball.onPaddle) {
        ball.x = this.paddle.centerX;
        ball.y = this.paddle.y - ball.radius - 1;
      }
      ball.update(dt);
    }

    // Magnetic: re-attach any onPaddle balls
    if (this.paddle.magnetic) {
      for (const b of this.balls) {
        if (b.onPaddle) { b.x = this.paddle.centerX; }
      }
    }

    // Ball vs Paddle
    for (const ball of this.balls) {
      if (this.physics.ballVsPaddle(ball, this.paddle)) {
        this.audio.playPaddleHit();
        this.particles.createBlockDestroy(ball.x, ball.y, COLORS.NEON_GREEN, 4);
      }
      this.physics.ballVsShield(ball, this.paddle);
    }

    // Ball vs Blocks
    this._processBallBlockCollisions();

    // Ball vs Boss
    if (this.boss && this.boss.alive) {
      this._processBallBossCollisions();
      this.boss.update(dt);

      // Boss projectiles vs paddle
      const hits = this.physics.bossProjectilesVsPaddle(this.boss, this.paddle);
      if (hits.length > 0) {
        this._loseLife();
      }
    }

    // PowerUps
    for (const pu of this.powerUps) {
      pu.update(dt);
      if (this.physics.powerUpVsPaddle(pu, this.paddle)) {
        this._collectPowerUp(pu.type);
        pu.active = false;
      }
    }
    this.powerUps = this.powerUps.filter(p => p.active && !p.offScreen);

    this.powerUpSys.update(dt, this.balls, this.paddle);
    this.powerUpSys.updateLaserCooldown(dt);

    // Laser fire
    if (this.paddle.laserActive) {
      this._laserFireTimer -= dt;
      if (this._laserFireTimer <= 0) {
        this._laserFireTimer = 0.18;
        const origin = this.powerUpSys.fireLaser(this.paddle);
        if (origin) {
          this.lasers.push(new Laser(origin.x - 8, origin.y));
          this.lasers.push(new Laser(origin.x + 8, origin.y));
        }
      }
    }

    // Update & collide lasers
    this._updateLasers(dt);

    this.comboSys.update(dt);
    this.levelSys.update(dt);

    // Update blocks
    for (const b of this.blocks) b.update(dt);

    // Balls lost
    const hadBalls = this.balls.some(b => b.active);
    const lostBalls = this.balls.filter(b => !b.active);
    this.balls = this.balls.filter(b => b.active);

    if (hadBalls && this.balls.length === 0) {
      this._ballsAllLost();
    }

    // Level complete check
    if (this.levelSys.isComplete(this.blocks) && !this.boss) {
      this._triggerLevelComplete();
    }
    if (this.boss && !this.boss.alive) {
      this.achievements.session.bossesDefeated++;
      this.audio.playBossDefeat();
      this.renderer.shake(12, 0.6);
      this.renderer.flash(COLORS.NEON_RED, 0.5);
      this.particles.createExplosion(
        this.boss.x + this.boss.width / 2,
        this.boss.y + this.boss.height / 2,
        80, COLORS.NEON_RED
      );
      this.boss = null;
      this._triggerLevelComplete();
    }

    // Achievement checks (non-intrusive, every frame is fine at 60fps)
    this.achievements.session.score = this.score;
    this.achievements.session.levelTime = this.levelSys.levelTime;
    this.achievements.session.maxBallsActive =
      Math.max(this.achievements.session.maxBallsActive ?? 0, this.balls.length);
    const news = this.achievements.check();
    for (const id of news) {
      this._achieveQueue.push(
        this.achievements.getAllWithStatus().find(a => a.id === id)?.name ?? id
      );
    }
  }

  // ── Ball vs Block ─────────────────────────────────────────

  _processBallBlockCollisions() {
    for (const ball of this.balls) {
      if (!ball.active) continue;

      let explosionChain = 0;
      const toExplode = [];

      for (const block of this.blocks) {
        if (!block.alive) continue;

        const result = this.physics.ballVsBlock(ball, block);
        if (!result) continue;

        const { result: hitResult } = result;

        if (hitResult.special === 'barrier') {
          this.audio.playBlockHit(block.type);
          this.renderer.shake(2, 0.1);
          continue;
        }

        this.audio.playBlockHit(block.type);
        this.comboSys.onHit();
        this.achievements.session.blocksDestroyed++;

        const baseScore = block.score * this.comboSys.multiplier * this.powerUpSys.scoreMultiplier;

        if (block.type === BLOCK_TYPES.RAINBOW) {
          this.score += baseScore * 3;
          this.achievements.session.rainbowDestroyed++;
        } else {
          this.score += baseScore;
        }

        this.particles.createBlockDestroy(block.centerX, block.centerY, block.color);
        this.particles.createScoreText(block.centerX, block.centerY - 16, Math.round(baseScore));

        if (hitResult.destroyed) {
          // Special destruction effects
          if (hitResult.special === 'explode_3x3') {
            this._triggerExplosion(block, 1, 0);
            explosionChain++;
          }
          if (hitResult.special === 'explode_5x5') {
            this._triggerExplosion(block, 2, 0);
            explosionChain += 2;
            this.renderer.shake(8, 0.35);
            this.audio.playExplosion();
          }
          if (hitResult.special === 'drop_powerup') {
            const pu = new PowerUp(POWERUP_TYPES.MULTI_BALL, block.centerX - 14, block.centerY);
            this.powerUps.push(pu);
          } else {
            const dropped = PowerUpSystem.maybeDropPowerUp(block.centerX, block.centerY);
            if (dropped) this.powerUps.push(dropped);
          }
          if (hitResult.special === 'electric') {
            this.particles.createElectric(block.centerX, block.centerY);
            this.audio.playElectric();
          }
          if (hitResult.special === 'rainbow_bonus') {
            this.particles.createComboText(block.centerX, block.centerY - 24, 'RAINBOW!', COLORS.NEON_PURPLE);
          }
        }

        if (hitResult.special === 'electric_redirect') {
          ball.vx += (Math.random() - 0.5) * 100;
          ball.vy += (Math.random() - 0.5) * 100;
          ball.normaliseSpeed(ball.speed);
          this.particles.createElectric(block.centerX, block.centerY);
          this.audio.playElectric();
        }

        if (hitResult.special === 'freeze_ball') {
          ball.applySlow(0.5);
        }

        // BombBall: explode 5x5 on next hit
        if (ball.bombNext) {
          ball.bombNext = false;
          this._triggerExplosion(block, 2, 0);
          this.renderer.shake(8, 0.35);
          this.audio.playExplosion();
        }

        // Fireball: destroy without HP check
        if (ball.fire && !hitResult.destroyed && block.type !== BLOCK_TYPES.BARRIER) {
          block.hp = 0;
          block.alive = false;
          this.particles.createExplosion(block.centerX, block.centerY, 30, COLORS.NEON_ORANGE);
        }

        // Track achievements
        if (explosionChain > 0) {
          this.achievements.session.explosionChain += explosionChain;
          this.achievements.session.maxExplosionChain = Math.max(
            this.achievements.session.maxExplosionChain,
            this.achievements.session.explosionChain
          );
        }
      }
    }
  }

  _triggerExplosion(sourceBlock, radius, depth) {
    if (depth > 3) return; // cap chain
    for (const b of this.blocks) {
      if (!b.alive) continue;
      const dc = Math.abs(b.col - sourceBlock.col);
      const dr = Math.abs(b.row - sourceBlock.row);
      if (dc <= radius && dr <= radius && b !== sourceBlock) {
        const was = b.alive;
        b.hp = 0;
        b.alive = false;
        if (was) {
          this.score += b.score * this.comboSys.multiplier;
          this.particles.createBlockDestroy(b.centerX, b.centerY, b.color, 8);
          if (b.type === BLOCK_TYPES.EXPLOSIVE) {
            this._triggerExplosion(b, 1, depth + 1);
          }
        }
      }
    }
    this.particles.createExplosion(sourceBlock.centerX, sourceBlock.centerY, 35 + radius * 10);
    this.renderer.shake(4 + radius * 2, 0.25);
  }

  // ── Ball vs Boss ──────────────────────────────────────────

  _processBallBossCollisions() {
    for (const ball of this.balls) {
      if (!ball.active || !this.boss.alive) continue;
      if (this.physics.ballVsBoss(ball, this.boss)) {
        this.audio.playBossHit();
        this.renderer.shake(5, 0.2);
        this.particles.createBossHit(
          this.boss.x + this.boss.width / 2,
          this.boss.y + this.boss.height / 2
        );
        this.score += 200 * this.comboSys.multiplier;
        this.comboSys.onHit();
      }
    }
  }

  // ── Lasers ────────────────────────────────────────────────

  _updateLasers(dt) {
    for (const laser of this.lasers) {
      laser.update(dt);
      if (!laser.active) continue;

      for (const block of this.blocks) {
        if (!block.alive) continue;
        if (laser.x > block.x && laser.x < block.x + block.width &&
            laser.y < block.y + block.height && laser.y + laser.h > block.y) {
          const was = block.alive;
          block.hit(true);
          if (!block.alive && was) {
            this.score += block.score * this.comboSys.multiplier;
            this.particles.createBlockDestroy(block.centerX, block.centerY, block.color, 6);
            this.comboSys.onHit();
          }
          if (block.type !== BLOCK_TYPES.BARRIER) laser.active = false;
        }
      }

      if (this.boss && this.boss.alive &&
          laser.x > this.boss.x && laser.x < this.boss.x + this.boss.width &&
          laser.y < this.boss.y + this.boss.height) {
        this.boss.hit(true);
        laser.active = false;
        this.audio.playBossHit();
        this.score += 100;
        if (!this.boss.alive) {
          this.achievements.session.bossesDefeated++;
          this.boss = null;
          this._triggerLevelComplete();
        }
      }
    }
    this.lasers = this.lasers.filter(l => l.active);
  }

  // ── Power-up collection ───────────────────────────────────

  _collectPowerUp(type) {
    this._levelNoPowerup = false;
    this.achievements.session.levelNoPowerup = false;
    this.achievements.session.powerupTypes.add(type);

    const gs = { lives: this.lives, score: this.score };
    this.powerUpSys.collect(type, this.balls, this.paddle, gs);
    this.lives = gs.lives; // extra life may have been granted

    this.achievements.check();
  }

  // ── Ball management ───────────────────────────────────────

  _launchBall() {
    const waiting = this.balls.find(b => b.onPaddle);
    if (waiting) {
      waiting.onPaddle = false;
      const speed = BALL_SPEED * this.shop.getBallSpeedMult();
      waiting.vx  = (Math.random() - 0.5) * 80;
      waiting.vy  = -speed;
      waiting.normaliseSpeed(speed);
    }
  }

  _spawnBallOnPaddle() {
    const b = new Ball(this.paddle.centerX, this.paddle.y - 8);
    b.onPaddle = true;
    this.balls.push(b);
  }

  _ballsAllLost() {
    this.comboSys.reset();
    this._loseLife();
  }

  _loseLife() {
    this.lives--;
    this._levelMissCount++;
    this.achievements.session.levelLivesLost++;
    this.renderer.shake(10, 0.5);
    this.renderer.flash(COLORS.NEON_RED, 0.5);
    this.audio.playBallLost();

    // Adaptive difficulty: player is struggling → easier
    this._difficulty = Math.max(0.1, this._difficulty - 0.1);

    if (this.lives <= 0) {
      this._triggerGameOver();
      return;
    }
    // Respawn
    this._spawnBallOnPaddle();

    // Shield from powerup is lost
    if (this.paddle.shielded) this.paddle.shielded = false;
    // Re-apply start shield if upgrade active
    if (this.shop.hasStartShield()) this.paddle.shielded = true;
  }

  // ── Level management ─────────────────────────────────────

  _startLevel(levelNum) {
    this.level    = levelNum;
    this.blocks   = [];
    this.powerUps = [];
    this.lasers   = [];
    this.boss     = null;

    this._levelMissCount = 0;
    this._levelNoPowerup = true;
    this.achievements.resetLevelSession();

    // Apply shop upgrades to combo system
    this.comboSys.bonusTimeout = this.shop.getBonusComboTime();

    this.levelSys.startLevel();

    const { blocks, boss } = this.levelSys.generateLevel(levelNum, this.mode, this._difficulty);
    this.blocks = blocks;
    this.boss   = boss;

    // Paddle
    if (!this.paddle) this.paddle = new Paddle();
    this.paddle.applyWidthMult(this.shop.getPaddleWidthMult());
    this.paddle.shielded = this.shop.hasStartShield();

    // Apply pending temp shop items
    if (this.shop.hasPending('temp_multi_ball')) {
      this.shop.consumePending('temp_multi_ball');
      for (let i = 0; i < 2; i++) {
        const ang = (Math.random() - 0.5) * 0.8;
        const spd = BALL_SPEED * this.shop.getBallSpeedMult();
        this.balls.push(new Ball(
          this.paddle.centerX,
          this.paddle.y - 8,
          Math.sin(ang) * spd,
          -Math.cos(ang) * spd
        ));
      }
    }
    if (this.shop.hasPending('temp_score_boost')) {
      this.shop.consumePending('temp_score_boost');
      this.powerUpSys._active.set(POWERUP_TYPES.SCORE_BOOST, { timer: 999, maxTimer: 999 });
      this.powerUpSys.scoreMultiplier = 2;
    }
    if (this.shop.hasPending('temp_laser')) {
      this.shop.consumePending('temp_laser');
      this.powerUpSys._active.set(POWERUP_TYPES.LASER, { timer: 8, maxTimer: 8 });
      this.paddle.laserActive = true;
    }

    // Spawn ball
    this._spawnBallOnPaddle();

    // Music
    if (boss) {
      this.music.setMode('boss');
    } else if (levelNum >= 8) {
      this.music.setMode('intense');
    } else {
      this.music.setMode('normal');
    }

    this.gameState.set(boss ? GAME_STATES.BOSS : GAME_STATES.PLAYING);

    this.achievements.session.highestLevel = Math.max(this.achievements.session.highestLevel, levelNum);
  }

  _triggerLevelComplete() {
    // All-clear bonus
    const allClear = this.blocks.every(b => !b.alive);
    this._levelAllClear = allClear;
    this.achievements.session.levelAllClear = allClear;

    const time    = this.levelSys.levelTime;
    const noMiss  = this._levelMissCount === 0;
    const bonus   = this.levelSys.calculateBonusScore(
      this.level, time, noMiss, allClear, this.comboSys.maxCombo
    );
    const coinsEarned = this.levelSys.calculateCoins(
      this.level, time, noMiss, allClear, this.comboSys.maxCombo
    );

    this.score += bonus.total;
    this.coins += coinsEarned;
    this.saveSystem.addCoins(coinsEarned);

    this.audio.playLevelComplete();
    this.renderer.flash(COLORS.NEON_GREEN, 0.4);

    // Adaptive difficulty: player cleared → harder
    this._difficulty = Math.min(0.95, this._difficulty + 0.05);

    this.levelClearUI.reset({
      level: this.level,
      baseScore: this.score - bonus.total,
      bonus,
      coins: coinsEarned,
      mode: this.mode,
    });

    this.achievements.check();
    this.achievements.persistSession();

    this.gameState.set(GAME_STATES.LEVEL_COMPLETE);
    this.music.setMode('victory');
  }

  _triggerGameOver() {
    this.audio.playGameOver();
    this.renderer.shake(15, 0.8);
    this.renderer.flash(COLORS.NEON_RED, 0.6);
    this.music.setMode('normal');
    this.music.setVolume(0.08);

    this.achievements.check();
    this.achievements.persistSession();

    this.gameOverUI.reset(this.score, this.mode);
    this.gameState.set(GAME_STATES.GAME_OVER);
  }

  // ── Pause ─────────────────────────────────────────────────

  _checkPauseToggle() {
    if (this.inputSystem.wasJustPressed('KeyP') || this.inputSystem.wasJustPressed('Escape')) {
      this.gameState.set(this.gameState.previous === GAME_STATES.BOSS ? GAME_STATES.BOSS : GAME_STATES.PLAYING);
    }
  }

  // ── UI action handlers ────────────────────────────────────

  _handleTitleAction(action) {
    this.audio.init();
    this.audio.resume();
    if (!this.music._playing) this.music.start();

    switch (action) {
      case 'play':         this.gameState.set(GAME_STATES.MODE_SELECT); break;
      case 'achievements': this.gameState.set(GAME_STATES.ACHIEVEMENTS); break;
      case 'howtoplay':    this.gameState.set(GAME_STATES.HOW_TO_PLAY);  break;
    }
  }

  _handleModeSelectAction(action) {
    if (action === 'back') { this.gameState.set(GAME_STATES.TITLE); return; }
    this.mode  = action;
    this.score = 0;
    this.lives = 3 + this.shop.getBonusLives();
    this.level = 1;
    this.balls = [];
    this.achievements.resetSession();
    this._timeAttackLeft = 5 * 60;
    this.music.setVolume(0.25);
    this._startLevel(1);
  }

  _handleLevelClearAction(action) {
    if (action === 'shop') {
      this.gameState.set(GAME_STATES.SHOP);
    } else {
      this._startLevel(this.level + 1);
    }
  }

  _handleShopAction(action) {
    // 'continue'
    this._startLevel(this.level + 1);
  }

  _handleGameOverAction(action) {
    if (action === 'retry') {
      this.score = 0;
      this.lives = 3 + this.shop.getBonusLives();
      this.level = 1;
      this.balls = [];
      this.achievements.resetSession();
      this._timeAttackLeft = 5 * 60;
      this.music.setVolume(0.25);
      this._startLevel(1);
    } else {
      this.gameState.set(GAME_STATES.TITLE);
      this.music.setMode('normal');
    }
  }

  // ── Achievement toast ─────────────────────────────────────

  _updateAchieveToast(dt) {
    if (this._achieveTimer > 0) {
      this._achieveTimer -= dt;
      if (this._achieveTimer <= 0 && this._achieveQueue.length > 0) {
        this._achieveQueue.shift();
        this._achieveTimer = this._achieveQueue.length > 0 ? 2.5 : 0;
      }
    } else if (this._achieveQueue.length > 0) {
      this._achieveTimer = 2.5;
    }
  }

  // ── Draw ──────────────────────────────────────────────────

  _draw() {
    const ctx   = this.ctx;
    const state = this.gameState.current;

    this.renderer.begin();
    this.renderer.drawBackground();

    switch (state) {
      case GAME_STATES.TITLE:
        {
          const action = this.titleScreen.draw(this._mouse);
          if (action) this._handleTitleAction(action);
        }
        break;

      case GAME_STATES.MODE_SELECT:
        {
          const action = this.modeSelect.draw(this._mouse);
          if (action) this._handleModeSelectAction(action);
        }
        break;

      case GAME_STATES.HOW_TO_PLAY:
        {
          const action = this.howToUI.draw(this._mouse);
          if (action) this.gameState.set(GAME_STATES.TITLE);
        }
        break;

      case GAME_STATES.PLAYING:
      case GAME_STATES.BOSS:
        this._drawPlaying();
        break;

      case GAME_STATES.PAUSED:
        this._drawPlaying();
        this.hud.drawPaused();
        break;

      case GAME_STATES.LEVEL_COMPLETE:
        this._drawPlaying();
        {
          const a = this.levelClearUI.draw(this._mouse);
          if (a) this._handleLevelClearAction(a);
        }
        break;

      case GAME_STATES.SHOP:
        {
          const a = this.shopUI.draw(this._mouse);
          if (a) this._handleShopAction(a);
        }
        break;

      case GAME_STATES.GAME_OVER:
        this._drawPlaying();
        {
          const a = this.gameOverUI.draw(this._mouse);
          if (a) this._handleGameOverAction(a);
        }
        break;

      case GAME_STATES.ACHIEVEMENTS:
        {
          const a = this.achieveUI.draw(this._mouse);
          if (a) this.gameState.set(GAME_STATES.TITLE);
        }
        break;
    }

    // Achievement toast
    this._drawAchieveToast();

    this.renderer.end();

    // Flush input AFTER draw so UI screens can read wasJustPressed
    this.inputSystem.flush();
  }

  _drawPlaying() {
    // Blocks
    for (const b of this.blocks) b.draw(this.ctx);

    // Boss
    if (this.boss) this.boss.draw(this.ctx);

    // Power-ups
    for (const p of this.powerUps) p.draw(this.ctx);

    // Lasers
    for (const l of this.lasers) l.draw(this.ctx);

    // Particles
    this.particles.draw(this.ctx);

    // Paddle
    if (this.paddle) this.paddle.draw(this.ctx);

    // Balls
    for (const b of this.balls) b.draw(this.ctx);

    // HUD
    this.hud.draw({
      lives:        this.lives,
      score:        this.score,
      highScore:    this.saveSystem.getHighScore(this.mode),
      level:        this.level,
      mode:         this.mode,
      combo:        this.comboSys.getDisplayInfo(),
      activePowerups: this.powerUpSys.getActiveList(),
      timeLeft:     this.mode === GAME_MODES.TIME_ATTACK ? this._timeAttackLeft : null,
      coins:        this.coins,
    });
  }

  _drawAchieveToast() {
    if (this._achieveQueue.length === 0 || this._achieveTimer <= 0) return;
    const name  = this._achieveQueue[0];
    const alpha = Math.min(1, this._achieveTimer * 2, (this._achieveTimer));
    const ctx   = this.ctx;
    const w = 260, h = 44;
    const x = CANVAS_WIDTH - w - 10;
    const y = 45;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = 'rgba(0,0,20,0.85)';
    ctx.strokeStyle = COLORS.GOLD;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = COLORS.GOLD;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.shadowBlur   = 6;
    ctx.fillStyle    = COLORS.GOLD;
    ctx.font         = 'bold 11px monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 ACHIEVEMENT UNLOCKED', x + 10, y + 14);
    ctx.fillStyle    = '#ffffff';
    ctx.font         = '11px monospace';
    ctx.fillText(name, x + 10, y + 30);
    ctx.restore();
  }
}
