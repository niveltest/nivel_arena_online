# 実装計画：Lobbyボタンの不整合解決

Lobby画面において、「PLAYER NAME」が入力されているにもかかわらず、「CREATE ROOM」ボタンが押せない（disabled状態）問題を解決します。

## 調査結果

- `Lobby.tsx` では `disabled={!username.trim()}` によってボタンの有効/無効を切り替えています。
- スクリーンショットでは「edi」と入力されていますが、ボタンが暗く表示されており、Reactの内部状態が空である可能性があります。
- ブラウザのオートコンプリートなどで表示上の値とReactの状態が乖離している可能性があります。

## 提案される変更

### [MODIFY] [Lobby.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Lobby.tsx)

1. **ボタンの物理的な無効化を解除**: `disabled` 属性を削除し、いつでもクリックできるようにします。
2. **実行時のバリデーション強化**: `handleCreate` および `handleJoin` 内で `username` が空の場合に具体的なエラーメッセージを `alert` で出すようにします。
3. **デバッグログの追加**: 状態の変化を確認できるように `console.log` を追加します。
4. **オートコンプリート無効化**: ブラウザの干渉を防ぐため `autoComplete="off"` を設定します。

```tsx
// 変更イメージ
<input
    id="player-name"
    autoComplete="off"
    // ...
/>

const handleCreate = () => {
    console.log("Create button clicked. Username:", username);
    if (!username.trim()) {
        return alert("プレイヤー名を入力してください。");
    }
    // ...
}
```

## 検証計画

### 手動確認

- ユーザーに修正後の画面で「CREATE ROOM」ボタンが押せるようになったか、あるいは押した際にアラートが表示されるか確認を依頼します。
