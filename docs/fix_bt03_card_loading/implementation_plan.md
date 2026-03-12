# BT03カード表示不具合の修正計画

BT03カードがデッキビルダーに表示されない問題は、サーバーのビルド成果物（`dist/`）が古く、BT03データが含まれていないことが原因です。これを解決するため、TypeScriptのコンパイルエラーを全て解消し、サーバーを再ビルドします。

## 提案される変更

### 共有型定義 (`shared/`)

#### [MODIFY] [types.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/shared/types.ts)
- `EffectTrigger` に `'FLIP_CONDITION'` を追加。
- `EffectAction` に `'DAMAGE_BY_HAND_DIFF'`, `'RECYCLE_ITEMS_FOR_KILL'`, `'SWAP_WITH_DAMAGE'` を追加。
- `SelectionState['type']` に `'HAND_AND_DISCARD'` を追加。

### サーバーエンジン (`server/`)

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)
- `Card` 型に存在しない `isAwakened` プロパティへのアクセスなど、コンパイルエラーを引き起こしている箇所を修正（`as any` キャスト等で対応）。
- その他の型不一致エラーを修正。

#### [MODIFY] [index.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/index.ts)
- 重複していた `path` のインポートを削除（実施済み）。

## 検証計画

### 自動テスト
- `npm run build` がエラーなく完了することを確認。

### 手動検証
- ビルド後の `dist/server/data/cards.json` を直接読み込み、BT03カードの件数が 0 件でないこと（期待値 90 件）を確認。
