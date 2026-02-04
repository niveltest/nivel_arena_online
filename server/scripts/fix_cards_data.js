
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
let modified = false;

cards = cards.map(card => {
    // 1. Dorothy (ST04-001) - Fix TargetType and Condition
    if (card.id === 'ST04-001' && card.effects) {
        card.effects.forEach(eff => {
            if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_ALLY' && eff.targetType === 'ALL_ENEMIES') {
                console.log('Fixing Dorothy (ST04-001)...');
                eff.targetType = 'ALL_ALLIES';
                eff.condition = 'OPPONENT_TURN';
                modified = true;
            }
        });
    }

    // 2. Kevlar Vest (ST03-016) - Fix TargetType
    if (card.id === 'ST03-016' && card.effects) {
        card.effects.forEach(eff => {
            if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_ALLY' && eff.targetType === 'ENEMY') {
                console.log('Fixing Kevlar Vest (ST03-016)...');
                eff.targetType = 'SELF';
                modified = true;
            }
        });
    }

    // 3. Crown Naked King (BT02-067) - Fix TargetType
    if (card.id === 'BT02-067' && card.effects) {
        card.effects.forEach(eff => {
            if (eff.trigger === 'ON_ATTACK' && eff.action === 'GRANT_ABILITY' && eff.targetType === 'OPPOSING') {
                console.log('Fixing Crown Naked King (BT02-067)...');
                eff.targetType = 'SELF';
                modified = true;
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
