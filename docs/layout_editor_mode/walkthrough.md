# Walkthrough - Interactive Layout Editor

## Changes Made

### components/GameBoard.tsx

**1. Independent Unit Slots**
Refactored the single `field` zone into three independent slots (`field0`, `field1`, `field2`). This allows placing each unit unit slot anywhere on the board rather than being locked into a horizontal row.

**2. Layout Editor State**
Added `isEditMode` and `customLayout` states. `customLayout` stores the positions and scales of all zones.

**3. Draggable UI Wrapper**
Implemented a `DraggableZone` component that leverages `framer-motion`'s `drag` feature.

- **Edit Mode**: Zones become draggable and show a yellow dashed boundary.
- **Position Calculation**: Dropping a zone calculates its new position as a percentage (%) relative to the playmat container, ensuring the layout remains responsive.

**4. Layout Control Panel**
Added a specialized HUD panel that appears when "レイアウト調整" (Layout Setup) is toggled.

- **Toggle Button**: Switch between play mode and edit mode.
- **JSON Output**: Displays the current `customLayout` object.
- **Copy Function**: One-click copy to clipboard so users can send the new configuration to the AI.
- **Reset**: Reverts to the default theme layout.

### Technical Refinement (Quality Pass)

- **Component Stabilization**: Refactored the interactive layout logic to eliminate cascading renders and stabilized `useState` initialization using the current theme.
- **Strict Typing**: Replaced `any` types with proper React and Framer Motion types for drag events and references.
- **Code Consistency**: Standardized function names and consolidated CSS variable injection.

## Validation Results

- **Interaction**: Cards can be dragged around the screen smoothly.
- **Responsiveness**: Coordinates are saved in `%`, so the layout scales with window size.
- **Game Logic**: Cards remain clickable and interactive in "Play Mode" with their new positions.
- **Modularity**: Individual unit slots move independently as requested.

## Usage Guide

1. Click the **📐 (レイアウト調整)** icon in the status bar.
2. Drag the Leader card, Unit slots, Deck, or Trash to your preferred locations.
3. Observe the JSON configuration update in real-time in the sidebar.
4. Click **COPY JSON CONFIG** and paste it here if you want me to make these changes permanent.
5. Click **💾 (編集終了)** to return to the game.
