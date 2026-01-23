# Implementation Plan - Dynamic Leader Image

## Goal Description

Implement logic to switch the Leader card image to its "Awakened" version when the leader's level meets or exceeds the awakening requirement.
The "Base" image is the top half, and "Awakened" is the bottom half of the source image.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- In the Leader Zone rendering:
  - Calculate `isAwakened = p.leaderLevel >= (p.leader.awakeningLevel || 99)`.
  - Pass `isAwakened={isAwakened}` to the `Card` component for the leader.

#### [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

- Add `isAwakened?: boolean` to `CardProps` interface.
- Update the `<img>` tag logic:
  - If `card.type === 'LEADER'`:
    - Default (Base): `object-position: top` (Show top half).
    - Awakened: `object-position: bottom` (Show bottom half).

## Verification Plan

- **Manual**:
    1. Observe Leader at Level 1 (Should show Top/Base).
    2. Use "FORCE LVL UP" to reach Level 6 (or awakening level).
    3. Observe Leader image change to Bottom/Awakened.
