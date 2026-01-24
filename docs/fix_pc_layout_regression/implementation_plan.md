# PC版レイアウト崩れ修正計画

表示倍率を画面に合わせる「Fit」処理が PC 版で悪影響を及ぼし、プレイマットが横に引き伸ばされて表示される問題を修正します。

## 課題の分析

- **原因**: `GameBoard.tsx` において、`h-full` と `max-w-full` が競合し、ブラウザによっては横幅を優先して引き伸ばしてしまっています（特に Flexbox 内）。
- **解決策**: Canvas 要素に対して、`height: 100%` 指定を維持しつつ、`width: auto` を明示し、`aspect-ratio` 以外で横に広がらないように固定します。

## 修正内容

### 1. プレイマットのスケーリング修正 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - `playmat-canvas` の指定を `w-auto h-full max-w-full aspect-video` に変更します。
  - `w-auto` を入れることで、単なる `div` のデフォルト (`w-full`) を上書きし、アスペクト比に基づいた計算を強制します。

### 2. スタイル定義の強化 (`globals.css`)

- [MODIFY] [app/globals.css](file:///c:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)
  - `.playmat-canvas` クラスに、明示的に `width: auto !important; height: 100% !important; max-width: 100% !important;` などを設定する（PC版）ことで、強制的な引き伸ばしを防止します。

## 検証プラン

- PCブラウザでプレイマットの比率が正しく（16:9で）表示されることを確認。
- モバイル/タブレットでも引き続き画面に収まっていることを確認。
