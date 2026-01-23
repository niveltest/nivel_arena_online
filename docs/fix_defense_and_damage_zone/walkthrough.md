# ウォークスルー - 防御フェイズとダメージゾーンの修正

防御フェイズで進行不能になる不具合の修正と、ダメージゾーンの配置調整を行いました。

## 変更内容

### [Server] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- **防御フェイズの進行不能バグの修正**:
  - サーバーの `broadcastState` メソッドが、アタックの進行状況（`pendingAttack`）をクライアントに送信していなかった問題を修正しました。
  - これにより、防御側プレイヤーの画面に正しく防御選択モーダルが表示され、ゲームを進行できるようになります。

### [Component] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **ダメージゾーンの配置調整**:
  - `official` プレイマットのダメージゾーンの座標を、背景画像の「Damage Zone」枠に合わせて調整しました。
  - 相手側のダメージゾーンも、画像上の適切な位置（左上）に表示されるように修正しました。

## 検証結果

### 自動テスト / コード確認

- `Game.ts` の `broadcastState` に `pendingAttack` が追加されていることを確認しました。
- `GameBoard.tsx` の `PLAYMAT_CONFIGS.official` の座標が更新されていることを確認しました。

### 手動確認 (想定動作)

- アタック後に防御側が「🛡️ 防御」か「💔 受ける」を選択できるようになります。
- ダメージを受けた際、カードがプレイマットの左下（自分）または右上（相手）にある専用の枠内に表示されます。
