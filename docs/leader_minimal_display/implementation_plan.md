# Implementation Plan - Minimal Leader Display

## Goal Description

Modify the Leader card display to show only the artwork image, hiding all text, badges, and stats. This is to improve visibility for the horizontally rotated cards on the playmat.

## Proposed Changes

### Components

#### [MODIFY] [Card.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/Card.tsx)

- Add `minimal?: boolean` to the `CardProps` interface.
- In the JSX, wrap the following elements in `!minimal && (...)`:
  - Type Badge, Keywords, Affiliation Badge, Attribute Badge, Cost Badge.
  - Name display.
  - Text/Effect area.
  - Status Icons Overlay.
  - Stats (Power/Hit Count).
  - Active Ability Button.
- Ensure the Image container (`flex-1`) still works correctly or takes up the full space.

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- Locate the Leader Zone rendering.
- Pass `minimal={true}` to the `Card` component for both the player and the opponent's leaders.

## Verification Plan

- **Manual**:
    1. Observe Leader cards on the game board. They should show only the image.
    2. Observe other cards (Units, Skills). They should still show all original information.
    3. Verify that the image fills the Leader card area better now that the text is gone.
