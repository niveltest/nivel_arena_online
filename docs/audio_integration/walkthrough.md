# Audio Integration Walkthrough

## 完了した変更

### 1. Audio System Update

- `utils/AudioManager.ts` を刷新し、ローカルファイルマッピング (`SOUND_MAP`) を導入しました。
- `utils/SoundManager.ts` を `AudioManager` のアダプターとして書き換え、既存コードへの影響を最小限に抑えました。

### 2. Client Integration

- `components/GameBoard.tsx` の起動時に `bgm_battle` を再生するようにしました。
- 既存の SE 再生箇所（カードプレイ、攻撃、ダメージなど）が新しいシステム経由で動作することを確認しました。

### 3. Documentation

- `public/audio/README.md` を更新し、ユーザーがどのファイル名で音声を配置すればよいかを明確にしました。

## 今後の手順（ユーザー作業）

1. **音声ファイルの準備**:
    `public/audio/` フォルダに以下のファイルを配置してください。

    - `bgm_battle.mp3` (BGM)
    - `se_play_card.mp3`
    - `se_attack_start.mp3`
    - `se_attack_hit.mp3`
    - `se_draw.mp3`
    - `se_destroy.mp3`
    - `se_damage.mp3`
    - `se_levelup.mp3`
    - `se_victory.mp3`
    - `se_defeat.mp3`

2. **動作確認**:
    ゲームを起動し、対戦画面に入るとBGMが再生され、各アクションでSEが鳴ることを確認してください。

## トラブルシューティング

- **音が鳴らない**: ブラウザの自動再生ポリシーにより、ユーザー操作（クリックなど）があるまで再生がブロックされることがあります。一度画面をクリックしてみてください。
- **404エラー**: コンソールに `GET /audio/xxx.mp3 404` が出ている場合は、ファイルが正しく配置されていません。
