
import { Game } from '../Game';
import { Player } from '../Player';
import { CPUPlayer } from '../AIPlayer';
import { Card } from '../../shared/types';
import { v4 as uuid } from 'uuid';

// Mock Socket
const mockSocket = {
    id: 'mock-socket-id',
    emit: (event: string, data: any) => { }
} as any;
const mockIo = { to: () => ({ emit: () => { } }), in: () => ({ emit: () => { } }) };

const createMockCard = (id: string, name: string, type: 'UNIT' | 'ITEM' | 'SKILL', cost: number, power: number = 0, keywords: string[] = [], effects: any[] = []): Card => ({
    id: id || uuid(),
    name,
    type,
    cost,
    power,
    hitCount: 1,
    text: name,
    keywords,
    effects,
    affiliation: 'MOCK'
});

async function runTests() {
    console.log('=== Unit Test: AI Strategic Enhancement Verification ===');

    const game = new Game('test-room', mockIo);
    const p1 = new Player({ ...mockSocket, id: 'p1' }, 'Human');
    const cpu = new CPUPlayer(game, 'CPU');

    game.addPlayer(p1);
    game.addPlayer(cpu);

    // --- TEST 1: Strategic Attack Sequence (Loot/Penetration First) ---
    console.log('\n--- Test 1: Strategic Attack Sequence (Priority) ---');
    game.turnPlayerId = cpu.id;
    game.phase = 'ATTACK';
    p1.state.hp = 50; // Not lethal
    cpu.state.hp = 10;
    cpu.state.maxHp = 10;
    game.debugLogs = [];

    const lootUnit = createMockCard('c-loot', 'Looter', 'UNIT', 2, 2000, ['LOOT']);
    const plainUnit = createMockCard('c-plain', 'Plain', 'UNIT', 2, 3000);
    cpu.state.field = [lootUnit, plainUnit, null];
    cpu.state.unitsPlaced = [true, true, false];

    const weakEnemy = createMockCard('e1', 'Weakling', 'UNIT', 1, 500);
    p1.state.field = [weakEnemy, null, null];

    // AI should choose LootUnit to attack Weakling because it triggers LOOT
    // plain logic would pick plain unit (higher power).
    console.log('AI Thinking about attack...');
    await cpu.think();

    // Note: think() calls game.attack which then changes phase/state.
    // We expect the first attack in log to be Looter.
    // In our strategic sort, Loot/Penetration has priority over plain high power.

    // Check if the first attack was from Looter
    if (game.debugLogs.some(log => log.includes('Strategic Attack: Looter'))) {
        console.log('PASS: Looter took priority for trigger-able target.');
    } else {
        console.log('Last logs:', game.debugLogs.slice(-5));
        console.error('FAIL: Attack sequence not optimized.');
    }

    // --- TEST 2: Strategic Intercept (Mook protects Lord) ---
    console.log('\n--- Test 2: Strategic Intercept (Save the Lord) ---');
    game.turnPlayerId = cpu.id;
    game.phase = 'GUARDIAN_INTERCEPT';
    game.pendingAttack = { attackerId: 'p1', attackerIndex: 0, defenderId: cpu.id, targetIndex: 0 };
    game.debugLogs = [];

    const lordUnit = createMockCard('c-lord', 'Lord', 'UNIT', 5, 4000, [], [{ trigger: 'PASSIVE', action: 'BUFF_ALLY', value: 1000 }]);
    const mookGuardian = createMockCard('c-mook', 'Mook', 'UNIT', 1, 1000, ['GUARDIAN']);
    cpu.state.field = [lordUnit, mookGuardian, null];
    cpu.state.hp = 10;

    const bigAttacker = createMockCard('atk1', 'Big Attacker', 'UNIT', 4, 5000);
    p1.state.field[0] = bigAttacker;

    console.log('AI Thinking about intercept...');
    await cpu.think();

    if (game.debugLogs.some(log => log.includes('Strategic Intercept: Mook'))) {
        console.log('PASS: Mook sacrificed itself for the Lord.');
    } else {
        console.log('Last logs:', game.debugLogs.slice(-5));
        console.error('FAIL: AI let the Lord die.');
    }

    // --- TEST 3: Skill Utility (Don't waste heal) ---
    console.log('\n--- Test 3: Skill Utility (Heal check) ---');
    game.turnPlayerId = cpu.id;
    game.phase = 'MAIN';
    cpu.state.hp = 10;
    cpu.state.maxHp = 10;
    cpu.state.resources = 10;
    game.debugLogs = [];

    const healSkill = createMockCard('s-heal', 'Heal', 'SKILL', 1, 0, [], [{ action: 'HEAL_LEADER', value: 2 }]);
    cpu.state.hand = [healSkill];
    cpu.state.field = [null, null, null];
    cpu.state.skillZone = [];

    console.log('AI Thinking about playing heal at Full HP...');
    await cpu.think();

    if (cpu.state.hand.length === 1) {
        console.log('PASS: AI did not play heal at full HP.');

        // Reset for second part of Test 3
        game.turnPlayerId = cpu.id;
        game.phase = 'MAIN';
        cpu.state.hp = 5;
        console.log('HP lowered to 5. Thinking again...');
        await cpu.think();

        if (cpu.state.hand.length === 0 || game.debugLogs.some(log => log.includes('Strategic SKILL'))) {
            console.log('PASS: AI played heal when damaged.');
        } else {
            console.log('Last logs:', game.debugLogs.slice(-5));
            console.error('FAIL: AI still did not play heal.');
        }
    } else {
        console.error('FAIL: AI wasted heal at full HP.');
    }

    console.log('\n=== Test AI Strategic Complete ===');
}

runTests().catch(console.error);
