# CPU戦のマリガン処理修正

## 目的

- [x] CPU戦でマリガンフェーズが発生しない原因の調査
- [x] マリガンリクエストを順次処理するフローの実装 (`server/Game.ts`)
- [x] `proceedMulligan` ヘルパーメソッドの導入
- [x] `resolveSelection` におけるステート上書きバグの修復
- [x] エンドフェーズでのCPU停止バグの修正 (`AIPlayer.ts` の `case 'END'` 追加)
- [x] 手札上限によるディスカード後のフェーズ復元修正 (`Game.ts`)
- [x] `resolveSelection` および `resolveMulligan` の更新によるマリガンシーケンスの継続
