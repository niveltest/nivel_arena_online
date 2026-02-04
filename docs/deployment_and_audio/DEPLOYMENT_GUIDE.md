# デプロイガイド: オンライン環境へのデプロイ手順

このガイドでは、ゲームを外部からアクセス可能にするための手順を説明します。

## 前提知識

**デプロイとは？**

- 開発したアプリケーションをインターネット上で公開し、誰でもアクセスできるようにすること
- 現在はローカル環境（あなたのPC）でのみ動作していますが、デプロイ後は世界中からアクセス可能になります

**必要なもの:**

- GitHubアカウント（コードを保存）
- Vercelアカウント（フロントエンド用、無料）
- Renderアカウント（サーバー用、無料プランあり）

---

## ステップ1: GitHubにコードをアップロード

### 1.1 GitHubアカウントの作成

1. <https://github.com> にアクセス
2. 「Sign up」をクリックして無料アカウントを作成
3. メールアドレスを確認

### 1.2 リポジトリの作成

1. GitHubにログイン後、右上の「+」→「New repository」をクリック
2. Repository name: `nivel-arena-online`
3. 「Public」を選択（無料プランの場合）
4. 「Create repository」をクリック

### 1.3 コードのアップロード

プロジェクトフォルダで以下のコマンドを実行：

```bash
# Gitの初期化（まだの場合）
git init

# GitHubリポジトリを追加
git remote add origin https://github.com/あなたのユーザー名/nivel-arena-online.git

# ファイルをステージング
git add .

# コミット
git commit -m "Initial commit"

# GitHubにプッシュ
git branch -M main
git push -u origin main
```

---

## ステップ2: Vercelでフロントエンドをデプロイ

### 2.1 Vercelアカウントの作成

1. <https://vercel.com> にアクセス
2. 「Sign Up」をクリック
3. 「Continue with GitHub」を選択してGitHubアカウントで連携

### 2.2 プロジェクトのインポート

1. Vercelダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリ一覧から `nivel-arena-online` を選択
3. 「Import」をクリック

### 2.3 設定

- **Framework Preset**: Next.js（自動検出されます）
- **Root Directory**: `.`（デフォルト）
- **Environment Variables**（環境変数）:
  - `NEXT_PUBLIC_SOCKET_URL`: （後でRenderのURLを設定）

### 2.4 デプロイ

1. 「Deploy」をクリック
2. 数分待つとデプロイ完了
3. 表示されるURL（例: `https://nivel-arena-online.vercel.app`）をメモ

---

## ステップ3: Renderでサーバーをデプロイ

### 3.1 Renderアカウントの作成

1. <https://render.com> にアクセス
2. 「Get Started」をクリック
3. 「Continue with GitHub」を選択

### 3.2 Web Serviceの作成

1. ダッシュボードで「New +」→「Web Service」をクリック
2. GitHubリポジトリ `nivel-arena-online` を選択
3. 以下の設定を入力：
   - **Name**: `nivel-arena-server`
   - **Region**: Singapore（日本に近い）
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free（無料プラン）

### 3.3 環境変数の設定

「Environment」タブで以下を追加：

- `PORT`: `3001`
- `NODE_ENV`: `production`

### 3.4 デプロイ

1. 「Create Web Service」をクリック
2. デプロイが完了したらURLをメモ（例: `https://nivel-arena-server.onrender.com`）

---

## ステップ4: 環境変数の更新

### 4.1 Vercelの環境変数を更新

1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」
3. `NEXT_PUBLIC_SOCKET_URL` の値をRenderのURL（`https://nivel-arena-server.onrender.com`）に更新
4. 「Save」をクリック
5. 「Deployments」タブで「Redeploy」をクリック

---

## ステップ5: 動作確認

1. VercelのURL（`https://nivel-arena-online.vercel.app`）にアクセス
2. ゲームが正常に表示されるか確認
3. 別のデバイス（スマホなど）からもアクセスして対戦できるか確認

---

## トラブルシューティング

### サーバーに接続できない

- Renderのログを確認（ダッシュボード→Logs）
- 環境変数が正しく設定されているか確認
- Renderの無料プランは15分間アクセスがないとスリープするため、初回アクセス時は起動に時間がかかります

### デプロイが失敗する

- GitHubのコードが最新か確認
- `package.json` の依存関係が正しいか確認
- Vercel/Renderのビルドログでエラーメッセージを確認

---

## 次のステップ

デプロイが完了したら：

1. 友人にURLを共有して対戦してもらう
2. フィードバックを収集
3. 必要に応じて機能を追加・改善
