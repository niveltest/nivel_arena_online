# 装備カード表示改善のウォークスルー

## 修正内容

相手ユニット（画面上部）に装備されているカードの表示位置と向きを調整しました。

### 変更前

- 表示位置: カードの下（画面上では上側/奥側）
- 向き: カード本体に合わせて180度回転（逆さま）

### 変更後

- 表示位置: カードの上（画面上では下側/手前側）
- 向き: 正位置（文字が読める向きに再回転）

### コードの変更点 (`GameBoard.tsx`)

```tsx
<div className={`absolute left-1/2 -translate-x-1/2 w-max flex flex-row justify-center gap-1 p-1 pointer-events-auto z-50
    ${isOpponent ? 'bottom-full mb-1 rotate-180' : 'top-full mt-1'}
`}>
```

- `isOpponent` が真の場合、`bottom-full` でスロットの手前に配置し、`rotate-180` を適用して親コンテナの回転を相殺（または補正）しています。

## 結果

相手の装備カードが手前に表示され、文字も正しい向きで読めるようになりました。
