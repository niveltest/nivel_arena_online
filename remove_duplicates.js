const fs = require('fs');

const cardPath = 'server/data/cards.json';
const data = JSON.parse(fs.readFileSync(cardPath, 'utf8'));

const seen = new Set();
const uniqueCards = [];
let duplicateCount = 0;

for (const card of data) {
    if (seen.has(card.id)) {
        console.log(`Duplicate found and removed: ${card.id} (${card.name})`);
        duplicateCount++;
    } else {
        seen.add(card.id);
        uniqueCards.push(card);
    }
}

fs.writeFileSync(cardPath, JSON.stringify(uniqueCards, null, 2), 'utf8');
console.log(`Removed ${duplicateCount} duplicate cards. Total cards now: ${uniqueCards.length}`);
