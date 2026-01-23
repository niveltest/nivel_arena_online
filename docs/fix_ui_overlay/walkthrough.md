# Walkthrough - UI Fixes and Playmat Alignment

## Changes Made

### components/GameBoard.tsx

**1. Fixed UI Blocking Issue**
The hand cards overlay was blocking clicks on the bottom part of the screen, making the "Next Phase" button unclickable.
I added `pointer-events-none` to the container and `pointer-events-auto` to the cards themselves. This allows clicks to pass through the transparent parts of the overlay to the buttons below, while keeping the cards interactive.

```typescript
<div className="fixed ... pointer-events-none">
    {/* ... */}
    <div className="... pointer-events-auto" onClick={...}>
        <Card ... />
    </div>
</div>
```

**2. Improved Help Text**
Updated the help text logic to display "Waiting for next phase..." during phases where no specific action is required (like Level Up or Draw), instead of prompting to "Select target".

**3. Fixed Playmat Zone Alignment**
Changed the playmat background sizing from `bg-cover` to `bg-[length:100%_100%]`. ensuring identical stretching.
This forces the background image to stretch exactly to the container's dimensions (which marks the playmat area), ensuring that the absolute-positioned zones (defined by percentages) align perfectly with the graphics on the image, regardless of the window's aspect ratio.

```typescript
// Before
className="absolute inset-0 bg-cover ..."

// After
className="absolute inset-0 bg-[length:100%_100%] ..."
```

## Validation Results

- **Interactivity**: "Next Phase" button is now clickable. Hand cards remain clickable.
- **Alignment**: Playmat zones should now perfectly match the background image markers.
