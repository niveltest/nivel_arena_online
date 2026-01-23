# Active Ability Implementation Plan

## Goal

Implement the system for "Active" abilities (Activated Abilities) that can be used once per turn during the Main Phase. Current implementation uses a placeholder `ON_PLAY` effect which is incorrect.

## Proposed Changes

### Data Layer (`server/data/cards.json` via `server/scripts/populate_effects.ts`)

- Update `populate_effects.ts` to identify `[アクティブメイン]` (Active Main) keywords.
- Generate effects with `trigger: 'ACTIVE'`.
- Parse specific action effects from text (e.g. "Select 1 enemy unit, Power -1500").

### Server Logic (`server/Game.ts`)

- **State**: Ensure `Card` interface (or runtime object) has `activeUsedThisTurn` boolean.
- **Action**: Add `activateAbility(playerId, unitSlotIndex)` method.
  - Check phase (MAIN).
  - Check ownership.
  - Check correct unit type and if it has an `ACTIVE` effect.
  - Check `activeUsedThisTurn`.
  - Execute `applyEffect` with `trigger: 'ACTIVE'`.
  - Mark `activeUsedThisTurn = true`.
- **Effect Handling**:
  - Update `applyEffect` to handle typical Active actions (Debuff, Destroy, etc.).

## Verification Plan

- Run `populate_effects.ts` and inspect `cards.json` for correct `ACTIVE` trigger.
- Create a test case in `server/test_game_logic.ts` (or manual test) to:
  - Play an Active unit (e.g. Neon: Blue Ocean).
  - Attempt to activate ability.
  - Verify effect application.
  - Verify "once per turn" restriction.
