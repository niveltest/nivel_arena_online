# 公式ルールへの準拠と独自拡張の除去

## 目標

『ニベルアリーナ』の公式ルールに存在しない「UNION（ユニオン）」および「LEGION（レギオン）」のメカニズムを削除し、公式カードゲームに基づいた正しいロジックに戻します。ただし、公式データ上必要な `SET_HIT` 効果については保持します。

## 変更内容

### [Server] ゲームロジック (`server/Game.ts`)

- **UNION の削除**:
  - `union` メソッドの削除。
  - `hasKeyword`, `getUnitPower`, `getUnitHitCount` から `unionCards` による継承ロジックを削除。
  - `hasKeyword` 内のキーワードマッピングから `UNION` を削除。
- **LEGION の削除**:
  - `applyEffect` および `getUnitPower` から `LEGION` 条件の判定ロジックを削除。
  - `hasKeyword` 内のキーワードマッピングから `LEGION` を削除。
- **`SET_HIT` の保持**:
  - `applyEffect` 内の `SET_HIT` 実装は公式カードに存在する可能性があるため、そのまま残します。

### [Other] クリーンアップ

- **テストの削除**: `server/testData/unitTestUnionLegion.ts` を削除。
- **ドキュメントの更新**:
  - `docs/union_legion_implementation/` ディレクトリを削除（または廃止記録として残す）。
  - `docs/future_roadmap.md` から UNION / LEGION に関する記述を削除。

## 検証計画

- 既存のユニットテスト（`unitTestAI.ts`, `unitTestPhase3.ts` 等）を実行し、デグレードがないことを確認します。
