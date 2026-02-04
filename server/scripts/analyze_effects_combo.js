
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const combinations = new Set();
const breakdown = {};

cards.forEach(card => {
    if (card.effects) {
        card.effects.forEach(effect => {
            const key = `[ACT:${effect.action}] [TGT:${effect.targetType || 'N/A'}] [CND:${effect.condition || 'N/A'}]`;
            combinations.add(key);
            if (!breakdown[key]) {
                breakdown[key] = [];
            }
            breakdown[key].push(card.name);
        });
    }
});


const output = [];
output.push('--- Unique Effect Combinations ---');
const sortedCombos = Array.from(combinations).sort();
sortedCombos.forEach(combo => {
    output.push(`${combo} (Count: ${breakdown[combo].length})`);
    if (breakdown[combo].length < 3) {
        output.push(`  Sample: ${breakdown[combo].join(', ')}`);
    }
});

fs.writeFileSync(path.join(__dirname, 'combo_output.txt'), output.join('\n'), 'utf8');
console.log('Output written to combo_output.txt');
