# [BGM読み込みエラー] 修正計画 v2

## 問題

Vercelデプロイ環境で `bgm_lobby.mp3` が404エラー。Gitには含まれており、ファイルサイズも許容範囲内だが、何らかの理由でVercelが配信していない。

## 新しい解決策

### バックエンド（Render）でオーディオファイルを配信する

Vercelの配信が不安定な場合、バックエンドサーバー（Render）からオーディオファイルを配信するように設定し、それをフォールバックとして利用する。

**手順:**

1. ✅ `server/index.ts` を修正し、`public/audio` ディレクトリを `/audio` パスで静的配信するように設定。
2. Renderで再デプロイを行い、バックエンドからファイルにアクセスできるか確認。
   - 例: `https://nivel-arena-server-96ie.onrender.com/audio/bgm_lobby.mp3`
3. もしVercelが引き続き404の場合は、`AudioManager.ts` の参照先をバックエンドURLに変更する。

## 検証計画

1. `git push` 後、Renderのデプロイ完了を待つ。
2. ブラウザでバックエンドURL経由でmp3にアクセスできるか確認。
3. （必要に応じて）フロントエンドの `AudioManager.ts` を更新。
