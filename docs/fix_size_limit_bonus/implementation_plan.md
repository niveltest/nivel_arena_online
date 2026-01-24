# サイズ制限ボーナス実装計画

リーダーが覚醒した際などの「サイズ+1」効果が正しく機能するように修正します。

## 課題の分析

- **カードデータ不足**: `ST02-001` の `effects` にサイズを増やすアクションが定義されていない。
- **計算ロジック不足**: `Game.ts` の `getSizeLimit` が単に「リーダーレベル＋ダメージ」を返しており、リーダーの効果を評価していない。

## 修正内容

### 1. カードデータの更新 (`cards.json`)

- [MODIFY] [cards.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/data/cards.json)
  - `ST02-001` の `effects` に `action: "BUFF_SIZE", value: 1` のような定義を追加（または既存の `BUFF_ALLY` を修正）。

### 2. サーバーサイドロジックの修正 (`Game.ts`)

- [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)
  - `getSizeLimit` メソッドを更新し、リーダーが覚醒状態かつ適切なパッシブ効果を持っている場合に値を加算するようにします。

### 3. CPUロジックの修正 (`AIPlayer.ts`)

- [MODIFY] [AIPlayer.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/AIPlayer.ts)
  - 先ほど追加した `getSizeLimit` をサーバー側と同様のロジックに更新し、AIがボーナス分を正しく認識できるようにします。

## 検証プラン

- ビルドが通ることを確認。
- `ST02-001` を使用してレベル6（覚醒）にする。
- 通常の制限（6+ダメージ）よりも1多いコスト分までユニットを並べられることを確認。
