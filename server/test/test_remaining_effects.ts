import { Game } from '../Game';
import { Player } from '../Player';
import { Card } from '../../shared/types';

// Mock Socket
const mockSocket: any = {
    id: 'mock-id',
    emit: (event: string, data: any) => {
        // console.log(`[Socket] Emit ${event}:`, data);
    }
};

async function testRemainingEffects() {
    console.log("=== STARTING REMAINING EFFECTS TEST ===");

    const game = new Game("test-room");
    const p1 = new Player({ ...mockSocket, id: 'p1-id' } as any, "Player1");
    // p2 needed for game.start() usually
    const p2 = new Player({ ...mockSocket, id: 'p2-id' } as any, "Player2");
    game.addPlayer(p1);
    game.addPlayer(p2);
    game.start();

    // Helper to get fresh mock unit
    const getMockUnit = (id: string): Card => ({ id, type: 'UNIT', name: 'Test Unit', cost: 1, power: 1000, keywords: [] } as any);

    // --- TEST 1: LEVEL_UP ---
    console.log("\n--- TEST 1: LEVEL_UP ---");
    p1.state.leaderLevel = 1;
    game.applyEffect(p1.id, getMockUnit('level-up'), 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY', action: 'LEVEL_UP', targetType: 'SELF', value: 1
    });
    if (p1.state.leaderLevel === 2) console.log("OK: Level Up 1 -> 2");
    else console.error(`FAIL: Level Up expected 2, got ${p1.state.leaderLevel}`);

    // --- TEST 2: RECYCLE ---
    console.log("\n--- TEST 2: RECYCLE ---");
    const recycleTarget = { ...getMockUnit('recycle-target') };
    p1.state.discard.push(recycleTarget);
    game.applyEffect(p1.id, getMockUnit('recycler'), 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY', action: 'RECYCLE', targetType: 'DISCARD', value: 1
    });

    // Simulate selection resolution
    if (game.selection && game.selection.action === 'RECYCLE_SELECTION') {
        console.log("OK: Selection Requested");
        game.resolveSelection(p1.id, ['recycle-target']);
        // Check deck bottom (index 0)
        if (p1.state.deck[0] && p1.state.deck[0].id === 'recycle-target') console.log("OK: Recycled to Deck Bottom");
        else console.error("FAIL: Not recycled to deck bottom");
    } else {
        console.error("FAIL: Selection not requested");
    }

    // --- TEST 3: RESTRICT_ATTACK ---
    console.log("\n--- TEST 3: RESTRICT_ATTACK ---");
    p1.state.field[0] = getMockUnit('restrict-unit');
    game.applyEffect(p1.id, p1.state.field[0]!, 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY', action: 'RESTRICT_ATTACK', targetType: 'SELF', value: 1
    });
    if (p1.state.field[0]!.cannotAttack === true) console.log("OK: Unit cannot attack");
    else console.error("FAIL: Unit can still attack");

    // --- TEST 4: PERMANENT RESTRICT ATTACK ---
    console.log("\n--- TEST 4: PERMANENT RESTRICT ATTACK ---");
    p1.state.field[1] = getMockUnit('perm-restrict-unit');
    game.applyEffect(p1.id, p1.state.field[1]!, 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY', action: 'RESTRICT_ATTACK', targetType: 'SELF', value: 0
    });
    const u2 = p1.state.field[1]!;
    if (u2.keywords?.includes('PERMANENT_CANNOT_ATTACK')) console.log("OK: Permanent Keyword added");
    else console.error("FAIL: Permanent Keyword missing");

    if (u2.cannotAttack) console.log("OK: cannotAttack set");

    // Verify persistence logic check
    const hasPerm = u2.keywords?.includes('PERMANENT_CANNOT_ATTACK');
    if (u2.cannotAttack && hasPerm) {
        console.log("OK: Logic preserves cannotAttack due to keyword");
    } else {
        console.error("FAIL: Logic check failed");
    }

    // --- TEST 5: SET_POWER ---
    console.log("\n--- TEST 5: SET_POWER ---");
    // Ensure unit has undefined tempPowerBuff initially or handled
    const setPowerUnit = { ...getMockUnit('set-power-unit'), power: 3000 };
    p1.state.field[2] = setPowerUnit;
    game.applyEffect(p1.id, p1.state.field[2]!, 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY', action: 'SET_POWER', targetType: 'SELF', value: 5000
    });
    // Base 3000, Set 5000 -> Diff +2000
    if (p1.state.field[2]!.tempPowerBuff === 2000) console.log("OK: Power Set correctly (Buff +2000)");
    else console.error(`FAIL: Buff is ${p1.state.field[2]!.tempPowerBuff}`);

    // --- TEST 6: SALVAGE_EQUIPMENT ---
    console.log("\n--- TEST 6: SALVAGE_EQUIPMENT ---");
    const equipped = {
        ...getMockUnit('equipped-unit'),
        attachments: [{ id: 'test-item', type: 'ITEM', name: 'Test Item', cost: 1, keywords: [] } as any],
        effects: [{
            trigger: 'ON_DESTROY' as any,
            action: 'SALVAGE_EQUIPMENT' as any,
            targetType: 'SELF' as any,
            value: 1
        }]
    };
    p1.state.field[0] = equipped; // Overwrite slot 0

    (game as any).destroyUnit(p1.id, 0);

    // Check Hand
    const salvaged = p1.state.hand.find(c => c.id === 'test-item');
    if (salvaged) console.log("OK: Item Salvaged to Hand");
    else console.error("FAIL: Item not in hand");

    // --- TEST 7: POWER_COPY_FRIEND ---
    console.log("\n--- TEST 7: POWER_COPY_FRIEND ---");
    p1.state.field[0] = { ...getMockUnit('copier'), power: 1000 };
    p1.state.field[1] = { ...getMockUnit('guardian'), power: 4000, keywords: ['GUARDIAN'] };

    game.applyEffect(p1.id, p1.state.field[0]!, 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY', action: 'POWER_COPY_FRIEND', targetType: 'SELF'
    });
    // Copier 1000, Guardian 4000. Diff +3000.
    if (p1.state.field[0]!.tempPowerBuff === 3000) console.log("OK: Power Copied (Buff +3000)");
    else console.error(`FAIL: Buff is ${p1.state.field[0]!.tempPowerBuff}`);

    // --- TEST 8: BUFF_HIT ---
    console.log("\n--- TEST 8: BUFF_HIT ---");
    const buffHitUnit = { ...getMockUnit('buff-hit-unit') };
    p1.state.field[0] = buffHitUnit;
    game.applyEffect(p1.id, buffHitUnit, 'ON_PLAY', undefined, {
        trigger: 'ON_PLAY' as any, action: 'BUFF_HIT' as any, targetType: 'SELF' as any, value: 1
    });
    // Check hitCount via getUnitHitCount (private, need cast)
    const hitCount = (game as any).getUnitHitCount(p1.id, 0);
    if (hitCount === 2) console.log("OK: Hit Count Buffered (1 + 1 = 2)");
    else console.error(`FAIL: Hit Count is ${hitCount}`);

    // --- TEST 9: BREAKTHROUGH ---
    console.log("\n--- TEST 9: BREAKTHROUGH ---");
    const breakthroughUnit = { ...getMockUnit('breakthrough-unit'), keywords: ['BREAKTHROUGH'] };
    p1.state.field[0] = breakthroughUnit;
    p2.state.field[0] = getMockUnit('defender-unit');

    // Setup Attack State Manually
    const gameAny = game as any;
    gameAny.phase = 'DEFENSE';
    gameAny.pendingAttack = { attackerId: p1.id, attackerIndex: 0, defenderId: p2.id, targetIndex: 0 };

    // Try to Block
    game.resolveDefense(p2.id, 'BLOCK');

    // Should still be in DEFENSE phase because BLOCK was rejected
    if (game.phase === 'DEFENSE') console.log("OK: Block Rejected (Phase remains DEFENSE)");
    else console.error(`FAIL: Phase changed to ${game.phase}`);

    console.log("=== TEST COMPLETE ===");
}

testRemainingEffects().catch(console.error);
