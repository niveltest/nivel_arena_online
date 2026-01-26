# マリガン画面への先攻・後攻表示の実装計画

## 目標

マリガン（手札引き直し）画面において、プレイヤーが先攻か後攻かを明示する。

## 実装方針

### 1. 先攻・後攻の判定

`GameBoard.tsx` 内で `gameState` を参照し、`gameState.startPlayerId` (もし存在すれば) または `gameState.turnPlayerId` (初期ターンプレイヤー) と自身の `playerId` を比較して判定する。
通常、ゲーム開始時に `turnPlayerId` が先攻プレイヤーに設定されていると推測される。

### 2. UIへの表示

`SelectionModal` コンポーネントに、この情報を表示するための仕組みを追加する。
`SelectionModal` は汎用的な選択モーダルであるため、汎用的な `message` または `subTitle` プロパティを追加するか、Mulligan時専用の表示領域を設ける。

### 変更点

#### [MODIFY] [components/SelectionModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/SelectionModal.tsx)

- `SelectionModalProps` に `turnOrderLabel` (例: "先攻 (First)" / "後攻 (Second)") のようなオプショナルプロパティを追加。
- モーダルのヘッダー部分に上記ラベルを目立つように表示する（例: 赤/青の色分けバッジなど）。

#### [MODIFY] [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `renderMulliganModal` 関数内で先攻・後攻を判定。
  - `const isFirst = gameState.turnPlayerId === playerId;` (仮定: turnPlayerIdは初期化済み)
- `SelectionModal` に `turnOrderLabel` を渡す。

## 検証

- マリガン画面が表示された際、「先攻」または「後攻」が表示されていることを確認する。
