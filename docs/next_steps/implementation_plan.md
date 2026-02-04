# CPUロジック改善計画

## 目標

新しく実装されたカード効果（バウンス、デバフ、攻撃制限など）をCPUが有効に活用できるよう、選択ロジック（`handleSelection`）を強化する。現状の「先頭からN個選ぶ」だけの単純なロジックから、効果に応じた最適なターゲットを選ぶロジックへ更新する。

## 変更内容

### [Server] AIロジック (`server/AIPlayer.ts`)

#### [MODIFY] [AIPlayer.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/AIPlayer.ts)

1. **`handleSelection` メソッドの拡張**:
    - `case 'RESTRICT_ATTACK_SELECTION'`:
        - 相手のフィールド（`candidateIds`に対応するカード）を確認。
        - **優先順位**: パワーが高い > `ATTACKER`持ち > `GUARDIAN`持ち > その他。
    - `case 'BOUNCE_UNIT_SELECTION'`:
        - **優先順位**: コストが高い（再展開しにくい） > パワーが高い > 装備品が多い。
    - `case 'DEBUFF_ENEMY_SELECTION'`:
        - **優先順位**: パワーが高い（無力化） > `GUARDIAN`（突破用）。
    - `case 'KILL_UNIT_SELECTION'`:
        - **優先順位**: 最も脅威度が高い（パワー・コスト大）。
    - `case 'ADD_TO_HAND_FROM_DECK'` / `ADD_TO_HAND`:
        - 自分の手札補充。
        - **優先順位**: ユニット > アイテム。コストカーブに合うもの。

2. **ヘルパーメソッドの追加**:
    - `evaluateThreat(cardId: string)`: 候補カードの脅威度を数値化して返すメソッド。ゲーム状態（`this.game.players`）からカード情報を参照する必要がある。

## 検証計画

- `unitTestAI.ts` (新規作成) にて、特定の状況（相手フィールドに高パワーユニットがいる状態）を作り、CPUに「バウンス効果持ちカード」をプレイさせる。
- CPUが正しく高パワーユニットを対象に選択するかを確認する。
