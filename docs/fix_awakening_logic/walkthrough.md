# ウォークスルー - 覚醒ロジックとパワー計算の修正

未覚醒のリーダーパッシブが適用される問題と、パワー計算の不整合を修正しました。

## 変更内容

### [Server] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- **覚醒チェックの導入**:
  - `getUnitPower` メソッドで、効果に `isAwakening: true` が設定されている場合、リーダーのレベルが `awakeningLevel` に達しているかを確認するようにしました。
- **レベル上限の引き上げ**:
  - `applyEffect` の `LEVEL_UP` アクションで、リーダーレベルの上限を10に引き上げました。

### [Component] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **クライアント計算の同期**:
  - `getCalculatedStats` メソッドに、サーバー側と同様の覚醒状態チェックを追加しました。

### [Data] [populate_effects.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/scripts/populate_effects.ts)

- **文字パースの改善**:
  - `[覚醒]面` や `リーダーレベルがN以上` といった記述を正しく検出し、覚醒効果としてタグ付け（`isAwakening: true`）できるように改善しました。
  - 基本面と覚醒面を分けてパースすることで、効果の重複（未覚醒時に覚醒効果が表示される等）を防ぐようにしました。

## 検証結果

- **ST01-005 (ノイズ)**:
  - リーダーが未覚醒（レベル5未満）のとき、パワーがベース値の **3000** で表示されることを確認しました。
- **リーダーパッシブ**:
  - 覚醒効果が `isAwakening: true` として正しくデータ化され、条件を満たしたときのみパワーに加算されることを確認しました。
