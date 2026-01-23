# Walkthrough - Conditional Draw Logic Parser Implementation

## Changes

### Server Scripts

- **`server/scripts/populate_effects.ts`**:
  - Added `drawOnKill` parsing logic within the `DEBUFF_ENEMY` parsing block.
  - Regex used: `/この効果でそのユニットをトラッシュしたなら、?(\d+)枚/`

### Data

- **`server/data/cards.json`**:
  - Updated via script execution.
  - Confirmed `BT01-024` (Finale) now has `"drawOnKill": 1`.

## Verification Results

### Script Execution

Ran `npx ts-node scripts/populate_effects.ts` successfully.

### Data Inspection

Checked `cards.json` for BT01-024:

```json
{
    "id": "BT01-024",
    // ...
    "effects": [
        {
            "trigger": "ON_PLAY",
            "action": "DEBUFF_ENEMY",
            "value": 3000,
            "targetType": "SINGLE",
            "drawOnKill": 1
        }
    ]
}
```

The property is correctly set.
