# Walkthrough - Complex Effects Implementation

## Changes

### 1. Data Parsing (`populate_effects.ts`)

- Added detection for:
  - **Swap Damage Hand**: Matches "ダメージゾーンから...手札に加え...手札を...ダメージゾーンに置く".
  - **Cost Based Kill**: Matches "手札...トラッシュ...コストより低い...トラッシュ".
  - **Salvage Equipment (Nero)**: Matches "トラッシュされる時...装備しているアイテム...手札に戻す".
  - **Power Copy (Friends)**: Matches "ガーディアン...持つ...持たない...パワー分上がる".
  - **Item Shield (Drake)**: Added keyword `ITEM_SHIELD`.
- These map to new Action Types: `SWAP_DAMAGE_HAND`, `COST_BASED_KILL`, `SALVAGE_EQUIPMENT`, `POWER_COPY_FRIEND`.

### 2. Type Definitions (`shared/types.ts`)

- Added `SWAP_DAMAGE_HAND`, `COST_BASED_KILL`, `SALVAGE_EQUIPMENT`, `POWER_COPY_FRIEND` to `EffectAction`.
- Added `DAMAGE_ZONE` to `SelectionState`.

### 3. Game Logic (`server/Game.ts`)

- **`requestSelection`**: Updated signature to accept `DAMAGE_ZONE`.
- **`applyEffect`**:
  - Implemented initial triggers for the new actions.
- **`resolveSelection`**:
  - Implemented chained logic using `setTimeout`.
  - `SWAP_DAMAGE_STEP_1/2`: Hand/Damage swap logic.
  - `COST_BASED_KILL_STEP_1/2`: Discard cost -> Destroy target logic.
  - `POWER_COPY_STEP_1/2`: Select Source -> Apply Buff to Target Logic.
  - `SALVAGE_EQUIPMENT`: Added handling (via `ADD_FROM_DISCARD` re-use) for Nero.

## Verification

- Ran `populate_effects.ts` successfully.
- Ran `find_missing_effects.ts` and confirmed 0 cards are missing Implementation.
