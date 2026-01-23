# Implementation Plan - Move Hand to Left Sidebar

## Goal Description

The user wants to move the hand cards from the bottom of the screen to the left margin/whitespace. This involves changing the layout from a horizontal row to a vertical column on the left side.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **Hand Container (line ~1190)**:
  - Change `fixed bottom-0 left-0 right-0 h-40` to `fixed left-0 top-0 bottom-0 w-32` (or appropriate width).
  - Add `justify-center` vertically.
  - Remove `items-center` (or adjust align).
- **Card List Container**:
  - Change `flex-row items-end` to `flex-col items-center`.
  - Update margins: `pb-4` to `pr-4` (or padding adjustment).
- **Card Positioning**:
  - Change horizontal overlap (`-ml-12`) to vertical overlap (`-mt-24` or similar, considering card height).
  - Update hover effects (`translate-x` instead of `translate-y`?). Or just `translate-x` to pop out to the right.

## Verification Plan

- **Visual**: Cards should be stacked vertically on the left.
- **Interaction**: Hovering should pop cards out (rightwards or scaling) to make them visible.
