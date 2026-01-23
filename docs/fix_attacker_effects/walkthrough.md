# ウォークスルー - 「アタッカー」効果とパッシブスキルの修正

「アタッカー」キーワードによるパワー増加効果と、リーダーのパッシブスキルが反映されない問題を修正しました。

## 変更内容

### [Server] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- **アタック時のトリガー発動**:
  - `attack` メソッド内で `ON_ATTACK` トリガーを呼び出すようにし、アタッカーユニット自身の効果（例：攻撃時にパワー+2000）が正しく発動するようにしました。
- **バフ処理の修正**:
  - 自己バフなどが恒久的にパワーを書き換えてしまわないよう、一時的なバフ（`tempPowerBuff`）を使用するように修正しました。
- **リーダーパッシブの強化**:
  - キーワード指定（`KEYWORD_アタッカー` など）や、データ不備時のフォールバック計算を追加し、リーダーによる特定ユニットへのバフが確実に反映されるようにしました。

### [Component] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **パワー計算の同期**:
  - サーバー側の `getUnitPower` と同期するように `getCalculatedStats` を強化しました。
  - クライアント側でも `hasKeyword` ヘルパーを導入し、キーワードベースのバフ計算を正確に行えるようにしました。

## 検証結果

### コード確認

- `Game.ts` の `attack` メソッドで `applyEffect` が正しく呼ばれていることを確認しました。
- `getUnitPower` と `getCalculatedStats` でリーダーのパッシブが反映されるロジックを確認しました。

### 手動確認 (想定動作)

- アタッカーが攻撃する際、攻撃中のパワーにキーワード効果が加算されます。
- リーダーの「アタッカーを持つユニットのパワー+2000」などの効果が、フィールド上の該当ユニットに常時反映されます。
