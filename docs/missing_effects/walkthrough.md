# ウォークスルー: 欠落している効果の実装

## 変更内容

### 1. データ修正 (`server/data/cards.json`)

- **スクリプト**: `fix_cards_data.js` & `fix_cards_data_phase3.js`
- **修正内容**:
  - **ドロシー (ST04-001)**: ターゲットを `ALL_ALLIES` に修正し、`OPPONENT_TURN` 条件を追加。
  - **ケブラーベスト (ST03-016)**: ターゲットを `SELF` に修正。
  - **クラウン‐ネイキッドキング (BT02-067)**: ターゲットを `SELF` (覚醒) に修正し、`OPPOSING_HIT_LE_ARMED_COUNT` 条件を追加。

### 2. ゲームロジック (`server/Game.ts`)

- **`getUnitPower` のリファクタリング**:
  - ユニットのパッシブ（自身）およびロード効果（味方全体バフ）をサポート。
  - 条件を追加: `PER_LEADER_LEVEL`, `ARMED_PER_ITEM`, `ARMED_IF_EQUIPPED`, `OPPONENT_TURN`, `MY_TURN`。
- **`applyEffect` の更新**:
  - **RESTRICT_ATTACK**: `SINGLE` ターゲットのサポートと選択処理を追加。
  - **GRANT_ABILITY**: `ALL_ENEMIES` ターゲットのサポートを追加。
  - **BOUNCE_UNIT**: `ALL_ENEMIES` ターゲットのサポートを追加。
  - **BUFF_HIT**: `ALL_ALLIES` ターゲットのサポートを追加。
  - **新しい条件**: `OPPOSING_HIT_LE_ARMED_COUNT` (ネイキッドキング用) を実装。

## 検証結果

### 単体テスト: `unitTestMissingEffects.ts` (Phase 1)

- 基本的なパッシブ効果と攻撃制限の動作を確認。

### 単体テスト: `unitTestPhase2.ts` (Phase 2)

- ロード効果、条件付きバフ、全体デバフの動作を確認。

### 単体テスト: `unitTestPhase3.ts` (Phase 3)

- **BOUNCE_UNIT (ALL_ENEMIES)**: すべての敵ユニットが手札に戻ることを確認。
- **BUFF_HIT (ALL_ALLIES)**: すべての味方ユニットにヒットバフが適用されることを確認。
- **ネイキッドキングの条件**: 装備品数 ≧ 防御側のヒット数の場合のみ効果が適用されることを確認。

## 結論

データ分析により特定された未実装効果の網羅的な実装が完了しました。
