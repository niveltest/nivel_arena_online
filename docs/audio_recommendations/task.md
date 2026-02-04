# タスクリスト: 音声演出の強化 (Audio Recommendations)

## 1. 音声ファイルの準備 (Placeholder Files)

- [x] 既存の `bgm_battle.mp3` を使用して、欠落しているSEおよび新規SEのダミーファイルを作成する <!-- id: 1 -->
  - [x] `se_play_card.mp3`, `se_attack_start.mp3`, `se_attack_hit.mp3`, `se_draw.mp3` <!-- id: 2 -->
  - [x] `se_destroy.mp3`, `se_damage.mp3`, `se_levelup.mp3` <!-- id: 3 -->
  - [x] `se_victory.mp3`, `se_defeat.mp3` <!-- id: 4 -->
  - [x] `se_effect.mp3` (新規: エフェクト用) <!-- id: 5 -->
  - [x] `se_turn_start.mp3` (新規: ターン開始用) <!-- id: 6 -->
  - [x] `se_selection.mp3` (新規: 選択プロンプト用) <!-- id: 7 -->

## 2. オーディオ管理の更新

- [x] `utils/AudioManager.ts` の `SoundKey` と `SOUND_MAP` に新規SEを追加 <!-- id: 8 -->
- [x] `utils/SoundManager.ts` の `KEY_MAP` に新規SEを追加 <!-- id: 9 -->

## 3. 再生ロジックの実装 (`GameBoard.tsx`)

- [x] アニメーションイベント (`DESTROY`, `EFFECT`) 時の再生追加 <!-- id: 10 -->
- [x] ターン開始時の再生追加 <!-- id: 11 -->
- [x] 選択モーダル表示時の再生追加 <!-- id: 12 -->
- [ ] HP低下時の警告演出 (Optional: 今回はスコープ外) <!-- id: 13 -->

## 4. 動作検証

- [x] 各アクションで音が鳴る（ダミー音が再生される）ことを確認 <!-- id: 14 -->
- [x] 404エラーが出ないことを確認 <!-- id: 15 -->
