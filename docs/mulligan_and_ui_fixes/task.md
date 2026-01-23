# Mulligan and UI Fixes Task List

- [x] Mulliganの「Keep All」ボタンの不具合修正
- [x] Mulliganルールの「All or Nothing」厳格適用確認
- [x] UI要素のローカライズ（日本語化）
  - [x] `GameBoard.tsx`: フェーズ名、ボタン、ラベル
  - [x] `SelectionModal.tsx`: タイトル、フォルダ名（手札・山札等）、ステータス
  - [x] `CardDetailModal.tsx`: カード種別（ユニット・アイテム等）
- [x] Lintエラーと型警告の解消
  - [x] `Game.ts` の `any` 排除と変数の最適化
  - [x] `CardDetailModal.tsx` の未使用インポート削除
  - [x] `GameBoard.tsx` の Socket.io 型エラー修正 (古い型定義 @types の削除を含む)
- [x] ドキュメントの整備と `docs` フォルダへの保存
  - [x] `task.md`
  - [x] `implementation_plan.md`
  - [x] `walkthrough.md`
