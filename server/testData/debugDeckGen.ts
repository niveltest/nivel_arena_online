
import fs from 'fs';
import path from 'path';

// Load cards directly
const cardsPath = path.join(__dirname, '../data/cards.json');
const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

function debugDeckGen() {
    console.log('=== Debug Deck Generation ===');

    // Helper like Game.ts (NEW STRICT LOGIC)
    const getCompatibleCards = (leader: any, pool: any[]) => {
        return pool.filter(c =>
            c.type !== 'LEADER' &&
            c.attribute === leader.attribute
        );
    };

    const leadersToCheck = [
        { name: 'Red Hood', attribute: '炎' },
        { name: 'Scarlet', attribute: '大地' },
        { name: 'Privaty', attribute: '嵐' },
        { name: 'Dorothy', attribute: '波濤' },
        { name: 'Crown', attribute: '稲妻' }
    ];

    const allCards = cardsData;

    leadersToCheck.forEach(check => {
        // Find leader in data to confirm existence
        const leader = allCards.find((c: any) => c.type === 'LEADER' && c.name === check.name); // Exact match first
        // If not exact, try includes but be careful
        const realLeader = leader || allCards.find((c: any) => c.type === 'LEADER' && c.attribute === check.attribute);

        if (!realLeader) {
            console.error(`Leader NOT FOUND for ${check.attribute}`);
            return;
        }

        console.log(`Testing Leader: ${realLeader.name} (${realLeader.attribute})`);

        const compatible = getCompatibleCards(realLeader, allCards);
        console.log(`Compatible Cards: ${compatible.length}`);

        // Verify counts
        if (compatible.length * 3 < 40) {
            console.error(`FAIL: Not enough cards! (${compatible.length} x 3 = ${compatible.length * 3})`);
        } else {
            console.log(`PASS: Sufficient cards.`);
        }

        // Verify Strictness
        const invalid = compatible.find((c: any) => c.attribute !== realLeader.attribute);
        if (invalid) {
            console.error(`FAIL: Found invalid card ${invalid.name} (${invalid.attribute})`);
        } else {
            console.log(`PASS: Strict attribute check passed.`);
        }
        console.log('---');
    });
}

debugDeckGen();
