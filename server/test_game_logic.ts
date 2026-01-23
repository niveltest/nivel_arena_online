
import { Game } from './Game';
import { Player } from './Player';

// Mock Socket
const mockSocket: any = {
    id: 'mock-id',
    emit: (event: string, data: any) => {
        // console.log(`[Socket] Emit ${event}:`, data);
    }
};

async function testGameLogic() {
    console.log("=== STARTING GAME LOGIC TEST ===");

    const game = new Game("test-room");

    // Create Players
    const p1 = new Player({ ...mockSocket, id: 'p1-id' } as any, "Player1");
    const p2 = new Player({ ...mockSocket, id: 'p2-id' } as any, "Player2");

    game.addPlayer(p1);
    game.addPlayer(p2);

    console.log("--- Starting Game ---");
    game.start();

    // Verify Turn 1 State
    console.log(`[Turn 1] Phase: ${game.phase}`);
    console.log(`[Turn 1] P1 (Turn Player) Level: ${p1.state.leaderLevel}`);
    console.log(`[Turn 1] P2 (Opponent) Level: ${p2.state.leaderLevel}`);

    if (game.phase !== 'LEVEL_UP') console.error("!!! ERROR: Phase should be LEVEL_UP");
    if (p1.state.leaderLevel !== 2) console.error("!!! ERROR: P1 should be Level 2");

    console.log("--- P1 Confirms Level Up (Next Phase) ---");
    game.nextPhase(); // LEVEL_UP -> DRAW -> MAIN
    console.log(`[Turn 1] Phase after OK: ${game.phase}`);
    if (game.phase !== 'MAIN') console.error("!!! ERROR: Phase should be MAIN");

    console.log("--- P1 End Mains -> Attack -> End ---");
    (game as any).phase = 'END'; // Skip ahead for test
    game.nextPhase(); // END -> Switch Turn

    // Verify Turn 2 State
    console.log(`[Turn 2] Turn Count: ${game.turnCount}`);
    console.log(`[Turn 2] Turn Player: ${game.turnPlayerId}`);
    console.log(`[Turn 2] Phase: ${game.phase}`);
    console.log(`[Turn 2] P1 Level: ${p1.state.leaderLevel}`);
    console.log(`[Turn 2] P2 Level: ${p2.state.leaderLevel}`);

    // Critical Check
    if (game.phase !== 'LEVEL_UP') console.error("!!! ERROR: Turn 2 start phase should be LEVEL_UP");
    if (p2.state.leaderLevel !== 2) console.error("!!! ERROR: P2 should be Level 2 on Turn 2");

    console.log("--- P2 Confirms Level Up ---");
    game.nextPhase();
    console.log(`[Turn 2] Phase after OK: ${game.phase}`);
    if (game.phase !== 'MAIN') console.error("!!! ERROR: Phase should be MAIN");


    console.log("--- P2 Ends Turn -> Turn 3 ---");
    (game as any).phase = 'END';
    game.nextPhase();

    console.log(`[Turn 3] Turn Count: ${game.turnCount}`);
    console.log(`[Turn 3] P1 Level: ${p1.state.leaderLevel}`);

    // Turn 3 -> Level should be 1 + ceil(3/2) = 1 + 2 = 3.
    if (p1.state.leaderLevel !== 3) console.error("!!! ERROR: P1 should be Level 3 on Turn 3");

    console.log("=== TEST COMPLETE ===");
}

testGameLogic().catch(console.error);
