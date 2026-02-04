
// @ts-nocheck
import { Game } from '../Game';
import { CPUPlayer } from '../AIPlayer';
import { Player } from '../Player';
import { Card } from '../../shared/types';
import { v4 as uuid } from 'uuid';

// Mock Socket
const mockSocket = {
    id: 'mock-socket-id',
    emit: (event: string, data: any) => { },
    join: () => { },
    on: () => { },
    connect: () => { },
    disconnect: () => { },
    removeAllListeners: () => { },
    close: () => { }
} as any;
const mockIo = { to: () => ({ emit: () => { } }), in: () => ({ emit: () => { } }) };

const createMockCard = (id: string, name: string, cost: number, power: number, keywords: string[] = []): Card => ({
    id: id || uuid(),
    name,
    type: 'UNIT',
    cost,
    power,
    hitCount: 1,
    text: 'Mock Card',
    keywords,
    effects: [],
    affiliation: 'MOCK'
});

async function runTest() {
    console.log('=== Unit Test: AI Selection Logic ===');

    const game = new Game('test-room-ai', mockIo);
    const cpu = new CPUPlayer(game, 'CPU');
    const human = new Player({ ...mockSocket, id: 'human' } as any, 'Human');

    game.addPlayer(human);
    game.addPlayer(cpu); // CPU is p2 usually
    game.start();

    // Setup Scenario: CPU is Player 2
    // Human has 2 units: 
    // 1. Weak Unit (Cost 1, Level 1000)
    // 2. Strong Unit (Cost 5, Level 5000, GUARDIAN)

    const weakUnit = createMockCard('c-weak', 'Weak Unit', 1, 1000);
    const strongUnit = createMockCard('c-strong', 'Strong Guardian', 5, 5000, ['GUARDIAN']);

    human.state.field[0] = weakUnit;
    human.state.field[1] = strongUnit;

    // --- TEST 1: BOUNCE SELECTION ---
    console.log('\n--- Test 1: BOUNCE Selection (Should pick High Cost/Threat) ---');
    game.selection = {
        playerId: cpu.id,
        action: 'BOUNCE_UNIT_SELECTION',
        count: 1,
        candidateIds: [weakUnit.id, strongUnit.id],
        context: {}
    };

    // Trigger AI Selection Logic manually
    // We can't await think() easily as it has delays. 
    // We can access private handleSelection via any cast or invoke logic directly if we extract it?
    // Or just invoke think() and wait? think() calls handleSelection if phase matches. 
    // Using handleSelection directly via cast is easier.
    (cpu as any).handleSelection();

    // Check Last Action from Game
    // Wait, resolveSelection simply updates game state or callback.
    // We can spy on resolveSelection or check result.
    // Since Game.resolveSelection is called, we can check if human field changed? 
    // NO, resolveSelection usually triggers the Effect continuation.
    // But in unit test, we didn't setup the request callback cleanly via "requestSelection".
    // We just set game.selection manually. 
    // So resolveSelection won't find a pending callback for this manual setup unless we mocked requestSelection properly.
    // However, CPU calls valid `game.resolveSelection`. Let's mock `game.resolveSelection` to capture output.

    // We can't easily mock game method AFTER instantiation without Proxy.
    // Let's rely on checking `game.selection` being cleared? No.
    // Let's overwrite `game.resolveSelection` temporarily.

    let selectedIds: string[] = [];
    game.resolveSelection = (playerId: string, ids: string[]) => {
        selectedIds = ids;
        console.log(`[MockGame] Resolved Selection: ${ids.join(', ')}`);
        // Don't do actual logic
    };

    // Retry handleSelection
    (cpu as any).handleSelection();

    if (selectedIds[0] === strongUnit.id) {
        console.log('PASS: CPU selected Strong Unit for Bounce.');
    } else {
        console.error(`FAIL: CPU selected ${selectedIds[0]} (Expected ${strongUnit.id})`);
    }

    // --- TEST 2: KILL SELECTION ---
    console.log('\n--- Test 2: KILL Selection (Should pick High Threat) ---');
    game.selection = {
        playerId: cpu.id,
        action: 'KILL_UNIT_SELECTION',
        count: 1,
        candidateIds: [weakUnit.id, strongUnit.id],
        context: {}
    };
    (cpu as any).handleSelection();

    if (selectedIds[0] === strongUnit.id) {
        console.log('PASS: CPU selected Strong Unit for Kill.');
    } else {
        console.error(`FAIL: CPU selected ${selectedIds[0]} (Expected ${strongUnit.id})`);
    }

    // --- TEST 3: DISCARD_HAND (Own) ---
    console.log('\n--- Test 3: DISCARD_HAND (Should pick Low Value) ---');
    const weakCard = createMockCard('h-weak', 'Weak Hand', 1, 1000);
    const strongCard = createMockCard('h-strong', 'Strong Hand', 6, 6000);
    cpu.state.hand = [weakCard, strongCard];

    game.selection = {
        playerId: cpu.id,
        action: 'DISCARD_HAND',
        count: 1,
        candidateIds: [weakCard.id, strongCard.id],
        context: {}
    };
    (cpu as any).handleSelection();

    if (selectedIds[0] === weakCard.id) {
        console.log('PASS: CPU discarded Weak Card.');
    } else {
        console.error(`FAIL: CPU selected ${selectedIds[0]} (Expected ${weakCard.id})`);
    }

    console.log('=== Test AI Complete ===');
}

runTest().catch(console.error);
