# マリガン機能の実装タスクリスト

- [x] `GameState` に `MULLIGAN` フェーズを追加
- [x] `Player` インターフェースに `mulliganDone` フラグを追加
- [x] `Game.start()` を変更し、即座にレベルアップせずマリガンフェーズから開始するように修正
- [x] サーバー側に `resolveMulligan` ロジックを実装（選択カードをデッキ底へ、同数ドロー、シャッフル）
- [x] Socket.io に `mulligan` イベントを公開
- [x] `SelectionModal` を更新し、マリガン用のラベル表示と0枚選択（全キープ）をサポート
- [x] `GameBoard` にマリガンUIを表示するロジックを追加
- [x] 両プレイヤーがマリガン完了後に自動で第1ターンを開始する処理を実装
