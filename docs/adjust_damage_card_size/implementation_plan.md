# ダメージゾーンのカードサイズ調整計画

プレイマット背景にある1〜9の枠線に、ダメージカードがぴったり収まるように修正します。

## 課題の分析

- **サイズが小さすぎる**: 背景の枠に対してカードが小さすぎるため、`scale` を大きくします。
- **情報が多すぎる**: `minimal={true}` でも数値が表示されてしまっているため、イラストのみの表示に徹底します。

## 修正内容

### 1. レイアウト設定の調整 (`GameBoard.tsx`)

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - `PLAYMAT_CONFIGS.official.damage` の `scale` を大きくします（1.1〜1.2程度を試行）。
  - `left` 位置を微調整し、カードと枠が重なるようにします。

### 2. カードコンポーネントの修正 (`Card.tsx`)

- [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)
  - `minimal={true}` の時に、パワー、コスト、ヒット数などを完全に非表示にします。

### 3. 重なり設定の調整

- [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  - 枠の間隔に合わせて、ネガティブマージン（重ねる幅）を最適化します。

## 検証プラン

- ビルドが通ることを確認。
- ブラウザでダメージが複数枚ある状態を確認し、背景の枠（1, 2, 3...）の上にカードが正しく重なることを目視で確認。
- 公式レイアウト以外のテーマ（mermaid等）でも崩れていないか確認。
