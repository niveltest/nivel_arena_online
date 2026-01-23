# Walkthrough - Dynamic Leader Image & Fixes

## Changes Made

### components/Card.tsx

#### 1. Implemented Image Cropping for Awakening

- Added `isAwakened` prop.
- Switched `object-position` based on awakening state:
  - Base: `object-top`
  - Awakened: `object-bottom`

#### 2. Fixed Compilation Errors

- Resolved syntax errors caused by malformed editing (missing closing braces, invalid JSX).
- Ensured the component structure is valid and robust.

### components/GameBoard.tsx

#### 1. Pass Awakening State

- Calculated `isAwakened` based on leader level.

#### 2. Linter Fixes

- Replaced inline style `style={{ gap: ... }}` with Tailwind arbitrary value `gap-[var(--field-gap)]` to satisfy linter rules.

## Validation Results

- **Visual**: Leader card switches image halves correctly on level up.
- **Stability**: Application compiles without errors or warnings in these components.
