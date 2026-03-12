import { Game } from '../Game';
import { Player } from '../Player';
import { Card } from '../../shared/types';
import cardsData from '../data/cards.json';

const allCards = cardsData as unknown as Card[];

describe('BT03 System Tests: 防壁 (BOUHEKI) & コスト付きアクティブ', () => {
    let game: Game;
    let p1: Player;
    let p2: Player;

    beforeEach(() => {
        // Suppress console.log for neat test output
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        game = new Game('TEST_BT03', { emit: jest.fn(), on: jest.fn(), to: () => ({ emit: jest.fn() }) });
        
        p1 = new Player({ id: 'socket1', emit: jest.fn() } as any, 'Player1');
        p2 = new Player({ id: 'socket2', emit: jest.fn() } as any, 'Player2');
        game.addPlayer(p1);
        game.addPlayer(p2);
        game.start();

        // Skip mulligan
        game.resolveMulligan(p1.id, []);
        game.resolveMulligan(p2.id, []);

        // Prepare some arbitrary weak leader to avoid random behavior
        p1.state.leader = { id: 'ST01-001', name: 'Leader1', type: 'LEADER', cost: 0, text: '' } as Card;
        p2.state.leader = { id: 'ST01-001', name: 'Leader2', type: 'LEADER', cost: 0, text: '' } as Card;
    });

    test('防壁 (BOUHEKI) intercepts attack to adjacent lane correctly', () => {
        // Setup P2 field with a Bouheki unit on slot 1, attack aimed at slot 0
        const bouhekiUnit = allCards.find(c => c.id === 'BT03-061'); // マスト (防壁)
        const victimUnit = allCards.find(c => c.id === 'BT01-002'); // 適当なバニラ
        const attackerUnit = allCards.find(c => c.id === 'BT01-002');
        
        expect(bouhekiUnit).toBeDefined();

        const p1Attacker = JSON.parse(JSON.stringify(attackerUnit));
        p1Attacker.power = 5000;
        p1.state.field[0] = p1Attacker; // Attacker on slot 0

        const p2Victim = JSON.parse(JSON.stringify(victimUnit));
        p2Victim.power = 1000;
        p2.state.field[0] = p2Victim; // Victim on slot 0

        const p2Bouheki = JSON.parse(JSON.stringify(bouhekiUnit));
        // Verify it has BOUHEKI
        if (!p2Bouheki.keywords) p2Bouheki.keywords = [];
        if (!p2Bouheki.keywords.includes('防壁')) p2Bouheki.keywords.push('防壁');
        p2.state.field[1] = p2Bouheki; // Bouheki defender on adjacent slot

        // Fast forward to P1 turn MAIN -> ATTACK phase
        game.turnPlayerId = p1.id;
        game.phase = 'ATTACK';
        game.attack(p1.id, 0, 0);

        // Expect phase to pause for interception
        expect(game.phase).toBe('GUARDIAN_INTERCEPT');
        
        // P2 chooses to intercept with slot 1
        game.resolveGuardianIntercept(p2.id, 1);

        // Expect phase to be DEFENSE, target changed to slot 1
        expect(game.phase).toBe('DEFENSE');
        expect(game.pendingAttack?.targetIndex).toBe(1);
        
        // Check if Bouheki unit is rested
        expect(p2.state.field[1]?.attackedThisTurn).toBe(true);

        // Take damage
        game.resolveDefense(p2.id, 'TAKE');
        expect(p2.state.damageZone.length).toBe(1);
    });

    test('COST_HAND_2 ACTIVE ability correctly requires hand discard to resolve', () => {
        const activeUnit = allCards.find(c => c.id === 'BT03-027'); // シン (COST_HAND_2)
        expect(activeUnit).toBeDefined();

        const p1Active = JSON.parse(JSON.stringify(activeUnit));
        p1.state.field[0] = p1Active;
        
        // Give P1 some dummy cards in hand to discard
        const dummyDiscard1 = { id: 'd1', name: 'Discard1', type: 'UNIT', cost: 1 } as Card;
        const dummyDiscard2 = { id: 'd2', name: 'Discard2', type: 'UNIT', cost: 1 } as Card;
        const dummyHandRemaining = { id: 'd3', name: 'Remaining', type: 'UNIT', cost: 1 } as Card;
        p1.state.hand = [dummyDiscard1, dummyDiscard2, dummyHandRemaining];

        game.turnPlayerId = p1.id;
        game.phase = 'MAIN';

        // 1. Activate Skill
        game.useActiveAbility(p1.id, 0);

        // 2. Expect a request for player to select hand cards
        expect(game.selection).toBeDefined();
        expect(game.selection?.action).toBe('PAY_ACTIVE_COST');
        expect(game.selection?.count).toBe(2);

        // 3. Select 2 cards from hand to trash
        game.resolveSelection(p1.id, ['d1', 'd2']);

        // 4. Expect selection cleared and discard updated
        expect(game.selection).toBeNull();
        expect(p1.state.hand.length).toBe(1);
        expect(p1.state.discard.length).toBe(2);
        expect(p1.state.discard).toContainEqual(dummyDiscard1);

        // 5. Expect the effect (BUFF_ALLY +4000) to have applied
        const powerAfter = game.getUnitPower(p1.id, 0);
        expect(powerAfter).toBeGreaterThan((p1Active.power || 0)); // Actually base + 4000
        expect(p1.state.field[0]?.activeUsedThisTurn).toBe(true);
    });
});
