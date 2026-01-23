# Socket.io型エラーの修正 実装計画

`GameBoard.tsx` で発生している型エラーを解決するため、依存関係とインポート文を最新の `socket.io-client` (v4) に合わせて修正します。

## 解決すべき問題

- `GameBoard.tsx:5` : `socket.io-client` から `io` がエクスポートされていないというエラー。
- `GameBoard.tsx:17` : `Socket` が型として正しく認識されていないエラー。

原因：`package.json` に古い `@types/socket.io-client` (v1用) が含まれており、v4の組み込み型定義と競合している、または古い形式のインポート（`import { io }`）を試みているため。

## 提案される変更

### Frontend 依存関係

#### [MODIFY] [package.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/package.json)

- `devDependencies` から `"@types/socket.io-client": "^1.4.36"` を削除します。

### Frontend コンポーネント

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- インポート文を `import { io, Socket } from 'socket.io-client';` から `import { io, Socket } from 'socket.io-client';` (あるいは必要に応じて `import io from 'socket.io-client'` かつ `import { Socket } from 'socket.io-client'`) に見直します。
- 基本的に v4 では `import { io, Socket } from "socket.io-client";` で動作するはずですが、ライブラリの型解決を優先させるために依存関係の整理を先行させます。

## 検証計画

### 自動テスト

- `npm run build` または `npx tsc` を実行して、`GameBoard.tsx` の型エラーが解消されていることを確認します。

### 手動確認

- 開発サーバーを起動し、ブラウザでコンソールエラーが出ていないこと、ソケット接続が正常に行われることを確認します。
