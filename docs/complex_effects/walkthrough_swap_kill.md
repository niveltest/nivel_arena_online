# Walkthrough - Complex Effects Implementation

## Changes

### 1. Data Parsing (`populate_effects.ts`)

- Added detection for:
  - **Swap Damage Hand**: Matches "ダメージゾーンから...手札に加え...手札を...ダメージゾーンに置く".
  - **Cost Based Kill**: Matches "手札...トラッシュ...コストより低い...トラッシュ".
- These map to new Action Types: `SWAP_DAMAGE_HAND` and `COST_BASED_KILL`.

### 2. Type Definitions (`shared/types.ts`)

- Added `SWAP_DAMAGE_HAND` and `COST_BASED_KILL` to `EffectAction`.
- Added `DAMAGE_ZONE` to `SelectionState` type to allow selecting cards from the damage zone.

### 3. Game Logic (`server/Game.ts`)

- **`requestSelection`**: Updated signature to accept `DAMAGE_ZONE`.
- **`applyEffect`**:
  - Implemented initial triggers for the new actions.
  - `SWAP_DAMAGE_HAND`: Requests `DAMAGE_ZONE` selection.
  - `COST_BASED_KILL`: Requests `HAND` selection (to discard cost source).
- **`resolveSelection`**:
  - Implemented chained logic using `setTimeout` to trigger subsequent selection steps after the first resolution completes.
  - **`SWAP_DAMAGE_STEP_1`**: Moves card Damage -> Hand, triggers Step 2.
  - **`SWAP_DAMAGE_STEP_2`**: Moves card Hand -> Damage.
  - **`COST_BASED_KILL_STEP_1`**: Discards Hand card, captures Cost, triggers Step 2 (Field Selection with Cost filter).
  - **`COST_BASED_KILL_STEP_2`**: Destroys the selected target.

## Verification

- Ran `populate_effects.ts` successfully.
- Confirmed `cards.json` contains the new action types for `BT02-073` and `ST03-013`.
