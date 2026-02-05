# 修正計画：先攻・後攻の視認性向上

## 現状の課題

- プレイヤーが「先攻（First Player）」か「後攻（Second Player）」かが視覚的に分かりにくい。
- 特に最初のマリガン画面において、自分がどちらなのかの表示がないため、戦略が立てにくい。

## 変更内容

### [components/SelectionModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/SelectionModal.tsx)

- `SelectionModal` のヘッダーデザインを調整。
- `turnOrderLabel` が渡された場合、タイトルのすぐ横に「先攻」「後攻」を分かりやすいバッジとして表示。

### [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- 自分が先攻（`gameState.turnPlayerId === playerId` ※Turn 1時点）か後攻かを判定する `isFirstPlayer` フラグ等の情報を取得。
- `renderSelectionModal` において、マリガン中であれば「先攻」または「後攻」の文字列を `turnOrderLabel` プロパティ経由で渡す。
- ステータスバー（画面上部）の「T-1」表示の横に、対戦中常時確認できる「先攻」「後攻」バッジを追加。

## 検証計画

### 手動検証

1. 対戦を開始する。
2. マリガン画面（SelectionModal）のタイトル横に「先攻」または「後攻」と表示されていることを確認する。
3. 対戦中の画面上部ステータスバーに、自分がどちらなのかが常時表示されていることを確認する。
