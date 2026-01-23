const fs = require('fs');
const cards = require('./data/cards.json');

const KEYWORDS = [
    'エントリー', 'アタッカー', 'ディフェンダー', 'エグジット',
    'パッシブ', 'アクティブ', 'ガーディアン', 'アームド',
    'レベルリンク', '戦線維持'
];

let updateCount = 0;

cards.forEach(card => {
    if (!card.keywords) card.keywords = [];

    const beforeCount = card.keywords.length;

    // テキストからキーワードを検出
    KEYWORDS.forEach(keyword => {
        if (card.text && card.text.includes(`【${keyword}】`)) {
            if (!card.keywords.includes(keyword)) {
                card.keywords.push(keyword);
            }
        }
    });

    if (card.keywords.length > beforeCount) {
        updateCount++;
        console.log(`Updated ${card.id} (${card.name}): added ${card.keywords.length - beforeCount} keywords`);
    }
});

fs.writeFileSync('./data/cards.json', JSON.stringify(cards, null, 4), 'utf-8');
console.log(`\nKeywords補完完了: ${updateCount}枚のカードを更新`);
