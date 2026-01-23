# Implementation Plan - Fix UI Unresponsiveness

## Goal Description

The user reported that buttons (specifically "Next Phase") are unpressable in the Level Up phase. The cause is the "Hand Overlay" container which has `z-index: 45` and covers the bottom 40px (160px) of the screen, overlapping the "Status Bar" (z-index: 40, height 64px). This transparent container blocks clicks.
The user also explicitly rejected the auto-progression plan, so manual button clicks must work.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **Hand Overlay Container**: Add `pointer-events-none` to the container `div` (line ~1170).
- **Hand Cards**: Add `pointer-events-auto` to the card wrapper `div`s (line ~1190) so cards remain clickable.
- **Help Text**: Update the help text logic (line ~1180) to show a generic message or be hidden during `LEVEL_UP` and `DRAW` phases, instead of defaulting to "Select target".

## Verification Plan

- **Click Test**: Verify "Next Phase" button is clickable.
- **Card Interaction**: Verify cards in hand are still clickable/selectable.
- **Visual Check**: Verify help text is appropriate for the phase.
