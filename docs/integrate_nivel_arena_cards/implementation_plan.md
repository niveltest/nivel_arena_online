# 実装計画 - Nivel Arena カード連携統合

Nivel Arenaのゲームプレイをより忠実に再現するため、カード効果のロジックの拡充、UIの改善、およびカードデータの追加を行います。

## ユーザーレビューが必要な項目

- **手動選択ロジック**: デッキからカードを探す際や、墓地からカードを戻す際の手動選択UIの実装について。現在は自動処理または簡易処理になっています。
- **サーバー起動**: PowerShellの実行ポリシーにより `npm run dev:server` が失敗する問題の修正方針について。

## 変更内容

### サーバーロジック (`server/Game.ts`)

- **キーワードの実装**:
  - `DEATH_TOUCH` (接死): `resolveDefense` 内で、このキーワードを持つユニットが戦闘を行った場合、相手ユニットを（パワーに関わらず）破壊するロジックを追加。
  - `INFILTRATE_1` (潜入): `attack` 内で、ダイレクトアタック時にダメージを+1するか、またはブロックされた際にもリーダーにダメージを与えるロジックをカードテキストに合わせて調整。
  - `ITEM_SHIELD`: アイテム装備時に効果対象外とするため、 `applyEffect` や `DAMAGE_UNIT` 処理の冒頭でターゲットユニットのキーワードを確認する処理を追加。
- **特殊アクションの追加**:
  - `LEVEL_UP`: `player.state.leaderLevel` を増加させる処理を `applyEffect` に実装。
  - `SET_HIT`: ヒット数を計算する `getUnitHitCount` メソッドを新設。
    - `COUNT_BASE`: フィールドの「ベース」所属ユニット数をヒット数に加算するロジック。
    - `FIELD_FULL`: ユニットが3体埋まっている場合にヒット数を+1するロジック。
- **ITEM_SHIELD (アイテムシールド)の実装**:
  - ユニットが「アイテムシールド」を持っている場合、スキルによる破壊やダメージを無効化するロジックを `applyEffect` に追加。
- **手動選択システムの導入**:

## Proposed Changes

### サーバー側ロジックの改善

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- `broadcastState` メソッドを修正し、`selection` 情報をクライアントに送信するようにします。
- 必要に応じて `resolveSelection` のバリデーション（選択数など）を強化します。

---

### クライアント側UIの実装

#### [NEW] [SelectionModal.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/SelectionModal.tsx)

- カード選択用のモーダルコンポーネントを作成します。
- `GameState.selection` が自分宛ての場合に表示されます。
- カード画像の一覧を表示し、クリックで選択/解除ができるようにします。
- 指定された枚数を選択したら「確定」ボタンを有効にします。

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `SelectionModal` をインポートして配置します。
- サーバーへの `resolveSelection` 送信イベントを実装します（`socket.emit('resolveSelection', { selectedIds })`）。

---

### カードデータの拡充

#### [MODIFY] [cards.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/data/cards.json)

- BT01, BT02 の残りのカードを追加します。
- 特に手動選択が必要な効果（サーチ、サルベージ）を持つカードを優先します。

## Verification Plan

### Automated Tests

- 現時点では自動テスト環境が未整備のため、手動検証を中心に行います。

### Manual Verification

1. `npm run dev` でサーバーとクライアントを起動します。
2. 2つのブラウザウィンドウを開き、対戦を開始します。
3. サーチ効果を持つカード（例：「ベース」サーチ）を使用します。
4. `SelectionModal` が正しく表示され、カードが選択できることを確認します。
5. 選択確定後、カードが手札に加わり、対戦が続行できることを確認します。
6. `ITEM_SHIELD` を持つユニット（ドレイクなど）が装備品を身代わりにして破壊を免れることを確認します。

### カードデータ (`server/data/cards.json`)

- BT01およびBT02から、まだ登録されていないカードを追加定義します。
- 各カードの `effects` と `keywords` を正確に設定します。

### クライアントUI (`client/components/GameBoard.tsx` 等)

- カードにキーワード（DUELIST, BERSERKER等）を表示するバッジを追加。 (完了)
- 検索や墓地回収時のカード選択ダイアログ (`SelectionModal`) の実装。
- パッシブ効果が適用されていることを示す視覚効果（BUFF!バッジ等）の洗練。
- ライフ（ダメージゾーン）の正確な表示と、ダメージ時のエフェクト。

## 検証計画

### 自動テスト

- `server/Game.ts` の各ロジック（パワー計算、効果発動、キーワード処理）の単体テストを検討。現状テストコードが不足している場合は、簡易的なテストスクリプトを作成。

### 手動検証

- 各新規カードが期待通りに場に出せるか、効果が発動するかを確認。
- `npm run dev` でローカルサーバーを立ち上げ、ブラウザで動作確認。
- ログ出力を強化し、効果の発動タイミングと内容をデバッグ。
