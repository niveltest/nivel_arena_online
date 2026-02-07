# CPUフリーズおよびBGM重複の修正計画

## 概要

ゲーム中のBGMが重複して再生される問題、およびCPUが自壊（自爆）エフェクト発生後にフリーズする問題を修正します。

## 修正が必要な部位

### 1. BGM重複問題

- **原因**:
  - `GameBoard.tsx` の `useEffect` 内で呼び出される `initAudio` (async) が、コンポーネントのアンマウント（React 18の再マウント含む）後も完了し、BGMを再生してしまう。
  - `AudioManager.ts` が `playBGM` ごとに `new Audio()` を生成しており、以前のインスタンスが解放されないケースがある。
- **対策**:
  - `GameBoard.tsx` に `isMounted` ref を導入し、アンマウント後はBGM再生を実行しないようにする。
  - `AudioManager.ts` を修正し、BGM用オーディオインスタンスを1つに固定（または確実に前のものを破棄・解放）する。

### 2. CPUフリーズ問題

- **原因**:
  - 自壊 (Self-Destruct) エフェクトなどの割り込み処理後、AI側の `think()` を呼び出すきっかけとなる `broadcastState` が不足しているか、フェーズ遷移が正しく行われていない。
  - もしくは、特定のカード効果（ケブラープロテクターを装備したユニットの爆発など）の処理中に `effectQueue` がスタックしている。
- **対策**:
  - `Game.ts` の `destroyUnit` や `resolveDefense` における自壊ロジック周辺のログを強化し、スタック箇所を特定。
  - 自壊処理完了後に `broadcastState()` を呼び、AIが次の行動を考えられるようにする。
  - AI (`AIPlayer.ts`) 側で、攻撃可能なユニットがいなくなった場合のフェーズ終了処理が確実に行われるよう確認。

## 変更ファイル

### [MODIFY] [AudioManager.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)

- `playBGM` にて、既存の `this.bgm` がある場合は `src` が同じなら再利用、違うなら確実に `pause()` して破棄するように変更。

### [MODIFY] [GameBoard.tsx](file:///C:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `useEffect` 内の `initAudio` にマウントチェックを追加。

### [MODIFY] [Game.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- 自壊処理後の `broadcastState` の位置や、フェーズ更新ロジックのデバッグログ追加と調整。

## 検証計画

- ゲーム開始→BGMが1つだけ流れること、音量調整（ミュート含む）が全てのBGM音に適用されることを確認。
- CPUとの対戦で、自壊効果を持つユニット（ギロチン等）が防御した際、その後のAIターンが止まらないことを確認。
