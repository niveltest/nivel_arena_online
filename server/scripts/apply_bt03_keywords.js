const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '../data/cards.json');
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
let modified = false;

// 対象: BT03カード
cards = cards.map(c => {
    if (!c.id.startsWith('BT03-')) return c;
    if (!c.effects) c.effects = [];

    let hasChanges = false;

    // 1. [アタッカー]
    if (c.keywords?.includes('アタッカー') || c.text?.includes('[アタッカー]')) {
        if (!c.effects.some(e => e.trigger === 'ON_ATTACK' && e.action === 'BUFF_ALLY' && e.targetType === 'SELF')) {
            c.effects.push({
                trigger: "ON_ATTACK",
                action: "BUFF_ALLY",
                targetType: "SELF",
                value: 4000
            });
            hasChanges = true;
        }
    }

    // 2. [ディフェンダー]
    // ディフェンダーはパッシブバフ (+4000) と相手ターンの強制ブロックロジックを持つ（Game.ts実装済みとする）
    if (c.keywords?.includes('ディフェンダー') || c.text?.includes('[ディフェンダー]')) {
        if (!c.effects.some(e => e.trigger === 'PASSIVE' && e.action === 'BUFF_ALLY' && e.condition === 'OPPONENT_TURN')) {
             c.effects.push({
                 trigger: "PASSIVE",
                 action: "BUFF_ALLY",
                 targetType: "SELF",
                 condition: "OPPONENT_TURN",
                 value: 4000
             });
             hasChanges = true;
        }
    }

    // 3. [貫通] (PENETRATION_*)
    // キーワード側でPENETRATION_1等を処理するため、明示的なEffectは不要の場合が多いが、
    // ここでは念のため設定しない。Game.tsのhasKeyword()で判定される構成のため。

    if (hasChanges) {
        modified = true;
        console.log(`Applied keyword effects to ${c.id}: ${c.name}`);
    }

    return c;
});

if (modified) {
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2), 'utf8');
    console.log('BT03 keyword mapping completed.');
} else {
    console.log('No BT03 keyword mappings needed.');
}
