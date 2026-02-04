# Room Management & Spectator Mode Walkthrough

This document outlines the changes made to implement password-protected rooms and spectator mode in Nivel Arena, along with instructions for verification.

## Changes Overview

### Server-Side

- **Room Passwords**: `Game` class now supports a `password` property. `createGame` and `joinGame` events updated to handle password validation.
- **Spectator Mode**: `Game` class maintains a `spectators` list. `joinGame` now accepts `isSpectator` flag.
- **State Broadcast**: `broadcastState` now sends the full game state to spectators. Logic for creating game state was refactored into `createGameState`.
- **Card Visibility**: Currently, spectators receive the full state including all hands. The client handles the "reveal both hands" UI. (Note: Secure masking on server is a future consideration).

### Client-Side

- **Lobby UI**:
  - Added "Create Password" field in Room Creation.
  - Added "Spectator" checkbox and "Room Password" field in Join Room section.
- **Game Board**:
  - **Spectator Indicator**: Displays a pulsating "SPECTATOR MODE" badge.
  - **View Logic**:
    - Spectators see Player 1 (Creator) at the bottom and Player 2 at the top.
    - Interaction disabled (cannot click cards, end turn, etc.).
    - Both players' hands are fully visible (cards are face-up).
  - **Waiting Screen**: Spectators can join empty rooms (waiting for P1/P2) or active games. Logic updated to show board if spectating even if player count < 2 (though gameplay requires 2 players).

## Verification Plan

### Prerequisites

- Build the server: `npm run build` in `server/`.
- Start the server: `npm run start` in `server/`.
- Start the client: `npm run dev` in `client/` (or root).

### Test Case 1: Password Protected Room

1. **User A (Host)**:
    - Go to Lobby.
    - Enter Username "Host".
    - Check "Create Password" and enter "1234".
    - Click "Create Room". (Room ID generated, e.g., `room-abc`).
2. **User B (Attacker)**:
    - Go to Lobby.
    - Enter Username "Hacker".
    - Enter Room ID `room-abc`.
    - **Leave Password empty**.
    - Click "Join Room". -> **Expected**: Join fails (Alert or non-action).
3. **User B (Correct)**:
    - Enter Password "1234".
    - Click "Join Room". -> **Expected**: Successfully joins game.

### Test Case 2: Spectator Mode

1. **User A & B**: Start a game as above (or in a new room).
2. **User C (Spectator)**:
    - Go to Lobby.
    - Enter Username "Watcher".
    - Enter Room ID.
    - Check "Join as Spectator".
    - (Password if required).
    - Click "Join Room".
3. **Observation**:
    - User C enters the game.
    - "SPECTATOR MODE" badge is visible.
    - User C sees User A's hand (bottom) and User B's hand (top).
    - User C cannot drag cards or click "End Turn".

### Test Case 3: Gameplay Functionality (Regression)

- Verify that normal game actions (Play unit, Attack, Turn switch) still work for A and B.
- Verify Spectator receives updates in real-time.

## Automated Verification Status

- **Server Build**: Passed (`tsc` successful).
- **Unit Tests**: Existing tests were preserved. New features require manual UI testing or integration tests (simulated clients).

## Implementation Details & Fixes

- Fixed TypeScript errors in `Game.ts` related to `drawOnKill` and state generation.
- Fixed `AIPlayer` type inconsistencies.
