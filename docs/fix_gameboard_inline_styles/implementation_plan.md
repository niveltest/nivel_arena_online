# 実装計画 - GameBoard インラインスタイルの修正

`GameBoard.tsx` で報告された CSS インラインスタイルの警告を解決し、スタイルを CSS 変数または外部 CSS（今回は既存の `<style>` タグ内）に統合します。

## 概要

ESLint 等のリンターにより、React の `style` プロップによるインラインスタイルが非推奨とされています。これを修正することで、コードの品質と保守性を向上させます。

## 変更内容

### [Component] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `PlaymatArea` コンポーネント内のダメージゾーン描画部分のリファクタリング。
  - `p.damageZone.map` 内の `div` に適用されている `marginLeft` と `zIndex` を CSS 変数（例: `--card-index`）に置き換えます。
  - 親の `<style>` タグに、これらの変数を使用したスタイルルールを追加します。
- `DraggableZone` コンポーネント内のインラインスタイルも同様に CSS 変数へ移行することを検討します。

## 検証計画

### 手動確認

- ブラウザでゲーム画面を開き、ダメージゾーンのカードが正しく重なって表示されることを確認します。
- プレイマットの編集モード（DraggableZone）が正常に動作し、ドラッグやリサイズが可能であることを確認します。
- リンターの警告が消えていることを確認します。
