# モバイル向け詳細表示ボタン実装計画

右クリックができないモバイル環境において、タップで詳細画面を開くための専用ボタンをカードに追加します。

## 変更内容

### 1. カードコンポーネントの調整 (`Card.tsx`)

- [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)
  - `showDetailOverlay` プロップを追加。
  - `true` の時のみ、カード上に「🔍 詳細を見る」ボタンを表示します。

### 2. ゲームボードでの制御 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - 手札の選択中カード（`selectedCardIndex`）に対して `showDetailOverlay={true}` を適用。
  - アタック時に選択したユニットなど、ハイライトされているカードにも同様に適用を検討。

## 検証プラン

- ビルドが通ることを確認。
- （モバイルエミュレータ）
  - カード上の「🔍」ボタンをタップして詳細画面が開くこと。
  - ボタン以外の場所をタップした際は、通常通りカードが選択されること。
