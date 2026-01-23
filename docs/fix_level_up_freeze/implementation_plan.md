# Implementation Plan - Auto-Advance Phases

## Goal Description

The user reported that buttons are unresponsive during the Level Up phase. The current implementation requires the user to manually click "Next Phase" to proceed from "Level Up" and "Draw" phases. This is unintuitive and feels like a freeze. I will make these system phases automatically advance after a short animation delay.

## Proposed Changes

### Server

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- **`handleLevelUpPhase`**: Add a `setTimeout` (e.g., 2000ms) to automatically call `this.nextPhase()`.
- **`handleDrawPhase`**: Add a `setTimeout` (e.g., 1500ms) to automatically call `this.nextPhase()`.
- Ensure these timeouts check if the game is still active (`this.phase !== 'FINISHED'`) before executing.

### Client

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **`render` (Status Bar)**: Update the "Next Phase" button to be disabled when `gameState.phase` is `LEVEL_UP` or `DRAW`.

## Verification Plan

- **Test Play**: Start a game (Solo/CPU).
- **Observe Flow**:
  - Verify that after Mulligan, `LEVEL_UP` phase starts, waits 2s, and proceeds to `DRAW`.
  - Verify that `DRAW` phase waits 1.5s (and draws card if T>1) and proceeds to `MAIN`.
  - Verify that control is returned to player in `MAIN` phase.
