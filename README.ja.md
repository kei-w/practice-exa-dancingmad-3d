# P5 エクサ練習 3D（混沌の終末）

[English](README.md) | 日本語

FF14「絶妖星乱舞」P5 のエクサフレア回避を 3D 視点で練習できる非公式トレーナーです。

練習できるギミック内容（6ウェーブ・左/中/右パターン等）は
[オリジナルの2D版練習ページ](https://github.com/pilsnerdrinker/practice-exa-dancingmad) を参考にしていますが、
コードはギミックの仕様に基づく独自実装です（座標系・判定・描画とも元コードとは別物です）。
エクサの座標・半径・タイミングは、俯瞰の検証動画から測定した値に合わせて調整しています。
当たり判定は実際のエクサフレアに合わせた円判定を採用しています。
実践練習では、表示より2タイミング早く移動する着弾判定で被弾判定します。

画面右上の言語セレクターで日本語と英語を切り替えられます。
初回はブラウザの言語設定を使用し、選択した言語はブラウザに保存されます。
マーカー配置と半径、発動速度、「一問ごと」の設定もブラウザに保存され、次回以降に復元されます。

## 操作

| 操作 | 内容 |
| --- | --- |
| `W` `A` `S` `D`（または矢印キー） | 自キャラ移動（W = カメラの向いている方向） |
| マウス右ドラッグ | カメラ回転（自キャラ追従の三人称視点） |
| マウスホイール | ズーム |
| 左クリック（位置確認モード） | クリック位置の安地判定 |
| 左スティック | 自キャラ移動（アナログ・カメラ基準） |
| 右スティック | カメラ回転 |
| `L1(LB)` + 右スティック上下 | ズーム |

コントローラは FF14 の標準コンフィグ風の挙動です。
ブラウザの仕様上、**一度何かボタンを押すまで**コントローラは認識されません。

## モード

- **位置確認**: 各ウェーブの直線攻撃と次の予兆をスライドで確認。フィールドをクリックすると安地判定
- **実践練習**: カウントダウン後にエクサ開始。キャラを操作して全6ウェーブを回避

エクサ発動速度はスライダーで 2.5〜5.0 秒に調整できます（初期値4.4秒）。
「一問ごと」で自動送りを止められ、前の問題/同じ問題/新しい問題を切り替えられます。

フィールドマーカーは FF14 風の光柱表現で、`A`(北)から時計回りに 90 度刻みで `A/B/C/D`、
数字はその 45 度ずれのコーナーに等距離（45度刻み）で配置しています。
配置半径は「マーカー」スライダーで 25〜50（整数、初期値35）に調整できます。
`2341`（北西=1 北東=2 南東=3 南西=4）/ `1234`（北東=1 から時計回り）ボタンで
数字の割り当てを切り替えられます。

## 開発

ツールチェーンは [mise](https://mise.jdx.dev/) で管理しています（Node LTS + pnpm）。

```sh
mise install        # node / pnpm のセットアップ
pnpm install        # 依存関係のインストール
pnpm dev            # 開発サーバー起動 (http://localhost:5173)
pnpm build          # 本番ビルド (dist/)
pnpm format         # Biome でフォーマット
pnpm lint           # Biome で lint
pnpm check          # フォーマット + lint をまとめて実行（自動修正あり）
pnpm typecheck      # tsc --noEmit での型チェック
```

## 構成

UI は React 19、スタイリングは [Emotion](https://emotion.sh/) の styled components を使用しています。

- [index.html](index.html) — React のマウントポイント
- [src/App.tsx](src/App.tsx) — 画面全体のコンポーネント構成
- [src/App.styles.ts](src/App.styles.ts) — 画面全体のレイアウトスタイル
- [src/components/](src/components) — ヘッダー、操作バー、3Dステージ、ステータスパネル
- [src/hooks/useTrainer.ts](src/hooks/useTrainer.ts) — React とゲームコントローラーの接続
- [src/i18n/](src/i18n) — 日本語／英語の翻訳辞書と言語切替Context
- [src/styles/GlobalStyles.tsx](src/styles/GlobalStyles.tsx) — グローバルスタイル
- [src/game/controller.ts](src/game/controller.ts) — React とゲームループ／Three.js の橋渡し
- [src/config.ts](src/config.ts) — ゲーム設定値（フィールド半径、レーン数、タイミング等）
- [src/game/](src/game) — ゲームロジック
  - `lanes.ts` — レーン幾何（方向ベクトル・レーン判定・着弾円の当たり判定）
  - `problem.ts` — 問題生成と履歴（`ProblemHistory`）
  - `practiceSession.ts` — 実践練習の状態・タイミング・移動ロジック
  - `settings.ts` — UIから変更できる練習設定
  - `slides.ts` — 位置確認モードのスライド生成
  - `viewFormatters.ts` — React表示用のフォーマット関数
- [src/three/](src/three) — Three.js 描画
  - `primitives.ts` — ディスク/リング/帯ジオメトリ・テキストスプライト・テクスチャ
  - `markers.ts` — FF14 風フィールドマーカー
  - `scene.ts` — `Scene3D`（フィールド、エクサ描画、プレイヤー、カメラ、マウス入力）
- [src/input/](src/input) — `keyboard.ts`（WASD/矢印)、`gamepad.ts`（FF14風パッド操作）
- [src/main.tsx](src/main.tsx) — React エントリーポイント

## 注意

- 個人制作の非公式練習ツールです。
- 実際の処理手順やコールは、参加するパーティーの方針に合わせてください。
