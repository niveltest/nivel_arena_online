# Implementation Plan - Fine-Tune Alignment

## Goal Description

The user wants the Unit Zones to align with the text/boxes on the background image. The previous adjustment was a guess, so I will refine it by moving the zone slightly lower and increasing the gap between slots, as proper playmat zones are usually more spaced out than the default `gap-4`.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **Add Gap to Config**: Add `gap?: string` to `PlaymatZoneConfig`.
- **Update `official` Config**:
  - `field`: Set `top: '26%'` and `gap: '2rem'`.
- **CSS Variables**: Inject `--field-gap` in the `<style>` block.
- **Render Slots**: In `renderSlots`, replace `gap-4` class with `style={{ gap: 'var(--field-gap, 1rem)' }}`.

## Verification Plan

- **Visual Check**: Confirm the slots are now lower and wider apart, hopefully matching the background.
