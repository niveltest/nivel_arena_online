
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
    console.log('=== Unit Test: Phase 2 Effects Verification ===');

    const game = new Game('test-room', mockIo);
    const p1 = new Player({ ...mockSocket, id: 'p1' }, 'Player1');
    const p2 = new Player({ ...mockSocket, id: 'p2' }, 'Player2');

    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();

    // Use specific IDs to simulate cards from cards.json (after fix)

    // --- TEST 1: Lord Effect (Unit buffing others) ---
    console.log('\n--- Test 1: Lord Effect ---');
    // Imagine a unit that buffs ALL_ALLIES by 500
    const captain = createMockCard('c-captain', 'Captain', [],
        [{ trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 500, targetType: 'ALL_ALLIES' }]
    );
    const soldier = createMockCard('c-soldier', 'Soldier', [], [], 1, 1000);
    p1.state.field[0] = captain; // Spot 0
    p1.state.field[1] = soldier; // Spot 1

    let soldierPower = (game as any).getUnitPower('p1', 1);
    console.log(`[Test] Soldier Power: ${soldierPower} (Expected 1000 + 500 = 1500)`);
    if (soldierPower !== 1500) console.error('FAIL: Lord effect not applied to ally.');

    // --- TEST 2: ARMED_IF_EQUIPPED Condition ---
    console.log('\n--- Test 2: ARMED_IF_EQUIPPED ---');
    const maxwell = createMockCard('c-maxwell', 'Maxwell', [],
        [{ trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 1000, targetType: 'SELF', condition: 'ARMED_IF_EQUIPPED' }],
        3, 2000
    );
    p1.state.field[2] = maxwell;

    let maxPower = (game as any).getUnitPower('p1', 2); // No item
    console.log(`[Test] Maxwell (No Item): ${maxPower} (Expected 2000 + 500(Captain)) = 2500`);
    if (maxPower !== 2500) console.error('FAIL: Base power (with captain buff) incorrect.');

    // Equip
    const item = createMockCard('item-gun', 'Gun', [], [], 1, 0); item.type = 'ITEM';
    maxwell.attachments = [item];
    maxPower = (game as any).getUnitPower('p1', 2);
    console.log(`[Test] Maxwell (Equipped): ${maxPower} (Expected 2500 + 1000 = 3500)`);
    if (maxPower !== 3500) console.error('FAIL: Buff not applied when equipped.');

    // --- TEST 3: OPPONENT_TURN Condition ---
    console.log('\n--- Test 3: OPPONENT_TURN ---');
    // Emulate Dorothy Leader Effect
    p1.state.leader.effects = [
        { trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 1000, targetType: 'ALL_ALLIES', condition: 'OPPONENT_TURN', isAwakening: true }
    ];
    // Force awaken
    p1.state.leaderLevel = 10;
    p1.state.leader.awakeningLevel = 4;

    game.turnPlayerId = 'p1'; // My Turn
    let p1UnitPower = (game as any).getUnitPower('p1', 1); // Soldier
    // Soldier Base 1000 + Captain 500 = 1500. Dorothy should NOT apply.
    console.log(`[Test] My Turn Power: ${p1UnitPower} (Expected 1500)`);
    if (p1UnitPower !== 1500) console.error('FAIL: Opponent turn buff applied during my turn.');

    game.turnPlayerId = 'p2'; // Opponent Turn
    p1UnitPower = (game as any).getUnitPower('p1', 1);
    // Soldier Base 1000 + Captain 500 + Dorothy 1000 = 2500.
    console.log(`[Test] Opponent Turn Power: ${p1UnitPower} (Expected 1500 + 1000 = 2500)`);
    if (p1UnitPower !== 2500) console.error('FAIL: Opponent turn buff not applied.');


    // --- TEST 4: GRANT_ABILITY ALL_ENEMIES ---
    console.log('\n--- Test 4: GRANT_ABILITY ALL_ENEMIES ---');
    // Effect: Grant "Stunned" (dummy keyword for test) to ALL_ENEMIES
    const debuffer = createMockCard('spell-debuff', 'Mass Debuff', [],
        [{ trigger: 'ON_PLAY', action: 'GRANT_ABILITY', grantedKeyword: 'TEST_DEBUFF', targetType: 'ALL_ENEMIES' }]
    );
    p1.state.hand = [debuffer];

    // Setup enemies
    p2.state.field[0] = createMockCard('e1', 'Enemy 1');
    p2.state.field[1] = createMockCard('e2', 'Enemy 2');

    game.turnPlayerId = 'p1';
    game.phase = 'MAIN';

    // Play card
    (game as any).applyEffect('p1', debuffer, 'ON_PLAY', undefined, debuffer.effects![0]);

    const e1 = p2.state.field[0];
    const e2 = p2.state.field[1];

    if (e1?.tempKeywords?.includes('TEST_DEBUFF') && e2?.tempKeywords?.includes('TEST_DEBUFF')) {
        console.log('PASS: All enemies received the keyword.');
    } else {
        console.error('FAIL: Enemies did not receive keyword.');
        console.log('E1 keywords:', e1?.tempKeywords);
    }

    console.log('=== Test Phase 2 Complete ===');
}

runTests().catch(console.error);
