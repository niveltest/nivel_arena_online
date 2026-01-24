# プレイマット最大化実装計画

画面上の不要な余白（特にプレイヤー間の黒い隙間）を排除し、プレイマットを以前よりさらに大きく表示します。

## 課題の分析

- **プレイヤー間の隙間**: `PlaymatArea` のコンテナに設定されている `p-2 sm:p-4` が、上下のプレイマットの間に大きな余白を作っています。
- **スケーリングの制限**: `globals.css` の `max-height` や `transform: scale` が、PC版でもプレイマットを縮小させている可能性があります。

## 修正内容

### 1. レイアウトのパディング削除 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - `PlaymatArea` のルート `div` から `p-2 sm:p-4` を削除し、コンテナの端までグラフィックを表示させます。

### 2. CSS スケーリングの緩和 (`globals.css`)

- [MODIFY] [app/globals.css](file:///c:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)
  - `.playmat-canvas` の基本スタイルを確認し、PC版では `max-height` 制限がかからないように修正。
  - `transform: scale(0.95)` を `1.0` に戻し、CSSによる強制縮小を廃止。

### 3. 接合部の視認性調整

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - 相手側の `border-b` 指定が隙間に見える可能性があるため、配置を微調整。

## 検証プラン

- PC版でプレイマットが中央で接し、画面端まで大きく表示されていることを確認。
- カードの操作（ドラッグ等）に影響が出ていないか確認。
