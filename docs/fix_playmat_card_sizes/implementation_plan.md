# プレイマットとカードサイズ修正の実装計画 (改訂版)

## 問題の根本原因

- `GameBoard.tsx` 内の `renderSlot` でカードスロットのサイズが固定値 (`w-28 h-40`など) になっているため、レスポンシブ対応していない。
- 親コンテナのパディングやレイアウト設定により、相手と自分のプレイマットの間に隙間が生じている。
- `flex-1` による領域確保と `aspect-video` のアスペクト比維持が競合し、意図しない余白や引き伸ばしが発生する可能性がある。

## 解決策: コンテナクエリとレイアウトの最適化

### 変更点

#### 1. [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

**A. カードサイズのレスポンシブ化 (コンテナクエリ)**

- `playmat-canvas` に `container-type: size` を適用。
- `renderSlot`, `deck`, `trash`, `skill`, `damage` などの各ゾーンのサイズ指定を、固定ピクセル (`w-28 h-40`) からコンテナ幅に対する割合 (`cqw`) に変更。
  - 例: `w-[13cqw] aspect-[5/7]` (基準値)
  - デッキ/トラッシュ/スキルは少し小さめ (`scale-75`相当の `w-[10cqw]`) に調整。

**B. プレイマットのレイアウト修正 (隙間と歪みの解消)**

- `PlaymatArea` のラッパー `div` から余分なパディング (`p-2 sm:p-4`) を削除。
- プレイマット間の境界を密着させるため、レイアウト構造を整理。
- 内部の `playmat-canvas` が常にアスペクト比 `16:9` を維持しつつ、利用可能な領域内で最大化するように調整。

#### 2. [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

- 必要に応じて、`className` でサイズが上書きされた場合にデフォルトの固定サイズクラス (`w-16` 等) が競合しないように整理（Tailwindは後勝ちだが、記述をスッキリさせる）。

### 詳細ステップ

1. `GameBoard.tsx`: `PlaymatArea` コンポーネントの `p-2 sm:p-4` を削除。
2. `GameBoard.tsx`: `playmat-canvas` にスタイル `container-type: size;` を追加。
3. `GameBoard.tsx`: 固定サイズ (`w-28`, `h-40`, `w-12`, `h-16` 等) を検索し、すべて `cqw` ベースのクラスに置換。
4. `Card.tsx`: `className` がある場合のデフォルトサイズの適用条件を確認・修正。

## 検証項目

- 上下のプレイマットが隙間なく配置されているか。
- カードサイズがウィンドウ幅に応じて適切に変化するか。
- アスペクト比が維持され、画像が歪んでいないか。
