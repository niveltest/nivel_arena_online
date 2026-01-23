# Conditional Draw Logic Parser Implementation

- [x] **Implementation**
  - [x] Update `server/scripts/populate_effects.ts`
    - [x] Add `drawOnKill` Property to interface.
    - [x] Implement detection logic for "if trashed, draw" text.
    - [x] Attach `drawOnKill` to `DEBUFF_ENEMY` and `KILL_UNIT` effects.
- [x] **Verification**
  - [x] Run script and check `cards.json`.
