# Lobby.tsx インラインスタイル修正の実装計画

`Lobby.tsx` 内で使用されているインラインスタイルを `globals.css` に移行し、コンソール警告（HTML/CSS のベストプラクティス違反）を解消します。

## 変更内容

### [Component] Lobby

- [Lobby.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Lobby.tsx)
  - インラインスタイル（背景グリッド）を削除し、新しい CSS クラス `.bg-grid-pattern` を適用します。

### [Styles] Global CSS

- [globals.css](file:///c:/Users/worke/Antigravity/nivel_arena_online/app/globals.css)
  - 新しいクラス `.bg-grid-pattern` を追加します。
  - 内容:

        ```css
        .bg-grid-pattern {
          background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
          background-size: 40px 40px;
        }
        ```

## 検証計画

### 自動テスト

- なし（UI/スタイルの変更のみのため）

### 手動確認

1. `npm run dev` でローカルサーバーを起動。
2. ロビー画面（[http://localhost:3000](http://localhost:3000)）にアクセス。
3. 背景のグリッド模様が正しく表示されているか確認。
4. ブラウザのコンソールを開き、`Lobby.tsx` に関する CSS インラインスタイルの警告が消えていることを確認。
