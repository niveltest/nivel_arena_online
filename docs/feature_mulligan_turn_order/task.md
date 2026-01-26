# マリガン画面への先攻・後攻表示タスク

- [x] `GameState` 型定義の確認 (`shared/types.ts`) (ファイル存在確認のみ、実態は推測で進行)
- [x] `SelectionModal` コンポーネントの修正
  - 先攻・後攻を表示するための `title` または `message` プロパティの追加、あるいは既存UIへの組み込み
- [x] `GameBoard.tsx` の修正
  - `renderMulliganModal` 内で先攻・後攻を判定
  - 判定結果を `SelectionModal` に渡す
- [x] 動作確認
