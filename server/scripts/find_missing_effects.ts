import fs from 'fs';
import path from 'path';

// Minimal types
interface Card {
    id: string;
    name: string;
    type: string;
    text: string;
    effects?: any[];
    keywords?: string[];
}

const CARDS_PATH = path.join(__dirname, '../data/cards.json');

const main = () => {
    if (!fs.existsSync(CARDS_PATH)) {
        console.error('Cards file not found');
        return;
    }

    const cards: Card[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8'));
    const missing: Card[] = [];

    cards.forEach(card => {
        if (!card.text || card.text === '-') return;

        // If effects are empty
        if (!card.effects || card.effects.length === 0) {
            // Include only if NO keywords
            if (!card.keywords || card.keywords.length === 0) {
                // Check if text is just empty or simple
                if (card.text.length > 5) {
                    missing.push(card);
                }
            }
        }
    });

    console.log(`Found ${missing.length} cards with potentially missing effects:\n`);
    missing.forEach(c => {
        console.log(`[${c.id}] ${c.name} (${c.type})`);
        console.log(`Text: ${c.text}`);
        console.log('---');
    });
};

main();
