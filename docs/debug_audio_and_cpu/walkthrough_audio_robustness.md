# 音声再生ロジックの改善とファイル欠落への対応

## 実施内容

「準備していないSEが鳴る」「欠落ファイルがある場合に別の音が鳴るように聞こえる」という問題を解消・調査しやすくするため、オーディオ管理システムを強化しました。

## 修正内容

### 1. 欠落ファイルの自動検知と再生ブロック

- **[AudioManager.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)**:
  - 一度ロードに失敗（404 Not Found 等）した音声ファイルは `missingSounds` リストに記録され、その後の再生試行を完全にスキップするようにしました。
  - これにより、ブラウザやサーバーの挙動によって「存在しないパスなのに別のファイル（BGM等）が流れてしまう」といった予期せぬ挙動を未然に防ぎます。

### 2. ログ出力のさらなる強化

- **[SoundManager.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/SoundManager.ts)**:
  - `SoundManager.play('damage')` のような呼び出しがあった際、どの論理キーにマッピングされたかを出力するようにしました。
  - 出力例: `[SoundManager] play(damage) -> mapped to damage`

### 3. エラーメッセージの明確化

- ファイルが存在しない場合、コンソールに以下のように赤文字等でエラーが出るようにしました：
  - `[AudioManager] 404: SE file not found: /audio/se_damage.mp3`

## ユーザー様への説明と確認のお願い

### 戦闘BGMについて

ゲーム画面（GameBoard）を開いた際、**戦闘BGM (`bgm_battle.mp3`) は自動的に開始される仕様**になっています。
ダメージSE (`se_damage.mp3`) が存在しない場合、現在は「無音」になるように修正しました。もしダメージ時に音が鳴っているように聞こえる場合、それは背景で流れている戦闘BGMである可能性が高いです。

### 確認手順

1. ブラウザを更新（F5）してください。
2. デベロッパーツール（F12）の「コンソール」を確認します。
3. ダメージが発生した際、以下のログが出ているか確認してください：
    - ロード失敗時: `[AudioManager] 404: SE file not found: /audio/se_damage.mp3`
    - 再生成功時: `[AudioManager] playSE: damage -> /audio/se_damage.mp3 ...`

もし `404` と出ているのに音が鳴る場合は、サーバー側で「存在しないファイルへのリクエストに対してBGMを返してしまう」といった特殊な設定（リライトルール等）がないか調査する必要があります。

render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)
render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/SoundManager.ts)
