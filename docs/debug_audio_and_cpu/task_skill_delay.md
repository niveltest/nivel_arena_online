# "わが師の恩" (ST02-013) の効果適用遅延の修正

## タスクリスト

- [ ] 現状のコード調査 [/]
  - [ ] `Game.ts` の `applyEffectImmediate` における `LEVEL_UP` の処理を確認
  - [ ] `SKILL` カード使用時の `broadcastState` のタイミングを確認
- [ ] 修正の実施 [ ]
  - [ ] `LEVEL_UP` 実行直後の状態更新がUIに反映されない原因の特定と修正
  - [ ] 必要に応じて `applyEffectImmediate` 内での個別 `broadcastState` または `broadcastAction` の追加
- [ ] 検証 [ ]
  - [ ] SKILLカード使用直後にリーダーレベルの表示が更新されることを確認
