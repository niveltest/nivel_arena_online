# 残りの問題の修正タスク (GameBoard & README)

## 1. GameBoard.tsx の修正

- [x] `SelectionState` 未使用インポートの削除 (Line 9) <!-- id: 1 -->
- [x] アニメーションデータの `as any` 解消と型安全なアクセス (Line 561) <!-- id: 2 -->
- [x] `opponent` の null 可能性への対処 (Line 1193, 1308, 1309, 1337) <!-- id: 3 -->
- [x] `targetPlayer` の null 可能性への対処 (Line 1413, 1415, 1416) <!-- id: 4 -->
- [x] プレイマット選択の `any` 解消 (Line 1450, 1478) <!-- id: 5 -->
- [x] `PlaymatArea` への `p` 渡しの型不整合修正 (Line 1647) <!-- id: 6 -->

## 2. README.md の修正

- [x] `public/audio/README.md` のテーブルフォーマット修正 (MD060) <!-- id: 7 -->

## 3. 検証

- [ ] `tsc` を実行し、エラーが解消されたことを確認する <!-- id: 8 -->
- [ ] README.md の見た目を確認する <!-- id: 9 -->
