# タスクリスト: 戦闘外BGMの追加 (Add Non-Combat BGM)

## 1. 音声ファイルの準備 (Dummy Files)

- [x] 既存の `bgm_battle.mp3` を複製して以下のファイルを作成する <!-- id: 1 -->
  - [x] `bgm_lobby.mp3` (ロビー用) <!-- id: 2 -->
  - [x] `bgm_deck.mp3` (デッキ構築用) <!-- id: 3 -->
  - [x] `bgm_victory.mp3` (勝利時) <!-- id: 4 -->
  - [x] `bgm_defeat.mp3` (敗北時) <!-- id: 5 -->

## 2. コード実装 (Code Implementation)

- [x] `utils/AudioManager.ts` の定義更新 <!-- id: 6 -->
  - [x] `SoundKey` に新しいBGMを追加 <!-- id: 7 -->
  - [x] `SOUND_MAP` にファイルパスを追加 <!-- id: 8 -->
- [x] `utils/SoundManager.ts` の更新 <!-- id: 9 -->
  - [x] `KEY_MAP` に新しいBGMを追加 <!-- id: 10 -->
- [x] 各コンポーネントへのBGM再生処理の追加 <!-- id: 11 -->
  - [x] `components/Lobby.tsx`: マウント時に `bgm_lobby` 再生 <!-- id: 12 -->
  - [x] `components/DeckBuilder.tsx`: マウント時に `bgm_deck` 再生 <!-- id: 13 -->
  - [x] `components/GameBoard.tsx`:
    - [x] 初期ロード時は `bgm_battle` 再生 <!-- id: 14 -->
    - [x] 勝敗決定時に `bgm_victory` / `bgm_defeat` に切り替え <!-- id: 15 -->
    - [x] ロビーに戻る際 (アンマウント時) の処理確認 (Lobby側で再生されればOK) <!-- id: 16 -->

## 3. 動作検証 (Verification)

- [x] ロビー起動時にBGMが鳴るか <!-- id: 17 -->
- [x] デッキ構築画面遷移でBGMが切り替わるか <!-- id: 18 -->
- [x] ゲーム開始で戦闘BGMに切り替わるか <!-- id: 19 -->
- [x] ゲーム終了時に勝利/敗北BGMに切り替わるか <!-- id: 20 -->
