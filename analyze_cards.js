const fs = require('fs');

const cards = JSON.parse(fs.readFileSync('server/data/cards.json', 'utf8'));

const withoutEffects = cards.filter(c => !c.effects || c.effects.length === 0);

console.log('=== Cards without effects ===');
console.log(`Total: ${withoutEffects.length}\n`);

withoutEffects.forEach(c => {
    console.log(`${c.id} - ${c.name} (${c.type})`);
    console.log(`Text: ${c.text}`);
    console.log('---');
});
