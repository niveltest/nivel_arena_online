
import * as fs from 'fs';
import * as path from 'path';

interface CardEffect {
    trigger: string;
    action: string;
    value?: number;
    targetType?: string;
    condition?: string;
    drawOnKill?: number;
    grantedKeyword?: string;
    isAwakening?: boolean;
    isSelfTrash?: boolean;
}

interface Card {
    id: string;
    name: string;
    type: string;
    text: string;
    power?: number;
    hit?: number;
    cost?: number;
    level?: number;
    awakeningLevel?: number; // 指定されたリーダーレベルで発動可能
    awakenedText?: string; // 覚醒テキスト
    keywords?: string[];
    effects?: CardEffect[];
    tempKeywords?: string[];
    defenderBonus?: number;
    isSelfDestruct?: boolean;
    equipCondition?: string;
    isRecycle?: boolean;
}

const CARDS_PATH = path.join(__dirname, '../data/cards.json');

const main = () => {
    const cards: Card[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8'));
    let updatedCount = 0;

    cards.forEach(card => {
        const text = card.text || "";
        const entryMatch = text.match(/\[エントリ\]\s*\/\s*(.+?)(?:\n|$)/) || text.match(/エントリー\s*(.+?)(?:\n|$)/);
        const exitMatch = text.match(/\[エグジット\]\s*\/\s*(.+?)(?:\n|$)/) || text.match(/エグジット\s*(.+?)(?:\n|$)/);
        const triggerMatch = text.match(/\[トリガー\]\s*\/\s*(.+?)(?:\n|$)/);
        const passiveMatch = text.match(/\[パッシブ\]\s*\/\s*(.+?)(?:\n|$)/);
        const activeMatch = text.match(/\[アクティブ\]\s*\/\s*(.+?)(?:\n|$)/) || text.match(/\[起動\]\s*\/\s*(.+?)(?:\n|$)/);
        const attackerMatch = text.match(/\[アタッカー\]\s*\/\s*(.+?)(?:\n|$)/);

        const isEntry = !!entryMatch || text.includes('エントリー') || text.includes('[エントリ]');
        const isExit = !!exitMatch || text.includes('エグジット') || text.includes('[エグジット]');
        const isTrigger = !!triggerMatch || text.includes('トリガー');
        const isPassive = !!passiveMatch || text.includes('パッシブ');
        const isActive = !!activeMatch || text.includes('アクティブ') || text.includes('起動');
        const isAttacker = !!attackerMatch || text.includes('アタッカー');

        // Detect Awakening
        const awakeningLvMatch = text.match(/覚醒LV(\d+)/);
        const levelMatch = text.match(/リーダーレベルが(\d+)以上/);
        const awakeningLevel = awakeningLvMatch ? parseInt(awakeningLvMatch[1], 10) : (levelMatch ? parseInt(levelMatch[1], 10) : undefined);

        const awakenedSectionMatch = text.match(/\[覚醒\]面\n*(.+)/s) || text.match(/覚醒LV\d+\n*(.+)/s);
        let baseText = text;
        if (awakenedSectionMatch) {
            baseText = text.replace(awakenedSectionMatch[0], '');
        }

        if (awakeningLevel) {
            card.awakeningLevel = awakeningLevel;
            if (awakenedSectionMatch) {
                card.awakenedText = awakenedSectionMatch[1].trim();
            }
        }

        const newEffects: CardEffect[] = [];

        const parseAction = (subText: string, defaultTrigger: string, isAwakening: boolean = false): CardEffect[] => {
            if (!subText) return [];
            const sentences = subText.split(/[。！!]/).filter(s => s.trim().length > 0);
            const effects: CardEffect[] = [];

            const detectTarget = (s: string, def: string = 'SELF') => {
                if (s.includes('相手') && s.includes('全て')) return 'ALL_ENEMIES';
                if (s.includes('味方') && s.includes('全て')) return 'ALL_ALLIES';
                if (s.includes('フィールドにある') && (s.includes('ユニット全て') || s.includes('全てのユニット'))) {
                    return s.includes('相手') ? 'ALL_ENEMIES' : 'ALL_ALLIES';
                }
                if (s.includes('選んだ') || s.includes('選び') || s.includes('選ぶ')) return 'SINGLE';
                if (s.includes('対向')) return 'OPPOSING';
                return def;
            };

            sentences.forEach(sentence => {
                const addEffect = (effect: Partial<CardEffect>) => {
                    effects.push({
                        trigger: defaultTrigger,
                        isAwakening,
                        isSelfTrash: sentence.includes('このカードをトラッシュする'),
                        ...effect
                    } as CardEffect);
                };

                // Detect Condition (e.g., "If opponent has 3+ cards in hand")
                let condition = undefined;
                const handLeMatch = sentence.match(/相手の手札が(\d+)枚以上ある場合/);
                if (handLeMatch) condition = `OPPONENT_HAND_GE_${handLeMatch[1]}`;

                const myHandLeMatch = sentence.match(/自分の手札が(\d+)枚以下の場合/);
                if (myHandLeMatch) condition = `MY_HAND_LE_${myHandLeMatch[1]}`;

                // 1. Power Buff/Debuff
                const powerPlus = sentence.match(/パワー\+(\d+)/);
                const powerMinus = sentence.match(/パワー-(\d+)/);
                if (powerPlus) {
                    addEffect({
                        action: 'BUFF_ALLY',
                        value: parseInt(powerPlus[1], 10),
                        targetType: detectTarget(sentence, (sentence.includes('味方') || sentence.includes('自分')) ? 'ALL_ALLIES' : 'SELF'),
                        condition: sentence.includes('自分のターン') ? 'MY_TURN' : condition
                    });
                } else if (powerMinus) {
                    const drawOnKillMatch = sentence.match(/この効果でそのユニットをトラッシュしたなら、?(\d+)枚/);
                    addEffect({
                        action: 'DEBUFF_ENEMY',
                        value: parseInt(powerMinus[1], 10),
                        targetType: detectTarget(sentence, 'SINGLE'),
                        drawOnKill: drawOnKillMatch ? parseInt(drawOnKillMatch[1], 10) : undefined,
                        condition: condition
                    });
                }

                // 1.5 Set Power (Fixed value)
                const powerSet = sentence.match(/パワー[はを].*?(\d+)になる/) || sentence.match(/パワーを(\d+)にする/);
                if (powerSet) {
                    addEffect({
                        action: 'SET_POWER',
                        value: parseInt(powerSet[1], 10),
                        targetType: detectTarget(sentence, 'SELF'),
                        condition: condition
                    });
                }

                // 2. Hit Buff
                const hitPlus = sentence.match(/ヒット\+(\d+)/);
                if (hitPlus) {
                    const isTemp = sentence.includes('このターンが終わるまで') || sentence.includes('ターン中');
                    addEffect({
                        action: isTemp && defaultTrigger !== 'PASSIVE' ? 'BUFF_HIT' : 'SET_HIT',
                        value: parseInt(hitPlus[1], 10),
                        targetType: detectTarget(sentence),
                        condition: condition
                    });
                }

                // 3. Draw
                const drawMatch = sentence.match(/(\d+)枚ドロー/) || sentence.match(/(\d+)枚引く/);
                if (drawMatch || sentence.includes('1枚引く')) {
                    addEffect({
                        action: 'DRAW',
                        value: drawMatch ? parseInt(drawMatch[1], 10) : 1,
                        condition: condition
                    });
                }

                // 4. Kill Unit vs Discard Hand
                if (sentence.includes('トラッシュする') || sentence.includes('破壊する')) {
                    const isHand = sentence.includes('手札');
                    const isField = sentence.includes('相手のユニット') || sentence.includes('フィールド');
                    const target = detectTarget(sentence, isHand ? 'SELF_HAND' : 'SINGLE');

                    if (isHand) {
                        const discardValueMatch = sentence.match(/手札を(\d+)枚/);
                        addEffect({
                            action: 'DISCARD',
                            targetType: sentence.includes('相手') ? 'OPPONENT_HAND' : 'SELF_HAND',
                            value: discardValueMatch ? parseInt(discardValueMatch[1], 10) : 1,
                            condition: condition
                        });
                    } else if (isField || sentence.includes('相手は')) {
                        const killCostMatch = sentence.match(/コスト(\d+)以下の相手のユニット/);
                        addEffect({
                            action: 'KILL_UNIT',
                            targetType: target,
                            condition: killCostMatch ? `COST_LE_${killCostMatch[1]}` : condition
                        });
                    }
                }

                // 5. Bounce Unit
                if (sentence.includes('手札に戻す')) {
                    const lowestCost = sentence.includes('最もコストの高い') ? 'HIGHEST_COST' : (sentence.includes('最もコストの低い') ? 'LOWEST_COST' : undefined);
                    addEffect({
                        action: 'BOUNCE_UNIT',
                        targetType: detectTarget(sentence, 'SINGLE'),
                        condition: lowestCost || condition
                    });
                }

                // 6. Search Deck
                if (sentence.includes('デッキ') && sentence.includes('手札に加える')) {
                    const isTop = sentence.includes('上から');
                    const countMatch = sentence.match(/上から(\d+)枚/);
                    let searchCond = undefined;
                    if (sentence.includes('ベース')) searchCond = 'AFFILIATION_BASE';
                    if (sentence.includes('ユニット')) searchCond = 'TYPE_UNIT';
                    const costMatch = sentence.match(/コスト(\d+)以下/);
                    if (costMatch) searchCond = `COST_LE_${costMatch[1]}`;

                    addEffect({
                        action: 'SEARCH_DECK',
                        targetType: isTop ? 'DECK_TOP' : 'DECK_ALL',
                        value: countMatch ? parseInt(countMatch[1], 10) : 1,
                        condition: searchCond
                    });
                }

                // 7. Add from Discard (Salvage)
                if (sentence.includes('トラッシュ') && sentence.includes('手札に加える') && !sentence.includes('デッキ')) {
                    let salvageCond = undefined;
                    if (sentence.includes('エグジット')) salvageCond = 'HAS_EXIT';
                    const costMatch = sentence.match(/コスト(\d+)以下/);
                    if (costMatch) salvageCond = (salvageCond ? salvageCond + '_' : '') + `COST_LE_${costMatch[1]}`;

                    addEffect({
                        action: 'ADD_FROM_DISCARD',
                        targetType: 'DISCARD',
                        value: 1,
                        condition: salvageCond
                    });
                }

                // 8. Grant Ability
                if (sentence.includes('を得る')) {
                    const keywords: string[] = [];
                    if (sentence.includes('[アタッカー]')) keywords.push('アタッカー');
                    if (sentence.includes('突破')) keywords.push('BREAKTHROUGH');
                    if (sentence.includes('貫通')) keywords.push('PENETRATION');

                    if (keywords.length > 0) {
                        addEffect({
                            action: 'GRANT_ABILITY',
                            grantedKeyword: keywords.join(','),
                            targetType: detectTarget(sentence, 'ALL_ALLIES'),
                            condition: sentence.includes('このターンが終わるまで') ? 'TURN_END' : condition
                        });
                    }
                }

                // 9. Level Up
                const levelUpMatch = sentence.match(/リーダーレベル\+(\d+)/);
                if (levelUpMatch) {
                    addEffect({
                        action: 'LEVEL_UP',
                        value: parseInt(levelUpMatch[1], 10),
                        condition: condition
                    });
                }

                // 10. Custom/Complex cases
                if (sentence.includes('ダメージゾーンから') && sentence.includes('手札を1枚選んでダメージゾーンに置く')) {
                    addEffect({ action: 'SWAP_DAMAGE_HAND', targetType: 'DAMAGE_ITEM', value: 1 });
                }
                if (sentence.includes('コストより低いコストを持つ')) {
                    addEffect({ action: 'COST_BASED_KILL', targetType: 'HAND_UNIT', value: 1 });
                }
                if (sentence.includes('装備しているアイテムを1枚選んで持ち主の手札に戻す')) {
                    addEffect({ action: 'SALVAGE_EQUIPMENT', targetType: 'SELF', value: 1 });
                }
                if (sentence.includes('パワーが ガーディアン を持つユニットの今のパワー分上がる')) {
                    addEffect({ action: 'POWER_COPY_FRIEND', value: 1 });
                }
            });

            return effects;
        };

        if (isEntry) newEffects.push(...parseAction(entryMatch ? entryMatch[1] : baseText, 'ON_PLAY'));
        if (isExit) newEffects.push(...parseAction(exitMatch ? exitMatch[1] : baseText, 'ON_EXIT'));
        if (isPassive) newEffects.push(...parseAction(passiveMatch ? passiveMatch[1] : baseText, 'PASSIVE'));
        if (isActive) newEffects.push(...parseAction(activeMatch ? activeMatch[1] : baseText, 'ACTIVE'));
        if (isAttacker) newEffects.push(...parseAction(attackerMatch ? attackerMatch[1] : baseText, 'ON_ATTACK'));

        // Handle Awakening Text
        if (card.awakenedText) {
            newEffects.push(...parseAction(card.awakenedText, 'PASSIVE', true));
        }

        // Handle Trigger
        if (isTrigger && triggerMatch) {
            const triggerText = triggerMatch[1];
            const hasSelfTrash = triggerText.includes('このカードをトラッシュする');
            const actionText = triggerText.replace(/このカードをトラッシュする。?/, '');

            if (actionText.trim().length > 0 && !actionText.includes('手札に加える')) {
                const parsedEffects = parseAction(actionText, 'ON_DAMAGE_TRIGGER');
                parsedEffects.forEach(eff => { if (hasSelfTrash) eff.isSelfTrash = true; });
                newEffects.push(...parsedEffects);
            } else if (triggerText.includes('手札に加える')) {
                newEffects.push({ trigger: 'ON_DAMAGE_TRIGGER', isAwakening: false, isSelfTrash: hasSelfTrash, action: 'ADD_FROM_DISCARD', targetType: 'SELF' } as CardEffect);
            }
        }


        // Handle Trigger
        if (isTrigger && triggerMatch) {
            const triggerText = triggerMatch[1];
            const hasSelfTrash = triggerText.includes('このカードをトラッシュする');
            // If the trigger has specific actions other than just adding back to hand, parse them.
            // But exclude the most common "this card to discard" cost text from action parsing.
            const actionText = triggerText.replace(/このカードをトラッシュする。?/, '');

            if (actionText.trim().length > 0 && !actionText.includes('手札に加える')) {
                const parsedEffects = parseAction(actionText, 'ON_DAMAGE_TRIGGER');
                parsedEffects.forEach(eff => { if (hasSelfTrash) eff.isSelfTrash = true; });
                newEffects.push(...parsedEffects);
            } else if (triggerText.includes('手札に加える')) {
                newEffects.push({ trigger: 'ON_DAMAGE_TRIGGER', isAwakening: false, isSelfTrash: hasSelfTrash, action: 'ADD_FROM_DISCARD', targetType: 'SELF' } as CardEffect);
            }
        }

        // Keywords Extraction
        const keywordSet = new Set<string>();
        if (card.keywords) card.keywords.forEach(k => { if (k !== '-') keywordSet.add(k); });

        const penetrationMatch = text.match(/貫通\s*\[(\d+)\]/);
        if (penetrationMatch) {
            keywordSet.add(`PENETRATION_${penetrationMatch[1]}`);
        } else if (text.includes('貫通')) {
            keywordSet.add('PENETRATION_1');
        }

        if (text.includes('突破')) keywordSet.add('BREAKTHROUGH');
        if (text.includes('アタッカー')) keywordSet.add('アタッカー');
        if (text.includes('ガーディアン')) keywordSet.add('GUARDIAN');
        if (text.includes('デュエリスト')) keywordSet.add('DUELIST');
        const infiltrateMatch = text.match(/潜入\s*\[(\d+)\]/);
        if (infiltrateMatch) {
            keywordSet.add(`INFILTRATE_${infiltrateMatch[1]}`);
        } else if (text.includes('潜入') || text.includes('潜伏')) {
            keywordSet.add('INFILTRATE_1');
        }
        if (text.includes('道連れ')) keywordSet.add('DEATH_TOUCH');
        if (text.includes('アームド')) keywordSet.add('ARMED');
        if (text.includes('ディフェンダー')) {
            keywordSet.add('DEFENDER');
            const defBonusMatch = text.match(/\[ディフェンダー\].*パワー\+(\d+)/);
            if (defBonusMatch) {
                card.defenderBonus = parseInt(defBonusMatch[1], 10);
            }
            if (text.includes('自壊')) {
                card.isSelfDestruct = true;
            }
        }

        const equipMatch = text.match(/\[装備条件:\s*\[?(.+?)\]?を持つユニット\]/) || text.match(/\[装備条件:\s*(.+?)\]/);
        if (equipMatch) {
            const condition = equipMatch[1];
            if (condition !== 'なし') {
                card.equipCondition = condition;
            }
        }

        if (text.includes('帰還')) {
            card.isRecycle = true;
            keywordSet.add('RECYCLE');
        }

        const lootMatch = text.match(/略奪\s*\[(\d+)\]/);
        if (lootMatch) {
            keywordSet.add(`LOOT_${lootMatch[1]}`);
        } else {
            const lootTextMatch = text.match(/略奪\s*(\d+)枚/);
            if (lootTextMatch) {
                keywordSet.add(`LOOT_${lootTextMatch[1]}`);
            } else if (text.includes('略奪')) {
                keywordSet.add('LOOT_1');
            }
        }

        if (keywordSet.size > 0) {
            card.keywords = Array.from(keywordSet);
        }

        if (newEffects.length > 0) {
            card.effects = newEffects;
            updatedCount++;
        }
    });

    fs.writeFileSync(CARDS_PATH, JSON.stringify(cards, null, 4));
    console.log(`Updated cards.`);
};

main();
