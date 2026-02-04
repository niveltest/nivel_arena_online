
import { Game } from '../Game';
import { Player } from '../Player';
import { Card } from '../../shared/types';
import { v4 as uuid } from 'uuid';

// Mock Socket
const mockSocket = {
    id: 'mock-socket-id',
    emit: (event: string, data: any) => {
        // console.log(`[MockSocket] Emit ${event}`, data);
    }
} as any;

const createMockCard = (id: string, name: string, keywords: string[] = [], effects: any[] = [], cost: number = 1, power: number = 1000): Card => ({
    id: uuid(),
    name,
    type: 'UNIT',
    cost,
    power,
    hitCount: 1,
    text: 'Mock Card',
    keywords,
    effects,
    affiliation: 'MOCK'
});

async function runTests() {
    console.log('=== Starting Unit Tests for New Cards ===');

    const mockIo = { to: () => ({ emit: () => { } }), in: () => ({ emit: () => { } }) };
    const game = new Game('test-room', mockIo);
    const p1 = new Player({ ...mockSocket, id: 'p1' }, 'Player1');
    const p2 = new Player({ ...mockSocket, id: 'p2' }, 'Player2');

    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start(); // This generates random decks, but we will override fields

    // --- TEST 1: Noah (INVINCIBLE) ---
    console.log('\n--- Test 1: Noah (INVINCIBLE) ---');
    const noah = createMockCard('c030', 'Noah', ['INVINCIBLE']);
    p1.state.field[0] = noah;

    // Attempt to destroy
    // Access private method via any or just try to trigger it via kill effect?
    // Game.destroyUnit is private. 
    // We can simulate an attack that would kill it OR use a KILL effect.
    // Let's use a mock KILL effect from Player 2.
    const killerCard = createMockCard('kill-spell', 'Killer', [], [{ trigger: 'ON_PLAY', action: 'KILL_UNIT', targetSlot: 0 }]);
    // We need to call applyEffect. applyEffect is private.
    // We can access private methods using (game as any)

    console.log(`[Test] Attempting to destroy Noah...`);
    (game as any).destroyUnit('p1', 0, 'p2');

    if (p1.state.field[0] !== null && p1.state.field[0]?.name === 'Noah') {
        console.log('PASS: Noah was NOT destroyed (Invincible working).');
    } else {
        console.error('FAIL: Noah WAS destroyed.');
    }

    // --- TEST 2: Snow White (BREAKTHROUGH_COST5) ---
    console.log('\n--- Test 2: Snow White (BREAKTHROUGH_COST5) ---');
    // Setup P1 attacker (Snow White) and P2 defender (Cost 5 Unit)
    const snowWhite = createMockCard('c027', 'Snow White', ['BREAKTHROUGH_COST5']);
    const bigDefender = createMockCard('def-1', 'Big Defender', [], [], 5, 5000); // Cost 5

    p1.state.field[1] = snowWhite; // Slot 1
    p2.state.field[1] = bigDefender; // Slot 1 (Frontal)

    game.phase = 'ATTACK';
    game.turnPlayerId = 'p1';

    // P1 Attack
    game.attack('p1', 1, 1);

    if ((game.phase as string) === 'DEFENSE' && game.pendingAttack) {
        console.log('[Test] Attack initiated. Attempting to BLOCK with Cost 5 unit...');
        game.resolveDefense('p2', 'BLOCK');

        // If block was rejected, pendingAttack should still exist and phase should be DEFENSE.
        // If block accepted, it usually resolves battle and returns to ATTACK (and pendingAttack null).

        if (game.pendingAttack !== null && (game.phase as string) === 'DEFENSE') {
            console.log('PASS: Block was REJECTED (Breakthrough Cost 5 working).');
        } else {
            console.error('FAIL: Block was ACCEPTED.');
        }

        // Cancel attack to reset
        game.phase = 'ATTACK';
        game.pendingAttack = null;

    } else {
        console.error('FAIL: Attack sequence did not start correctly.');
    }

    // --- TEST 3: Alice (MY_TURN Passive) ---
    console.log('\n--- Test 3: Alice (MY_TURN Passive) ---');
    // Reset Leader to avoid interference
    p1.state.leader = createMockCard('lead-mock', 'Mock Leader', [], [], 0, 0);
    p1.state.leader.type = 'LEADER';

    // Clear field
    p1.state.field = [null, null, null];

    const alice = createMockCard('c029', 'Alice', [],
        [{ trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 2000, targetType: 'SELF', condition: 'MY_TURN' }],
        3, 4000
    );
    p1.state.field[2] = alice;

    // Set turn to P1
    game.turnPlayerId = 'p1';
    const powerP1Turn = (game as any).getUnitPower('p1', 2);
    console.log(`[Test] Power on P1 Turn: ${powerP1Turn} (Expected: 6000)`);

    // Set turn to P2
    game.turnPlayerId = 'p2';
    const powerP2Turn = (game as any).getUnitPower('p1', 2);
    console.log(`[Test] Power on P2 Turn: ${powerP2Turn} (Expected: 4000)`);

    if (powerP1Turn === 6000 && powerP2Turn === 4000) {
        console.log('PASS: Alice Passive works correctly.');
    } else {
        console.error('FAIL: Power values incorrect.');
    }

    console.log('\n=== Tests Completed ===');
}

runTests().catch(console.error);
