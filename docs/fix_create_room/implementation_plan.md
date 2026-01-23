# 実装計画 - 「ルーム作成」ボタンの不具合修正

「ルーム作成」ボタンを押しても反応しない問題の原因は、サーバー（port 3001）が起動していないこと、およびクライアント側に接続エラーの通知機能がないことにあると考えられます。

## 概要

現在、ユーザーは `npm run dev` でフロントエンドのみを起動しており、Socket.io サーバーが起動していません。また、`Lobby.tsx` ではサーバーへの接続待機中にタイムアウトやエラーハンドリングがないため、ボタンが「無反応」に見えてしまいます。

## 変更内容

### [Component] [Lobby.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Lobby.tsx)

#### [MODIFY] [Lobby.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Lobby.tsx)

- 接続状態を管理する `isConnecting` ステートを追加し、ボタンの多重押しを防止します。
- ソケットの接続エラー（`connect_error`）をキャッチし、ユーザーにアラートを表示するようにします。
- 接続タイムアウトを設定します。

### [Misc] 起動方法の改善

#### [MODIFY] [package.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/package.json)

- `npm run dev` が `concurrently` を使用してサーバーも同時に起動するように変更するか、注意書きを追加することを検討します。（今回は安全のため、既存の `dev:all` を推奨するメッセージをコンソールに出力するようにします）

## 検証計画

### 手動確認

1. サーバーを停止した状態で「ルーム作成」を押し、適切にエラーメッセージが表示されることを確認します。
2. サーバーを起動した状態でルームが正常に作成され、ゲーム画面に遷移することを確認します。
