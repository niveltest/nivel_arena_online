# カードキーワード論理の拡張と洗練：完了報告

未実装だったカード効果の調査を行い、以下のキーワードとロジックの実装・修正を完了しました。

## 実施内容

### 1. 「潜入」(INFILTRATE) の修正

- **修正内容**: ヒット数ボーナスから、**「相手ユニットに防御（ブロック）されずにダメージを与えた場合にカードを引く」**効果に修正しました。
- **パース**: `潜入[N]` 形式を認識し、ドロー枚数 `N` を動的に取得します。

### 2. 「貫通」(PENETRATION) の数値パース

- **修正内容**: `貫通[N]` 形式を認識し、ブロック時にリーダーへ与えるダメージ量 `N` を動的に取得するようにしました。

### 3. 「道連れ」(DEATH_TOUCH) の実装

- **実装内容**: 戦闘で破壊された際、相打ちした相手ユニットも同時に破壊するロジックを有効化しました。
- **パース**: `道連れ` キーワードをカードデータから抽出できるようにしました。

### 4. その他既存キーワードの整理

- `デュエリスト` (強制防御)、`エグジット` (破壊時発動)、`帰還` (ターン終了時回収) など、前回実装した機能との整合性を確認しました。

## 検証結果

- `潜入[1]` を持つユニットでリーダーにダメージを与えた際、カードが1枚ドローされることを確認。
- `貫通[2]` を持つユニットがブロックされた際、リーダーに2ダメージが入ることを確認。
- `道連れ` を持つユニットが破壊された際、相手ユニットもトラッシュに送られることを確認。

---
`docs/card_keyword_logic/` 以下にすべての関連ドキュメントを保存しました。

- [task.md](file:///c:/Users/worke/Antigravity/nivel_arena_online/docs/card_keyword_logic/task.md)
- [implementation_plan.md](file:///c:/Users/worke/Antigravity/nivel_arena_online/docs/card_keyword_logic/implementation_plan.md)
- [walkthrough.md](file:///c:/Users/worke/Antigravity/nivel_arena_online/docs/card_keyword_logic/walkthrough.md)
