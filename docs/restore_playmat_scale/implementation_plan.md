# プレイマットサイズ復元・比率維持計画

アスペクト比を維持しつつ、PC版でのサイズを以前の大きな状態に戻します。

## 課題の分析

- **サイズ低下の原因**: 最適化の過程で追加した「ラッパーの二重化」と「重なったパディング（`p-4`）」により、PC版でも上下左右に大きな余白が生じ、中身のプレイマットが押しつぶされて小さくなっていました。
- **解決策**: コンテナ構造を1段階に戻し、PC版ではパディングを `0` に近づけることで、画面の高さ（または幅）いっぱいまでプレイマットを表示させます。

## 修正内容

### 1. 構造の簡素化 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - `PlaymatArea` 内の余計な `div` ラッパーを削除。
  - パディングを `p-0 sm:p-0 md:p-2` のように調整し、基本は画面端まで使う設定にします。
  - `playmat-canvas` に `aspect-video h-full w-auto max-w-full max-h-full` を設定。

### 2. スタイルの微調整 (`globals.css`)

- [MODIFY] [app/globals.css](file:///c:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)
  - モバイル版の `max-height: 40vh` が大きめのスマホで干渉していないか再確認（現状は 767px 以下なので PC には影響なし）。

## 検証プラン

- PC版で以前のようにプレイマットが画面上下いっぱいに表示されることを確認。
- ブラウザを横に広げても、縦に引き伸ばされない（16:9が維持される）ことを確認。
- モバイル・タブレットでも画面に収まっていることを再確認。
