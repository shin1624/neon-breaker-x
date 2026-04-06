// ============================================================
// constants.js — Global game constants for Neon Breaker X
// ============================================================

export const CANVAS_WIDTH  = 800;
export const CANVAS_HEIGHT = 600;

// --- Paddle ---
export const PADDLE_WIDTH   = 110;
export const PADDLE_HEIGHT  = 12;
export const PADDLE_Y       = CANVAS_HEIGHT - 48;
export const PADDLE_SPEED   = 600; // px/s (keyboard)

// --- Ball ---
export const BALL_RADIUS = 7;
export const BALL_SPEED  = 340; // px/s base

// --- Blocks ---
export const BLOCK_COLS    = 12;
export const BLOCK_ROWS    = 8;
export const BLOCK_PAD     = 4;
export const BLOCK_OFFSET_X = 24;
export const BLOCK_OFFSET_Y = 60;
export const BLOCK_WIDTH   = Math.floor((CANVAS_WIDTH - BLOCK_OFFSET_X * 2 - BLOCK_PAD * (BLOCK_COLS - 1)) / BLOCK_COLS);
export const BLOCK_HEIGHT  = 22;

// --- FPS / Physics ---
export const TARGET_FPS      = 60;
export const FIXED_DT        = 1 / TARGET_FPS;
export const MAX_ACCUMULATOR = FIXED_DT * 5;

// ============================================================
// Block Types
// ============================================================
export const BLOCK_TYPES = {
  NORMAL:    'normal',
  TOUGH:     'tough',
  EXPLOSIVE: 'explosive',
  BARRIER:   'barrier',
  REGEN:     'regen',
  ELECTRIC:  'electric',
  MIRROR:    'mirror',
  MOVING:    'moving',
  BOMB:      'bomb',
  GHOST:     'ghost',
  DIAMOND:   'diamond',
  CRYSTAL:   'crystal',
  STEEL:     'steel',
  FROZEN:    'frozen',
  RAINBOW:   'rainbow',
};

// ============================================================
// Power-Up Types
// ============================================================
export const POWERUP_TYPES = {
  MULTI_BALL:    'multi_ball',
  LASER:         'laser',
  WIDE_PADDLE:   'wide_paddle',
  NARROW_PADDLE: 'narrow_paddle',
  FAST_BALL:     'fast_ball',
  SLOW_BALL:     'slow_ball',
  PIERCE:        'pierce',
  MAGNETIC:      'magnetic',
  FIREBALL:      'fireball',
  SHIELD:        'shield',
  SLOW_TIME:     'slow_time',
  SCORE_BOOST:   'score_boost',
  EXTRA_LIFE:    'extra_life',
  BOMB_BALL:     'bomb_ball',
  GHOST_BALL:    'ghost_ball',
};

// ============================================================
// Game Modes
// ============================================================
export const GAME_MODES = {
  CLASSIC:     'classic',
  ENDLESS:     'endless',
  TIME_ATTACK: 'time_attack',
  BOSS_RUSH:   'boss_rush',
};

// ============================================================
// Game States
// ============================================================
export const GAME_STATES = {
  TITLE:          'title',
  MODE_SELECT:    'mode_select',
  HOW_TO_PLAY:    'how_to_play',
  PLAYING:        'playing',
  PAUSED:         'paused',
  LEVEL_COMPLETE: 'level_complete',
  SHOP:           'shop',
  BOSS:           'boss',
  GAME_OVER:      'game_over',
  ACHIEVEMENTS:   'achievements',
  VICTORY:        'victory',
};

// ============================================================
// Neon Colour Palette
// ============================================================
export const COLORS = {
  NEON_CYAN:   '#00ffff',
  NEON_PINK:   '#ff00ff',
  NEON_GREEN:  '#00ff88',
  NEON_ORANGE: '#ff6600',
  NEON_YELLOW: '#ffff00',
  NEON_PURPLE: '#aa00ff',
  NEON_BLUE:   '#0088ff',
  NEON_RED:    '#ff0044',
  NEON_WHITE:  '#e8f4ff',
  GOLD:        '#ffd700',
  BG_DARK:     '#0a0a1a',
  BG_MID:      '#0f0f2e',
  UI_DARK:     '#1a1a3e',
};

// Block type → colour mapping
export const BLOCK_COLORS = {
  [BLOCK_TYPES.NORMAL]:    COLORS.NEON_CYAN,
  [BLOCK_TYPES.TOUGH]:     COLORS.NEON_BLUE,
  [BLOCK_TYPES.EXPLOSIVE]: COLORS.NEON_ORANGE,
  [BLOCK_TYPES.BARRIER]:   '#555588',
  [BLOCK_TYPES.REGEN]:     COLORS.NEON_GREEN,
  [BLOCK_TYPES.ELECTRIC]:  COLORS.NEON_YELLOW,
  [BLOCK_TYPES.MIRROR]:    '#aaddff',
  [BLOCK_TYPES.MOVING]:    COLORS.NEON_PINK,
  [BLOCK_TYPES.BOMB]:      COLORS.NEON_RED,
  [BLOCK_TYPES.GHOST]:     '#8888aa',
  [BLOCK_TYPES.DIAMOND]:   '#88ffff',
  [BLOCK_TYPES.CRYSTAL]:   COLORS.NEON_PURPLE,
  [BLOCK_TYPES.STEEL]:     '#aaaaaa',
  [BLOCK_TYPES.FROZEN]:    '#88ddff',
  [BLOCK_TYPES.RAINBOW]:   COLORS.NEON_YELLOW,
};

