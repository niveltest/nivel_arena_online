# Complex Card Effects Implementation Task List

- [x] **Effect Analysis**
  - [x] Identify cards with unimplemented complex effects.
  - [x] Categorize missing effects (Graveyard, Kill, AOE).
- [x] **Data Population**
  - [x] Update script to regex match new patterns.
  - [x] Re-run script to populate `cards.json`.
- [x] **Server Logic Implementation (`server/Game.ts`)**
  - [x] **Graveyard Interaction**:
    - [x] `ADD_FROM_DISCARD` Logic (Selection Request).
    - [x] `ADD_FROM_DISCARD` Resolution (Move to Hand).
  - [x] **Damage / Removal**:
    - [x] `AOE_DAMAGE` (via `DAMAGE_UNIT` + `ALL_ENEMIES`).
    - [x] `KILL_UNIT` (Condition parsing `COST_LE_X`).
    - [x] `KILL_UNIT` Resolution (UUID support).
- [ ] **Verification**
  - [ ] Verify in-game behavior (Manual Test).
