# タスクリスト: 欠落しているカード効果の実装

- [x] **分析**
  - [x] `server/data/cards.json` を分析し、全ユニーク効果アクションを抽出。
  - [x] 抽出したアクションと `server/Game.ts` の実装を比較。
  - [x] 不一致と不足しているロジックを特定。
- [x] **計画**
  - [x] 欠落している効果の実装計画を作成。
- [x] **実装**
  - [x] `BOUNCE_UNIT` (ALL_ENEMIES) の実装
  - [x] `BUFF_HIT` (ALL_ALLIES) の実装
  - [x] ネイキッドキングの特殊条件 (`OPPOSING_HIT_LE_ARMED_COUNT`) の実装
- [x] **検証**
  - [x] 必要に応じて型定義を更新。
  - [x] 単体テストおよび動作確認を実施。
