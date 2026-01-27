# 突破能力修正計画

## 問題

「突破」能力を持つカードが、対象コスト制限を無視して機能している可能性があるため、全カードを調査・修正する。

## 調査対象

`server/data/cards.json` を検索し、「突破」能力を持つすべてのカードをリストアップする。

## 修正案

### 1. [MODIFY] [server/data/cards.json](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/data/cards.json)

対象カードの `keywords` または `grantedKeyword` を修正する。

- **スノーホワイト (ST02-010)**: `BREAKTHROUGH` -> `BREAKTHROUGH_2`
- **その他確認されたカード**:
  - もしコスト指定がある場合 ("コストX以下...") -> `BREAKTHROUGH_X`
  - 無条件の場合 -> `BREAKTHROUGH` (変更なし、ロジック側で「無制限」として処理)

### 2. [MODIFY] [components/GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

防御判定ロジック (`renderDefenseModal` 内など) をアップデート。

```typescript
const checkBreakthrough = () => {
    const keywords = [...(attacker.keywords || []), ...(attacker.tempKeywords || [])];
    
    // "BREAKTHROUGH" または "BREAKTHROUGH_X" を探す
    const btKeyword = keywords.find(k => k === 'BREAKTHROUGH' || k.startsWith('BREAKTHROUGH_'));
    
    if (!btKeyword) return false;

    // "BREAKTHROUGH" (無印) は無条件突破
    if (btKeyword === 'BREAKTHROUGH') return true;

    // "BREAKTHROUGH_X" はコストX以下なら防御不可
    const threshold = parseInt(btKeyword.split('_')[1]);
    const defenderCost = defender.cost;
    
    return defenderCost <= threshold;
};
```

## 検証

- 各パターンの突破持ちによる攻撃で、正しい防御可否判定が行われるか確認する。
