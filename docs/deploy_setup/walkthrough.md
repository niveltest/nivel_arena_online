# デプロイ手順書 (Deployment Walkthrough)

本プロジェクトは「Frontend (Next.js)」と「Backend (Node.js/Socket.io)」の2つの構成要素から成ります。
推奨構成は以下の通りです。

- **Frontend**: [Vercel](https://vercel.com/) (推奨)
- **Backend**: [Render](https://render.com/) (推奨)

## 0. 前提準備

- GitHubにコードがプッシュされていること。
- Vercel, Render のアカウント作成が完了していること。

## 1. Backendのデプロイ (Render)

サーバー側を先にデプロイし、URLを取得する必要があります。

1. **Render Dashboard** にアクセスし、`New +` ボタンから **Web Service** を選択。
2. **Build and deploy from a Git repository** を選択し、リポジトリを連携。
3. 以下の設定を入力:
   - **Name**: `nivel-arena-server` (任意)
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install && npx tsc` (自動検出される場合あり)
   - **Start Command**: `cd server && npm start`
   - **Instance Type**: `Free` (テスト用)
4. **Environment Variables** (環境変数) を設定:
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `*` (最初は全許可推奨。VercelのURL確定後に変更可能)
5. **Create Web Service** をクリック。
6. デプロイが完了するのを待つ。成功すると、`https://nivel-arena-server.onrender.com` のようなURLが発行されます。**このURLを控えてください。**

> [!NOTE]
> `render.yaml` が含まれているため、"Blueprints" 機能を使って自動構成することも可能ですが、手動作成の方が確実です。

## 2. Frontendのデプロイ (Vercel)

1. **Vercel Dashboard** にアクセスし、**Add New... > Project** を選択。
2. リポジトリをインポート。
3. **Configure Project** で以下を設定:
   - **Framework Preset**: `Next.js` (自動検出)
   - **Root Directory**: `.` (デフォルトのまま)
4. **Environment Variables** (環境変数) を設定:
   - `NEXT_PUBLIC_SOCKET_URL`: 先ほど取得したRenderのURL (例: `https://nivel-arena-server.onrender.com`)
     - **注意**: 末尾に `/` をつけないでください (`...onrender.com` で終わる)。
5. **Deploy** をクリック。
6. ビルドが完了すると、`https://nivel-arena-online.vercel.app` のようなURLが発行されます。

## 3. 動作確認

1. Vercelで発行されたURLにアクセス。
2. ゲーム画面が表示されるか確認。
3. カード操作を行い、通信エラーが出ないか確認 (F12などの開発者ツール > Console で確認)。
   - もし CORS エラー (Access-Control-Allow-Origin) が出る場合は、Render側の環境変数 `CORS_ORIGIN` を VercelのURL (例: `https://nivel-arena-online.vercel.app`) に変更して再デプロイしてください。

## 4. ルーム管理・パスワード機能について (現状の制限)

現在、ルームはランダム生成のみでパスワード機能は未実装です。
URLを共有した人だけが入れる仕組みですが、完全なプライベート性はまだありません。
次回のアップデートでパスワード機能を実装することを推奨します。
