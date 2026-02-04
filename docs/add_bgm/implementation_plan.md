# 実装計画: 戦闘外BGMの追加

## 目的

戦闘中以外（ロビー、デッキ構築）およびゲーム終了時（勝利、敗北）に適切なBGMを再生し、ユーザー体験を向上させる。
現在は `bgm_battle.mp3` のみが実装されているため、他のシーン用のBGM定義と再生ロジックを追加する。
※実際の音声ファイルについては、暫定的に `bgm_battle.mp3` の複製を用いて動作確認可能な状態にする。

## 実装内容

### 1. 音声ファイルの準備

`public/audio/` ディレクトリに以下のファイルを用意する。
（今回は `run_command` を使用して `bgm_battle.mp3` をコピーする）

- `bgm_lobby.mp3`: ロビー画面用
- `bgm_deck.mp3`: デッキ構築画面用
- `bgm_victory.mp3`: 勝利時用
- `bgm_defeat.mp3`: 敗北時用

### 2. Audio定義の更新

**ファイル**: `utils/AudioManager.ts`

- `SoundKey` 型定義に上記4つのキーを追加する。
- `SOUND_MAP` にキーとパスのマッピングを追加する。

**ファイル**: `utils/SoundManager.ts`

- `KEY_MAP` に新しいキーを追加し、`SoundManager.play()` 経由で呼び出せるようにする。

### 3. 各画面での再生ロジック実装

#### ロビー (`components/Lobby.tsx`)

- `useEffect` を追加し、コンポーネントマウント時に `SoundManager.play('bgm_lobby')` を呼び出す。

#### デッキ構築 (`components/DeckBuilder.tsx`)

- `useEffect` を追加し、コンポーネントマウント時に `SoundManager.play('bgm_deck')` を呼び出す。

#### ゲームボード (`components/GameBoard.tsx`)

- **開始時**: 既存の `SoundManager.play('bgm_battle')` を維持。
- **終了時**: `setGameResult` で勝敗が決まったタイミングで、結果に応じて `bgm_victory` または `bgm_defeat` を再生する。 `useEffect` 内で `gameResult` を監視して実行するのが適切。

## 検証計画

### 手動検証

1. **Lobby**: アプリをリロードし、ロビー画面でBGMが流れることを確認。（コンソールログやブラウザの音声インジケータで確認）
2. **Deck Builder**: 「Deck Builder」ボタンを押し、BGMが切り替わるか（`bgm_deck`が再生されるか）確認。
3. **Back to Lobby**: デッキ構築から戻った際に `bgm_lobby` に戻るか確認。
4. **Game Start**: ゲームを開始し、戦闘BGM (`bgm_battle`) に切り替わるか確認。
5. **Game End**: 降参するか勝利条件を満たし、リザルト画面表示とともに `bgm_victory` / `bgm_defeat` が流れるか確認。

### 自動検証

- 特に無し。ビルドエラーが出ないことの確認。
