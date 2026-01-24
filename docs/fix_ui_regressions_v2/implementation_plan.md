# UI表示デグレーション修正計画 (第2弾・改)

リーダーカードのサイズ復元、および一般カード（手札など）への所属情報（ベース等）の再表示を行います。

## 変更内容

### 1. カード情報表示の改善 (`Card.tsx`)

* [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)
  * カード上に `affiliation`（所属）情報を表示するように追加します。
  * `minimal` モードではない場合に、カード名の横や下に「[ベース]」のような形で表示します。

### 2. リーダーカードの表示サイズ調整 (`GameBoard.tsx`)

* [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
  * `PLAYMAT_CONFIGS.official` のリーダーの `scale` を `1.0` に引き上げます。
  * ユーザーの要望に基づき、リーダーについては `minimal={true}` を維持し、情報表示は増やさずサイズのみ変更します。

## 検証プラン

* ビルドが通ることを確認。
* （ユーザー検証）
  * 手札のカードなどに「[ベース]」などの所属情報が表示されていること。
  * リーダーカードが適切な（以前のような）大きさで表示されていること（情報は整理されたまま）。
