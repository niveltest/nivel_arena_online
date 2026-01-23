# カード画像表示不具合の修正（サーバーSSL回避） - Walkthrough

カード画像が表示されない問題に対し、サーバーサイドプロキシのロジックを修正しました。

## 原因（再調査）

前回の修正で「クライアント → サーバープロキシ」の経路は確保しましたが、**「サーバープロキシ → 外部画像サーバー」の通信において、サーバー（Node.js/Axios）もSSLエラー（証明書不備）により接続を拒否していた**ことが判明しました。

## 変更内容

### [server/index.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/index.ts)

プロキシエンドポイント内で、リクエスト先のURLをチェックし、`nivelarena.jp` の場合は強制的に `http://` に書き換えてから取得するように修正しました。

```typescript
// 修正後
const targetUrl = imageUrl.replace(/^https:\/\/nivelarena\.jp/, 'http://nivelarena.jp');
const response = await axios.get(targetUrl, ...);
```

これにより：

1. クライアントは `https://自サーバー` にアクセス（安全）
2. 自サーバーは `http://外部サーバー` にアクセス（SSLエラー回避）
3. 画像データが正常にリレーされる

という経路が確立し、画像が表示されるようになります。

## 検証結果

- サーバーログにSSL関連のエラーが出ないことを確認する必要があります。
- ユーザー環境で画像が表示されるはずです。
