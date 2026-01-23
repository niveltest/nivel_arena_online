# Render と Vercel を使用した本番環境デプロイ手順

このガイドでは、サーバーを Render に、クライアントを Vercel にデプロイする方法を説明します。

## 概要

- **サーバー (Socket.io)**: Render にデプロイ
- **クライアント (Next.js)**: Vercel にデプロイ

## 前提条件

- GitHub アカウント
- プロジェクトが GitHub リポジトリにプッシュされていること
- Render アカウント (無料)
- Vercel アカウント (無料)

## Part 1: サーバーを Render にデプロイ

### 1. Render アカウントの作成

1. [Render](https://render.com/) にアクセス
2. GitHub アカウントでサインアップ

### 2. 新しい Web Service を作成

1. Render ダッシュボードで "New +" → "Web Service" をクリック
2. GitHub リポジトリを接続
3. プロジェクトのリポジトリを選択

### 3. サービスの設定

以下の設定を入力:

- **Name**: `nivel-arena-server` (任意)
- **Region**: 最寄りのリージョンを選択
- **Branch**: `main` (または使用しているブランチ)
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### 4. 環境変数の設定

"Environment" セクションで以下を追加:

- `CLIENT_URL`: (後で Vercel のデプロイ後に設定)

### 5. デプロイ

"Create Web Service" をクリックしてデプロイを開始します。

デプロイが完了すると、サーバーの URL が表示されます (例: `https://nivel-arena-server.onrender.com`)。

## Part 2: クライアントを Vercel にデプロイ

### 1. Vercel アカウントの作成

1. [Vercel](https://vercel.com/) にアクセス
2. GitHub アカウントでサインアップ

### 2. 新しいプロジェクトを作成

1. Vercel ダッシュボードで "Add New..." → "Project" をクリック
2. GitHub リポジトリをインポート
3. プロジェクトのリポジトリを選択

### 3. プロジェクトの設定

以下の設定を入力:

- **Framework Preset**: `Next.js` (自動検出されるはず)
- **Root Directory**: `./` (プロジェクトのルート)
- **Build Command**: `npm run build` (デフォルト)
- **Output Directory**: `.next` (デフォルト)

### 4. 環境変数の設定 (クライアント)

"Environment Variables" セクションで以下を追加:

- **Key**: `NEXT_PUBLIC_SOCKET_URL`
- **Value**: `https://nivel-arena-server.onrender.com` (Render でデプロイしたサーバーの URL)

### 5. デプロイ (クライアント)

"Deploy" をクリックしてデプロイを開始します。

デプロイが完了すると、クライアントの URL が表示されます (例: `https://nivel-arena.vercel.app`)。

## Part 3: サーバーの環境変数を更新

1. Render ダッシュボードに戻る
2. デプロイしたサービスを選択
3. "Environment" タブを開く
4. `CLIENT_URL` を Vercel のクライアント URL に更新 (例: `https://nivel-arena.vercel.app`)
5. "Save Changes" をクリック
6. サービスが自動的に再デプロイされます

## 動作確認

1. Vercel のクライアント URL にアクセス
2. ルームを作成
3. 別のブラウザまたはデバイスで同じ URL にアクセス
4. ルーム ID を入力して参加
5. 対戦が開始されることを確認

## トラブルシューティング

### WebSocket 接続エラー

- **原因**: CORS 設定が正しくない
- **解決策**: Render の `CLIENT_URL` 環境変数が Vercel の URL と一致しているか確認

### サーバーが起動しない

- **原因**: ビルドコマンドまたは起動コマンドが正しくない
- **解決策**: Render のログを確認し、エラーメッセージを確認

### クライアントがサーバーに接続できない

- **原因**: 環境変数 `NEXT_PUBLIC_SOCKET_URL` が正しくない
- **解決策**: Vercel の環境変数を確認し、再デプロイ

## 無料プランの制限

### Render (無料プラン)

- サービスは 15 分間アクティビティがないとスリープ状態になります
- 初回アクセス時に起動に数秒かかる場合があります
- 月 750 時間まで無料

### Vercel (無料プラン)

- 月 100GB の帯域幅
- 無制限のデプロイ
- 商用利用には制限があります

## 次のステップ

- カスタムドメインの設定
- HTTPS の強制
- パフォーマンスモニタリングの設定
- エラートラッキングの導入 (Sentry など)
