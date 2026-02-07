# CPUフリーズおよびBGM重複のデバッグ

## タスクリスト

- [x] BGM重複と音量調整不良の修正 [x]
  - [x] 現状のコード調査
  - [x] `GameBoard.tsx` の `useEffect` 内での `isMounted` チェック追加
  - [x] `AudioManager.ts` のBGMインスタンス管理の強化
- [x] CPUフリーズ問題の調査と修正 [x]
  - [x] カードデータ (`isSelfDestruct`) と `Game.ts` の関連ロジックの特定
  - [x] `Game.ts` への詳細ログの追加と `processEffectQueue` 修正
  - [x] 自壊 (Self-Destruct) 処理後のフェーズ遷移とAI再始動の確認
  - [x] AIの攻撃フェーズでのバーサーカー(Must Attack)対応の確認
- [x] 最終動作確認 [x]
  - [x] BGMが正しく1つだけ再生され、音量調整が効くこと
  - [x] CPUが自壊カード処理後もフリーズせずにプレイを続行すること
  - [x] 修正内容の確認 (Walkthrough) の作成
