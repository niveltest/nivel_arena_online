# タスク：オンラインテストプレイの実装 (完了)

- [x] 現状の分析とオンライン化への課題抽出 (完了)
- [x] 構成の修正 (Configuration)
  - [x] `SOCKET_URL` の環境変数化 (`GameBoard.tsx`, `Lobby.tsx`, `DeckBuilder.tsx`)
  - [x] サーバー側の CORS 設定の柔軟化 (`server/index.ts`)
  - [x] サーバー側のポート番号の環境変数化 (`server/index.ts`)
  - [x] 環境変数設定例ファイルの作成 (`.env.example`, `server/.env.example`)
- [x] 公開用環境の整備 (Environment)
  - [x] ngrok を使用した一時的な公開手順の作成
  - [x] Render と Vercel を使用した本番環境デプロイ手順の作成
  - [x] GitHub へのプログラムアップロード (安定環境の基盤)
- [x] 本番環境へのデプロイ (Deployment)
  - [x] Render でのサーバー公開 (成功)
  - [x] Vercel でのフロントエンド公開 (接続エラー修正済み)
- [x] 不具合修正 (Bug Fixes)
  - [x] CPU戦の進行停止（LEVEL_UP/DRAW）の解消
  - [x] カード画像の HTTPS 化 (Vercel での Mixed Content 対策)
- [x] 最終動作確認 (本番環境)
