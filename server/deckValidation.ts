import { Card } from '../shared/types';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateDeck(deck: Card[], leader: Card): ValidationResult {
    const errors: string[] = [];
    const MAX_DECK_SIZE = 40;
    const MAX_COPIES = 3;
    const MAX_TRIGGERS = 8;

    // 1. Deck Size
    if (deck.length !== MAX_DECK_SIZE) {
        errors.push(`Deck must have exactly ${MAX_DECK_SIZE} cards. Current: ${deck.length}`);
    }

    // 2. Attribute Consistency
    // Rules: Cards must match Leader's attribute OR be Neutral (empty or "ニュートラル").
    if (leader.attribute) {
        const invalidAttributeCards = deck.filter(c => {
            if (!c.attribute || c.attribute === "ニュートラル" || c.attribute === "-") return false;
            return c.attribute !== leader.attribute;
        });
        if (invalidAttributeCards.length > 0) {
            const names = [...new Set(invalidAttributeCards.map(c => c.name))].join(', ');
            errors.push(`リーダーの属性 (${leader.attribute}) と異なる属性のカードが含まれています: ${names}`);
        }
    } else {
        // If Leader has no attribute (Neutral Leader?), maybe allow anything?
        // For now, let's warn if leader has no attribute
        // errors.push("Leader has no attribute defined."); 
    }

    // 3. Card Limits (Max 3 copies)
    const cardCounts = new Map<string, number>();
    deck.forEach(c => {
        // Use name or ID for uniqueness? Usually ID refers to specific card entry.
        // Some games allow different IDs with same name (alternate art). 
        // Rule says "same identification number". So ID.
        // However, in our mock, we generate unique IDs (uuid) for instances.
        // We need the "Catalog ID" (e.g., c001, c002).
        // Our types.ts says `id: string`. In Game.ts, we do `...baseCard, id: uuid()`.
        // So we need to store the original ID somewhere or rely on Name. 
        // Let's assume `name` must be unique for the limit, or we need to change Game.ts.
        // For now, checking by NAME is safer given current data structure, or we'd need to change Game.ts.
        // Actually, let's look at `cards.json`, IDs are c001, c002...
        // When we build a deck for validation, it SHOULD come from the Catalog (IDs c001..).
        // If we are validating a running game deck, IDs are UUIDs.
        // The validation usually happens at Deck Construction time (Catalog IDs).
        // So we assume `deck` passed here has Catalog IDs.

        // Use ID for count
        cardCounts.set(c.id, (cardCounts.get(c.id) || 0) + 1);
    });

    cardCounts.forEach((count, id) => {
        if (count > MAX_COPIES) {
            // Find name for error message
            const name = deck.find(c => c.id === id)?.name || id;
            errors.push(`Deck contains more than ${MAX_COPIES} copies of ${name}.`);
        }
    });

    // 4. Trigger Limits (Max 8)
    const triggerCards = deck.filter(c => {
        // Check for ON_DAMAGE_TRIGGER effect
        return c.effects && c.effects.some(e => e.trigger === 'ON_DAMAGE_TRIGGER');
    });

    if (triggerCards.length > MAX_TRIGGERS) {
        errors.push(`Deck contains more than ${MAX_TRIGGERS} Trigger cards. Current: ${triggerCards.length}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
