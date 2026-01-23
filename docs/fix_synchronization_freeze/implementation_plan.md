# Implementation Plan - Fix Synchronization Freeze

## Goal Description

The game freezes at the "Synchronizing..." (同期中...) screen when a player starts a new game. This is caused by two issues:

1. **Infinite Socket Reconnection**: The `useEffect` hook managing the socket connection depends on `gameState`. Since the socket updates `gameState`, this triggers a re-render and a new socket connection, creating an infinite loop.
2. **Incorrect Waiting State**: The logic to display "Synchronizing..." triggers when the opponent is missing. However, when a player first creates a room, they are alone (1 player), causing the "Synchronizing" message to display instead of the "Waiting for Opponent" screen.

## User Review Required

None. This is a bug fix.

## Proposed Changes

### Components

#### [MODIFY] [GameBoard.tsx](file:///c:/Users/worke/Antigravity/nivel_arena_online/components/GameBoard.tsx)

- **Refactor `useEffect` dependencies**: Remove `gameState` from the dependency array of the socket connection effect to prevent reconnection loops.
- **Use Functional State Updates**: Update the `socket.on('gameState')` handler to use `setGameState(prev => ...)` so that previous state can be accessed for sound effect logic without needing `gameState` in the closure.
- **Update Waiting Condition**: Modify the condition for showing the "Waiting for Opponent" screen to include the case where `gameState` exists but has fewer than 2 players.

## Verification Plan

### Manual Verification

- **Start Game**: Open the game and create a room.
- **Check Waiting Screen**: Verify that "Waiting for Opponent" (Room ID display) appears instead of "Synchronizing...".
- **Join Game**: Have a second client join the room.
- **Check Game Start**: Verify that the game starts correctly and "Synchronizing..." disappears.
- **Check Console**: Ensure weird connection logs (repeated "Connected") do not appear in the console.
