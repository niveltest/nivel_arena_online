# 修正計画：オーディオ音量の不整合および調整不能問題

## 現状の課題

- **レースコンディション**: `AudioManager.initialize()` (非同期) が完了する前に `SoundManager.play('bgm_battle')` が呼ばれるため、`localStorage` からの音量設定が読み込まれる前にデフォルト音量（20%）で再生が開始されてしまう。
- **音量更新の漏れ**: `initialize()` が完了した際、既に再生中のBGMの音量を更新する処理がない。
- **非同期参照の不整合**: `playBGM` 内の `play().then()` で `this.bgm` を参照しているため、フェード中に別のBGMに切り替わると古いBGMのフェード処理が新しいBGMに適用されたり、古いBGMが止まらなくなったりする可能性がある（「調整不能」の原因の可能性）。

## 変更内容

### [utils/AudioManager.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)

- `playBGM` メソッドに `!this.initialized` のチェックを追加し、初期化前なら `pendingBGM` にキューイングするように修正（SEと同様の挙動）。
- `playBGM` 内の非同期処理で `this.bgm` ではなくローカル変数を使用し、確実に再生を開始した個体に対して操作を行う。
- `initialize` メソッドの最後に、ロードされた設定を反映させるために `this.bgm.volume` を更新する処理を追加し、再生中のBGMに音量を適用する。

### [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `SoundManager.play('bgm_battle')` の呼び出しを、`useEffect` 内での `audioManager.initialize()` の完了を待ってから行うように修正する。
- 複数の `useEffect` で行われている初期化処理を整理し、順序性を担保する。

## 検証計画

### 手動検証

1. ロビーで音量設定を開き、BGMを0%にする。
2. 対戦を開始する。
3. 戦闘開始直後のBGMが無音であることを確認する。
4. 戦闘中に設定を開き、BGM音量を上げた場合に正しく音量が変化することを確認する。
5. 逆に、BGMを上げた状態で対戦に入り、途中で0%にした際に完全に消えることを確認する。
