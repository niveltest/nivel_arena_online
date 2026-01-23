# オンラインテストプレイの実装計画

## 概要

現在ローカル環境 (`localhost`) で動作しているゲームを、外部のネットワークからアクセス可能な状態にし、友人とオンラインでテストプレイできるようにします。

## ユーザーレビューが必要な項目
>
> [!IMPORTANT]
> オンライン化にあたり、サーバーを公開するための「ホスティングサービス」の選定が必要です。
>
> 1. **Render (無料枠あり)**: サーバー (Node.js) のデプロイに適しています。
> 2. **Vercel (無料枠あり)**: クライアント (Next.js) のデプロイに適しています。
> 3. **ngrok (ローカル公開)**: 自分の PC で動かしているサーバーを一時的に外部公開する最も簡単な方法です。

## 提案される変更点

### [Component] Client (Frontend)

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `SOCKET_URL` をハードコードせず、環境変数 `process.env.NEXT_PUBLIC_SOCKET_URL` から取得するように修正します。

### [Component] Server (Backend)

#### [MODIFY] [index.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/index.ts)

- デプロイ先のポート番号を環境変数 `PORT` から取得するように修正します (Render 等のサービス対応)。
- CORS 設定で、特定のドメイン（クライアントの公開URL）を許可できるように準備します。

## 検証計画

### 手動検証

- ngrok を使用して一時的な URL を生成し、外部のブラウザ（スマホ等）からアクセスして対戦ができるか確認します。
- サーバーを Render に、クライアントを Vercel にデプロイし、本番環境での Socket.io 通信を確認します。
