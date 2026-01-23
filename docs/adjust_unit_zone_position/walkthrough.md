# Walkthrough - Fine-tuning Unit Zone Position

## Changes Made

### components/GameBoard.tsx

**Shifted Unit Zone Back by Another 1%**
User requested to "return" the position by another 1%.

- Previous position: `-5%`.
- Moved "back" (downwards) by 1% to `-4%`.

```typescript
field: { 
    top: '-4%', // -5% + 1%
    left: '50%', 
    translate: '-50%', 
    gap: '1.32rem', 
    scale: '0.6'
},
```

## Validation Results

- **Position**: Unit Zone adjusted slightly lower.
