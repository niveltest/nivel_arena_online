# Walkthrough - Leader Image Cropping Fix

## Changes Made

### components/Card.tsx

**Fixed Split Image Issue**
Previously, `object-position` could lead to both halves being partially visible depending on the aspect ratio and image content. I replaced this with an explicit 50/50 split method.

- **Old Implementation**: Used `object-top` / `object-bottom` on a standard size image.
- **New Implementation**:
  - Forces the internal `img` height to `200%` of its container.
  - Uses `absolute` positioning.
  - Toggles between `top-0` (Base) and `bottom-0` (Awakened).
  - Combined with `overflow-hidden` on the parent, this guarantees that exactly one half is visible at all times.

## Validation Results

- **Visual**: Leader cards now show only the top half (Base) or bottom half (Awakened) without any bleed from the other form.
- **Alignment**: The image fill remains centered and thematic within the card frame.
