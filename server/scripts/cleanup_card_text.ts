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

// Korean to Japanese replacements
const koreanReplacements: Record<string, string> = {
    '디펜더를 가진 유닛': 'ディフェンダーを持つユニット',
    '디펜더': 'ディフェンダー',
    '어택커': 'アタッカー',
};

// Keywords to wrap in brackets
const keywords = [
    'ディフェンダー',
    'アタッカー',
    'パッシブ',
    'アクティブ',
    'トリガー',
    'デュエリスト',
    'ペネトレーション',
    '貫通',
    '先制',
    '誓約',
    '覚醒',
];

function cleanupText(text: string): string {
    if (!text) return text;

    let cleaned = text;

    // Replace Korean text
    for (const [korean, japanese] of Object.entries(koreanReplacements)) {
        cleaned = cleaned.replace(new RegExp(korean, 'g'), japanese);
    }

    // Add brackets around keywords (only if not already bracketed)
    for (const keyword of keywords) {
        // Match keyword not already in brackets
        const regex = new RegExp(`(?<!\\[)${keyword}(?!\\])`, 'g');
        cleaned = cleaned.replace(regex, `[${keyword}]`);
    }

    return cleaned;
}

let modifiedCount = 0;

for (const card of cards) {
    const originalText = card.text;
    const originalAwakenedText = card.awakenedText;

    card.text = cleanupText(card.text);
    if (card.awakenedText) {
        card.awakenedText = cleanupText(card.awakenedText);
    }

    if (originalText !== card.text || originalAwakenedText !== card.awakenedText) {
        modifiedCount++;
        console.log(`Modified: ${card.id} - ${card.name}`);
    }
}

// Write back to file
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 4), 'utf-8');

console.log(`\n✅ Cleanup complete! Modified ${modifiedCount} cards.`);
