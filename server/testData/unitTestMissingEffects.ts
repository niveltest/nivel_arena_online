
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
const mockIo = { to: () => ({ emit: () => { } }), in: () => ({ emit: () => { } }) };

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
    console.log('=== Unit Test: Missing Effects Implementation ===');

    const game = new Game('test-room', mockIo);
    const p1 = new Player({ ...mockSocket, id: 'p1' }, 'Player1');
    const p2 = new Player({ ...mockSocket, id: 'p2' }, 'Player2');

    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();

    // --- TEST 1: PER_LEADER_LEVEL Passive ---
    console.log('\n--- Test 1: PER_LEADER_LEVEL Passive ---');
    p1.state.leaderLevel = 1;
    const diesel = createMockCard('c-diesel', 'Diesel', [],
        [{ trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 1000, targetType: 'SELF', condition: 'PER_LEADER_LEVEL' }],
        2, 1000
    );
    p1.state.field[0] = diesel;

    let power = (game as any).getUnitPower('p1', 0);
    console.log(`[Test] Level 1 Power: ${power} (Expected 1000 base + 1000*1 = 2000)`);
    if (power !== 2000) console.error('FAIL: Level 1 Power calculation incorrect');

    p1.state.leaderLevel = 3;
    power = (game as any).getUnitPower('p1', 0);
    console.log(`[Test] Level 3 Power: ${power} (Expected 1000 base + 1000*3 = 4000)`);
    if (power !== 4000) console.error('FAIL: Level 3 Power calculation incorrect');


    // --- TEST 2: ARMED_PER_ITEM Passive ---
    console.log('\n--- Test 2: ARMED_PER_ITEM Passive ---');
    const soda = createMockCard('c-soda', 'Soda', [],
        [{ trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 1000, targetType: 'SELF', condition: 'ARMED_PER_ITEM' }],
        2, 2000
    );
    p1.state.field[1] = soda;

    let sodaPower = (game as any).getUnitPower('p1', 1);
    console.log(`[Test] No Items Power: ${sodaPower} (Expected 2000)`);
    if (sodaPower !== 2000) console.error('FAIL: Base power incorrect');

    // Equip item
    const item1 = createMockCard('item1', 'Item 1', [], [], 1, 0); item1.type = 'ITEM';
    soda.attachments = [item1];

    sodaPower = (game as any).getUnitPower('p1', 1);
    console.log(`[Test] 1 Item Power: ${sodaPower} (Expected 2000 base + 1000*1 = 3000)`);
    if (sodaPower !== 3000) console.error('FAIL: 1 Item power calculation incorrect');


    // --- TEST 3: RESTRICT_ATTACK (Single Target) ---
    console.log('\n--- Test 3: RESTRICT_ATTACK (Single Target) ---');
    // P1 plays usage card -> P2 unit cannot attack
    // Setup P2 unit
    const p2Unit = createMockCard('p2-u', 'Target Unit', [], [], 3, 3000);
    p2.state.field[0] = p2Unit;

    const restrictCard = createMockCard('spell-restrict', 'Restrict Spell', [],
        [{ trigger: 'ON_PLAY', action: 'RESTRICT_ATTACK', targetType: 'SINGLE', value: 1 }],
        1, 0
    );
    restrictCard.type = 'SKILL';
    p1.state.hand = [restrictCard];

    // Simulate play (triggers selection because SINGLE target not pre-selected)
    game.turnPlayerId = 'p1';
    game.phase = 'MAIN';
    // Mock requestSelection to auto-select p2 unit
    const originalRequestSelection = (game as any).requestSelection;
    let selectionRequested = false;
    (game as any).requestSelection = (pid: string, type: string, candidates: string[], count: number, action: string, context: any, trigger: any) => {
        console.log(`[Test] Selection Requested: ${action}`);
        selectionRequested = true;
        // Simulate resolution
        game.selection = { playerId: pid, type: 'FIELD', candidateIds: candidates, count, action, context, triggerCard: trigger, previousPhase: 'MAIN' };
        game.resolveSelection(pid, [p2Unit.id]);
    };

    // Use private method via any
    (game as any).applyEffect('p1', restrictCard, 'ON_PLAY', undefined, restrictCard.effects![0]);

    if (selectionRequested) {
        if (p2Unit.cannotAttack) {
            console.log('PASS: P2 Unit is restricted from attacking.');
        } else {
            console.error('FAIL: P2 Unit cannotAttack flag is false.');
        }
    } else {
        console.error('FAIL: Selection was not requested.');
    }

    // Restore original method just in case
    (game as any).requestSelection = originalRequestSelection;

    console.log('=== Test Complete ===');
}

runTests().catch(console.error);
