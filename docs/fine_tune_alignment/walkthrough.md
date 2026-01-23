# Walkthrough - Playmat Image Crop

## Changes Made

### components/GameBoard.tsx

**Cropped Playmat Image**
The user requested to remove the Korean text/spaces from the "Abyss Flower" playmat and show "only the illustration".
Since the text is baked into the image, I increased the `background-size` to zoom in, effectively cropping out the borders where the text resides.

```typescript
// Before
bg-cover // Fits image to container

// After
bg-[length:135%] // Zooms in 135%, cropping edges
```

## Validation Results

- **Visual**: The outer edges of the playmat image (containing text) should be pushed outside the visible area, leaving the central illustration more prominent.
