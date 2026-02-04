# 実装計画: オンライン環境整備とオーディオ強化

ゲームを外部からアクセス可能にし、BGM・SEで没入感を高めます。

## ユーザーレビューが必要な項目

> [!IMPORTANT]
> **デプロイ先の選択**: 以下のオプションを提案します：
>
> - **フロントエンド**: Vercel（推奨、Next.jsに最適化）
> - **バックエンド**: Render（無料プランあり）、Railway、またはFly.io
>
> どのサービスを使用するか、またはすでにアカウントをお持ちかご確認ください。

> [!WARNING]
> **WebSocket対応**: Vercelは標準でWebSocketをサポートしていないため、Socket.ioサーバーは別途デプロイが必要です。

## 変更内容

### [Component 1] デプロイ設定

#### [NEW] [vercel.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/vercel.json)

Vercelのデプロイ設定ファイルを作成します：

- Next.jsアプリケーションのビルド設定
- 環境変数の参照
- リダイレクトルール

#### [NEW] [render.yaml](file:///c:/Users/worke/Antigravity/nivel_arena_online/render.yaml)

Renderでのサーバーデプロイ設定：

- Socket.ioサーバーのビルドとスタート設定
- 環境変数の定義
- ヘルスチェックの設定

#### [MODIFY] [package.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/package.json)

本番環境用のスクリプトを追加：

- `build:server`: サーバーのビルド
- `start:server`: 本番サーバーの起動

---

### [Component 2] ルーム管理強化

#### [MODIFY] [server/index.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/index.ts)

ルーム管理機能を拡張：

- パスワード付きルームの作成
- ルーム一覧の取得
- 観戦者の参加管理

#### [MODIFY] [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

観戦モードUIの追加：

- 観戦者用の読み取り専用表示
- 観戦者リストの表示

---

### [Component 3] オーディオシステム

#### [NEW] [utils/AudioManager.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)

オーディオ管理クラスを作成：

- BGM/SEの再生・停止
- ボリューム制御
- フェードイン/アウト

#### [NEW] [public/audio/](file:///c:/Users/worke/Antigravity/nivel_arena_online/public/audio/)

オーディオファイルの配置：

- `bgm_main.mp3`: メインBGM
- `se_card_play.mp3`: カードプレイ音
- `se_attack.mp3`: 攻撃音
- `se_damage.mp3`: ダメージ音
- `se_victory.mp3`: 勝利音

#### [MODIFY] [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

オーディオ統合：

- ゲーム開始時にBGM再生
- アクション時にSE再生
- ボリューム調整UIの追加

## 検証プラン

### デプロイ検証

- [ ] Vercelにフロントエンドをデプロイし、アクセス可能か確認
- [ ] Renderにサーバーをデプロイし、WebSocket接続が確立するか確認
- [ ] 異なるネットワークから対戦が可能か確認

### オーディオ検証

- [ ] BGMがループ再生されるか確認
- [ ] 各アクションで適切なSEが再生されるか確認
- [ ] ボリューム調整が正しく機能するか確認
- [ ] ミュート機能が正しく動作するか確認
