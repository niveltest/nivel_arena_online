const fs = require('fs');
const path = require('path');

const cardPath = 'server/data/cards.json';
const data = JSON.parse(fs.readFileSync(cardPath, 'utf8'));

const typeMap = {
    'ユニット': 'UNIT',
    'スキル': 'SKILL',
    'アイテム': 'ITEM',
    'リーダー': 'LEADER'
};

let count = 0;
const normalized = data.map(card => {
    if (typeMap[card.type]) {
        card.type = typeMap[card.type];
        count++;
    }
    // Also clean up attribute/affiliation if they are "-"
    if (card.attribute === '-') card.attribute = '';
    if (card.affiliation === '-') card.affiliation = '';
    
    return card;
});

fs.writeFileSync(cardPath, JSON.stringify(normalized, null, 2), 'utf8');
console.log(`Normalized ${count} cards.`);
