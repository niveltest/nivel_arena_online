import fs from 'fs';
import path from 'path';
import { CardEffect } from '../../shared/types';

const cardsPath = path.join(__dirname, '../data/cards.json');
const cardsData = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

const bt03Effects: Record<string, CardEffect[]> = {
    "BT03-012": [{ trigger: "ON_PLAY", action: "DRAW", value: 3, condition: "TRASH_HAND_EXCEPT_2" }], // Simplified
    "BT03-013": [{ trigger: "ON_PLAY", action: "DAMAGE_BY_HAND_DIFF", targetType: "SINGLE" }],
    "BT03-014": [{ trigger: "ON_PLAY", action: "GRANT_ABILITY", targetType: "SINGLE", grantedKeyword: "デュエリスト", condition: "COST_LE_4" }],
    "BT03-015": [{ trigger: "ON_PLAY", action: "DEBUFF_ENEMY", targetType: "SINGLE", value: 3000, condition: "TRASH_UNIT_FROM_HAND" }], // Simplified
    "BT03-017": [{ trigger: "ACTIVE", action: "CHANGE_BASE_POWER", targetType: "SINGLE", value: 3000, isSelfTrash: true }],
    "BT03-018": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "ALL_ALLIES", value: 1000, condition: "FIELD_FULL", isAwakening: true }],
    "BT03-019": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 2000, condition: "LEVEL_GE_6" }],
    "BT03-020": [
        { trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 3000, condition: "LEVEL_GE_6_AND_FIELD_FULL" },
        { trigger: "PASSIVE", action: "BUFF_HIT", targetType: "SELF", value: 1, condition: "LEVEL_GE_6_AND_FIELD_FULL" },
        { trigger: "ON_DAMAGE_TRIGGER", action: "KILL_UNIT", targetType: "SINGLE", value: 3 }
    ],
    "BT03-021": [{ trigger: "ON_ENTRY", action: "LEVEL_UP", value: 1, condition: "FIELD_FULL" }],
    "BT03-022": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "ALL_ALLIES", value: 2000, condition: "LEVEL_GE_6_AND_FIELD_FULL_AND_COST_LE_3" }],
    "BT03-023": [{ trigger: "ON_ENTRY", action: "SEARCH_DECK", targetType: "DECK_TOP", value: 2, condition: "COST_LE_4" }],
    "BT03-024": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 1000, condition: "PER_OTHER_HIT_COUNT" }],
    "BT03-025": [
        { trigger: "ON_ENTRY", action: "DRAW", value: 1, condition: "LEVEL_GE_10" },
        { trigger: "ON_ENTRY", action: "LEVEL_UP", value: 1, condition: "LEVEL_LT_10" }
    ],
    "BT03-028": [{ trigger: "PASSIVE", action: "GRANT_ABILITY", targetType: "SELF", grantedKeyword: "突破", condition: "LEVEL_GE_10" }],
    "BT03-029": [{ trigger: "ON_PLAY", action: "BUFF_HIT", targetType: "SINGLE", value: 1, condition: "COST_GE_5" }],
    "BT03-030": [{ trigger: "ON_PLAY", action: "BUFF_HIT", targetType: "ALL_ALLIES", value: 1, condition: "COST_LE_3" }],
    "BT03-031": [{ trigger: "ON_PLAY", action: "KILL_UNIT", targetType: "OPPOSING", condition: "COST_LE_3_AND_HIGH_POWER" }],
    "BT03-032": [
        { trigger: "ON_PLAY", action: "BUFF_ALLY", targetType: "ALL_ALLIES", value: 5000, condition: "COST_LE_3" },
        { trigger: "ON_DAMAGE_TRIGGER", action: "LEVEL_UP", value: 1 }
    ],
    "BT03-033": [{ trigger: "PASSIVE", action: "BUFF_SIZE", targetType: "SELF", value: 1 }],
    "BT03-034": [
        { trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 2500 },
        { trigger: "PASSIVE", action: "BUFF_HIT", targetType: "SELF", value: 1 }
    ],
    "BT03-035": [{ trigger: "ACTIVE", action: "DISCARD", targetType: "OPPONENT_HAND", value: 1, condition: "OPPONENT_HAND_GE_3", isAwakening: true }],
    "BT03-036": [{ trigger: "ON_EXIT", action: "DRAW", value: 1, condition: "PER_EXIT_UNIT" }],
    "BT03-037": [{ trigger: "ON_EXIT", action: "DEBUFF_ENEMY", targetType: "SINGLE", value: 2500, condition: "COUNT_PILGRIM" }],
    "BT03-038": [{ trigger: "ON_EXIT", action: "DISCARD", targetType: "OPPONENT_HAND", value: 1, condition: "OPPONENT_HAND_GE_3" }],
    "BT03-040": [{ trigger: "PASSIVE", action: "DISCARD", targetType: "OPPONENT_HAND", value: 4, condition: "ON_OPPONENT_DRAW" }],
    "BT03-041": [{ trigger: "ON_ENTRY", action: "BUFF_ALLY", targetType: "SELF", value: 2500, condition: "HAND_TRIGGER_SPECIAL" }],
    "BT03-042": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 2500, condition: "OPPONENT_TRASH_GE_1" }],
    "BT03-043": [{ trigger: "ON_ENTRY", action: "GRANT_ABILITY", targetType: "OPPOSING", grantedKeyword: "自壊", condition: "COST_LE_4" }],
    "BT03-044": [
        { trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 3000, condition: "OPPONENT_HAND_LE_2" },
        { trigger: "ON_ENTRY", action: "KILL_UNIT", targetType: "OPPOSING", condition: "OPPONENT_HAND_LE_1" }
    ],
    "BT03-045": [
        { trigger: "ON_ENTRY", action: "GRANT_ABILITY", targetType: "ALL_ALLIES", grantedKeyword: "帰還", condition: "TRASH_ALLY_1" }
    ],
    "BT03-046": [{ trigger: "ON_PLAY", action: "DRAW", value: 1, isSelfTrash: true, condition: "COST_LE_2" }],
    "BT03-047": [{ trigger: "ON_PLAY", action: "BUFF_ALLY", targetType: "ALL_ALLIES", value: 2000, condition: "KEYWORD_Mmissilis" }],
    "BT03-048": [
        { trigger: "ON_PLAY", action: "ADD_FROM_DISCARD", targetType: "DISCARD", value: 1, condition: "COST_GE_4_AND_COST_LE_6" },
        { trigger: "ON_DAMAGE_TRIGGER", action: "DISCARD", targetType: "OPPONENT_HAND", value: 1, condition: "OPPONENT_HAND_GE_3" }
    ],
    "BT03-049": [{ trigger: "ON_PLAY", action: "BUFF_ALLY", targetType: "ALL_ALLIES", value: 5000, condition: "TRASH_ALLY_1" }], // Simplified value
    "BT03-050": [{ trigger: "ON_EXIT", action: "KILL_UNIT", targetType: "SINGLE", condition: "OPPONENT_HAND_LE_3" }],
    "BT03-051": [{ trigger: "ACTIVE", action: "GAIN_EFFECT_OF_ALLY", targetType: "SINGLE", condition: "HAS_ABILITY" }],
    "BT03-052": [
        { trigger: "FLIP_CONDITION", action: "SET_HIT", value: 0, condition: "LEADER_LEVEL_GE" }, // value handled by flip logic
        { trigger: "ACTIVE", action: "RESOLVE_ALLY_ABILITY", targetType: "SINGLE", condition: "TRASH_SKILL_3" }
    ],
    "BT03-053": [
        { trigger: "ON_ENTRY", action: "DRAW", value: 1 },
        { trigger: "ON_ENTRY", action: "DRAW", targetType: "ENEMY", value: 1 }
    ],
    "BT03-054": [{ trigger: "ON_ENTRY", action: "MILL_DECK", targetType: "SELF", value: 1, condition: "TRIGGER_IF_SKILL_ELSE_DRAW" }],
    "BT03-055": [{ trigger: "ON_ENTRY", action: "SEARCH_DECK", targetType: "DECK_TOP", value: 3, condition: "SKILL" }],
    "BT03-056": [{ trigger: "ON_ENTRY", action: "RESTRICT_ATTACK", targetType: "OPPOSING" }],
    "BT03-057": [{ trigger: "ACTIVE", action: "TRIGGER_COMPLEX_DAMAGE", value: 2500 }], // Simplified
    "BT03-058": [{ trigger: "PASSIVE", action: "DRAW", value: 1, condition: "ON_OPPONENT_ATTACK" }],
    "BT03-059": [{ trigger: "ON_ENTRY", action: "RESTRICT_SUMMON", targetType: "OPPONENT", value: 4, condition: "TRASH_HAND_2" }],
    "BT03-061": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 4000, condition: "DEFENDING" }],
    "BT03-062": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 2000, condition: "DEFENDING" }],
    "BT03-063": [{ trigger: "ON_PLAY", action: "RESTRICT_ATTACK", targetType: "SINGLE" }],
    "BT03-064": [{ trigger: "ON_PLAY", action: "BOUNCE_UNIT", targetType: "OPPOSING", condition: "TRASH_HAND_BY_HIT" }],
    "BT03-065": [
        { trigger: "ON_PLAY", action: "DRAW", value: 1, condition: "PER_KEYWORD_UNIT" },
        { trigger: "ON_PLAY", action: "SILENCE_KEYWORD", targetType: "OPPONENT", grantedKeyword: "EFFECT" }
    ],
    "BT03-066": [{ trigger: "ON_PLAY", action: "DRAW", value: 2 }],
    "BT03-067": [{ trigger: "ON_EXIT", action: "RESURRECT", targetType: "SELF", condition: "TRASH_HAND_1" }],
    "BT03-068": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 3000 }],
    "BT03-069": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 2000, condition: "DEFENDING" }],
    "BT03-070": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 2500, condition: "ARMED" }],
    "BT03-071": [{ trigger: "ON_DAMAGE_TRIGGER", action: "DRAW", value: 1 }],
    "BT03-072": [{ trigger: "ON_EXIT", action: "ADD_FROM_DISCARD", targetType: "DISCARD", value: 1, condition: "TYPE_ITEM_AND_COST_2" }],
    "BT03-073": [
        { trigger: "ACTIVE", action: "MILL_DECK", targetType: "SELF", value: 3, condition: "PER_ITEM_MOUNTED" },
        { trigger: "ON_DAMAGE_TRIGGER", action: "DRAW", value: 2, condition: "TRASH_HAND_2" }
    ],
    "BT03-074": [{ trigger: "ON_ENTRY", action: "BUFF_HIT", targetType: "SELF", value: 1, condition: "LEVEL_GE_10_AND_DEFENDING" }],
    "BT03-075": [{ trigger: "ON_ENTRY", action: "KILL_UNIT", targetType: "OPPOSING", condition: "TRASH_ITEMS_3" }],
    "BT03-076": [{ trigger: "PASSIVE", action: "BUFF_ALLY", targetType: "SELF", value: 3000, condition: "LEVEL_GE_6" }],
    "BT03-077": [
        { trigger: "PASSIVE", action: "RESTRICT_ABILITY", condition: "ONLY_MY_ITEMS" },
        { trigger: "ACTIVE", action: "ADD_FROM_DISCARD", targetType: "DISCARD", value: 2, condition: "TYPE_ITEM" }
    ],
    "BT03-078": [{ trigger: "ON_DESTROY", action: "RECYCLE_TO_HAND", targetType: "SELF", condition: "TRASH_ITEM_1" }],
    "BT03-079": [{ trigger: "ON_ENTRY", action: "RECYCLE_ITEMS_FOR_KILL" }],
    "BT03-080": [{ trigger: "ON_ENTRY", action: "RECYCLE", targetType: "SINGLE" }],
    "BT03-081": [
        { trigger: "ON_PLAY", action: "MILL_DECK", targetType: "SELF", value: 5, condition: "SALVAGE_UNIT" },
        { trigger: "ON_DAMAGE_TRIGGER", action: "SEARCH_DECK", targetType: "DECK_TOP", value: 1, condition: "TYPE_ITEM_AND_COST_LE_1" }
    ],
    "BT03-082": [{ trigger: "ON_PLAY", action: "GRANT_ABILITY", targetType: "ALL_ALLIES", condition: "SHARE_ITEM_EFFECT" }],
    "BT03-083": [{ trigger: "PASSIVE", action: "RECYCLE_TO_HAND", targetType: "SELF", condition: "SELF_DESTRUCTION" }],
    "BT03-084": [{ trigger: "ACTIVE", action: "MILL_DECK", targetType: "SELF", value: 3, condition: "BUFF_IF_ITEM_MILLED" }]
};


let updated = 0;
for (const card of cardsData) {
    if (bt03Effects[card.id]) {
        card.effects = bt03Effects[card.id];
        updated++;
    }
}

fs.writeFileSync(cardsPath, JSON.stringify(cardsData, null, 2));
console.log(`Updated ${updated} cards with BT03 effects.`);
