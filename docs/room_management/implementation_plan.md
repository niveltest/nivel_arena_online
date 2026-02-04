# 実装計画: ルーム管理強化 (パスワード & 観戦モード)

## 概要

現在、ルームIDのみでマッチングしていますが、プライベートな対戦や大会運営のために「パスワード機能」と「観戦機能」を実装します。

## 変更内容

### 1. Server Side (`server/Game.ts`, `server/index.ts`)

#### Game.ts

- `password` (string | null) プロパティを追加。
- `spectators` (Record<string, Player>) プロパティを追加。
- `addSpectator(player: Player)` メソッドを追加。
- `broadcastState` を修正し、観戦者には**両プレイヤーの手札が見える**特別なステート、あるいは既存ステートに手札情報を付加して送るように変更（またはクライアント側で出し分け）。
  - *方針*: `GameState` に `spectatorMode: boolean` は含めず、ソケット送信時に `visibleHand` 情報を調整する。観戦者には `player1Hand`, `player2Hand` の両方を送る。

#### index.ts (Socket Events)

- `createGame`: `(username, deckId, password?)` を受け取るように変更。
- `joinGame`: `(username, roomId, deckId, password?, isSpectator?)` を受け取るように変更。
  - パスワード不一致ならエラーを返す。
  - `isSpectator` が true なら `game.addSpectator` を呼ぶ。
- `gameAction` や `gameState` ブロードキャスト時に、観戦者（Room内の全ソケット）にも送信されることを確認。

### 2. Client Side (`components/Lobby.tsx`, `components/GameBoard.tsx`)

#### Lobby.tsx

- **Create Room**: パスワード入力欄（任意）を追加。
- **Join Room**: パスワード入力欄と「観戦モード (Watch Mode)」チェックボックスを追加。

#### GameBoard.tsx

- `isSpectator` プロパティを受け取る（またはサーバーからの `joined` イベントで判定）。
- 観戦者の場合：
  - 自分(`playerId`) は存在しない扱い、またはダミーID。
  - 操作（カードクリック、攻撃など）を無効化。
  - 画面下部に「SPECTATOR MODE」と表示。
  - 両プレイヤーの手札を表示するエリアを追加（あるいは画面切り替え）。
    - *UI案*: 通常UIを流用し、`isSpectator` の場合、下部（自分エリア）に Player 1、上部（相手エリア）に Player 2 を表示。

## Verification Plan

1. **パスワードロック**:
   - パスワード付きルームを作成し、パスワードなし/誤入力で入れないことを確認。
   - 正しいパスワードで参加できることを確認。
2. **観戦モード**:
   - プレイヤー2名が対戦中のルームに「観戦」で入室。
   - 盤面が同期されるか、操作できないか、両方の手札が見えるかを確認。
