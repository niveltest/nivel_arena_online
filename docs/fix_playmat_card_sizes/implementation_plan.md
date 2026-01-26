# プレイマットスケーリング修正の実装計画

## 問題の原因

前回の修正で `playmat-canvas` のクラスを `w-full aspect-video` に変更したため、コンテナの幅（画面幅いっぱい）に基づいて高さが計算されている。
その結果、高さが利用可能な領域（画面高さの半分）を超えてしまい、プレイマットが見切れたり、無駄に大きくなったりしている。

## 解決策

`playmat-canvas` に対し、親コンテナ（画面半分の領域）に収まるように制約を再適用する。

### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `playmat-canvas` のクラスを以下のように修正する:
  - `w-full` -> `w-auto` (または状況に応じて)
  - `aspect-video` (維持)
  - `max-w-full` (追加)
  - `max-h-full` (追加)
  - `h-auto` ? むしろ `h-full` だとアスペクト比が崩れる可能性がある。
  - 正解は: `h-full w-auto aspect-video max-w-full` または `w-full h-auto aspect-video max-h-full`。
  - CSSの `object-contain` のような挙動を `div` で実現するには:
      親が `flex items-center justify-center` なので、子は `max-w-full max-h-full aspect-video` であれば、幅か高さのどちらかが制限に達した時点で止まり、アスペクト比が維持される。

**修正案:**

```tsx
<div className="relative w-auto h-auto max-w-full max-h-full aspect-video flex items-center justify-center playmat-canvas" style={{ containerType: 'size' }} ref={canvasRef}>
```

※ `w-auto h-auto` だけだと潰れる可能性があるので、`w-full` は外すが、`aspect-video` があるので中身があれば広がる？いや、中身は絶対配置ばかりなので、サイズが0になる危険性がある。

**確実なアプローチ:**
以前のコード:

```tsx
<div className="relative h-full w-auto max-w-full max-h-full aspect-video ...">
```

これは「高さを満たそうとする」アプローチ。
今回は `width` を基準にしたい場合（横長画面）もあれば `height` を基準にしたい場合（縦長画面）もあるが、PC画面なら基本は高さ制限 (`max-h-full`) に引っかかるはず。

したがって、

```tsx
<div className="relative max-w-full max-h-full aspect-video w-full flex items-center justify-center playmat-canvas" ...>
```

だと `w-full` が勝つと高さがはみ出る。
`w-auto h-auto` にして、`aspect-video` を効かせつつ、`max-w/h` で止めるのが良いが、divが空（絶対配置のみ）だとサイズが不定になる。

**決定案:**

```tsx
<div className="relative max-w-full max-h-full aspect-video w-full h-full flex items-center justify-center playmat-canvas" ...>
```

これだと `width` と `height` 両方取ろうとしてアスペクト比が無視されるか歪む？
Tailwindの `aspect-video` は `aspect-ratio: 16/9` を設定するだけ。

正しくは、「親コンテナの中で最大化」したい。

```tsx
<div className="relative aspect-video max-w-full max-h-full mx-auto" ...>
```

そして `w-full` か `h-full` のどちらかを優先させる、あるいはCSSの `min()` を使う手もあるが、シンプルに:

```tsx
w-auto h-auto max-w-full max-h-full aspect-video
```

ただしこれだと中身がないと潰れる。
中身は絶対配置の子要素ばかりなので、明示的なサイズが必要。

前回のコード（ユーザーが戻してほしいと言っている状態）を確認すると：

```tsx
<div className="relative h-full w-auto max-w-full max-h-full aspect-video ...">
```

これに戻すのが一番安全。`h-full` で高さを親（画面の半分）に合わせ、`aspect-video` で幅を決め、`max-w-full` で幅が画面を超えないようにする。
これなら `cqw` も「その決定された幅」を基準にするはずなので機能するはず。

## 検証

- 変更後、画像2のように上下に黒帯（親コンテナの余白）ができ、プレイマット全体が表示されることを確認する。
- `cqw` が正しく動作し、カードサイズが適切か確認する。
