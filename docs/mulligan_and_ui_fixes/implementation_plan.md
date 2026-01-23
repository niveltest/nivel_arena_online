# Mulligan and UI Fixes Implementation Plan

## Goal

Mulliganフェーズにおける「Keep All」ボタンの不具合を修正し、公式ルールに基づいた「All or Nothing」のマリガン処理を確実に実装する。また、ゲームUIの全要素を日本語化（ローカライズ）し、コードベースの型安全性とLint品質を向上させる。

## Proposed Changes

### Client Components

#### [MODIFY] [SelectionModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/SelectionModal.tsx)

- `handleConfirm` のロジックを修正し、Mulliganフェーズでの0枚選択（全キープ）を許可。
- UIラベル（タイトル、ボタン、選択ステータス）を日本語に翻訳。

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- ゲームフェーズ名（MAIN, ATTACK等）の表示を日本語に変換するマッピングを追加。
- 防御モーダルやヘッダーのテキストを日本語化。
- `any` 型の使用や未使用変数のLintエラーを修正（前のフェーズで実施済み）。

#### [MODIFY] [CardDetailModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/CardDetailModal.tsx)

- カード種別（UNIT -> ユニット等）の表示を日本語化。
- 未使用の `useState` インポートを削除。

### Server Logic

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- `MULLIGAN` ロジックが「All or Nothing」ルールに従っていることを確認。
- 多くの `any` 型を具体的な型または `unknown` に置き換え。
- 変数の宣言を `let` から `const` に最適化。

## Verification Plan

### Automated Tests

- `npm run lint` を実行し、修正したファイルにエラーがないことを確認。

### Manual Verification

- Mulliganフェーズで何も選択せずに確定ボタン（KEEP ALL）を押し、ゲームが正常に開始されることを確認。
- 1枚でも選択した場合に「MULLIGAN ALL」となり、全手札が入れ替わることを確認。
- 各画面（メインボード、選択画面、詳細画面）のテキストが日本語になっていることを目視で確認。
