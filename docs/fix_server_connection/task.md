# サーバー接続エラー (xhr poll error) の修正タスク

- [x] 調査
  - [x] Render サーバーのヘルスチェック確認 (200 OK)
  - [x] CORS 設定の不整合の特定
- [x] 修正
  - [x] `server/index.ts` の CORS 設定（origin/credentials）を修正
  - [x] `Lobby.tsx` のエラーログ出力強化
- [x] 検証
  - [x] Vercel 環境からの接続テスト
  - [x] エラーログの消失確認
