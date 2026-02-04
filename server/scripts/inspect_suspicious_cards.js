
const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const targets = ['ドロシー', 'ケブラーベスト', 'クラウン‐ネイキッドキング'];


const output = [];
cards.forEach(card => {
    if (targets.some(t => card.name.includes(t))) {
        output.push(`--- ${card.name} (${card.id}) ---`);
        output.push(`Text: ${card.text}`);
        output.push(`Effects: ${JSON.stringify(card.effects, null, 2)}`);
    }
});
// Add Maxwell inspection
const additional = ['マクスウェル', 'センチ', 'ソーダ'];
cards.forEach(card => {
    if (additional.some(t => card.name.includes(t))) {
        output.push(`--- ${card.name} (${card.id}) ---`);
        output.push(`Effects: ${JSON.stringify(card.effects, null, 2)}`);
    }
});

fs.writeFileSync(path.join(__dirname, 'inspection_output.txt'), output.join('\n'), 'utf8');
console.log('Output written to inspection_output.txt');
