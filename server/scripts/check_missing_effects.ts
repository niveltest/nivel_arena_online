import fs from 'fs';
import path from 'path';

interface Card {
    id: string;
    name: string;
    type: string;
    text: string;
    effects?: any[];
}

const CARDS_PATH = path.join(__dirname, '../data/cards.json');

const main = () => {
    if (!fs.existsSync(CARDS_PATH)) {
        console.error('Cards file not found');
        return;
    }

    const cards: Card[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8'));
    let missingCount = 0;

    console.log('--- Checking for cards with text but no effects ---');

    cards.forEach(card => {
        if (!card.text || card.text.trim() === '') return;
        if (card.type === 'LEADER') return; // Leaders handled differently often

        // Skip vanity/flavor text only cards if any (Game usually has functional text)
        // Assume all non-empty text implies an effect for now unless specified.

        const hasEffects = card.effects && card.effects.length > 0;

        // Keywords usually handled separately, check if text implies active/trigger/passive that is NOT in effects
        const impliesEffect =
            card.text.includes('【起】') ||
            card.text.includes('[メイン]') ||
            card.text.includes('[常時]') ||
            card.text.includes('[登場時]') ||
            card.text.includes('[プレイ時]') ||
            card.text.includes('トリガー');

        if (impliesEffect && !hasEffects) {
            console.log(`[MISSING] ID: ${card.id} | Name: ${card.name}`);
            console.log(`Text: ${card.text}`);
            console.log('---');
            missingCount++;
        }
    });

    console.log(`Total potentially missing effects: ${missingCount}`);
};

main();
