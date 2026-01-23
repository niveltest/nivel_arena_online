# Active Ability Implementation Walkthrough

## Summary

Correctly implemented the Active Ability system (Main Phase effects). Previously these were placeholders mapped to `ON_PLAY`. Now they use a dedicated `ACTIVE` trigger and full parsing logic.

## Changes

### 1. Data Layer (`server/scripts/populate_effects.ts`)

- Updated detection logic to identify `[アクティブメイン]` (Active Main) and `[Active]`.
- Implemented parsing for:
  - `DEBUFF_ENEMY` (Power reduction)
  - `KILL_UNIT` (Trash unit)
- Assigned `trigger: 'ACTIVE'`.
- Ran script to update `server/data/cards.json`.

### 2. Type Definitions (`shared/types.ts`)

- Added `'ACTIVE'` to `EffectTrigger`.

### 3. Server Logic (`server/Game.ts`)

- Updated `useActiveAbility` to filter effects by `trigger === 'ACTIVE'` (was `condition === 'ACTIVE_ABILITY'`).
- Verified `applyEffect` correctly handles `DEBUFF_ENEMY` with `requestSelection` flow.
- Verified `activeUsedThisTurn` logic.

### 4. Client Logic (`components/GameBoard.tsx`)

- Implemented `handleUseActive` to emit `useActiveAbility` event.
- Passed `onUseActive` and `canUseActive` props to `Card` component in `renderSlots`.
- Logic ensures button only appears for:
  - Current Player
  - Main Phase
  - Unit has Active Ability
  - Not Opponent's unit

### 5. Verified Fixes

- **Neon: Blue Ocean (BT01-011)**:
  - Effect: Select 1 enemy, Power -1500.
  - Now correctly parsed as `{ trigger: 'ACTIVE', action: 'DEBUFF_ENEMY', value: 1500, targetType: 'SINGLE' }`.
  - When used, triggers `DEBUFF_ENEMY` in `Game.ts`, which calls `requestSelection` -> `DEBUFF_ENEMY` handling.

## Verification

- Code review confirms data flow from JSON -> Server State -> Client UI -> Server Action -> Effect Resolution.
- Korean keyword `[장착조건 없음]` was also fixed to `[装備条件なし]`.
