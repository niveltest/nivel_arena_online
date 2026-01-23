# Task: Auto-Advance Level Up and Draw Phases

## Status

- [ ] Server-Side (`Game.ts`)
  - [ ] Modify `handleLevelUpPhase` to auto-call `nextPhase()` after 2 seconds.
  - [ ] Modify `handleDrawPhase` to auto-call `nextPhase()` after 1.5 seconds.
  - [ ] Ensure safe execution (check if game is finished).
- [ ] Client-Side (`GameBoard.tsx`)
  - [ ] Disable "Next Phase" button during `LEVEL_UP` and `DRAW` phases.
  - [ ] Update button text to "AUTO..." or similar during these phases? (Optional, disabled is fine)
