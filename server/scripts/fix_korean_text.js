const fs = require('fs');
const PATH = 'server/data/cards.json';
const cards = JSON.parse(fs.readFileSync(PATH, 'utf8'));

// Korean to Japanese mapping
const KR_TO_JP = {
    '[액티브': '[アクティブ',
    '액티브]': 'アクティブ]',
    '[패시브': '[パッシブ',
    '패시브]': 'パッシブ]',
    '[엔트리': '[エントリー',
    '엔트리]': 'エントリー]',
    '[어태커': '[アタッカー',
    '어태커]': 'アタッカー]',
    '[디펜더': '[ディフェンダー',
    '디펜더]': 'ディフェンダー]',
    '[가디언': '[ガーディアン',
    '가디언]': 'ガーディアン]',
    '[이그지트': '[エグジット',
    '이그지트]': 'エグジット]',
    '[아암드': '[アームド',
    '아암드]': 'アームド]',
    '[레벨링크': '[レベルリンク',
    '레벨링크]': 'レベルリンク]',
    '[전선유지': '[戦線維持',
    '전선유지]': '戦線維持]'
};

let fixedCount = 0;

cards.forEach(card => {
    if (card.text) {
        let originalText = card.text;
        Object.entries(KR_TO_JP).forEach(([kr, jp]) => {
            // Escape special regex characters
            const escapedKr = kr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            card.text = card.text.replace(new RegExp(escapedKr, 'g'), jp);
        });
        if (originalText !== card.text) {
            fixedCount++;
            console.log(`Fixed: ${card.id} - ${card.name}`);
        }
    }
});

fs.writeFileSync(PATH, JSON.stringify(cards, null, 4));
console.log(`\nTotal cards fixed: ${fixedCount}`);
