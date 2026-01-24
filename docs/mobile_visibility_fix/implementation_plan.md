# モバイルにおける表示不備の修正計画

iPhone等のモバイル端末（特に縦持ち時）において、画面左右に配置されているレベルアップゾーンやデッキ・トラッシュが見えなくなる問題を、プレイマットの自動スケーリングと配置調整によって解決します。

## 課題の分析

- **原因**: プレイマット（`playmat-canvas`）が強制的に `h-full aspect-video` (16:9) に設定されているため、縦長のモバイル画面では横幅が画面を大きく突き出し、左右の要素がクリップされている。
- **解決策**: プレイマットが「画面の幅」と「画面の高さ」の両方に収まるように動的にフィット（contain）させ、かつ左右の端に余裕を持たせます。

## 変更内容

### 1. プレイマットのスケーリング修正 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - `playmat-canvas` のクラスを修正し、`h-full` 固定から `w-full h-full max-w-full max-h-full aspect-video` に変更（CSS側での制御を強化）。
  - 各 `PlaymatArea` のコンテナを `p-2` などで少し絞ることで、ベゼルによるクリップを防止。

### 2. スタイル調整 (`globals.css`)

- [MODIFY] [app/globals.css](file:///c:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)
  - `.playmat-canvas` の定義を更新し、アスペクト比を維持しながら親要素に完璧に収まるようにします（`width: auto; height: auto; max-width: 100%; max-height: 100%;`）。
  - モバイル時の `scale(0.9)` を見直し、必要に応じてさらに縮小するか、フィットロジックに任せます。

### 3. レイアウトの微調整 (`GameBoard.tsx` の定数)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - モバイルにおいて、左右の要素（サイドバーやデッキ）が端に寄りすぎている場合、少し内側に寄せる調整を検討（特に公式レイアウト）。

## 検証プラン

- ビルドが通ることを確認。
- ブラウザの開発者ツールで iPhone 13/14 等のプロファイルを選択し、以下の項目を確認：
  - プレイマット全体が画面内に収まっていること。
  - 左端のレベルアップゾーンが見えること。
  - 右端のデッキ・トラッシュが見えること。
  - 手札がプレイマットの下部を隠しすぎていないこと。
