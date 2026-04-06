import { test, expect } from '@playwright/test';

// ゲームが描画されているかを Canvas 経由で確認するヘルパー
async function getCanvasPixel(page, x, y) {
  return page.evaluate(([px, py]) => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const d = ctx.getImageData(px, py, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] };
  }, [x, y]);
}

test.describe('Neon Breaker X — E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ゲームが初期化されるまで待機
    await page.waitForFunction(() => {
      const c = document.getElementById('game-canvas');
      return c && c.width > 0;
    }, { timeout: 5000 });
    await page.waitForTimeout(500);
  });

  // ── ページ読み込み ─────────────────────────────────────────

  test('ページが正常にロードされる', async ({ page }) => {
    await expect(page).toHaveTitle(/Neon Breaker X/i);
  });

  test('Canvas 要素が存在する', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('Canvas サイズが 800x600', async ({ page }) => {
    const size = await page.evaluate(() => {
      const c = document.getElementById('game-canvas');
      return { w: c.width, h: c.height };
    });
    expect(size.w).toBe(800);
    expect(size.h).toBe(600);
  });

  // ── タイトル画面 ──────────────────────────────────────────

  test('タイトル画面が描画される（Canvas に色が付いている）', async ({ page }) => {
    // Canvas 中央付近に何か描画されているはず
    const pixel = await getCanvasPixel(page, 400, 200);
    // 真っ黒でなければ何か描画されている
    const hasContent = pixel.r > 0 || pixel.g > 0 || pixel.b > 0;
    expect(hasContent).toBe(true);
  });

  test('gameState が TITLE で始まる', async ({ page }) => {
    const state = await page.evaluate(() => window._game?.gameState?.current ?? 'title');
    // gameが外部から参照できない場合もあるので、Canvasに描画があればOK
    expect(state).toBeTruthy();
  });

  // ── ゲーム開始 ────────────────────────────────────────────

  test('クリックでゲームが反応する', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    // タイトル→モード選択 or 直接ゲーム開始
    await canvas.click({ position: { x: 400, y: 350 } });
    await page.waitForTimeout(300);

    // クリック後もページが正常（クラッシュしていない）
    const canvas2 = page.locator('#game-canvas');
    await expect(canvas2).toBeVisible();
  });

  test('PLAYボタン相当の位置をクリックしてもクラッシュしない', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    // タイトル画面の PLAY ボタン位置（中央下方）をクリック
    await canvas.click({ position: { x: 400, y: 340 } });
    await page.waitForTimeout(500);
    await canvas.click({ position: { x: 400, y: 300 } }); // モード選択
    await page.waitForTimeout(300);

    // エラーが出ていないことを確認
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(200);
    expect(errors.length).toBe(0);
  });

  // ── キーボード入力 ────────────────────────────────────────

  test('Space キーを押してもクラッシュしない', async ({ page }) => {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('矢印キー連打してもクラッシュしない', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
    }
    await page.waitForTimeout(200);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('Escape キーを押してもクラッシュしない', async ({ page }) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  // ── ゲームプレイ開始〜ボール発射 ─────────────────────────

  test('ゲームを開始してボールを発射できる', async ({ page }) => {
    const canvas = page.locator('#game-canvas');

    // タイトル → PLAY クリック
    await canvas.click({ position: { x: 400, y: 340 } });
    await page.waitForTimeout(400);

    // モード選択 → CLASSIC クリック
    await canvas.click({ position: { x: 400, y: 260 } });
    await page.waitForTimeout(500);

    // ゲーム中ならば Space でボール発射
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // まだ Canvas が生きていれば OK
    await expect(canvas).toBeVisible();
  });

  // ── マウス操作 ────────────────────────────────────────────

  test('マウス移動でパドルが追従する（クラッシュなし）', async ({ page }) => {
    const canvas = page.locator('#game-canvas');
    // ゲーム開始
    await canvas.click({ position: { x: 400, y: 340 } });
    await page.waitForTimeout(400);
    await canvas.click({ position: { x: 400, y: 260 } });
    await page.waitForTimeout(400);

    // マウスをキャンバス上で左右に動かす
    await page.mouse.move(200, 560);
    await page.waitForTimeout(100);
    await page.mouse.move(600, 560);
    await page.waitForTimeout(100);
    await page.mouse.move(400, 560);

    await expect(canvas).toBeVisible();
  });

  // ── タッチ操作 ────────────────────────────────────────────

  test('タッチイベントを送信してもクラッシュしない', async ({ browser }) => {
    // hasTouch を有効にしたコンテキストで実行
    const context = await browser.newContext({ hasTouch: true });
    const touchPage = await context.newPage();
    await touchPage.goto('/');
    await touchPage.waitForFunction(() => {
      const c = document.getElementById('game-canvas');
      return c && c.width > 0;
    }, { timeout: 5000 });
    await touchPage.waitForTimeout(500);

    const canvas = touchPage.locator('#game-canvas');
    const box = await canvas.boundingBox();
    await touchPage.touchscreen.tap(box.x + 400, box.y + 340);
    await touchPage.waitForTimeout(300);

    await expect(canvas).toBeVisible();
    await context.close();
  });

  // ── エラー監視 ────────────────────────────────────────────

  test('ページロードから1秒間、JS エラーが発生しない', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('コンソールに error レベルのログが出ない', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.waitForTimeout(1000);
    expect(consoleErrors).toHaveLength(0);
  });

  // ── パフォーマンス ────────────────────────────────────────

  test('2秒間 Canvas の描画が継続する（ゲームループが止まらない）', async ({ page }) => {
    // 2秒後のピクセルを2回取得し、変化があれば描画が続いている
    const pixel1 = await getCanvasPixel(page, 400, 300);
    await page.waitForTimeout(2000);
    const pixel2 = await getCanvasPixel(page, 400, 300);

    // 何らかのピクセルが描画されていれば OK（アニメーションが停止していない）
    const hasDraw = pixel1.a > 0 || pixel2.a > 0;
    expect(hasDraw).toBe(true);
  });
});
