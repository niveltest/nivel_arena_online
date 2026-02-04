# Walkthrough: GameBoard.tsx の型エラー修正

`GameBoard.tsx` で発生していた多数の TypeScript エラーおよび警告を解消しました。これにより、コードの堅牢性が向上し、ビルドエラーなしでプロジェクトを維持できるようになりました。

## 修正内容

### 1. 型定義の厳格化

- `any` 型を多用していた箇所を、`Player`, `CardType`, `CardEffect`, `SelectionState`, `AttackAnimationData`, `DestroyAnimationData` などの具体的な型に置き換えました。
- `shared/types.ts` から必要な型をすべてインポートするように修正しました。

### 2. 変数参照の修正

- `opponentId` が未定義だった箇所を `opponent?.id` または `opponent!.id`（文脈に応じて）に修正しました。
- `p` が未定義だった箇所を、適切なプレイヤーオブジェクト（`me` または `opponent`）を参照するように修正しました。

### 3. コールバック関数の型指定

- `map` や `filter` などのラムダ関数の引数に明示的な型を追加し、暗黙の `any` エラーを解消しました。
- `filter` において `f is CardType` のような Type Guard を適切に使用するように修正しました。

### 4. Hook の最適化とクリーンアップ

- `useEffect` の依存関係に `isSpectator` と `password` を追加し、React のルールに準拠させました。
- 未使用だった `DamagePopup` コンポーネントを削除しました。
- 型の競合（コンポーネントの `Card` と型の `Card`）を避けるため、型の方を `CardType` としてインポートするように統一しました。

## 検証結果

- `npx tsc --noEmit` を実行し、`GameBoard.tsx` に関するエラーが 0 件になったことを確認しました。
