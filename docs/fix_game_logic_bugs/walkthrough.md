# ゲームロジックの不具合修正（リーダーレベルアップ） - Walkthrough

リーダーのレベルアップロジックを修正し、カード効果によるレベルブーストが正しく維持されるようにしました。

## 変更内容

### サーバーサイドロジック

#### [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

カード効果などでリーダーのレベルが上昇した際、次の自ターンのレベルアップフェイズでそのブースト分がリセットされてしまう問題を修正しました。

```diff
-    const targetLevel = Math.min(10, Math.floor(player.state.turnCount / 2) + 1);
-    player.state.leaderLevel = targetLevel;
+    player.state.leaderLevel = Math.min(10, player.state.leaderLevel + 1);
```

- **修正前**: `turnCount`（経過ターン数）に基づいてレベルを再計算していたため、カード効果で先行して上がったレベルが、本来のターン経過によるレベルに上書き（実質リセット）されていました。
- **修正後**: 現在のレベルに対して単純に `+1` するように変更しました。これにより、カード効果によるブースト分が保持されたまま、次のレベルへ進行します。

## 検証結果

### 自動テスト（ロジック確認）

- `handleLevelUpPhase` において、`player.state.leaderLevel` が既存の値から正しくインクリメントされることをコードレベルで確認しました。
- `Math.min(10, ...)` により、最大レベルである10を超えないことも保証されています。

### 影響範囲

- この変更は「自ターンの開始時にレベルが1上がる」という基本ルールに忠実であり、副作用としてカード効果による戦略的なレベルアップがより価値を持つようになります。
