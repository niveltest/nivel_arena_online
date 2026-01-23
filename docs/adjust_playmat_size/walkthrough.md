# Walkthrough - Playmat Size Adjustment

## Changes Made

### components/GameBoard.tsx

**Increased Playmat Height**
To address the user's request to have the playmats "stick together" and remove the gap between them, I increased the height of the `playmat-canvas` container.

```typescript
// Before
<div className="relative h-[72%] aspect-video flex items-center justify-center playmat-canvas">

// After
<div className="relative h-[96%] aspect-video flex items-center justify-center playmat-canvas">
```

By increasing the height from 72% to 96% of the available half-screen space, the two playmats now occupy most of the vertical space, meeting at the center line. This effectively removes the visual gap while maintaining the 16:9 aspect ratio. The horizontal alignment of unit zones remains centered ensuring columns are aligned.

## Validation Results

- **Size**: Playmats are significantly larger and touch/nearly touch at the center.
- **Alignment**: Unit zones remain horizontally centered, ensuring alignment between players.
