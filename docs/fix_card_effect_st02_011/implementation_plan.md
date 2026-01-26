# カード効果修正計画: ST02-011

## 目標

ST02-011 (ディーゼル) の効果「[パッシブ] 自分のリーダーレベル1につき、パワー+1000。」を正しく反映させる。

## 変更内容

### 1. [MODIFY] [server/data/cards.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/data/cards.json)

- ST02-011 の効果定義を修正。
  - `targetType`: "ALL_ALLIES" -> "SELF"
  - `condition`: (新規追加) "PER_LEADER_LEVEL"

### 2. [MODIFY] [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- `getCalculatedStats` 関数内の `card.effects.forEach` ループに、`BUFF_ALLY` (パワー上昇) の処理を追加。
- `condition === 'PER_LEADER_LEVEL'` の場合、`p.leaderLevel * eff.value` を加算するロジックを実装。

## コード詳細 (GameBoard.tsx)

```typescript
        if (card.effects) {
            card.effects.forEach(eff => {
                // ... (既存の SET_HIT 処理)

                // 追加: パワーバフ処理
                if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_ALLY') {
                    if (eff.targetType === 'SELF') {
                        if (eff.condition === 'PER_LEADER_LEVEL') {
                            totalPower += (eff.value || 0) * p.leaderLevel;
                        } else {
                            totalPower += (eff.value || 0);
                        }
                    }
                }
            });
        }
```
