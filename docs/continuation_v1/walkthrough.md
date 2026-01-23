# Card Data & Logic Refinement Walkthrough

## Changes

### Card Data Population

- Created `server/scripts/populate_effects.ts` to automatically parsing card text into `effects` array.
- Run the script, populating effects for **167** cards.
- **Verification**: Checked `cards.json` to confirm `effects` array is populated correctly with triggers like `ON_PLAY`, `ON_ATTACK`, `PASSIVE`.

### Game Logic Refinement

- Refactored `server/Game.ts`:
  - Updated `applyEffect` to handle generic actions derived from text parsing.
  - Refactored `getUnitPower` to calculate power dynamically based on `PASSIVE` effects in `cards.json`.
  - Removed some hardcoded logic favoring data-driven approach.

## Verification Results

### Server Startup

- Confirmed server starts successfully on port 3001 after changes.
- `ts-node index.ts` execution verifies syntax and basic runtime integrity of `Game.ts`.

### Logical Checks

- `getUnitPower` now iterates through `player.state.leader.effects` and unit `effects` to apply `BUFF_ALLY` actions with `PASSIVE` trigger.
- Logic supports `myTurn`, condition checks (basic), and global buffs.
