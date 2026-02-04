# 残りの問題の修正計画

`GameBoard.tsx` のTypeScriptエラーと `public/audio/README.md` のMarkdown警告を一括で修正します。

## 修正内容

### 1. GameBoard.tsx (TypeScript)

- **型定義の修正**:
  - `SelectionState` インポートの削除。
  - 内部インターフェース `PlaymatOption` の追加。
  - アニメーションデータ (`data as any`) を `AnimationEvent['data']` または具体的なデータ型にキャスト。
- **Null安全性**:
  - `opponent` が存在する場合のみフィールドや墓地にアクセスするように修正（オプショナルチェイニング `?.` またはガード節）。
  - `renderDamageZoneModal` で `targetPlayer` の有無を確認。
  - `PlaymatArea` コンポーネントに渡す `p` が `Player | null` を受け取れるようにするか、呼び出し側でガード。

### 2. README.md (Markdown)

- テーブルのパイプ (`|`) の位置をヘッダーの配置 (`:---`) と揃え、適切なスペースを挿入します。

## 検証方法

- `npx tsc --noEmit` により型エラーが 0 件であることを確認。
- Markdown リンターの警告が消えていることを確認。
