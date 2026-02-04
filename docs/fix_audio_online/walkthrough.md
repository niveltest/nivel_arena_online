# Walkthrough: オンライン環境での音声再生問題修正

オンライン環境（Vercel）で音声が再生されない問題を修正しました。

## 実装内容

### 1. AudioManagerの改善

#### 詳細なログの追加

- `initialize()`メソッドに初期化プロセスの各ステップでログを出力
- `preloadSE()`メソッドに音声ファイルの読み込み成功/失敗のログを追加
- `playSE()`メソッドに再生開始/失敗のログを追加

#### 初期化状態確認メソッドの追加

```typescript
public isInitialized(): boolean {
    return this.initialized;
}
```

#### エラーハンドリングの強化

- 音声ファイルの読み込み時に`canplaythrough`と`error`イベントリスナーを追加
- 再生失敗時に詳細なエラーメッセージを表示

### 2. GameBoardでの初期化処理

#### コンポーネントマウント時の初期化

```typescript
useEffect(() => {
    console.log('[GameBoard] Initializing audio system...');
    audioManager.initialize()
        .then(() => {
            console.log('[GameBoard] Audio system initialized');
        })
        .catch(err => {
            console.error('[GameBoard] Failed to initialize audio:', err);
        });
    // ...
}, []);
```

#### ユーザーインタラクション時の初期化

ブラウザの自動再生ポリシーに対応するため、ユーザーの最初のクリックまたはキー入力時に音声システムを初期化：

```typescript
const handleFirstInteraction = () => {
    console.log('[GameBoard] First user interaction detected, ensuring audio is initialized');
    audioManager.initialize().catch(console.error);
    // Remove listeners after first interaction
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
};

document.addEventListener('click', handleFirstInteraction, { once: true });
document.addEventListener('keydown', handleFirstInteraction, { once: true });
```

## 検証方法

### ローカル環境での確認

1. サーバーを起動:

   ```bash
   npm run dev:all
   ```

2. ブラウザで`http://localhost:3000`にアクセス
3. F12で開発者ツールを開き、Consoleタブを確認
4. 以下のログが表示されることを確認:
   - `[GameBoard] Initializing audio system...`
   - `[AudioManager] Initializing...`
   - `[AudioManager] Initialized successfully`
   - `[AudioManager] Preloading sound effects...`
   - `[AudioManager] Preloaded: play_card (/audio/se_play_card.mp3)`
   - など
5. ゲームを開始し、カードプレイ時などに音声が再生されることを確認

### オンライン環境での確認

1. Vercelにデプロイ後、URLにアクセス
2. F12で開発者ツールを開き、Consoleタブを確認
3. 上記と同じログが表示されることを確認
4. Networkタブで音声ファイルのリクエストが成功していることを確認（Status: 200）
5. ゲーム中に音声が再生されることを確認

### トラブルシューティング

#### 音声が再生されない場合

1. **コンソールログを確認**:
   - `[AudioManager] SE play failed for xxx: NotAllowedError`が表示される場合、ブラウザの自動再生ポリシーによってブロックされています。ページ上で一度クリックしてから再度試してください。
   - `[AudioManager] Failed to preload: xxx`が表示される場合、音声ファイルが見つからないか、ネットワークエラーです。

2. **Networkタブを確認**:
   - 音声ファイルのリクエストが404エラーになっている場合、ファイルが正しくデプロイされていません。
   - CORSエラーが表示される場合、サーバー設定を確認してください。

3. **ブラウザの音量設定を確認**:
   - ブラウザのタブがミュートになっていないか確認
   - システムの音量が0になっていないか確認

## 変更ファイル

- `utils/AudioManager.ts`: ログ追加、エラーハンドリング強化、`isInitialized()`メソッド追加
- `components/GameBoard.tsx`: AudioManagerのインポート、初期化処理追加

## コミット情報

コミットハッシュ: `f4da8cf`
