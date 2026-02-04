
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

const createMockCard = (id: string, name: string, keywords: string[] = [], text: string = '-'): Card => ({
    id: id || uuid(),
    name,
    type: 'UNIT',
    cost: 1,
    power: 1000,
    hitCount: 1,
    text,
    keywords,
    effects: [],
    affiliation: 'MOCK'
});

async function runTests() {
    console.log('=== Unit Test: Phase 4 Card Effects / Logic Verification ===');

    const game = new Game('test-room', mockIo);
    const p1 = new Player({ ...mockSocket, id: 'p1' }, 'Player1');
    const p2 = new Player({ ...mockSocket, id: 'p2' }, 'Player2');

    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();

    // --- TEST 1: hasKeyword Improvement (Mappings) ---
    console.log('\n--- Test 1: hasKeyword (Mappings) ---');
    const unit1 = createMockCard('u1', 'Test Unit', ['アームド']);
    if (game.hasKeyword(unit1, 'ARMED')) {
        console.log('PASS: ARMED mapping to アームド works.');
    } else {
        console.error('FAIL: ARMED mapping failed.');
    }

    const unit2 = createMockCard('u2', 'Test Defender', ['ディフェンダー']);
    if (game.hasKeyword(unit2, 'DEFENDER')) {
        console.log('PASS: DEFENDER mapping to ディフェンダー works.');
    } else {
        console.error('FAIL: DEFENDER mapping failed.');
    }

    // --- TEST 2: hasKeyword Text-based (Brackets) ---
    console.log('\n--- Test 2: hasKeyword (Text-based Brackets) ---');
    const unit3 = createMockCard('u3', 'Test Attacker', [], 'このユニットは [アタッカー] を持つ。');
    if (game.hasKeyword(unit3, 'ATTACKER')) {
        console.log('PASS: [アタッカー] in text detected.');
    } else {
        console.error('FAIL: [アタッカー] in text missed.');
    }

    const unit4 = createMockCard('u4', 'Test Breakthrough', [], 'テキスト内に 突破 の文字あり。');
    if (game.hasKeyword(unit4, 'BREAKTHROUGH')) {
        console.log('PASS: 突破 in text detected.');
    } else {
        console.error('FAIL: 突破 in text missed.');
    }

    // --- TEST 3: Recycle (帰還) Logic ---
    console.log('\n--- Test 3: Recycle (帰還) in handleEndPhase ---');
    const recycleCard = createMockCard('c-recycle', 'Recycle Card', ['RECYCLE'], '帰還を持つカード。');
    // Or set isRecycle flag direct as per JSON
    (recycleCard as any).isRecycle = true;

    p1.state.discard = [recycleCard];
    p1.state.hand = [];

    game.turnPlayerId = 'p1';
    game.handleEndPhase();

    if (p1.state.hand.some(c => c.name === 'Recycle Card')) {
        console.log('PASS: Recycle card returned to hand at End Phase.');
        if (p1.state.discard.length === 0) {
            console.log('PASS: Recycle card removed from trash.');
        } else {
            console.error('FAIL: Recycle card still in trash.');
        }
    } else {
        console.error('FAIL: Recycle card not in hand.');
    }

    // --- TEST 4: Recycle (Text-based) ---
    console.log('\n--- Test 4: Recycle (Text-based Keyword) ---');
    const recycleCard2 = createMockCard('c-recycle2', 'Recycle Card 2', [], '【帰還】を持つアイテム。');
    p2.state.discard = [recycleCard2];
    p2.state.hand = [];

    // handleEndPhase processes both players
    game.handleEndPhase();

    if (p2.state.hand.some(c => c.name === 'Recycle Card 2')) {
        console.log('PASS: Text-based Recycle works.');
    } else {
        console.error('FAIL: Text-based Recycle missed.');
    }

    console.log('\n=== Test Phase 4 Complete ===');
}

runTests().catch(console.error);
