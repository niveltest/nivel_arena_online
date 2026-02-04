# GameBoard.tsx 残存エラー修正計画

`GameBoard.tsx` においてIDEが報告している残りのTypeScriptエラー（null可能性、any型の使用、未使用のインポート）を修正し、型安全性を確保します。

## 修正内容

### 1. インポートと型の整理

- [ ] Line 9: 使用されていない `SelectionState` をインポートから削除します。
- [ ] `PlaymatOption` インターフェースを定義し、プレイマット選択時の型として使用します（`any` の排除）。

### 2. Null可能性のハンドリング

- [ ] `opponent` が `null` の可能性がある箇所（Line 1193, 1308, 1309, 1337）に null チェックを追加します。
- [ ] `renderDamageZoneModal` 内で `targetPlayer` が `null` の場合に早期リターンするように修正します（Line 1413, 1415, 1416）。
- [ ] `PlaymatArea` に `p={opponent}` を渡す際、`opponent` が `null` の場合は何も表示しない（またはプレースホルダーを表示する）ように修正します。

### 3. 型アサーションの厳密化

- [ ] Line 561: `data as any` を `DamageAnimationData | EffectAnimationData` 等の適切な型にキャストするか、より安全な方法でプロパティにアクセスします。
- [ ] アニメーションデータの各プロパティ（`value`, `text`, `targetId` 等）へのアクセスを型安全にします。

## 検証計画

- [ ] `npm run build` または `npx tsc --noEmit` を実行し、`GameBoard.tsx` のエラーが解消されたことを確認します。
