# Damage Visibility Walkthrough

## Summary

ダメージを受けた際に引かれたカードを可視化する機能を実装しました。ゲームログへの出力に加え、画面中央に大きくカード情報を表示するオーバーレイを追加し、トリガー効果の発動も一目でわかるようになりました。

## Changes Made

### Server Side

#### [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- `dealDamage` メソッドに以下を追加:
  - ダメージカードの名前とトリガー情報をゲームログに出力
  - `broadcastAction` で `DAMAGE_REVEAL` イベントをクライアントに送信
  - イベントデータにカード情報、トリガーフラグ、プレイヤー名を含める

### Client Side

#### [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `damageCardReveal` ステートを追加し、ダメージカード情報を保持
- `gameAction` リスナーで `DAMAGE_REVEAL` イベントを受信し、ステートを更新
- 3秒後に自動的にオーバーレイを非表示にするタイマーを設定
- 画面中央にオーバーレイを表示:
  - カード画像を大きく表示
  - カード名とテキストを表示
  - トリガー発動時は「⚡ トリガー発動! ⚡」と黄色のアニメーション付きテキストで強調

## Verification

### Manual Testing

- 対戦中にダメージを受けると、ゲームログに「[プレイヤー名] がダメージカードを引いた: [カード名]」と表示されることを確認
- 画面中央にカード情報のオーバーレイが3秒間表示されることを確認
- トリガー効果を持つカードの場合、「トリガー発動!」の強調表示が出ることを確認
