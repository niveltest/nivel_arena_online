# CPUフリーズおよびBGM重複のデバッグ結果

## 実施内容

BGMの重複再生（音量調整不能なゴースト音）と、CPU戦でのフリーズ問題を修正しました。

## 修正内容

### 1. BGM重複問題の修正

- **[AudioManager.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)**:
  - `playBGM` 時に既存のオーディオインスタンスを確実に `pause` し、`src = ""` でリソースを解放するようにしました。
  - フェードアウト中のBGMリスト (`fadingBGMs`) も新規再生時に一掃し、複数のBGMが重なるのを防ぎます。
- **[GameBoard.tsx](file:///C:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)**:
  - `useEffect` 内に `isMounted` フラグを導入し、React 18の StrictMode による再レンダリングや高速な画面遷移時に、アンマウント済みのコンポーネントがオーディオを初期化・再生して「ゴースト」になるのを防止しました。

### 2. CPUフリーズ（スタック）問題の修正

- **[Game.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)**:
  - **エフェクトキューの処理漏れ修正**: `resolveDefense` (防御解決) と `resolveSelection` (カード選択) の末尾に `processEffectQueue()` の呼び出しを追記しました。これにより、自壊（Self-Destruct）効果などの後に発生する連鎖的なエフェクト（ドロー、追加破壊など）が正しく完結するようになります。
  - **AI思考トリガーの強化**: `broadcastState()` において、CPUが「自分自身のターン」でなくても `DEFENSE` (防御) や `GUARDIAN_INTERCEPT` (ガーディアン) のフェーズで自分が対象なら思考を開始するように修正しました。
  - **自壊ロジックの改善**: 装備品 (ITEM) に `isSelfDestruct` が付いている場合も正しく判定されるように修正しました。

## 検証結果

- **BGM**: 画面遷移を繰り返してもBGMが重ならず、設定画面からの音量調整が全ての音に反映されることを確認しました。
- **CPU**: 自壊カード（ケブラーベスト等）が絡む戦闘においても、AIが止まることなく思考を継続し、ゲームが進行することを確認しました。

render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)
render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)
render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)
