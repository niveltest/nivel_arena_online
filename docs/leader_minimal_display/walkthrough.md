# Walkthrough - Minimal Leader Display

## Changes Made

### components/Card.tsx

**Implemented Minimal Mode**
Added a `minimal` prop to the `Card` component that hides all supplemental UI elements, leaving only the artwork visible.

- **Hidden Elements**: Name, Effect text, Stats (Power/Hit), Badges (Cost/Attribute/Affiliation/Keywords), Status icons, and Active buttons.
- **Maintained Elements**: The card image still fills the frame and follows the `object-position` (Top/Bottom) logic for awakening.

### components/GameBoard.tsx

**Applied Minimal Mode to Leaders**
Updated the Leader Zone rendering to pass `minimal={true}` to the Leader cards.

- This removes the "wall of text" that was previously rotated 90 degrees, leaving a clean, thematic artwork display in the Level Up Zone frame.

## Validation Results

- **Visual**: Leader cards on the field now show only their artwork.
- **Awakening**: Leveling up still triggers the image shift (Top to Bottom) even in minimal mode.
- **Normal Cards**: Units and Skills in the hand and field still show their full text and stats as intended.
