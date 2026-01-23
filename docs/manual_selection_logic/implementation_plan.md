# 実装計画: 手動選択 (Manual Selection) の検証と洗練

## ゴール

`SelectionModal` と `SELECT_CARD` フェーズの連携が正しく動作することを確認し、必要な修正を行う。
具体的には「山札からのサーチ (`SEARCH_BASE`)」と「ドロップのカード回収 (`RECYCLE_ITEMS_TO_DECK`)」の2つのパターンを検証する。

## Proposed Changes

### Server (`server/Game.ts`)

- **[MODIFY] テスト用デバッグ機能の追加**:
  - `start()` メソッド内のデッキ生成ロジックを一時的に変更し、検証対象のカード（「マルチャーナ」や「ソーダ」など選択効果を持つカード）を手札または山札の確定位置に配置するようにする。
  - これにより、ランダム性を排除して即座に選択ロジックをテスト可能にする。
- **[NEW] デッキ構築バリデーション (`server/deckValidation.ts` or `shared`)**:
  - `validateDeck(deck: Card[], leader: Card): { valid: boolean, errors: string[] }` を実装。
  - ルール: 40枚 + リーダー, 属性一致 (Leader Attribute vs Card Attribute), 同名3枚, トリガー8枚。
- **[MODIFY] `server/data/cards.json`**:
  - リーダーカード (c001 Red Hood) に `attribute: "炎"` を追加。

### Components (`components/SelectionModal.tsx`)

- **[MODIFY] (必要に応じて)**:
  - 選択枚数のバリデーションが正しく機能しているか確認し、挙動が不自然な場合は修正する。

## Verification Plan

### Automated / Manual Verification with Browser

1. **サーバーとクライアントの起動**:
   - Backend: `ts-node server/index.ts` (Port 3001)
   - Frontend: `npm run dev` (Port 3000)

2. **ブラウザテスト (Browser Subagent)**:
   - 2つのブラウザインスタンス (またはタブ) を開き、Player 1 と Player 2 として参加する。
   - **シナリオ 1: 山札サーチ**
     - Player 1 が「マルチャーナ」など `SEARCH_BASE` 効果を持つカードをプレイする。
     - 画面に `SelectionModal` が表示されることを確認する。
     - 候補カードを選択し、決定する。
     - 選択したカードが手札に加わり、モーダルが閉じることを確認する。
   - **シナリオ 2: アイテム回収 (Soda)**
     - Player 1 のディスカードにアイテムカードが3枚ある状態を作る（デバッグコードで初期化）。
     - Player 1 が `RECYCLE_ITEMS_TO_DECK` 効果を持つカードをプレイする。
     - モーダルで3枚選択し、決定する。
     - カードが山札に戻り、対象の効果（相手ユニット破壊など）が発動することを確認する。
   - **シナリオ 3: デッキバリデーション**
     - サーバー起動時に不正なデッキ（属性不一致など）を読み込ませ、エラーが出るか確認する（ログ確認）。
     - 正しいデッキでゲームが開始できるか確認する。

### 注意点

- 検証のために `server/Game.ts` を一時的に書き換えるが、検証終了後は元に戻すか、デバッグフラグで制御するようにする。
