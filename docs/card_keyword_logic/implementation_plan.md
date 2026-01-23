# キーワード能力の拡張と洗練

デュエリストの実装を修正し、エグジット(EXIT)や帰還(RECYCLE)などの未実装キーワードを実装します。

## 推奨される変更

### 1. 「デュエリスト」(DUELIST) の修正

指摘通り、現在の「任意のユニットを攻撃できる」という仕様を削除し、「対向ユニットに強制的に防御させる」仕様に変更します。

- **`server/Game.ts`**:
  - `attack` メソッドでのレーン制限緩和（`DUELIST` チェック）を削除。
  - `finalizeAttackResolution` または `resolveDefense` の前段階で、攻撃対象がユニットかつ `DUELIST` による攻撃の場合、防御（`DEFENSE` フェーズ）を選択の余地なく強制的に解決するロジックを実装。
  - 具体的には、`guardianCandidates` がおらず、かつ対向にユニットがいる場合に、プレイヤーの選択を待まわずに防御処理へ移行させます。

### 2. 「エグジット」(EXIT) キーワードの実装

フィールドから離れる（破壊される）際のトリガー。※手札に戻る（バウンス）際には発動しません。

- **`shared/types.ts`**: `EffectTrigger` に `ON_EXIT` を追加。
- **`server/scripts/populate_effects.ts`**: `EXIT` キーワードと `ON_EXIT` トリガーのパース。
- **`server/Game.ts`**: `destroyUnit` 内で `ON_EXIT` 効果をトリガー。

### 3. 「帰還」(RECYCLE) キーワードの実装

ターン終了時にトラッシュから手札に戻る。

- **`shared/types.ts`**: `Card` に `isRecycle?: boolean` を追加。
- **`server/Game.ts`**: `handleEndPhase` でトラッシュから回収。

## 検証計画

- `DUELIST` で攻撃した際、相手が防御を選択する画面が出ず、強制的に戦闘（パワー比較）が行われることを確認。
- `EXIT` を持つユニットが破壊された際に効果が発動することを確認。
- `EXIT` を持つユニットが手札に戻った際には効果が発動しないことを確認。
- ターン終了時に `RECYCLE` 持ちが手札に戻ることを確認。
