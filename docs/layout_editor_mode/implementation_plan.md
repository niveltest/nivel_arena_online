# Implementation Plan - Interactive Layout Editor

## Goal Description

Provide a visual way for the user to adjust the game board layout (positions and sizes of all zones) using mouse dragging. This includes breaking the Unit Zone into three independent slots (Left, Center, Right).

## Proposed Changes

### Configuration & Types

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- Update `PlaymatThemeConfig` to replace `field` with `field0`, `field1`, `field2`.
- Update `PLAYMAT_CONFIGS` to define initial positions for all 3 slots independently.
- Update the CSS variable injection logic to handle the new slots.

### Features

#### [NEW] `DraggableZone` Component

- A wrapper using `framer-motion`'s `drag` feature.
- Only active when `isEditMode` is true.
- Updates a local `customLayout` state on drag end.

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- Add `isEditMode` state.
- Add `customLayout` state initialized from the selected theme.
- Implement a "Layout Control Panel" (absolute fixed) with:
  - "Toggle Edit Mode"
  - "Reset Layout"
  - "Copy Config JSON" (useful for the user to paste back to me).

### UI Refactoring

- Break the `renderSlots` loop or wrap each slot in a `DraggableZone`.
- Ensure scaling and rotation are still applied correctly during drag.

## Verification Plan

1. Enter Edit Mode.
2. Drag the Leader card, individual unit slots, and the deck area.
3. Exit Edit Mode and verify cards are still clickable (pointer events should work correctly).
4. Copy the JSON and verify it matches the visual layout.
