# Leader Level Up Logic Fix

## Goal

Ensure that leader level boosts from card effects are preserved and that the level correctly increases each turn.

## Proposed Changes

### [Component] Server Core

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- **`handleLevelUpPhase`**:
  - Change the calculation of `targetLevel`. Instead of `Math.ceil(this.turnCount / 2) + 1`, use `Math.min(10, player.state.leaderLevel + 1)`.
  - This ensures that if a card effect has already boosted the level, the next natural level-up starts from that higher point.

## Verification Plan

### Automated Tests

- N/A

### Manual Verification

1. Start a game.
2. Use a card effect that increases the Leader Level (e.g., `LEVEL_UP` action).
3. Verify the level increases immediately.
4. End the turn and wait for your next turn.
5. Verify the level increases again from the boosted level (e.g., if you were Level 2, boosted to 3, your next turn should start at Level 4).
