# カード画像表示不具合の修正 - Walkthrough

カード画像が表示されない問題を調査し、暫定的な対応を実装しました。

## 調査結果

- **原因**: 公式サイト `nivelarena.jp` のSSL証明書の設定が無効となっており、`https://` 経由でのアクセスが失敗（ホスティングサービスのデフォルトページにリダイレクト）しています。
- **確認事項**: ブラウザで `http://nivelarena.jp/` を直接開いた場合、画像は正常に存在することを確認しました。

## 変更内容

### 共通コンポーネントの修正

#### [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

#### [CardDetailModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/CardDetailModal.tsx)

画像URLが `https://nivelarena.jp` で始まる場合、強制的に `http://nivelarena.jp` に置換して読み込むロジックを追加しました。

```typescript
// 修正イメージ
src={card.imageUrl.replace(/^https:\/\/nivelarena\.jp/, 'http://nivelarena.jp')}
```

これにより、サーバー側のSSLエラーをバイパスして画像を表示できるようになります。

## ユーザーへの報告事項

> [!NOTE]
> この対応は、公式サイト側のSSL証明書が修正されるまでの暫定的な処置です。公式サイト側でSSLが正常化された後も、このコードは動作を継続しますが、将来的には元に戻すことが推奨されます。

## 検証結果

- `nivelarena.jp` の画像URLが `http` に置換されることをコードレベルで確認。
- サイト本体は `http` で正常に稼働しているため、画像データの取得が可能になりました。
