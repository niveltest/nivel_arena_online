# タブレット（iPad等）の表示最適化計画

iPadやその他のタブレット端末において、スマートフォンのような簡易表示ではなく、PC版と同等のリッチな表示（大きなカード、高密度なレイアウト）が適用されるように調整します。

## 課題の分析

- **現在の挙動**: `sm:` (640px) 以上のブレークポイントでPC向けスタイルに切り替わっていますが、タブレットの画面比率（4:3など）や解像度に対しては、まだ「スマホを少し大きくしただけ」のような表示になっている可能性があります。
- **改善案**: `md:` (768px) または `lg:` (1024px) を基準とした再調整を行い、タブレットを「PC/デスクトップ」カテゴリとして扱います。

## 修正内容

### 1. ブレークポイントの厳格化 (`globals.css`)

- [MODIFY] [globals.css](file:///c:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)
  - モバイル向けのスケーリング制限 (`max-height: 40vh` など) を `max-width: 767px` 以下に限定し、iPad Portrait 以上では解除されるようにします。

### 2. レイアウトの拡張 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - 手札エリアの高さをタブレット向けにさらに拡張 (`md:h-64` など)。
  - プレイマットのコンテナサイズを、タブレットの広い画面を活かせるように調整。

### 3. カードサイズの調整 (`Card.tsx`)

- [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)
  - `sm:` だけでなく `md:` ブレークポイントでさらに大きく表示されるようにサイズクラスを追加。

## 検証プラン

- ビルドが通ることを確認。
- ブラウザの開発者ツールで iPad / iPad Air のプロファイルを選択し、PC版に近い表示（カードが大きく、情報密度が高い状態）になっていることを確認。
