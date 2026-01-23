# Deck Builder Implementation Plan

## Goal

Enable players to create custom decks and use them in the game, replacing the random deck generation.

## Proposed Changes

### 1. Card Data Access

- **Server**: Expose `cards.json` to the client.
  - Since we use Express, add `app.get('/api/cards', ...)` in `server/index.ts`.
  - Alternatively, emit via Socket, but REST is standard for static data.

### 2. Deck Builder Component (`components/DeckBuilder.tsx`)

- **State**: `library` (all cards), `currentDeck` (list of cards), `filters`.
- **Validation Rules**:
  - Exactly 1 Leader.
  - Exactly 40 Main Deck cards.
  - Max 3 copies of same card.
  - Max 8 Trigger cards.
  - Attribute restriction: All cards must match Leader's attribute (unless dual attribute logic exists, sticking to basic for now).
- **Storage**: Save to browser's `localStorage` as JSON.

### 3. Game Integration

- **Lobby**: Add "Edit Deck" button.
- **Join**: When joining, read from `localStorage`. If valid deck exists, send it with `joinGame`.
- **Server**:
  - Update `joinGame` in `server/index.ts` to receive `deck: string[]` (list of IDs).
  - Update `Game.ts`: `addPlayer` now accepts optional deck list.
  - Warning: Validate deck on server side again to prevent cheating/invalid decks.

## Verification Plan

1. **UI**: Open Deck Builder, filter cards, add to deck.
2. **Validation**: Try to add >3 copies, or >8 triggers. Verify alerts/blocking.
3. **Gameplay**: Save deck, join game. Verify first 5 cards drawn match deck composition.
