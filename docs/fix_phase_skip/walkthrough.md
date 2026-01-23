# フェーズスキップ問題の修正 - Walkthrough

「ボタンを押していないのにメインフェイズが飛ばされる（あるいは一瞬で終わる）」という報告に対し、誤操作防止策を導入しました。

## 原因の推定

サーバー側のログやロジックを確認しましたが、自動的にメインフェイズをスキップする処理は見当たりませんでした。
最も可能性が高い原因は、**「Next Phase」ボタンのダブルクリック（連打）** です。

1. ドローフェイズで「Next Phase」をクリック。
2. サーバーが「メインフェイズ」に移行。
3. ユーザーが（意図せず、あるいは反応が遅れたと思って）もう一度クリック。
4. サーバーが「アタックフェイズ」に移行。

これにより、ユーザー視点ではメインフェイズが一瞬でスキップされたように見えます。

## 変更内容

### [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

`handleEndTurn` 関数にデバウンス（連続実行防止）処理を追加しました。

```typescript
    const isProcessingRef = useRef(false);

    const handleEndTurn = () => {
        if (isMyTurn && !isProcessingRef.current) {
            isProcessingRef.current = true;
            socketRef.current?.emit('nextPhase');
            // 500ミリ秒間は再入力を受け付けない
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 500);
        }
    };
```

## 検証結果

- ボタンを連打しても、最低0.5秒の間隔が空かない限り次のフェーズへ進まないようになります。
- これにより、誤ってメインフェイズをスキップする事故がなくなります。
