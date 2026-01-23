# Deck Builder Implementation Task List

- [x] **Data Access**
  - [x] Create API endpoint or Socket event to fetch all card data (`/api/cards` or `getCards`).
  - [x] Update `server/index.ts` to serve card data.
- [x] **Client-Side: Deck Builder UI**
  - [x] Create `components/DeckBuilder.tsx`.
  - [x] Implement Layout: Left (Card Library), Right (Current Deck).
  - [x] Implement Filters: Attribute, Type, Cost.
  - [x] Implement Deck Logic: Add/Remove, Validation (Leader, 40 cards, Limits).
  - [x] Save Deck: Persist to `localStorage`.
- [x] **Integration**
  - [x] Update `components/Lobby.tsx` to link to Deck Builder.
  - [x] Update `joinGame` event to accept `deckData`.
  - [x] Update `server/Game.ts` to use provided deck instead of random generation.
- [x] **Verification**
  - [x] Build a valid deck (Simulated via UI logic).
  - [x] Start game with custom deck.
