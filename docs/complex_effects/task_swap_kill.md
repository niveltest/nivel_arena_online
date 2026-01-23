# Complex Effects Implementation (Swap & Cost Kill)

- [x] **Data Parsing (`populate_effects.ts`)**
  - [x] Implement `SWAP_DAMAGE_HAND` detection (BT02-073).
  - [x] Implement `COST_BASED_KILL` detection (ST03-013).
  - [x] Run script and update `cards.json`.
- [x] **Game Logic (`Game.ts`)**
  - [x] Implement `SWAP_DAMAGE_HAND` initial trigger (Select from Damage).
  - [x] Implement `SWAP_DAMAGE_STEP_1` resolution (Add to Hand, Request Hand Select).
  - [x] Implement `SWAP_DAMAGE_STEP_2` resolution (Move to Damage).
  - [x] Implement `COST_BASED_KILL` initial trigger (Select from Hand).
  - [x] Implement `COST_BASED_KILL_STEP_1` resolution (Discard, Get Cost, Request Enemy Select).
  - [x] Implement `COST_BASED_KILL_STEP_2` resolution (Destroy Enemy).
- [x] **Verification**
  - [x] Verify json data.
