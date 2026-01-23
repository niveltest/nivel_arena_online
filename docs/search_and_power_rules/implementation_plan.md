# 実装計画: デッキサーチ機能とパワー破壊ルール

## 目的

Nivel Arena の基本ルールであるパワー0破壊の徹底と、戦略性を高めるデッキサーチ効果を実装する。

## 提案される変更

### 1. パワー破壊ルール (State-Based Actions)

- `Game.ts` への `checkStateBasedActions()` の追加。
- `applyEffect`, `resolveDefense`, `playCard` 等の主要アクション後にこのチェックを呼び出すようにする。
- パワーが0以下になったユニットを `destroyUnit` を介して適切にトラッシュへ送る。

### 2. デッキサーチ・ルック

- `populate_effects.ts` の拡張によるカード効果抽出の強化。
- `SEARCH_DECK` アクションの新設。
- `resolveSelection` でのシャッフル・ボトム戻しロジックの整理。

### 3. 戦闘解決の厳密化

- 同パワー時の相打ち処理の修正。
- 貫通、略奪、道連れの処理順序の安定化。
