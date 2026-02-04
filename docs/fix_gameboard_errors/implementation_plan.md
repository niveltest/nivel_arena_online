# 実装計画: GameBoard.tsx の型エラー修正

## 目的

`GameBoard.tsx` で報告された TypeScript のエラーおよび警告を修正し、コードの安全性と品質を向上させる。

## 修正内容

### 1. `any` 型の排除

`Unexpected any` エラーが出ている箇所を、`shared/types.ts` で定義されている適切な型に置き換える。

- アニメーションイベントのデータ (`dData` 等)
- プレイヤー状態 (`me`, `opponent`)

### 2. 未定義・誤名称の変数修正

- `opponentId` となっている箇所を、文脈に応じて `opponent?.id` または `isOpponent` に修正。
- `p` が見つからない箇所で、適切なプレイヤーオブジェクト（`me` 等）を参照するように修正。

### 3. 暗黙の `any` の解消

`filter`, `map`, `find` 等のコールバック引数に明示的な型指定を追加する。

### 4. Hook の依存関係とクリーンアップ

- `useEffect` の依存配列に指摘された漏れを追加。
- 未使用の `DamagePopup` 定義を削除。

## 検証計画

- `npm run build` (または `tsc`) を実行し、`GameBoard.tsx` に関するエラーが解消されたことを確認する。
