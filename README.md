# Neon Breaker X 🎮

> THE ULTIMATE BLOCK BREAKER — 過去のすべての作品を超える最高品質のHTML5ブロック崩しゲーム

![Neon Breaker X](https://img.shields.io/badge/version-1.0.0-00ffff?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-ff00ff?style=for-the-badge)

---

## 概要

**Neon Breaker X** は、ネオンサイバーパンク美学とRPGライクなプログレッションを融合させた、究極のブロック崩しゲームです。

### 🆚 過去作品との差別化

| 機能 | 旧作 | Neon Breaker X |
|------|------|----------------|
| ゲームモード | 1種 | **4種** (Classic/Endless/Time Attack/Boss Rush) |
| ブロック種類 | 〜5種 | **15種** |
| パワーアップ | 〜8種 | **15種** |
| ショップ | なし | **RPGショップ + 永続アップグレード** |
| 実績 | なし | **22種の実績システム** |
| マルチボール | なし | **最大5球同時** |
| 動的難易度 | なし | **プレイヤー実力に自動適応** |
| セーブ | なし | **localStorageで永続保存** |
| ビジュアル | 基本グロー | **スターフィールド + スキャンライン + シェイク + フラッシュ** |

---

## 起動方法

```bash
cd /Users/yoshikawashin/project/life-repo/projects/neon-breaker-x
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080` を開く。

**または:**
```bash
npx serve .
```

---

## 操作方法

| 操作 | キーボード | マウス/タッチ |
|------|-----------|-------------|
| パドル移動 | ← → / A D | マウス移動 / スワイプ |
| ボール発射 | Space / Enter | クリック / タップ |
| ポーズ | P / Escape | — |

---

## ゲームモード

### 🔵 CLASSIC
全レベルをクリアする王道モード。レベル5・10・15…でボスが出現。

### 🟢 ENDLESS
無限に続くランダム生成レベル。どこまで行けるか挑戦しよう。

### 🟡 TIME ATTACK
5分以内に最高スコアを狙え！時間切れでゲームオーバー。

### 🔴 BOSS RUSH
ボスのみを連続撃破するストイックなモード。

---

## ブロックの種類（15種）

| カラー | タイプ | 効果 |
|--------|--------|------|
| 水色 | NORMAL | 1ヒットで破壊・基本ブロック |
| 青 | TOUGH | 2〜5ヒット必要・HPバー表示 |
| 橙 | EXPLOSIVE | 破壊時3×3範囲爆発 |
| 灰 | BARRIER | 破壊不能（貫通ボールのみ有効） |
| 緑 | REGEN | 3秒で1HP回復する |
| 黄 | ELECTRIC | ヒット時ボール方向ランダム変化 |
| 水 | MIRROR | ヒット時ボール反射角変化 |
| ピンク | MOVING | 左右に動き続ける |
| 赤 | BOMB | 破壊時5×5大爆発 |
| 薄灰 | GHOST | 30%の確率でボールをすり抜ける |
| 水色 | DIAMOND | 5ヒット必要・高スコア(500pts) |
| 紫 | CRYSTAL | 破壊時パワーアップ確定ドロップ |
| 白灰 | STEEL | 5ヒット必要・頑丈 |
| 水 | FROZEN | ヒット時ボールを一時スロー |
| 虹色 | RAINBOW | 毎フレーム色変化・破壊で3倍スコア |

---

## パワーアップ一覧（15種）

| 表示 | 効果 | 持続 |
|------|------|------|
| ×3 MULTI BALL | ボールを3球に増やす | 即時 |
| LZ LASER | 自動レーザー発射 | 5秒 |
| ▬▬ WIDE PADDLE | パドル幅1.5倍 | 12秒 |
| ▶▶ FAST BALL | ボール速度1.3倍 | 10秒 |
| ◀◀ SLOW BALL | ボール速度0.7倍 | 10秒 |
| ⬛ PIERCE | ブロック貫通 | 12秒 |
| MG MAGNETIC | ボールをパドルに引き付け | 10秒 |
| 🔥 FIREBALL | 爆発ボール | 12秒 |
| SH SHIELD | 画面下部バリア | 〜 |
| ST SLOW TIME | 時間を0.45倍スロー | 5秒 |
| ×2 SCORE BOOST | スコア2倍 | 30秒 |
| +♥ EXTRA LIFE | 残機+1 | 即時 |
| BM BOMB BALL | 次ヒットで5×5爆発 | 1回 |
| GH GHOST BALL | ブロックすり抜け | 10秒 |

---

## RPGショップ

レベルクリア後にコインで強化できます（localStorageに永続保存）。

### 永続アップグレード
| 名称 | 効果 | 最大レベル | 費用 |
|------|------|-----------|------|
| Wider Paddle | パドル幅+15%/Lv | 3 | 50/100/200 |
| Faster Ball | ボール速度+8%/Lv | 3 | 75/150/300 |
| Extra Life | 最大残機+1 | 1 | 100 |
| Combo Extend | コンボ猶予+1秒/Lv | 2 | 80/160 |
| Start Shield | レベル開始時シールド | 1 | 150 |

### 一時アイテム（次レベル用）
| 名称 | 効果 | 費用 |
|------|------|------|
| Multi Ball | マルチボール発動 | 30 |
| Laser Start | レーザー発動 | 25 |
| Score Boost | スコア×2 | 40 |

---

## 実績システム（22種）

- 🩸 First Blood — 初ブロック破壊
- 🎯 Combo Master — 10コンボ達成
- 👑 Combo King — 50コンボ達成
- ⚡ Speed Runner — 60秒以内クリア
- 🛡 Untouchable — ノーミスクリア
- 🎳 Multi Master — 3球同時飛行
- ⚔️ Boss Slayer — ボス初撃破
- 💀 Boss Crusher — ボス5体撃破
- 💼 Collector — 全パワーアップ取得
- 🛒 Shopaholic — ショップ5回購入
- 💯 Centurion — ブロック100個
- 💥 Destroyer — ブロック1000個
- 💰 Millionaire — スコア100万
- 🎖 Veteran — レベル10クリア
- 🏆 Elite — レベル20クリア
- ⏱ Clock Beater — Time Attackクリア
- ∞ Endless Runner — Endlessでレベル10
- 😇 Purist — パワーアップなしクリア
- 🔗 Chain Reaction — 爆発5連鎖
- ✨ Perfectionist — 全ブロッククリア
- 🌈 Rainbow Hunter — RAINBOWブロック10個
- ⭐ Upgrade Master — 全永続アップグレードMAX

---

## 技術仕様

- **レンダリング**: HTML5 Canvas 2D + neon glow (shadowBlur)
- **音響**: Web Audio API (プロシージャル音楽 + SE)
- **アーキテクチャ**: ES6 Modules, OOP
- **永続化**: localStorage
- **依存関係**: ゼロ（外部ライブラリ不使用）
- **対応**: Chrome / Firefox / Safari / Edge + Mobile

---

## ファイル構成

```
neon-breaker-x/
├── index.html
├── README.md
└── src/
    ├── main.js             # エントリーポイント
    ├── Game.js             # メインゲームコントローラー
    ├── config/
    │   └── constants.js    # 全定数定義
    ├── core/
    │   ├── EventBus.js     # イベントシステム
    │   ├── GameLoop.js     # 固定タイムステップループ
    │   ├── GameState.js    # 状態マシン
    │   └── SaveSystem.js   # localStorage永続化
    ├── entities/
    │   ├── Ball.js         # ボール（軌跡/グロー）
    │   ├── Paddle.js       # パドル（各種エフェクト）
    │   ├── Block.js        # ブロック15種
    │   ├── PowerUp.js      # パワーアップ15種
    │   └── Boss.js         # 3フェーズボス
    ├── systems/
    │   ├── PhysicsSystem.js     # 衝突検出
    │   ├── RenderSystem.js      # 背景・エフェクト
    │   ├── InputSystem.js       # キーボード/マウス/タッチ
    │   ├── AudioSystem.js       # 効果音
    │   ├── MusicSystem.js       # プロシージャル音楽
    │   ├── ParticleSystem.js    # パーティクル
    │   ├── PowerUpSystem.js     # パワーアップ管理
    │   ├── ComboSystem.js       # コンボシステム
    │   ├── LevelSystem.js       # レベル生成
    │   ├── AchievementSystem.js # 実績(22種)
    │   └── ShopSystem.js        # ショップ
    └── ui/
        ├── HUD.js               # ゲームプレイHUD
        ├── TitleScreen.js       # タイトル画面
        ├── ModeSelectScreen.js  # モード選択
        ├── GameOverScreen.js    # ゲームオーバー
        ├── LevelCompleteScreen.js # レベルクリア
        ├── ShopScreen.js        # ショップ画面
        ├── AchievementsScreen.js # 実績一覧
        └── HowToPlayScreen.js   # 遊び方
```

---

## ライセンス

MIT License — 2026 Neon Breaker X