// Block type → base HP
export const BLOCK_HP = {
  [BLOCK_TYPES.NORMAL]:    1,
  [BLOCK_TYPES.TOUGH]:     3,
  [BLOCK_TYPES.EXPLOSIVE]: 1,
  [BLOCK_TYPES.BARRIER]:   999,
  [BLOCK_TYPES.REGEN]:     2,
  [BLOCK_TYPES.ELECTRIC]:  1,
  [BLOCK_TYPES.MIRROR]:    1,
  [BLOCK_TYPES.MOVING]:    2,
  [BLOCK_TYPES.BOMB]:      1,
  [BLOCK_TYPES.GHOST]:     1,
  [BLOCK_TYPES.DIAMOND]:   5,
  [BLOCK_TYPES.CRYSTAL]:   2,
  [BLOCK_TYPES.STEEL]:     5,
  [BLOCK_TYPES.FROZEN]:    1,
  [BLOCK_TYPES.RAINBOW]:   1,
};

// Block type → score value
export const BLOCK_SCORE = {
  [BLOCK_TYPES.NORMAL]:    100,
  [BLOCK_TYPES.TOUGH]:     200,
  [BLOCK_TYPES.EXPLOSIVE]: 150,
  [BLOCK_TYPES.BARRIER]:   0,
  [BLOCK_TYPES.REGEN]:     175,
  [BLOCK_TYPES.ELECTRIC]:  125,
  [BLOCK_TYPES.MIRROR]:    110,
  [BLOCK_TYPES.MOVING]:    180,
  [BLOCK_TYPES.BOMB]:      200,
  [BLOCK_TYPES.GHOST]:     130,
  [BLOCK_TYPES.DIAMOND]:   500,
  [BLOCK_TYPES.CRYSTAL]:   250,
  [BLOCK_TYPES.STEEL]:     400,
  [BLOCK_TYPES.FROZEN]:    120,
  [BLOCK_TYPES.RAINBOW]:   300,
};

// PowerUp → display colour
export const POWERUP_COLORS = {
  [POWERUP_TYPES.MULTI_BALL]:    COLORS.NEON_CYAN,
  [POWERUP_TYPES.LASER]:         COLORS.NEON_RED,
  [POWERUP_TYPES.WIDE_PADDLE]:   COLORS.NEON_GREEN,
  [POWERUP_TYPES.NARROW_PADDLE]: COLORS.NEON_ORANGE,
  [POWERUP_TYPES.FAST_BALL]:     COLORS.NEON_YELLOW,
  [POWERUP_TYPES.SLOW_BALL]:     COLORS.NEON_BLUE,
  [POWERUP_TYPES.PIERCE]:        COLORS.NEON_PINK,
  [POWERUP_TYPES.MAGNETIC]:      COLORS.NEON_PURPLE,
  [POWERUP_TYPES.FIREBALL]:      COLORS.NEON_ORANGE,
  [POWERUP_TYPES.SHIELD]:        COLORS.NEON_CYAN,
  [POWERUP_TYPES.SLOW_TIME]:     COLORS.NEON_BLUE,
  [POWERUP_TYPES.SCORE_BOOST]:   COLORS.GOLD,
  [POWERUP_TYPES.EXTRA_LIFE]:    COLORS.NEON_RED,
  [POWERUP_TYPES.BOMB_BALL]:     COLORS.NEON_ORANGE,
  [POWERUP_TYPES.GHOST_BALL]:    '#aaaacc',
};

// PowerUp → display label (2 chars)
export const POWERUP_LABELS = {
  [POWERUP_TYPES.MULTI_BALL]:    '×3',
  [POWERUP_TYPES.LASER]:         'LZ',
  [POWERUP_TYPES.WIDE_PADDLE]:   '▬▬',
  [POWERUP_TYPES.NARROW_PADDLE]: '▬',
  [POWERUP_TYPES.FAST_BALL]:     '▶▶',
  [POWERUP_TYPES.SLOW_BALL]:     '◀◀',
  [POWERUP_TYPES.PIERCE]:        '⬛',
  [POWERUP_TYPES.MAGNETIC]:      'MG',
  [POWERUP_TYPES.FIREBALL]:      '🔥',
  [POWERUP_TYPES.SHIELD]:        'SH',
  [POWERUP_TYPES.SLOW_TIME]:     'ST',
  [POWERUP_TYPES.SCORE_BOOST]:   '×2',
  [POWERUP_TYPES.EXTRA_LIFE]:    '+♥',
  [POWERUP_TYPES.BOMB_BALL]:     'BM',
  [POWERUP_TYPES.GHOST_BALL]:    'GH',
};
