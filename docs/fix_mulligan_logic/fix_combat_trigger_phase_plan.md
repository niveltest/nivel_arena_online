# Combat Trigger Phase Restoration Fix

## Goal

Fix the bug where the game stays in an un-interactable state after a trigger effect (e.g., during damage resolution) occurs during the Attack Phase.

## Proposed Changes

### [Component] Server Core

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- **`resolveSelection`**:
  - At the end of the method, if `this.phase` is still `SELECT_CARD` (meaning no new selection or phase transition was initiated), restore `this.phase` to `this.selection.previousPhase`.
- **`resolveDefense`**:
  - If a selection was triggered during defense resolution (making `this.phase === 'SELECT_CARD'`), update `this.selection.previousPhase` to `'ATTACK'`. This ensures that once the selection is done, the game returns to the Attack Phase rather than the now-obsolete Defense Phase.
- **`resolveGuardianIntercept`**:
  - Similar to `resolveDefense`, if a selection was triggered, ensure it returns to the next logical step (which might be `DEFENSE` or `ATTACK` depending on the outcome).
  - Actually, `resolveGuardianIntercept` usually transitions to `DEFENSE` or `ATTACK`.

## Verification Plan

### Automated Tests

- N/A

### Manual Verification

1. Start a game with units that have `ON_DAMAGE_TRIGGER` or similar effects.
2. Perform an attack and trigger an effect that requires a card selection.
3. Complete the selection.
4. Verify the game correctly returns to the `ATTACK` phase and allows further actions.
