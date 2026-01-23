# 実装計画 - カスタムレイアウトの永続化

ユーザーがレイアウトエディタで作成・エクスポートした配置設定を、デフォルトの `official` テーマに反映します。

## 変更内容

### GameBoard.tsx

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `PLAYMAT_CONFIGS.official` の各座標値（leader, field0-2, deck, trash, skill, damage, level）を、提供された JSON の値で更新します。
- **追加対応**: ユーザーの要望に基づき、`field0`, `field1`, `field2` の `scale` を `0.6` から `0.5` に縮小します。

## 検証計画

### 自動テスト

- なし（UI 配置の変更であるため）

### 手動確認

- 「レイアウト調整」モードをオフにした状態で、新しい配置が正しく反映されているか確認。
- エディタで「RESET」を押した際、今回設定した新しいデフォルト位置に戻ることを確認。
