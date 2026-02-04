
import { Game } from '../Game';
import { CPUPlayer } from '../AIPlayer';
import { Card } from '../../shared/types';

const createMockCard = (id: string, name: string, type: 'UNIT' | 'SKILL', cost: number, effects: any[] = []): Card => ({
    id,
    name,
    type,
    cost,
    power: type === 'UNIT' ? 2000 : 0,
    hitCount: 1,
    text: 'Mock',
    keywords: [],
    effects,
    affiliation: 'MOCK'
});

const mockPlayerState = (id: string, hand: Card[] = []) => ({
    id,
    username: id,
    connected: true,
    state: {
        id,
        hp: 10,
        maxHp: 10,
        leader: { id: `L-${id}`, name: 'Leader', type: 'LEADER', cost: 0, power: 0, hitCount: 1 } as Card,
        leaderLevel: 5,
        hand,
        deck: [],
        discard: [],
        field: [null, null, null],
        damageZone: [],
        skillZone: [],
        resources: 20
    }
});

const runSkillTest = async () => {
    console.log("Starting AI Skill Usage Unit Test...");
    const game = new Game("test-skill", { emit: () => { }, to: () => ({ emit: () => { } }) });
    const cpu = new CPUPlayer(game, "CPU");
    const humanId = "human";

    game.players = {
        [humanId]: { ...mockPlayerState(humanId), socket: { emit: () => { } } } as any,
        [cpu.id]: cpu
    };

    cpu.state.leaderLevel = 10;
    cpu.state.resources = 50;

    const resetFields = () => {
        game.players[humanId].state.field = [null, null, null];
        cpu.state.field = [null, null, null];
        cpu.state.hand = [];
        game.turnPlayerId = cpu.id;
        game.phase = 'MAIN';
    };

    // --- Case 1: Skill Utility (Don't play buff if no units) ---
    console.log("\n--- Case 1: No Units No Buff ---");
    resetFields();
    const buffSkill = createMockCard("s1", "Super Buff", "SKILL", 2, [{ action: "BUFF_ALLY", value: 2000 }]);
    cpu.state.hand = [buffSkill];

    let playCardCalled = false;
    const originalPlay = game.playCard.bind(game);
    game.playCard = (pid: string, idx: number) => {
        playCardCalled = true;
        originalPlay(pid, idx);
    };

    await cpu.think();
    console.log(`PlayCard called (Expected false): ${playCardCalled}`);
    if (playCardCalled) throw new Error("AI played buff skill with no units on field");

    // --- Case 2: Skill Utility (Play buff when unit exists) ---
    console.log("\n--- Case 2: Units Exist Play Buff ---");
    resetFields();
    cpu.state.field[0] = createMockCard("u1", "My Unit", "UNIT", 2);
    cpu.state.hand = [buffSkill];
    playCardCalled = false;

    await cpu.think();
    console.log(`PlayCard called (Expected true): ${playCardCalled}`);
    if (!playCardCalled) throw new Error("AI failed to play buff skill when unit exists");

    // --- Case 3: Prioritize Selection ---
    console.log("\n--- Case 3: Smart Target Selection ---");
    resetFields();
    const boss = createMockCard("boss", "Boss", "UNIT", 5);
    boss.power = 5000;
    const mook = createMockCard("mook", "Mook", "UNIT", 1);
    mook.power = 1000;

    cpu.state.field[0] = mook;
    cpu.state.field[1] = boss;

    // Skill that grants ability (should target boss)
    const grantSkill = createMockCard("s2", "Grant Skill", "SKILL", 2, [{ trigger: 'ON_PLAY', action: "GRANT_ABILITY", grantedKeyword: "PENETRATION", targetType: "SINGLE" }]);
    cpu.state.hand = [grantSkill];

    let selectedUnitId = "";
    game.resolveSelection = (pid: string, ids: string[]) => {
        selectedUnitId = ids[0];
        console.log(`[MockGame] Selection resolved: ${ids.join(',')}`);
    };

    await cpu.think(); // Plays skill -> triggers selection -> AI handles selection

    console.log(`Selected Unit ID (Expected boss): ${selectedUnitId}`);
    if (selectedUnitId !== "boss") throw new Error("AI failed to prioritize boss for buff");

    console.log("\nALL SKILL TESTS PASSED!");
};

runSkillTest().catch(e => {
    console.error("TEST FAILED:", e);
    process.exit(1);
});
