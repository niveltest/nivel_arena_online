
import { Game } from '../Game';
import { Player } from '../Player';
import { Card } from '../../shared/types';
import cardsData from '../data/cards.json';

const allCards = cardsData as unknown as Card[];

async function runTests() {
    console.log("=== BT03 Advanced Mechanics Test (Direct Execution) ===");

    // Mock Socket
    const mockSocket: any = { id: 'mock', emit: () => {} };

    const game = new Game('TEST_BT03');
    const p1 = new Player({ ...mockSocket, id: 'p1' } as any, 'P1');
    const p2 = new Player({ ...mockSocket, id: 'p2' } as any, 'P2');
    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();
    game.resolveMulligan('p1', []);
    game.resolveMulligan('p2', []);

    console.log("--- Test 1: Legend Flipping ---");
    const legendCard = allCards.find(c => c.id === 'BT03-018');
    p1.state.field[0] = { ...legendCard, id: 'legend1', rarity: 'L' } as Card;
    p1.state.leaderLevel = 4;
    game.handleLevelUpPhase(); // Should level up to 5 and trigger flip
    if ((p1.state.field[0] as any).isAwakened) {
        console.log("[PASS] Flipped at Lv5 via handleLevelUpPhase");
    } else {
        console.error("!!! FAIL: Not flipped at Lv5");
    }

    console.log("--- Test 2: Helm (Hand Diff Damage) ---");
    const helm = allCards.find(c => c.id === 'BT03-060');
    p2.state.hand = Array(8).fill({ id: 'dummy' });
    p2.state.hp = 0;
    const helmEffect = { trigger: 'ON_PLAY', action: 'DAMAGE_BY_HAND_DIFF', value: 5 };
    game.applyEffect('p1', helm as Card, 'ON_PLAY', { slotIndex: 0 }, [helmEffect as any]);
    if (p2.state.hp === 3) {
        console.log(`[PASS] Dealt 3 damage (8-5=3). HP=${p2.state.hp}`);
    } else {
        console.error(`!!! FAIL: Expected 3 damage, got ${p2.state.hp}`);
    }

    console.log("--- Test 3: Leona (Swap Damage Zone) ---");
    const leona = allCards.find(c => c.id === 'BT03-076');
    const dmgUnit = { id: 'dmg1', name: 'DmgCard', type: 'UNIT' } as Card;
    p1.state.damageZone = [dmgUnit];
    p1.state.field[1] = { ...leona, id: 'leona1' } as Card;
    game.applyEffect('p1', p1.state.field[1] as Card, 'ON_PLAY', { slotIndex: 1 });
    if (game.selection?.action === 'SWAP_WITH_DAMAGE_STEP_1') {
        console.log("[PASS] Swap Selection Requested");
        game.resolveSelection('p1', ['dmg1']);
        if (p1.state.hand.some(c => c.id === 'dmg1') && p1.state.damageZone.some(c => c.id === 'leona1')) {
            console.log("[PASS] Swapped successfully");
        } else {
            console.error("!!! FAIL: Swap contents incorrect");
        }
    } else {
        console.error("!!! FAIL: No Swap Selection");
    }

    console.log("--- Test 4: Behemoth (Recycle & Kill) ---");
    const behemoth = allCards.find(c => c.id === 'BT03-079');
    const item1 = { id: 'i1', type: 'ITEM', cost: 3 } as Card;
    const item2 = { id: 'i2', type: 'ITEM', cost: 5 } as Card;
    const enemy1 = { id: 'e1', type: 'UNIT', cost: 4 } as Card;
    p1.state.hand = [item1];
    p1.state.discard = [item2];
    p1.state.deck = Array(5).fill({ id: 'deckcard' });
    p2.state.field[0] = enemy1;
    const behEffect = { trigger: 'ON_PLAY', action: 'RECYCLE_ITEMS_FOR_KILL' };
    game.applyEffect('p1', behemoth as Card, 'ON_PLAY', { slotIndex: 0 }, [behEffect as any]);
    if (game.selection?.action === 'BEHEMOTH_STEP_1') {
        game.resolveSelection('p1', ['i1', 'i2']); // Budget 8
        if (game.selection?.action === 'BEHEMOTH_STEP_2' && game.selection.context?.totalCostRemaining === 8) {
            game.resolveSelection('p1', ['e1']); // Kill E1 (4), remaining 4
            game.resolveSelection('p1', []); // End kill
            if (p2.state.field[0] === null && p1.state.hand.length > 1) { // 1 draw from swap + multiple from behemoth? (test check simplicity)
                 console.log("[PASS] Behemoth flow completed");
            } else {
                console.error("!!! FAIL: Behemoth kill or draw failed");
            }
        }
    }

    console.log("=== ALL BT03 ADVANCED TESTS FINISHED ===");
}

runTests().catch(console.error);
