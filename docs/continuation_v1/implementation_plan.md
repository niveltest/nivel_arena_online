# Card Data Refinement Plan

## Goal

Populate the `effects` array in `server/data/cards.json` by parsing the `text` field of each card. This will enable the game logic to function correctly without hardcoded card effects.

## User Review Required
>
> [!IMPORTANT]
> This change will modify `server/data/cards.json`. A backup will be created before modification.

## Proposed Changes

### Card Data Refinement

#### [NEW] [populate_effects.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/scripts/populate_effects.ts)

- Create a script to iterate through all cards in `cards.json`.
- Parse `text` field looking for keywords:
  - `エントリー` (Entry) -> `trigger: 'ON_PLAY'`
  - `エグジット` (Exit) -> `trigger: 'ON_DESTROY'`
  - `アタッカー` (Attacker) -> `trigger: 'ON_ATTACK'`
  - `トリガー` (Trigger) -> `trigger: 'ON_DAMAGE_TRIGGER'`
  - `パッシブ` (Passive) -> `trigger: 'PASSIVE'` (Need to handle in Game.ts)
  - `アクティブ` (Active) -> `trigger: 'ON_PLAY'` (or distinct active trigger)
- Map descriptions to `EffectAction` where possible (e.g., "Power +1000" -> `BUFF_ALLY`).
- Save updated data to `cards.json`.

### Game Logic Refinement

#### [MODIFY] [Game.ts](file:///c:/Users/worke/Antigravity/nivel_arena_online/server/Game.ts)

- Update `applyEffect` to handle new generic effects derived from data.
- Ensure `PASSIVE` effects are handled (e.g., recalculated state or phase-based checks).

## Verification Plan

### Automated Verification

- Run the new script: `npx ts-node server/scripts/populate_effects.ts`
- Check output `cards.json` for populated `effects`.

### Manual Verification

- Start the server: `start_server.bat` (User action)
- Verify in console logs that cards are loaded with effects.
- (Optional) Play a mock game in `Game.ts` (using `testData` if available).
