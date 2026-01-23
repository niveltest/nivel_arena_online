# CPU戦のマリガン処理修正

## 目的

- [x] CPU戦でマリガンフェーズが発生しない原因の調査
- [x] マリガンリクエストを順次処理するフローの実装 (`server/Game.ts`)
- [x] `proceedMulligan` ヘルパーメソッドの導入
- [x] `resolveSelection` におけるステート上書きバグの修復
- [x] エンドフェーズでのCPU停止バグの修正
- [x] アタック時のトリガー効果処理後のフェーズ消失バグの修正 (`Game.ts`)
- [x] 手札上限によるディスカード後のフェーズ復元修正 (`Game.ts`)
- [x] `resolveSelection` における全般的なフェーズ復元ロジックの実装
- [x] `resolveSelection` および `resolveMulligan` の更新によるマリガンシーケンスの継続
