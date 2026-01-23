# Implementation Plan - Align Playmat Zones

## Goal Description

The user requested to revert the background image sizing (which was stretching the image) and instead adjust the zone positions to match the background artwork. The zones for Units, Level Up, Deck, and Damage need realignment.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **Revert Background Size**: Change `bg-[length:100%_100%]` back to `bg-cover` (line ~161).
- **Adjust `PLAYMAT_CONFIGS['official']`**:
  - **Field (Unit Zone)**: Adjust `top` and `left`. Maybe lower it? (e.g., `top: '25%'`?)
  - **Level**: Adjust `top`/`left` of the sidebar.
  - **Deck**: Adjust `top`/`right`.
  - **Damage**: Adjust `top`/`left`.
    *Refinement*: I will try to make slight adjustments based on standard layouts.
  - **Unit Zone**: 18% -> 22% (Lower)
  - **Deck**: 15% -> 18% (Lower)
  - **Level**: 12% -> 15% (Lower)
  - **Damage**: 38% -> 42% (Lower)

## Verification Plan

- **Visual Check**: Verify that the white borders of the zones line up roughly with the boxes in the background image.
