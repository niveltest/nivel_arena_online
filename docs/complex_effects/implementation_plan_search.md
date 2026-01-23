# Deck Search & Power Rules Implementation Plan

## Goal

1. Implement **Deck Search** mechanics (Look at top X cards, or search for specific trait, add to hand, shuffle rest).
2. Verify and enforce **Power <= 0 Destruction Rule**.

## Deck Search Mechanics

- **Use Cases**:
  - "Look at top 3 cards, add a Level 3 unit to hand." (`SEARCH_TOP_X`)
  - "Search your deck for a 'Base' card." (`SEARCH_DECK`)
- **Implementation**:
  - **Trigger**: `ON_PLAY` (usually).
  - **Action**: `SEARCH_DECK`.
  - **Condition**: `TOP_X_FILTER_Y` (e.g., `TOP_3_COST_LE_3`, `AFFILIATION_BASE`).
  - **Flow**:
        1. Server identifies cards (either top X or all valid candidates in deck).
        2. Sends `SELECT_CARD` request with source `DECK` (or `DECK_TOP`).
        3. Client displays candidates.
        4. Player selects 1 (or more).
        5. Server moves card to hand.
        6. **Shuffle**: Deck should represent shuffling only if "Search Deck" (not "Look at top X"). But usually looking at top X puts rest on bottom or shuffles. Need to check specific card text. Assuming "Bottom" for "Top X" and "Shuffle" for "Search Deck".

## Power 0 Rule Verification

- **Current State**:
  - `DAMAGE_UNIT`: Already checks `if (power <= 0) destroyUnit()`.
  - `DEBUFF_ENEMY` (Power Reduction): Currently sets `tempPowerDebuff`. Does **NOT** appear to check for destruction immediately given the code snippet viewed.
  - **The Rule**: In Nivel Arena, if a unit's power becomes 0 or less due to damage or debuffs, is it destroyed?
    - Official Rule check: "パワーが0以下になったユニットはトラッシュされる" (Units with Power <= 0 are trashed).
  - **Fix**: Needs a global check state update (State Based Action) or check immediately after applying debuff.
  - **Plan**: Add a helper `checkPowerDestruction(playerId)` and call it after any power modification.

## Implementation Steps

1. **Power Rule Fix**: State-Based Action check `checkStateBasedActions()`.
2. **Search Implementation**:
    - Update `populate_effects.ts` for Search patterns.
    - Update `Game.ts` to handle search logic.

## Verification

- Test debuff card (e.g. reduce power by 2000). If unit has 2000, it should die.
- Test search card.
