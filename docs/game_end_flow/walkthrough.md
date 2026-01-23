# Game End Flow Walkthrough

## Summary

Implemented the Game End Flow, handling Victory and Defeat conditions (10 Damage or Deck Out). Added a Result Modal to display the outcome and allow returning to the lobby.

## Changes

### 1. Server-Side Logic (`server/Game.ts`, `server/index.ts`)

- **Win Condition Check**:
  - Implemented inside `dealDamage` loop: Checks `hp >= 10` or `deck out` (empty deck).
  - Emits `GAME_OVER` event via `gameAction` with `{ winnerId, reason, loserId }`.
- **Debug Feature**:
  - Added `debugForceWin` socket handler in `index.ts` to instantly set opponent's HP to 10 and trigger game over for testing.

### 2. Client-Side UI (`components/`)

- **ResultModal.tsx**:
  - Displays "VICTORY" (Gold/Yellow theme) or "DEFEAT" (Gray/Dark theme).
  - Shows the reason (HP 0, Deck Out, Surrender).
  - "Return to Lobby" button reloads the page to reset state.
- **GameBoard.tsx**:
  - Listens for `GAME_OVER` action and sets local `gameResult` state.
  - Renders `ResultModal` when result is present.
  - Added "FORCE WIN" debug button next to "FORCE LVL UP".

## Verification

- **Test 1: Damage Victory**:
  - Used "FORCE WIN" button.
  - Verified `opponent.hp` set to 10.
  - Verified `GAME_OVER` event received.
  - Verified "VICTORY" modal displayed with "opponent HP 0" reason.
  - Verified "Return to Lobby" reloads the page.
- **Test 2: Defeat (Simulated)**:
  - (Implicit) If opponent forces win, current player receives "DEFEAT".

## Next Steps

- Implement Deck Builder to allow custom decks.
- Improve "Return to Lobby" to handle socket disconnection/cleanup more gracefully without full reload if desired (SPA navigation).
