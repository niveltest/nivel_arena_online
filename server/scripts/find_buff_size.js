
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

cards.forEach(card => {
    if (card.effects) {
        card.effects.forEach(effect => {
            if (effect.action === 'BUFF_SIZE') {
                console.log(`Found BUFF_SIZE in card: ${card.name} (${card.id})`);
                console.log(JSON.stringify(effect, null, 2));
                console.log('Card Text:', card.text);
            }
        });
    }
});
