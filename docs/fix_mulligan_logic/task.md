# CPU戦のマリガン処理修正

## 目的

- [x] CPU戦でマリガンフェーズが発生しない原因の調査
- [x] マリガンリクエストを順次処理するフローの実装 (`server/Game.ts`)
- [x] `proceedMulligan` ヘルパーメソッドの導入
- [x] `resolveSelection` におけるステート上書きバグの修復（順次処理の維持）
- [x] `resolveSelection` および `resolveMulligan` の更新によるマリガンシーケンスの継続
