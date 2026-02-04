# UI/UX改善 実装計画

## 目標

カードのステータス変化（バフ・デバフ）や戦闘のダイナミクス（ダメージ、キーワード効果）を視覚的に分かりやすく表現し、ゲームの没入感を高める。

## 変更内容

### [Client] カードコンポーネント (`components/Card.tsx`)

#### [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

1. **パワー表示の拡張**:
    - `card.tempPowerBuff` > 0 の場合: テキスト色を緑 (`text-green-400`)、背景エフェクトを追加。
    - `card.tempPowerDebuff` > 0 の場合: テキスト色を赤 (`text-red-400`)。
    - 通常時: 白 (`text-white`)。
2. **キーワードアイコンの追加**:
    - 現状の `BREAKTHROUGH`, `GUARDIAN`, `CANNOT_ATTACK` に加え、以下を追加:
        - `REVENGE` (💀): 道連れ/復讐
        - `TARGET` (🎯): 集中攻撃対象
        - `SNIPER` (🔭): 狙撃

### [Client] ゲームボード (`components/GameBoard.tsx`)

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

1. **フローティングテキストの実装**:
    - ダメージ発生時、ユニットの上に `-1000` のような数値をアニメーション表示するコンポーネントを追加。
    - `AnimationEvent` をリッスンし、アニメーションステートを更新するロジックを追加。

## 検証計画

- `unitTestUI.ts` (サーバー側) はUI変更を検証できないため、実際にブラウザで確認、もしくは `walkthrough.md` にてスクリーンショット等を添付して報告する形とする。
- 簡易的には、`TaskStatus` での実装完了報告をもって代える。
