# UI表示デグレーション修正計画

リーダーカードの向きとダメージゾーンのカードサイズが意図せず変更された問題を修正しました。

## 修正内容

### 1. リーダーカードを横向きに修正

* [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)
  * リーダーカード（`type === 'LEADER'`）の場合、デフォルトのサイズを `w-32 h-24`（横向き）にするように修正しました。
* [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  * `DraggableZone` コンポーネントが設定ファイル（`config.rotation`）を無視していた問題を修正し、回転が正しく適用されるようにしました。

### 2. ダメージゾーンのカードサイズ調整

* [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  * `official` レイアウトにおけるダメージゾーンの `scale` を `0.67` から `0.8` に引き上げ、以前のサイズ感に戻しました。

## 検証プラン

* ビルドが通ることを確認。
* （ユーザー検証）
  * リーダーカードが以前のように横長で表示されていること。
  * ダメージゾーンのカードが以前と同じ程度の適切なサイズで表示されていること。
