# カード画像表示不具合の修正（プロキシ方式）

## 目的

ブラウザの Mixed Content ブロック（HTTPSサイトで HTTP 画像を読み込めない仕様）を回避するため、サーバーサイドに画像転送用プロキシを実装します。

## 提案される変更

### [Component] Server (server/index.ts)

#### [MODIFY] [index.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/index.ts)

1. **プロキシエンドポイントの追加**:
    - `/api/proxy-image` エンドポイントを実装。
    - `axios` を用いて外部画像を fetch し、レスポンスとして返却。

### [Component] Frontend (components/Card.tsx, components/CardDetailModal.tsx)

#### [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

#### [MODIFY] [CardDetailModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/CardDetailModal.tsx)

1. **画像URLの変換**:
    - `imageUrl` を直接使わず、`/api/proxy-image?url=...` 経由で取得するように修正。

## 検証計画

- ローカル環境およびオンライン環境で画像が表示されることを確認。
- デベロッパーツールの Network タブで `/api/proxy-image` へのリクエストが成功していることを確認。
