# CPU AI Logic Improvements Walkthrough

## Overview

Updated the CPU AI (`AIPlayer.ts`) to make smarter decisions when interacting with card effects, specifically targeting the new mechanics (Bounce, Debuff, etc.).

## Changes

### `server/AIPlayer.ts`

#### 1. `evaluateThreat(card, actionType)`

New helper method that calculates a "Threat Score" for a card.

- **Base Score**: Power + (Cost * 1000). High cost implies high value/difficulty to replay.
- **Contextual Bonuses**:
  - **Guardian/Attacker**: +500 points.
  - **Bounce Action**: Prioritizes High Cost (tempo swing) and equipped units.
  - **Debuff Action**: Prioritizes High Power (neutering threats).

#### 2. `handleSelection`

Replaced the "select first N candidates" logic with sorting based on `evaluateThreat`.

- **RESTRICT_ATTACK / DEBUFF / KILL**: Targets the highest threat.
- **BOUNCE**: Targets best bounce candidates (High Cost/Equipped).
- **DISCARD**: Discards the lowest value cards from own hand.

## Verification

### Unit Test: `server/testData/unitTestAI.ts`

Simulated AI decision making in specific scenarios:

1. **Bounce**: AI correctly chose to bounce a **Strong Unit** (Cost 5, 5000 Power) over a Weak Unit.
2. **Kill**: AI correctly chose to kill the **Strong Unit**.
3. **Discard**: AI correctly chose to discard a **Weak Card** from its own hand.

## Conclusion

The CPU will now offer more resistance and make logical choices when using the newly implemented card effects, improving the single-player experience.
