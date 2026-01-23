# Game End Flow Implementation Plan

## Goal

Implement a complete game end flow where the game detects a win/loss condition (10 Damage or Deck Out), notifies clients, displays a result screen, and allows returning to the lobby.

## Proposed Changes

### Server Logic (`server/Game.ts`)

- **Event**: `gameOver`
  - Payload: `{ winnerId: string, reason: 'DAMAGE' | 'DECK_OUT' | 'SURRENDER' }`
- **Logic**:
  - In `dealDamage`, check if HP >= 10.
  - In `drawCard` (or `dealDamage` when drawing from deck), check if deck is empty.
  - Upon condition met, set `this.phase = 'GAME_OVER'` and emit event.

### Client UI (`components/`)

- **New Component**: `ResultModal.tsx`
  - Styled modal showing "VICTORY" or "DEFEAT".
  - "Return to Lobby" button.
- **Update**: `GameBoard.tsx`
  - State: `gameResult` (null | 'WIN' | 'LOSE')
  - Effect: Listen for `gameOver`.
  - Render `ResultModal` when `gameResult` is set.

## Verification Plan

1. **Server Test**: Use the existing `debugForceLevelUp` mechanism or add a `debugForceDamage` to trigger end game safely.
2. **UI Test**: Verify the modal appears correctly and overlays the game board.
3. **Flow Test**: Click "Return to Lobby" and verify it resets the view (reloads page).
