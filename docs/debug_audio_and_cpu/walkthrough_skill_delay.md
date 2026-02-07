# "わが師の恩" (ST02-013) 効果適用表示の修正

## 実施内容

「わが師の恩」などのスキルや効果によるリーダーレベルの上昇が、即座に反映されていないように感じられる（メインフェイズ終了時まで遅延しているように見える）問題を修正しました。

## 修正内容

### 1. クライアント側のレベルアップSEトリガーの修正

- **[GameBoard.tsx](file:///C:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)**:
  - レベルアップのSE（効果音）の再生判定が、サーバー側で未使用の `resources` 変数に基づいていました。
  - これを `leaderLevel` の変化に基づくように修正しました。これにより、スキル使用直後にSEが鳴り、レベルアップが即座に行われたことが視覚・聴覚的に伝わるようになります。

### 2. サーバー側の状態同期とログの強化

- **[Game.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)**:
  - `useActiveAbility` (起動能力) の使用後に `processEffectQueue()` が呼ばれておらず、能力による効果の同期が遅れる可能性があったため、追加しました。
  - `LEVEL_UP` 効果の適用時に `addLog` でログを出力するようにし、デバッグログ上で正確な適用タイミングを確認できるようにしました。
  - `LEVEL_UP` 時の `broadcastAction` のペイロードに `newLevel` を追加し、従来の形式と newer 形式の両方に対応させました。

## 検証

- スキルカード「わが師の恩」を使用し、即座にレベルアップSEが再生され、リーダーのレベル表示が LV1 -> LV2 に更新されることを確認しました。
- 起動能力やダメージトリガーによるレベルアップ時も、即座に連鎖エフェクトが処理されることを確認しました。

render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)
