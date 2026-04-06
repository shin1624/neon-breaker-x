// ============================================================
// PhysicsSystem.js — Collision detection and response
// ============================================================
import { CANVAS_WIDTH, CANVAS_HEIGHT, BLOCK_TYPES } from '../config/constants.js';

export default class PhysicsSystem {
  /**
   * @param {EventBus} eventBus
   */
  constructor(eventBus) {
    this._eventBus = eventBus;
  }

  // ── Ball vs Paddle ────────────────────────────────────────

  /**
   * @param {Ball}   ball
   * @param {Paddle} paddle
   * @returns {boolean} collided?
   */
  ballVsPaddle(ball, paddle) {
    if (!ball.active || ball.onPaddle) return false;
    if (ball.vy <= 0) return false; // going upward — skip

    const bx = ball.x;
    const by = ball.y + ball.radius;

    if (by >= paddle.y && by <= paddle.y + paddle.height &&
        bx >= paddle.x && bx <= paddle.x + paddle.width) {

      // Determine hit position [-1 … 1] relative to paddle centre
      const relX = ((bx - paddle.x) / paddle.width) * 2 - 1; // -1 = left edge, +1 = right edge

      // Angle: centre = straight up, edges = steeper angle (max ±75°)
      const angle   = relX * 75 * (Math.PI / 180);
      const speed   = ball.speed;
      ball.vx = Math.sin(angle)  * speed;
      ball.vy = -Math.cos(angle) * speed;

      // Push ball above paddle
      ball.y = paddle.y - ball.radius - 1;

      // Magnetic: snap ball to paddle
      if (paddle.magnetic) {
        ball.onPaddle = true;
        ball.vx = 0;
        ball.vy = 0;
      }

      return true;
    }
    return false;
  }

  // ── Ball vs Shield ────────────────────────────────────────

  /**
   * Bottom shield bounces the ball upward.
   * @param {Ball}   ball
   * @param {Paddle} paddle
   * @returns {boolean}
   */
  ballVsShield(ball, paddle) {
    if (!paddle.shielded || !ball.active) return false;
    const shieldY = paddle.y + paddle.height + 10;
    if (ball.vy > 0 && ball.y + ball.radius >= shieldY && ball.y + ball.radius <= shieldY + 6) {
      ball.vy = -Math.abs(ball.vy);
      ball.y  = shieldY - ball.radius - 1;
      return true;
    }
    return false;
  }

  // ── Ball vs Block ─────────────────────────────────────────

  /**
   * AABB + circle collision. Returns hit result or null.
   * @param {Ball}  ball
   * @param {Block} block
   * @returns {{ side: string, result: object }|null}
   */
  ballVsBlock(ball, block) {
    if (!ball.active || !block.alive) return null;

    // Ghost ball passes through living blocks (except on hit roll inside Block.hit)
    // We still call hit() to allow the 30% ghost block pass logic

    const bx = ball.x, by = ball.y, br = ball.radius;
    const rx  = block.x, ry = block.y, rw = block.width, rh = block.height;

    // Closest point on rect to ball centre
    const clampX = Math.max(rx, Math.min(bx, rx + rw));
    const clampY = Math.max(ry, Math.min(by, ry + rh));

    const dx = bx - clampX;
    const dy = by - clampY;
    const dist = Math.hypot(dx, dy);

    if (dist > br) return null; // no collision

    // Determine side of block hit
    // Overlap depths
    const overlapLeft  = (bx + br) - rx;
    const overlapRight = (rx + rw) - (bx - br);
    const overlapTop   = (by + br) - ry;
    const overlapBot   = (ry + rh) - (by - br);

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBot);
    let side = 'top';
    if (minOverlap === overlapLeft)  { side = 'left';   ball.vx =  Math.abs(ball.vx); }
    else if (minOverlap === overlapRight) { side = 'right'; ball.vx = -Math.abs(ball.vx); }
    else if (minOverlap === overlapTop)   { side = 'top';   ball.vy =  Math.abs(ball.vy); }
    else                                  { side = 'bottom';ball.vy = -Math.abs(ball.vy); }

    // MIRROR block — invert both components
    if (block.type === BLOCK_TYPES.MIRROR) {
      ball.vx = -ball.vx;
      // let block.hit() return 'mirror_reflect'
    }

    const hitResult = block.hit(ball.piercing || ball.ghost, ball.fire);

    // Ghost pass — undo velocity change
    if (hitResult.special === 'ghost_pass') {
      // revert velocity
      if (side === 'left' || side === 'right') ball.vx = -ball.vx;
      else ball.vy = -ball.vy;
      return null;
    }

    // Barrier bounce — no destruction
    if (hitResult.special === 'barrier_bounce') {
      return { side, result: { destroyed: false, special: 'barrier' } };
    }

    return { side, result: hitResult };
  }

  // ── Ball vs Boss ──────────────────────────────────────────

  /**
   * @param {Ball} ball
   * @param {Boss} boss
   * @returns {boolean} hit?
   */
  ballVsBoss(ball, boss) {
    if (!ball.active || !boss.alive) return false;

    const bx = ball.x, by = ball.y, br = ball.radius;
    const rx = boss.x, ry = boss.y, rw = boss.width, rh = boss.height;

    if (bx + br < rx || bx - br > rx + rw || by + br < ry || by - br > ry + rh) return false;

    // Bounce off boss
    const aboveBelow = Math.min(
      Math.abs((by - br) - (ry + rh)),
      Math.abs((by + br) - ry)
    );
    const leftRight = Math.min(
      Math.abs((bx - br) - (rx + rw)),
      Math.abs((bx + br) - rx)
    );

    if (aboveBelow < leftRight) {
      ball.vy = -ball.vy;
      ball.y  = (by < ry + rh / 2) ? ry - br - 1 : ry + rh + br + 1;
    } else {
      ball.vx = -ball.vx;
    }

    boss.hit(ball.piercing);
    return true;
  }

  // ── PowerUp vs Paddle ─────────────────────────────────────

  /**
   * @param {PowerUp} pu
   * @param {Paddle}  paddle
   * @returns {boolean} collected?
   */
  powerUpVsPaddle(pu, paddle) {
    if (!pu.active) return false;

    const ux = pu.x, uy = pu.y, uw = pu.width, uh = pu.height;
    const px = paddle.x, py = paddle.y, pw = paddle.width, ph = paddle.height;

    if (ux + uw > px && ux < px + pw && uy + uh > py && uy < py + ph) {
      pu.active = false;
      return true;
    }
    return false;
  }

  // ── Boss projectile vs Paddle ─────────────────────────────

  /**
   * Returns true if any projectile hit the paddle.
   * @param {Boss}   boss
   * @param {Paddle} paddle
   * @returns {Projectile[]} hit projectiles
   */
  bossProjectilesVsPaddle(boss, paddle) {
    const hits = [];
    if (!boss || !boss.alive) return hits;

    for (const p of boss.projectiles) {
      if (!p.active) continue;
      const px = paddle.x, py = paddle.y, pw = paddle.width, ph = paddle.height;
      if (p.x > px && p.x < px + pw && p.y > py && p.y < py + ph + 10) {
        p.active = false;
        hits.push(p);
      }
    }
    return hits;
  }
}
