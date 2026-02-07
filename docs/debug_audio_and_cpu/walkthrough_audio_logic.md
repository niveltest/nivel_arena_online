# 予期せぬ音声再生とファイル欠落時の処理の改善

## 実施内容

「準備していない音が鳴る」および「存在しないファイルへの処理」を明確にするため、オーディオシステムのログとエラーハンドリングを強化しました。

## 修正内容

### 1. 詳細な再生ログの追加

- **[AudioManager.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)**:
  - BGMおよびSEの再生時に、コンソールへ以下の形式で詳細なログを出力するようにしました：
    - `[AudioManager] playing: [論理キー] -> [ファイルパス] (vol: [音量])`
  - これにより、ブラウザのデベロッパーツール（F12）のコンソールを見ることで、「今どのファイルが再生されようとしたか」を一目で特定できます。

### 2. ファイル欠落（404エラー）の検知

- **[AudioManager.ts](file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)**:
  - 音声ファイルのロードに失敗した際（ファイルが存在しない、ネットワークエラー等）、明確なエラーメッセージをコンソールに表示するリスナーを追加しました。
  - `[AudioManager] Failed to load audio file: [パス] (Key: [キー]). Does the file exist in /public/audio?` というログが出力されます。

## 動作確認方法

1. ブラウザでゲームを開き、`F12` キー等でデベロッパーツールの「コンソール (Console)」タブを開きます。
2. 音が鳴ったタイミングで、`[AudioManager] playing:` というログを確認してください。そこに表示されているパスが、実際に再生されているファイルです。
3. もし「準備していないはずのファイルパス」が表示されている場合は、ソースコード上のトリガー（`SoundManager.play` の呼び出し箇所）を特定することができます。

render_diffs(file:///C:/Users/worke/Antigravity/nivel_arena_online/utils/AudioManager.ts)
