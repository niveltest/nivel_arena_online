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
- `playBGM` 内にブラウザ互換性のための `ended` イベントリスナーを追加し、確実にループするように修正。
- 音量が0（ミュート）の時でも `play()` を呼び出すように変更し、後から音量を上げた際に再生が始まるように改善。
- `setVolume` と `toggleMute` 内で、音量が有効になった際に再生が止まっていれば再開するロジックを追加。
- `initializing` フラグを導入し、複数のコンポーネントからの同時初期化による競合を防止。

### [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `SoundManager.play('bgm_battle')` の呼び出しを、`useEffect` 内での `audioManager.initialize()` の完了を待ってから行うように修正する。
- 複数の `useEffect` で行われている初期化処理を整理し、順序性を担保する。
- `useEffect` のクリーンアップ関数に `audioManager.stopBGM()` を追加し、対戦画面を離れた際にBGMが止まるように修正（BGMの重複再生を防止）。

## 検証計画

### 手動検証

1. 設定で音量を0にした状態で対戦を開始し、その後設定画面から音量を上げた時に音楽が流れることを確認する。
2. BGMが最後まで演奏された後、最初に戻ってループ再生されることを確認する。
3. 対戦終了後、またはリロードしてロビーに戻った際にBGMが正しく停止することを確認する。
