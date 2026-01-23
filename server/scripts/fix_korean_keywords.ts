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

// Korean to Japanese replacements for keywords
const koreanKeywordReplacements: Record<string, string> = {
    '메인': 'メイン',
    '디펜더': 'ディフェンダー',
    '어택커': 'アタッカー',
    '패시브': 'パッシブ',
    '트리거': 'トリガー',
    '액티브': 'アクティブ',
    '장착조건 없음': '装備条件なし',
};

function fixKoreanInText(text: string): string {
    if (!text) return text;

    let fixed = text;

    // Replace Korean text
    for (const [korean, japanese] of Object.entries(koreanKeywordReplacements)) {
        fixed = fixed.replace(new RegExp(korean, 'g'), japanese);
    }

    return fixed;
}

let modifiedCount = 0;

for (const card of cards) {
    const originalText = card.text;
    const originalAwakenedText = card.awakenedText;

    card.text = fixKoreanInText(card.text);
    if (card.awakenedText) {
        card.awakenedText = fixKoreanInText(card.awakenedText);
    }

    if (originalText !== card.text || originalAwakenedText !== card.awakenedText) {
        modifiedCount++;
        console.log(`Fixed Korean in: ${card.id} - ${card.name}`);
        if (originalText !== card.text) {
            console.log(`  Text: ${originalText.substring(0, 50)}...`);
            console.log(`  ->    ${card.text.substring(0, 50)}...`);
        }
    }
}

// Write back to file
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 4), 'utf-8');

console.log(`\n✅ Korean keyword fix complete! Modified ${modifiedCount} cards.`);
