// ============================================================
// main.js — Entry point for Neon Breaker X
// ============================================================
import Game from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
