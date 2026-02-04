
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const conditions = new Set();
const breakdown = {};

cards.forEach(card => {
    if (card.effects) {
        card.effects.forEach(effect => {
            if (effect.condition) {
                conditions.add(effect.condition);
                if (!breakdown[effect.condition]) {
                    breakdown[effect.condition] = 0;
                }
                breakdown[effect.condition]++;
            }
        });
    }
});

console.log('--- Unique Conditions Found in cards.json ---');
Array.from(conditions).sort().forEach(cond => {
    console.log(`${cond}: ${breakdown[cond]} occurrences`);
});
