# Implementation Plan - Conditional Draw Logic Parser

## Goal Description

Enhance `populate_effects.ts` to support conditional draw effects triggered by unit destruction (specifically "Draw on Kill"). This is required for cards like "Finale" (BT01-024).

## Proposed Changes

### [Server Scripts]

#### [MODIFY] [populate_effects.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/scripts/populate_effects.ts)

- Update `CardEffect` interface to include `drawOnKill`.
- In `parseAction` function:
  - Modify `DEBUFF_ENEMY` (Power minus) parsing logic.
  - Check for text matching "この効果でそのユニットをトラッシュしたなら、(\d+)枚(ドロー|引く)".
  - If matched, add `drawOnKill` property to the effect.
  - Also check `KILL_UNIT` parsing logic for similar patterns.

## Verification Plan

### Automated Tests

- Run `npx ts-node server/scripts/populate_effects.ts`
- Check `server/data/cards.json` to ensure "BT01-024" has `drawOnKill: 1` in its effects.
