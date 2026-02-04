# 未実装カード効果の実装計画 (フェーズ3)

## 目標

`BOUNCE_UNIT`（敵全体バウンス）、`BUFF_HIT`（味方全体ヒット数増加）、およびネイキッドキングの特殊条件（装備数≧対向ヒット数）を実装します。

## ユーザーレビューが必要な事項
>
> [!WARNING]
> `cards.json` を再修正し、ネイキッドキングに新しい条件タグ `OPPOSING_HIT_LE_ARMED_COUNT` を付与します。

## 変更内容

### [Data] カードデータ修正 (`server/data/cards.json`)

#### [NEW] [fix_cards_data_phase3.js](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/scripts/fix_cards_data_phase3.js)

- **クラウン‐ネイキッドキング (BT02-067)**:
  - `condition`: (追加) "OPPOSING_HIT_LE_ARMED_COUNT"

### [Server] ゲームロジック (`server/Game.ts`)

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

1. **`applyEffect` の拡張**:
    - **`BOUNCE_UNIT`**: `ALL_ENEMIES` 対応を追加。
    - **`BUFF_HIT`**: `ALL_ALLIES` 対応を追加。
    - **条件判定の追加**: `OPPOSING_HIT_LE_ARMED_COUNT` 判定ロジックを実装。
        - 対向ユニット (`opponent.state.field[slotIndex]`) のヒット数を取得し、自身の装備数と比較。

### [Verification]

#### [NEW] [unitTestPhase3.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/testData/unitTestPhase3.ts)

- 全体バウンス、全体ヒットバフ、ネイキッドキングの条件判定をテスト。

## 検証計画

```bash
node server/scripts/fix_cards_data_phase3.js
npx ts-node server/testData/unitTestPhase3.ts
```
