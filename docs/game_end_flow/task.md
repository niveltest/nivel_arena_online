# Game End Flow Implementation Task List

- [x] **Server-Side Implementation**
  - [x] Update `Game.ts` to fully implement `checkWinCondition` (HP >= 10 or Deck Out).
  - [x] Emit `gameOver` event with result data (`winnerId`, `reason`).
  - [x] Handle debug force win (`index.ts`).
- [x] **Client-Side Implementation**
  - [x] Create `components/ResultModal.tsx` for Victory/Defeat display.
  - [x] Update `GameBoard.tsx` to listen for `gameOver` event.
  - [x] Implement "Return to Lobby" functionality (reload page or clean reset).
- [x] **Verification**
  - [x] Trigger Game Over via Debug command (Force Win).
  - [x] Verify UI display and return flow.
