# 実装計画: 音声演出の強化

## 目的

ゲームの臨場感を高めるため、バトルの各アクションやUI操作に対して適切な効果音（SE）を紐付ける。
音声ファイル自体は暫定的に `bgm_battle.mp3` を使用し、ロジックを先行して実装する。

## 実装内容

### 1. 物理ファイルの準備

`public/audio/` に以下のダミーファイルを配置する。

- `se_effect.mp3`
- `se_turn_start.mp3`
- `se_selection.mp3`
(既存の `se_draw.mp3` 等も欠落しているため、同様にダミーを配置する)

### 2. 定義の追加

**`utils/AudioManager.ts`**

- `SoundKey`: `effect`, `turn_start`, `selection` を追加。
- `SOUND_MAP`: 各キーに対応する `/audio/se_...` パスを追加。

**`utils/SoundManager.ts`**

- `KEY_MAP`: `effect`, `turn_start`, `selection` を追加。

### 3. 再生ロジックの組み込み (`GameBoard.tsx`)

#### アニメーション連動

`newSocket.on('animation', ...)` 内で以下を追加:

- `type === 'DESTROY'`: `SoundManager.play('destroy')`
- `type === 'EFFECT'`: `SoundManager.play('effect')`

#### ターン開始通知

- 自分のターンになった瞬間（`isMyTurn` が false から true に変わった時）に `SoundManager.play('turn_start')` を呼び出す。

#### 選択プロンプト

- `renderSelectionModal`, `renderGuardianInterceptModal` が表示された瞬間に `SoundManager.play('selection')` を呼び出す。

## 検証計画

- ゲームプレイ中にカードを破壊した時、エフェクトが発生した時に音が鳴るか。
- 自分のターンの開始時に音が鳴るか。
- 選択画面が出た時に音が鳴るか。
- コンソールにファイルが見つからないというエラーが出ていないか。
