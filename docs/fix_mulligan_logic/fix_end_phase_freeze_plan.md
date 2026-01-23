# End Phase Freeze Fix

## Goal

Fix the issue where the game gets stuck at the End Phase when playing against the CPU.

## Proposed Changes

### [Component] AI Layer

#### [MODIFY] [AIPlayer.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/AIPlayer.ts)

- Add `case 'END'` to the `think()` method to call `this.game.nextPhase()`. This ensures the CPU transitions the turn to the player.

### [Component] Server Core

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- In `resolveSelection`, handle the `DISCARD_HAND` action to restore `this.phase` to `previousPhase` (which would be `END`) if it was triggered during the end-of-turn hand limit check.

## Verification Plan

### Automated Tests

- N/A

### Manual Verification

1. Start a CPU battle.
2. Reach the end of the CPU's turn.
3. Verify the CPU correctly transitions the turn to the player.
4. Ensure if the CPU has > 7 cards, it discards and THEN transitions.
