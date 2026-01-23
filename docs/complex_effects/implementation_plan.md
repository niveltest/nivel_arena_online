# Complex Card Effects Implementation Plan

## Goal

Support advanced card mechanics found in the official card list that go beyond basic stats and simple triggers.

## Key Mechanics to Implement

### 1. Graveyard (Discard Pile) Interaction

- **Use Case**: "Add a 'Pilgrim' unit from your trash to your hand."
- **Implementation**:
  - **Action**: `ADD_FROM_DISCARD`
  - **Condition**: Filter by Affiliation/Type.
  - **Flow**: Server sends `SELECT_CARD` request with `DISCARD` source. Client selects. Server moves card to hand.

### 2. Search Effects

- **Use Case**: "Look at top 3 cards, add 1 'Unit' to hand."
- **Implementation**:
  - **Action**: `SEARCH_DECK`
  - **Condition**: `TOP_X`, `FILTER_TYPE`.
  - **Flow**: Server reveals top X cards -> Client selects -> Add to hand -> Bottom/Shuffle rest.

### 3. Conditional Destruction / AOE

- **Use Case**: "Destroy an enemy unit with Cost 3 or less." / "Deal 2000 damage to all enemy units."
- **Implementation**:
  - **Action**: `KILL_UNIT` (targetType: SINGLE, condition: COST_LE_3)
  - **Action**: `DAMAGE_ALL` (value: 2000, targetType: ENEMY)

### 4. Special Keywords

- **Invincible**: Cannot be destroyed by effects.
- **Banish**: Remove from play entirely (new zone `removedZone`).

## Component Updates

- **`server/Game.ts`**:
  - Expand `applyEffect` switch case.
  - Enhance `requestSelection` to support searching deck/discard.
- **`cards.json`**:
  - Needs creating sophisticated effect objects (manually or via script).

## Detailed Steps

1. **Script Update**: Enhance `populate_effects.ts` to detect "トラッシュから...手札に加える" (Add from trash) and "相手のユニット...破壊する" (Destroy enemy).
2. **Server Logic**: Implement `ADD_FROM_DISCARD` and `KILL_UNIT` (conditional).
3. **Client UI**: Ensure `SelectionModal` handles `DISCARD` source correctly (already partially supported, verify).
