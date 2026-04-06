// jsdom環境のセットアップ
// Canvas APIのモック
class MockCanvasRenderingContext2D {
  constructor() {
    this.shadowBlur = 0;
    this.shadowColor = '';
    this.fillStyle = '';
    this.strokeStyle = '';
    this.globalAlpha = 1;
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
  }
  save() {}
  restore() {}
  beginPath() {}
  closePath() {}
  fill() {}
  stroke() {}
  arc() {}
  rect() {}
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fillText() {}
  strokeText() {}
  measureText(t) { return { width: t.length * 8 }; }
  moveTo() {}
  lineTo() {}
  arcTo() {}
  ellipse() {}
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
  drawImage() {}
  translate() {}
  rotate() {}
  scale() {}
  setTransform() {}
  resetTransform() {}
}

class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this._ctx = new MockCanvasRenderingContext2D();
  }
  getContext() { return this._ctx; }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 800, height: 600 };
  }
  addEventListener() {}
  removeEventListener() {}
}

// グローバルCanvas
global.HTMLCanvasElement = MockCanvas;
global.document = {
  ...global.document,
  getElementById: (id) => {
    if (id === 'game-canvas') return new MockCanvas();
    return null;
  },
  addEventListener: () => {},
};

// AudioContext のモック
class MockOscillator {
  constructor() {
    this.frequency = { value: 440, setValueAtTime() {}, linearRampToValueAtTime() {} };
    this.type = 'sine';
  }
  connect() { return this; }
  start() {}
  stop() {}
  disconnect() {}
}
class MockGainNode {
  constructor() {
    this.gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
  }
  connect() { return this; }
  disconnect() {}
}
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.state = 'running';
  }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGainNode(); }
  createDynamicsCompressor() {
    return {
      threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 },
      attack: { value: 0 }, release: { value: 0 },
      connect() { return this; }
    };
  }
  resume() { return Promise.resolve(); }
}
global.AudioContext = MockAudioContext;
global.window = {
  ...global.window,
  AudioContext: MockAudioContext,
  addEventListener: () => {},
};

// localStorage のモック
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

// requestAnimationFrame のモック
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
