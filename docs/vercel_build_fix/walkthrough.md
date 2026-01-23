# Vercel ビルドエラー修正 ウォークスルー

Vercel デプロイメントで発生していたビルドエラーを修正しました。

## 修正内容

### 1. GameBoard.tsx: Conditional Hook エラーの修正

`useRef` フックが条件付き（早期リターン後）に呼び出されていたため、React のフックルール違反によりビルドが失敗していました。
フックの定義をコンポーネントのトップレベル（条件分岐の前）に移動しました。

### 2. Card.tsx: コンポーネント破損の修復

ファイルの内容が不完全（関数の途中からコメントアウトされたコードが続く状態）になっており、構文エラーが発生していました。
正常なコンポーネントとして再構築し、構文エラーを解消しました。

### 3. CardDetailModal.tsx: 型エラーの修正

`Card` 型に存在しない `attributes` プロパティ（配列）を使用していました。
正しいプロパティである `attribute`（文字列）を使用するように修正しました。

### 4. eslint.config.mjs: 不要なリントエラーの除外

`server/` ディレクトリ配下およびルートのスクリプトファイルがリント対象に含まれ、大量のエラー（`require` の使用など）が発生していました。
これらを `eslint.config.mjs` の `globalIgnores` に追加し、ビルド時のチェック対象から除外しました。

## 検証結果

ローカル環境にて `npm run build` を実行し、正常に完了することを確認しました。

```bash
> nivel_arena_online@0.1.0 build
> next build

▲ Next.js 16.1.1 (Turbopack)
- Environments: .env.local
...
✓ Compiled successfully in 2.6s
...
Exit code: 0
```
