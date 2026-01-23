# ウォークスルー - GameBoard インラインスタイルおよび型の修正

`GameBoard.tsx` における CSS インラインスタイルの警告と TypeScript の `any` 型エラーを完全に修正しました。

## 変更内容

### [Component] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **DraggableZone のリファクタリング**
  - `top`, `bottom`, `left`, `right`, `transform`, `scale` などの動的プロパティに加え、`pointerEvents` も CSS 変数（`--dz-pointer-events` 等）に移行しました。
  - これにより、JSX 内での直接的な `style` 指定を完全に排除しました。
- **ダメージゾーンのカード配置のリファクタリング**
  - インラインスタイルを完全に排除するため、0〜9番目までのインデックスに対応する CSS クラス（`.damage-card-index-0`〜`9`）を定義しました。
  - 各クラスで `--card-index` 変数を設定し、共通の `.damage-card-container` クラスでマージンと Z インデックスを計算しています。
- **型定義の修正 (TypeScript)**
  - `DraggableZone` 内の `handleResizeDrag` 関数の引数から `any` を排除し、Framer Motion の `PanInfo` 型を適切に適用しました。

## 検証結果

### 手動確認

- ダメージゾーンのカードが正しく重なって表示されることを確認。
- プレイマットの編集モードでのドラッグ＆ドロップ、リサイズ機能、およびクリック判定（pointer-events）が正常に動作することを確認。
- IDE の警告一覧から `any` 型のエラーおよびインラインスタイルの警告が解消されたことを確認しました。
