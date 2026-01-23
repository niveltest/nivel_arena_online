# Active Ability Implementation Task List

- [x] **Data Refinement**
  - [x] Update `populate_effects.ts` to detect `[Active Main]` or `[アクティブメイン]`.
  - [x] Set trigger to `ACTIVE` instead of `ON_PLAY` placeholder.
  - [x] Implement parsing for common active effects (e.g. Debuff, Destroy).
  - [x] Run `populate_effects.ts` to update `cards.json`.
- [x] **Game Logic Implementation**
  - [x] Add `activeUsedThisTurn` flag to `Card` (Unit) state in `Game.ts`.
  - [x] Implement `activateAbility(playerId, unitSlotIndex)` method in `Game.ts` (mapped to `useActiveAbility`).
  - [x] Handle `ACTIVE` trigger in `applyEffect`.
- [x] **Validation**
  - [x] Verify Neon: Blue Ocean (BT01-011) functionality.
  - [x] Verify other active cards if any.
