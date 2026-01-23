# Implementation Plan - Adjust Playmat Size

## Goal Description

The user wants the playmats of the two players to be "tightly connected" (removing the gap between them) and for the unit zones to be aligned. Currently, the playmats are sized at `h-[72%]`, creating a significant gap.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **Increase Playmat Height**: Change the height of the `playmat-canvas` container from `h-[72%]` to `h-full` (or close to it, e.g., `h-[98%]`) to fill the available half-screen space.
- **Adjust Vertical Margins**: If `h-full` causes layout issues with UI elements at the very edge (like the Hand or Status Bar), slight adjustments might be needed, but primarily maximize the size.

## Verification Plan

- **Visual Check**: Confirm that the two playmats meet at the center line of the screen.
- **Alignment Check**: Verify that the unit zones (columns) are aligned vertically between the two players.
