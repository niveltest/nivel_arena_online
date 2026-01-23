import * as fs from 'fs';
import * as path from 'path';

interface Card {
    id: string;
    name: string;
    text: string;
    awakenedText?: string;
    [key: string]: any;
}

const cardsPath = path.join(__dirname, '../data/cards.json');
const cards: Card[] = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

function fixDoubleBrackets(text: string): string {
    if (!text) return text;

    // Replace 【[keyword]】 with [keyword]
    let fixed = text.replace(/【\[([^\]]+)\]】/g, '[$1]');

    // Replace any remaining 【keyword】 with [keyword]
    fixed = fixed.replace(/【([^】]+)】/g, '[$1]');

    return fixed;
}

let modifiedCount = 0;

for (const card of cards) {
    const originalText = card.text;
    const originalAwakenedText = card.awakenedText;

    card.text = fixDoubleBrackets(card.text);
    if (card.awakenedText) {
        card.awakenedText = fixDoubleBrackets(card.awakenedText);
    }

    if (originalText !== card.text || originalAwakenedText !== card.awakenedText) {
        modifiedCount++;
        console.log(`Fixed: ${card.id} - ${card.name}`);
    }
}

// Write back to file
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 4), 'utf-8');

console.log(`\n✅ Fix complete! Modified ${modifiedCount} cards.`);
