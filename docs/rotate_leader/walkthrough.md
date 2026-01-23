# Walkthrough - Rotating Leader to Fit Level Zone

## Changes Made

### components/GameBoard.tsx

**1. Rotated Leader Card Horizontal**
User requested to rotate the Leader card sideways and fit it into the "Level Up Zone frame".

- Added `rotation` support to the playmat configuration using internal CSS variables (`--leader-rotate`).
- Set Leader rotation to `-90deg` for the Official theme.

```typescript
leader: { 
    top: '25%', 
    left: '11%', 
    rotation: '-90deg' // Sideways
},
```

**2. Repositioned Leader**
Adjusted coordinates to align the now-horizontal leader with the vertical "Level Up Zone" sidebar on the left.

- Moved from `top: 38%`, `left: 17.5%` to `top: 25%`, `left: 11%`.
- This places the card roughly over the area where the level numbers are displayed, integrating them.

## Validation Results

- **Orientation**: Leader card is horizontal.
- **Position**: Located on the left side, overlapping/inside the Level Up Zone frame area.
