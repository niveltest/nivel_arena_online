
# タスクリスト：カードエフェクトの実装（GRANT_ABILITY / ON_OTHER_UNIT_DESTROY）

- [x] 新しいエフェクトトリガーとアクションの定義 (`shared/types.ts`)
  - [x] `EffectTrigger` に `ON_OTHER_UNIT_DESTROY` を追加
  - [x] `EffectAction` に `GRANT_ABILITY` を追加
  - [x] `CardEffect` インターフェースに `grantedKeyword` を追加
- [x] カードデータ解析スクリプトの更新 (`server/scripts/populate_effects.ts`)
  - [x] 「～を得る」パターンの解析実装 (GRANT_ABILITY)
  - [x] 「他のユニットが～たびに」パターンの解析実装 (ON_OTHER_UNIT_DESTROY)
  - [x] ターゲット選択（選んで/選ぶ）の解析精度向上
  - [x] スクリプトの実行と `cards.json` の更新
- [x] ゲームロジックの実装 (`server/Game.ts`)
  - [x] `GRANT_ABILITY` アクションの実装（対象：自身、単体選択、味方全体）
  - [x] `ON_OTHER_UNIT_DESTROY` トリガーの実装 (`destroyUnit` メソッド内)
  - [x] `BUFF_ALLY` の `ALL_ALLIES` 対応強化
- [x] 動作確認と検証
  - [x] テストスクリプト (`test_new_effects.ts`) による検証
  - [x] `cards.json` の解析結果確認
