const fs = require('fs');

const cards = JSON.parse(fs.readFileSync('server/data/cards.json', 'utf8'));

// Priority: Starter deck cards, low cost (1-3), or high rarity
const priority = cards.filter(c =>
    (c.cost <= 3 || c.rarity === 'SR' || c.rarity === 'SSR' || c.id.startsWith('ST'))
    && (!c.effects || c.effects.length === 0)
);

console.log('=== Priority cards without effects ===');
console.log(`Total: ${priority.length}\n`);

priority.forEach(c => {
    console.log(`${c.id} - ${c.name} (${c.type}) Cost: ${c.cost} Rarity: ${c.rarity}`);
    console.log(`Text: ${c.text}`);
    console.log(`Keywords: ${JSON.stringify(c.keywords)}`);
    console.log('---');
});

// Also check cards with text but no parsed effects
const hasTextNoEffect = cards.filter(c =>
    (c.cost <= 3 || c.rarity === 'SR' || c.rarity === 'SSR')
    && c.text !== '-'
    && c.text.length > 10
    && (!c.effects || c.effects.length === 0)
);

console.log('\n\n=== Priority cards with text but no parsed effects ===');
console.log(`Total: ${hasTextNoEffect.length}\n`);

hasTextNoEffect.forEach(c => {
    console.log(`${c.id} - ${c.name} (${c.type}) Cost: ${c.cost}`);
    console.log(`Text: ${c.text.substring(0, 150)}...`);
    console.log('---');
});
