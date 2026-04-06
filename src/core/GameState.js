// ============================================================
// GameState.js — Simple state machine
// ============================================================
import { GAME_STATES } from '../config/constants.js';

export default class GameState {
  /**
   * @param {string} initial  One of GAME_STATES values
   */
  constructor(initial = GAME_STATES.TITLE) {
    this._state    = initial;
    this._previous = null;
    this._listeners = new Map();
  }

  get current() { return this._state; }
  get previous() { return this._previous; }

  /** Is the game currently in a playable state? */
  get isPlaying() {
    return this._state === GAME_STATES.PLAYING || this._state === GAME_STATES.BOSS;
  }

  /**
   * Transition to a new state.
   * @param {string} newState
   */
  set(newState) {
    if (newState === this._state) return;
    const old = this._state;
    this._previous = old;
    this._state    = newState;

    // Notify listeners
    this._notify(old, newState);
  }

  /**
   * Register a listener for state transitions.
   * @param {string|'*'} from  Source state or '*' for any
   * @param {string|'*'} to    Target state or '*' for any
   * @param {Function}   cb    callback(from, to)
   * @returns {Function} unsubscribe
   */
  onTransition(from, to, cb) {
    const key = `${from}→${to}`;
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(cb);
    return () => this._listeners.get(key)?.delete(cb);
  }

  _notify(from, to) {
    const keys = [`${from}→${to}`, `${from}→*`, `*→${to}`, `*→*`];
    for (const k of keys) {
      const set = this._listeners.get(k);
      if (set) for (const cb of set) cb(from, to);
    }
  }

  /** Shorthand checks */
  is(state)    { return this._state === state; }
  was(state)   { return this._previous === state; }
  isOneOf(...s){ return s.includes(this._state); }
}
