
import { Game } from '../Game';
import { Player } from '../Player';
import { Card } from '../../shared/types';
import { v4 as uuid } from 'uuid';

// Mock Socket
const mockSocket = {
    id: 'mock-socket-id',
    emit: (event: string, data: any) => {
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
    console.log('=== Unit Test: Phase 3 Effects Verification ===');

    const game = new Game('test-room', mockIo);
    const p1 = new Player({ ...mockSocket, id: 'p1' }, 'Player1');
    const p2 = new Player({ ...mockSocket, id: 'p2' }, 'Player2');

    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();

    // Need to set turnPlayerId for conditions but manual triggers work anyway usually
    game.turnPlayerId = 'p1';

    // --- TEST 1: BOUNCE_UNIT (ALL_ENEMIES) ---
    console.log('\n--- Test 1: BOUNCE_UNIT (ALL_ENEMIES) ---');
    const bouncer = createMockCard('c-bouncer', 'Bouncer', [],
        [{ trigger: 'ON_PLAY', action: 'BOUNCE_UNIT', targetType: 'ALL_ENEMIES' }]
    );
    p1.state.hand = [bouncer];

    // Setup enemies
    p2.state.field[0] = createMockCard('e1', 'Enemy A');
    p2.state.field[1] = createMockCard('e2', 'Enemy B');

    // Play Bouncer
    (game as any).applyEffect('p1', bouncer, 'ON_PLAY', undefined, bouncer.effects![0]);

    if (p2.state.field[0] === null && p2.state.field[1] === null) {
        console.log('PASS: All enemies bounced.');
        if (p2.state.hand.length === 5 + 2) { // 5 initial hand + 2 bounced
            console.log('PASS: Enemies returned to hand.');
        } else {
            console.error(`FAIL: Hand count mismatch. Expected 7, got ${p2.state.hand.length}`);
        }
    } else {
        console.error('FAIL: Enemies still on field.');
    }

    // --- TEST 2: BUFF_HIT (ALL_ALLIES) ---
    console.log('\n--- Test 2: BUFF_HIT (ALL_ALLIES) ---');
    const buffer = createMockCard('c-buffer', 'Buffer', [],
        [{ trigger: 'ON_PLAY', action: 'BUFF_HIT', value: 1, targetType: 'ALL_ALLIES' }]
    );

    p1.state.field[0] = createMockCard('u1', 'Unit 1');
    p1.state.field[1] = createMockCard('u2', 'Unit 2');

    // Apply Effect
    (game as any).applyEffect('p1', buffer, 'ON_PLAY', undefined, buffer.effects![0]);

    const u1 = p1.state.field[0];
    const u2 = p1.state.field[1];

    if (u1?.tempHitBuff === 1 && u2?.tempHitBuff === 1) {
        console.log('PASS: Hit buff applied to all allies.');
    } else {
        console.error('FAIL: Hit buff not applied.', u1?.tempHitBuff, u2?.tempHitBuff);
    }

    // --- TEST 3: OPPOSING_HIT_LE_ARMED_COUNT ---
    console.log('\n--- Test 3: OPPOSING_HIT_LE_ARMED_COUNT ---');
    const nakedKing = createMockCard('c-king', 'King', [],
        [{
            trigger: 'ON_ATTACK',
            action: 'GRANT_ABILITY',
            grantedKeyword: 'BREAKTHROUGH',
            targetType: 'SELF',
            condition: 'OPPOSING_HIT_LE_ARMED_COUNT'
        }]
    );

    // Setup Attack Scenario
    p1.state.field[2] = nakedKing;
    const defender = createMockCard('defender', 'Defender');
    defender.hitCount = 2;
    p2.state.field[2] = defender;

    // Case A: 0 Items vs 2 Hit (Should fail)
    game.pendingAttack = { attackerId: 'p1', attackerIndex: 2, defenderId: 'p2', targetIndex: 2 };
    (game as any).applyEffect('p1', nakedKing, 'ON_ATTACK', undefined, nakedKing.effects![0]);

    if (nakedKing.tempKeywords?.includes('BREAKTHROUGH')) {
        console.error('FAIL: Condition ignored (0 items vs 2 hit).');
    } else {
        console.log('PASS: Condition checked correctly (0 < 2).');
    }

    // Case B: 2 Items vs 2 Hit (Should pass)
    const i1 = createMockCard('i1', 'Item 1'); i1.type = 'ITEM';
    const i2 = createMockCard('i2', 'Item 2'); i2.type = 'ITEM';
    nakedKing.attachments = [i1, i2];

    // Clear temp keywords
    nakedKing.tempKeywords = [];

    (game as any).applyEffect('p1', nakedKing, 'ON_ATTACK', undefined, nakedKing.effects![0]);

    if (nakedKing.tempKeywords?.includes('BREAKTHROUGH')) {
        console.log('PASS: Condition met (2 items >= 2 hit).');
    } else {
        console.error('FAIL: Condition failed despite meeting criteria.');
    }

    console.log('=== Test Phase 3 Complete ===');
}

runTests().catch(console.error);
