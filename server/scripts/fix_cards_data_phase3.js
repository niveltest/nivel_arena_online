
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
let modified = false;

cards = cards.map(card => {
    // Crown Naked King (BT02-067)
    // Add condition: OPPOSING_HIT_LE_ARMED_COUNT
    if (card.id === 'BT02-067' && card.effects) {
        card.effects.forEach(eff => {
            if (eff.trigger === 'ON_ATTACK' && eff.grantedKeyword?.includes('BREAKTHROUGH')) {
                if (eff.condition !== 'OPPOSING_HIT_LE_ARMED_COUNT') {
                    console.log('Fixing Crown Naked King (BT02-067) Condition...');
                    eff.condition = 'OPPOSING_HIT_LE_ARMED_COUNT';
                    modified = true;
                }
            }
        });
    }

    return card;
});

if (modified) {
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), 'utf8');
    console.log('cards.json updated successfully.');
} else {
    console.log('No changes needed.');
}
