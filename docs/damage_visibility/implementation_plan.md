# Damage Visibility Implementation Plan

## Goal

ダメージを受けた際にどのカードが引かれたかを可視化し、トリガー効果が発動したかどうかも一目でわかるようにする。

## Proposed Changes

### Server Side Logic

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- `dealDamage` メソッド内で、引かれたカードの名前とトリガーの有無を `addLog` でゲームログに出力する。
- `broadcastAction` を用いて、`DAMAGE_REVEAL` イベントをクライアントに送信する。送信データにはカード情報とトリガーフラグを含める。

### Client Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `lastDamageCard` ステートを追加し、ダメージを受けた際に引かれたカードを保持するようにする。
- `useEffect` 内の `gameAction` リスナーで `DAMAGE_REVEAL` を受信し、ステートを更新する。数秒後に自動的にクリアするようにタイマーを設定する。
- UI上に、引かれたダメージカードを大きく（かつ邪魔にならない場所に）表示するポップアップまたはオーバーレイを実装する。トリガー発生時はエフェクトや文字で強調する。

## Verification Plan

### Manual Verification

- 対戦中にダメージを受け、ゲームログにカード名が表示されることを確認。
- 画面中央付近に引かれたカードの画像または情報が一時的にオーバーレイ表示されることを確認。
- トリガー発生時に「トリガー発動！」といった強調表示が出ることを確認。
