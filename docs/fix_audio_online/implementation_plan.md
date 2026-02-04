# オンライン環境の音声再生問題の修正

オンライン環境で音声が再生されない問題を解決するため、ブラウザの自動再生ポリシーへの対応と、アセットパスの修正、およびデプロイエラーの解消を行います。

## Proposed Changes

### Vercel設定

#### [MODIFY] [vercel.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/vercel.json)

- `env` セクションにある `@socket_url` の参照を削除します。これは古いVercel Secretを参照しており、現在のビルド失敗の直接の原因です。環境変数はVercelダッシュボード（またはCLI）で直接管理します。

### オーディオ管理

#### [MODIFY] [AudioManager.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)

- ブラウザの自動再生ポリシーによりBGM再生がブロックされた際、`pendingBGM`として保存し、ユーザーの最初の操作後に自動的に再生を開始するロジックを追加しました（実装済み）。

### UIコンポーネント

#### [MODIFY] [Lobby.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Lobby.tsx)

- 音声システムの初期化をユーザー操作時にも行うように修正し、存在しない `grid.svg` への参照をCSSグリッドに置き換えました（実装済み）。

## Verification Plan

### 自動テスト

- なし（UIおよび音声関連のため、実機での確認が必要）

### 手動検証

1. `npx vercel --prod` でデプロイを実行し、正常に完了することを確認する。
2. デプロイされたURLにアクセスし、以下の点を確認する：
   - ロビー（Lobby）に入った際、何らかのクリック操作の後にBGM（bgm_lobby）が再生されること。
   - 画面の背景が正しく表示されていること（404エラーがないこと）。
   - ゲーム開始後、BGMが切り替わり、効果音（カードドローなど）が鳴ることを確認する。
