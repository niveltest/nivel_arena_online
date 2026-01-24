# マリガンUI改善計画

マリガン判断を容易にするため、カードコストの可視化と詳細確認モーダルの表示優先順位を修正します。

## 変更内容

### 1. カードへのコスト表示追加

* [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)
  * 左上に青色のコスト表示（ダイヤモンド型など）を追加します。
  * `minimal={false}` の場合のみ表示します。

### 2. モーダルの重なり順序修正

* [MODIFY] [CardDetailModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/CardDetailModal.tsx)
  * `z-index` を `50` から `200` に引き上げ、`SelectionModal` (z-100) よりも手前に表示されるようにします。

## 検証プラン

* ビルドが通ることを確認。
* （ユーザー検証）
  * マリガン画面でカードのコストが左上に表示されていること。
  * 右クリックでカード詳細が表示されること（SelectionModalの後ろに隠れないこと）。
