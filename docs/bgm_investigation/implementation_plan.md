# [BGM不具合] 調査・修正計画

## ゴール

カードプレイ時に戦闘BGM（`bgm_battle`）が毎回再生されてしまう問題を修正する。
本来の挙動通り、戦闘開始時に一度だけ再生される（または適切なタイミングで制御される）ようにする。

## 変更案

### `utils`

#### [MODIFY] [SoundManager.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/utils/SoundManager.ts)

- `play` メソッドにログ出力を追加し、呼び出し元をトレースできるようにする。

#### [MODIFY] [AudioManager.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)

- `playBGM` メソッドにログを追加し、呼び出しタイミングと重複チェックの挙動を確認する。
- 既に同じBGMが再生中の場合は処理をスキップする（冪等性）ロジックが正しく機能しているか確認・強化する。

### `components`

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- 音声初期化を行う `useEffect` にログを追加し、コンポーネントの再マウントによる再実行が発生していないか確認する。

## 検証計画

### 手動検証

1. ブラウザでゲームを開く。
2. 開発者ツールのコンソールを開く。
3. バトルを開始する（CPU戦またはオンライン戦）。
4. バトル開始時に「Requesting Combat BGM...」等のログが1回だけ出ることを確認。
5. カードをプレイする。
6. カードプレイ時に `SoundManager.play('bgm_battle')` 関連のログが出ないことを確認する。
7. もしBGMが再始動する場合、出力されたスタックトレースから呼び出し元を特定する。
