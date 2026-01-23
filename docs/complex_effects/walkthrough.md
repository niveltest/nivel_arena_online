# Complex Card Effects Implementation Walkthrough

## Summary

Implemented backend logic and data parsing for complex card effects including Graveyard Interaction (Retrieval), Conditional Destruction, and AOE Damage.

## Changes

### 1. Data Population (`server/scripts/populate_effects.ts`)

- Added regex detection for:
  - "Add from trash to hand" -> `ADD_FROM_DISCARD` (supports Affiliation condition).
  - "Destroy enemy unit (conditional)" -> `KILL_UNIT` (supports Cost comparison).
  - "Damage all enemy units" -> `AOE_DAMAGE` (mapped to `DAMAGE_UNIT` with `ALL_ENEMIES`).
- Re-ran script to update `cards.json`.

### 2. Server Logic (`server/Game.ts`)

- **`applyEffect`**:
  - Implemented `ADD_FROM_DISCARD`: Filters discard pile and requests selection from client using `DISCARD` source.
  - Implemented `KILL_UNIT` logic for selection: Now maps candidates to UUIDs for robust selection.
  - Added support for `COST_LE_X` condition parsing.
- **`resolveSelection`**:
  - Added handler for `ADD_FROM_DISCARD`: Moves selected card from Discard to Hand.
  - Updated `KILL_UNIT` resolution to handle UUIDs instead of slot indices.

## Verification Plan (Manual)

### Test Case A: Graveyard Retrieval

1. **Setup**: Create a deck with "Pilgrim" units and a card with "Add Pilgrim from trash".
2. **Action**: Play/Discard a Pilgrim unit. Play the retrieval card.
3. **Observation**: Result modal or Selection modal should appear showing the Discard pile. Selecting the unit should add it to hand.

### Test Case B: Conditional Kill

1. **Setup**: Opponent has a Cost 2 unit and Cost 5 unit.
2. **Action**: Play a card saying "Destroy enemy unit with Cost 4 or less".
3. **Observation**: Only the Cost 2 unit should be selectable. Selecting it destroys it.

### Test Case C: AOE Damage

1. **Setup**: Opponent has multiple units.
2. **Action**: Play AOE card (e.g. "2000 damage to all").
3. **Observation**: All opponent units take damage. Units with HP <= 0 are destroyed.

## Next Steps

- Verify in actual client.
- Consider implementing "Search Deck" effects next (requires large selection logic).
