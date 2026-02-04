
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const targets = ['ARMED_PER_ITEM', 'PER_LEADER_LEVEL', 'SELECTED_TARGET', 'TURN_END'];

cards.forEach(card => {
    if (card.effects) {
        card.effects.forEach(effect => {
            if (targets.includes(effect.condition)) {
                console.log(`Found ${effect.condition} in card: ${card.name} (${card.id})`);
                console.log(JSON.stringify(effect, null, 2));
            }
        });
    }
});
