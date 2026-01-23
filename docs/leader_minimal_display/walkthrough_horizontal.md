# Walkthrough - Horizontal Leader Display

## Changes Made

### components/Card.tsx

**Implemented Landscape Orientation for Leaders**
Changed the card's physical dimensions when it is a Leader type to match the landscape artwork.

- **Size**: Switched from `w-28 h-40` (Portrait) to `w-40 h-28` (Landscape) for Leaders.
- **Artwork Fit**: Since the artwork (Top half for Base, Bottom half for Awakened) is horizontal, it now fits the card frame perfectly without being sideways or excessively cropped on the sides.

```tsx
className={`${card.type === 'LEADER' ? 'w-40 h-28' : 'w-28 h-40'} ...`}
```

### components/GameBoard.tsx

**Updated Playmat Configuration**
Adjusted the positioning and rotation to accommodate the new landscape card shape.

- **Rotation**: Set to `0deg` (previously `-90deg`). The card is now naturally horizontal.
- **Position**: Adjusted `top` and `left` to keep the leader aligned with the Level Up zone.

## Validation Results

- **Orientation**: Leader card appears horizontally on the screen as a landscape card.
- **Artwork**: The image shows the correct form (Base or Awakened) and fills the wide frame correctly.
- **Minimal Mode**: All text is hidden as requested, keeping the focus on the horizontal artwork.
