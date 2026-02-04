
import { Player } from './Player';
import { Game } from './Game';
import { Card, CardEffect } from '../shared/types';
import { Socket } from 'socket.io';

// Mock Socket for CPU
class MockSocket {
    id: string;
    constructor() {
        this.id = 'CPU_' + Math.random().toString(36).substring(7);
    }
    join(room: string) { }
    emit(event: string, ...args: any[]) {
        // console.log(`[CPU Mock Socket] emitted ${event}`);
    }
    on(event: string, fn: Function) { }
}

export type AIPersonality = 'AGGRO' | 'CONTROL' | 'BALANCED';

export class CPUPlayer extends Player {
    private game: Game;

    constructor(game: Game, username: string, deckData?: { deckIdList: string[], leaderId: string }, personality: AIPersonality = 'BALANCED') {
        super(new MockSocket() as any as Socket, username, deckData);
        this.game = game;
        this.isCPU = true;
        this.personality = personality;
    }
    private personality: AIPersonality;

    public async think() {
        if (this.game.turnPlayerId !== this.id &&
            this.game.phase !== 'MULLIGAN' &&
            this.game.phase !== 'DEFENSE' &&
            this.game.phase !== 'GUARDIAN_INTERCEPT' &&
            !this.isSelecting()) return;

        // Add a small delay to simulate human "thinking"
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Re-check ownership AFTER delay to prevent "carrying over" actions into human turns
        if (this.game.turnPlayerId !== this.id &&
            this.game.phase !== 'MULLIGAN' &&
            this.game.phase !== 'DEFENSE' &&
            this.game.phase !== 'GUARDIAN_INTERCEPT' &&
            !this.isSelecting()) return;

        try {
            switch (this.game.phase) {
                case 'MULLIGAN':
                    this.handleMulligan();
                    break;
                case 'LEVEL_UP':
                    if (this.game.turnPlayerId === this.id) this.game.nextPhase();
                    break;
                case 'DRAW':
                    if (this.game.turnPlayerId === this.id) this.game.nextPhase();
                    break;
                case 'MAIN':
                    this.handleMainPhase();
                    break;
                case 'ATTACK':
                    this.handleAttackPhase();
                    break;
                case 'GUARDIAN_INTERCEPT':
                    this.handleGuardianIntercept();
                    break;
                case 'DEFENSE':
                    this.handleDefensePhase();
                    break;
                case 'SELECT_CARD':
                    this.handleSelection();
                    break;
                case 'END':
                    if (this.game.turnPlayerId === this.id) this.game.nextPhase();
                    break;
            }
        } catch (e) {
            console.error("[AI ERROR]", e);
        }
    }

    private getSizeLimit(): number {
        const damage = this.state.damageZone.length;
        let limit = this.state.leaderLevel + damage;

        // Apply Leader Passive Size Buffs
        const leader = this.state.leader;
        if (leader.effects) {
            const isAwakened = this.state.leaderLevel >= (leader.awakeningLevel || 6);
            leader.effects.forEach(eff => {
                if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_SIZE') {
                    if (!eff.isAwakening || (eff.isAwakening && isAwakened)) {
                        limit += (eff.value as number || 0);
                    }
                }
            });
        }
        return limit;
    }

    private getCurrentFieldSize(): number {
        const fieldSize = this.state.field.reduce((sum, c) => {
            if (!c) return sum;
            let unitTotal = c.cost;
            if (c.attachments) {
                unitTotal += c.attachments.reduce((aSum, a) => aSum + a.cost, 0);
            }
            return sum + unitTotal;
        }, 0);
        const skillSize = this.state.skillZone.reduce((sum, s) => sum + s.cost, 0);
        return fieldSize + skillSize;
    }

    private isSelecting() {
        return this.game.selection?.playerId === this.id;
    }

    private handleMulligan() {
        if (this.state.mulliganDone) return;

        // AI Mulligan Logic:
        // Goal: Ensure at least one 1-2 cost UNIT to play early.
        // 1. Identify low cost units (cost <= 2)
        const lowCostUnits = this.state.hand.filter(c => c.type === 'UNIT' && (c.cost || 0) <= 2);

        // 2. If we have good curve, keep them. Discard high cost (>4) or situational items.
        // If we have NO low cost units, discard everything to fish for them.

        let discardIds: string[] = [];

        if (lowCostUnits.length === 0) {
            // Panic: Full Mulligan (except maybe a key card if we had one implemented)
            discardIds = this.state.hand.map(c => c.id);
        } else {
            // We have playables. Discard high cost cards to smooth curve.
            discardIds = this.state.hand
                .filter(c => (c.cost || 0) > 4 || (c.type === 'ITEM' && (c.cost || 0) > 2))
                .map(c => c.id);
        }

        // Limit to 3 (or max allowed mulligan count if different)
        // Usually Mulligan allows selecting any number, but usually restricted or "select and redraw". 
        // Game.resolveMulligan takes selectedIds.

        // Update: Use resolveSelection to ensure selection state is cleared
        this.game.resolveSelection(this.id, discardIds as string[]);
    }

    private handleMainPhase() {
        // AI: Play cards if possible
        let acted = false;

        // 1. Level up and Active Abilities (already handled or automatic)
        this.state.field.forEach((unit, index) => {
            if (unit && !unit.activeUsedThisTurn && !unit.isStunned && !unit.cannotAttack) {
                const hasActive = unit.effects?.some(e => e.trigger === 'ACTIVE');
                if (hasActive) {
                    // console.log(`[AI] Using Active Ability: ${unit.name}`);
                    this.game.useActiveAbility(this.id, index);
                    acted = true;
                }
            }
        });
        if (acted) { this.think(); return; }

        // 2. Play Units (Smarter: Prefer high threat/utility per cost)
        const sizeLimit = this.getSizeLimit();
        const currentSize = this.getCurrentFieldSize();

        const units = this.state.hand
            .filter(c => c.type === 'UNIT')
            .sort((a, b) => {
                // Heuristic: Cost efficiency + Threat
                const aEff = (this.evaluateThreat(a, 'PLAY') || 0) / (a.cost || 1);
                const bEff = (this.evaluateThreat(b, 'PLAY') || 0) / (b.cost || 1);
                return bEff - aEff;
            });

        for (const unit of units) {
            const freeSlot = this.state.field.findIndex(s => s === null);
            if (freeSlot !== -1 && (currentSize + unit.cost) <= sizeLimit) {
                const handIndex = this.state.hand.findIndex(c => c.id === unit.id);
                console.log(`[AI] Playing UNIT: ${unit.name} (Cost: ${unit.cost}, Limit: ${sizeLimit - currentSize})`);
                this.game.playCard(this.id, handIndex, { slotIndex: freeSlot });
                acted = true;
                break;
            }
        }
        if (acted) { this.think(); return; }

        // 3. Play Items (Strategic: Attach to units that benefit most)
        const items = this.state.hand.filter(c => c.type === 'ITEM');
        const unitsOnField = this.state.field
            .map((u, i) => ({ unit: u, index: i }))
            .filter(spec => spec.unit !== null) as { unit: Card, index: number }[];

        if (items.length > 0 && unitsOnField.length > 0) {
            // Sort items by priority
            for (const item of items) {
                if ((currentSize + item.cost) > sizeLimit) continue;

                // Find best unit to attach to
                // Priority: Attacker/Keyword units or just high power base
                const targetUnitSpec = unitsOnField.sort((a, b) => {
                    const aVal = (this.game.hasKeyword(a.unit, 'ATTACKER') ? 2000 : 0) + (a.unit.power || 0);
                    const bVal = (this.game.hasKeyword(b.unit, 'ATTACKER') ? 2000 : 0) + (b.unit.power || 0);
                    return bVal - aVal;
                })[0];

                const handIndex = this.state.hand.findIndex(c => c.id === item.id);
                console.log(`[AI] Playing ITEM: ${item.name} -> Target: ${targetUnitSpec.unit.name}`);
                this.game.playCard(this.id, handIndex, { slotIndex: targetUnitSpec.index });
                acted = true;
                break;
            }
        }
        if (acted) { this.think(); return; }

        // 4. Play Skills (Utility based)
        const skills = this.state.hand.filter(c => c.type === 'SKILL');
        for (const skill of skills) {
            if ((currentSize + skill.cost) > sizeLimit) continue;

            let isUseful = false;
            // Enhanced Utility Check
            if (skill.effects) {
                for (const effect of skill.effects) {
                    if (effect.action === 'BUFF_ALLY' || effect.action === 'BUFF_HIT') {
                        isUseful = this.state.field.some(u => u !== null);
                    } else if (effect.action === 'DAMAGE_UNIT' || effect.action === 'KILL_UNIT' || effect.action === 'DEBUFF_ENEMY') {
                        const opp = Object.values(this.game.players).find(p => p.id !== this.id);
                        isUseful = opp ? opp.state.field.some(u => u !== null) : false;
                    } else if (effect.action === 'HEAL_LEADER') {
                        isUseful = this.state.maxHp - this.state.hp >= 2; // Only heal if 2+ dmg
                    } else if (effect.action === 'DRAW' || effect.action === 'SEARCH_DECK') {
                        isUseful = this.state.hand.length <= 5; // Don't overdraw if hand full
                    } else {
                        isUseful = true;
                    }
                }
            }

            if (isUseful) {
                const handIndex = this.state.hand.findIndex(c => c.id === skill.id);
                (this.game as any).addLog(`[AI] Strategic SKILL: ${skill.name}`);
                this.game.playCard(this.id, handIndex);
                acted = true;
                break;
            }
        }

        // 5. Final check: End Phase
        if (!acted && this.game.turnPlayerId === this.id) {
            this.game.nextPhase();
        } else if (acted) {
            this.think();
        }
    }

    private handleAttackPhase() {
        const opponentId = Object.keys(this.game.players).find(id => id !== this.id);
        if (!opponentId) return;
        const opponent = (this.game as any).players[opponentId];

        // 1. Identify all ready units
        const readyUnitsSpecs = this.state.field
            .map((u, i) => ({ unit: u, index: i }))
            .filter(spec => spec.unit && !spec.unit.attackedThisTurn && !spec.unit.cannotAttack && !spec.unit.isStunned);

        if (readyUnitsSpecs.length === 0) {
            if (this.game.turnPlayerId === this.id) {
                this.game.nextPhase();
            }
            return;
        }

        // 2. Lethal Detection (Total Hit Count vs Opponent HP)
        const totalPotentialHits = readyUnitsSpecs.reduce((sum, spec) => sum + this.game.getUnitHitCount(this.id, spec.index), 0);
        const lethalPossible = totalPotentialHits >= opponent.state.hp;

        if (lethalPossible) {
            console.log(`[AI] Lethal detected! Going all-in on Leader.`);
            // Priority: attack leader with anyone.
            // Pick the first unit and aim for an empty slot or a non-unit index (handled by Game.attack)
            const spec = readyUnitsSpecs[0];
            // To attack leader, we aim for a slot with no unit or -1 if the game handles it.
            // In current Game.ts, attack(p, attackerIdx, targetIdx) hits unit if opponent.field[targetIdx] exists.
            // So we find an empty slot.
            let targetIndex = opponent.state.field.findIndex((u: any) => u === null);
            if (targetIndex === -1) targetIndex = 0; // If field full, still hit a slot (Game.ts will handle block/intercept)

            this.game.attack(this.id, spec.index, targetIndex);
            this.think();
            return;
        }

        // 3. Normal Attack Logic (Strategic Board Control)
        // Sort attackers by strategic value
        const sortedAttackerSpecs = readyUnitsSpecs.sort((a, b) => {
            const aPower = this.game.getUnitPower(this.id, a.index);
            const bPower = this.game.getUnitPower(this.id, b.index);

            // Priority 1: Units with ON_ATTACK utility (that might buff others)
            const aHasOnAttack = a.unit?.effects?.some(e => e.trigger === 'ON_ATTACK');
            const bHasOnAttack = b.unit?.effects?.some(e => e.trigger === 'ON_ATTACK');
            if (aHasOnAttack && !bHasOnAttack) return -1;
            if (!aHasOnAttack && bHasOnAttack) return 1;

            // Priority 2: Keywords like LOOT/PENETRATION that want to attack early
            const aHasKeywordBuff = this.game.hasKeyword(a.unit!, 'LOOT') || this.game.hasKeyword(a.unit!, 'PENETRATION');
            const bHasKeywordBuff = this.game.hasKeyword(b.unit!, 'LOOT') || this.game.hasKeyword(b.unit!, 'PENETRATION');
            if (aHasKeywordBuff && !bHasKeywordBuff) return -1;
            if (!aHasKeywordBuff && bHasKeywordBuff) return 1;

            return bPower - aPower;
        });

        const bestAttackerSpec = sortedAttackerSpecs[0];
        const myPower = this.game.getUnitPower(this.id, bestAttackerSpec.index);

        // Pick the best target
        const opponentUnits = opponent.state.field
            .map((u: any, i: number) => ({ unit: u, index: i }))
            .filter((spec: any) => spec.unit !== null);

        let targetIndex = -1;

        if (opponentUnits.length > 0) {
            const rankedTargets = opponentUnits.map((spec: any) => {
                let priority = this.evaluateThreat(spec.unit, 'KILL');
                const enemyPower = this.game.getUnitPower(opponentId, spec.index);

                // --- Personality Specific Target Selection ---
                if (this.personality === 'AGGRO') {
                    // Aggro AI de-prioritizes units unless they have Guardian
                    if (!this.game.hasKeyword(spec.unit, 'GUARDIAN')) {
                        priority -= 1000;
                    }
                } else if (this.personality === 'CONTROL') {
                    // Control AI prioritizes board control highly
                    priority += (spec.unit.power || 0) * 0.5;
                }

                // Mandatory target: Guardian
                if (this.game.hasKeyword(spec.unit, 'GUARDIAN')) {
                    priority += 5000;
                }

                // Can we win the trade?
                if (myPower > enemyPower) {
                    priority += 1000;
                    // Extra bonus for triggering LOOT or PENETRATION
                    if (this.game.hasKeyword(bestAttackerSpec.unit!, 'LOOT') || this.game.hasKeyword(bestAttackerSpec.unit!, 'PENETRATION')) {
                        priority += 2000;
                    }
                } else if (myPower === enemyPower) {
                    priority += 200; // Mutual destruction might be okay if enemy is high threat
                } else {
                    priority -= 1000; // Avoid suicide unless necessary
                }

                return { index: spec.index, priority };
            }).sort((a: any, b: any) => b.priority - a.priority);

            const bestTarget = rankedTargets[0];
            const hasGuardian = opponentUnits.some(u => this.game.hasKeyword(u.unit, 'GUARDIAN'));

            // AGGRO logic: Hit leader if no Guardian, even if there are units
            const shouldHitLeader = !hasGuardian && (this.personality === 'AGGRO' || (bestTarget.priority < 0 && opponent.state.hp > 0));

            if (shouldHitLeader) {
                // Hit leader instead of units
                targetIndex = opponent.state.field.findIndex((u: any) => u === null);
                if (targetIndex === -1) targetIndex = 0;
            } else {
                targetIndex = bestTarget.index;
            }
        } else {
            // No units, hit face
            targetIndex = opponent.state.field.findIndex((u: any) => u === null);
            if (targetIndex === -1) targetIndex = 0;
        }

        (this.game as any).addLog(`[AI] Strategic Attack: ${bestAttackerSpec.unit?.name} (Pwr:${myPower}) -> TargetIdx:${targetIndex}`);
        this.game.attack(this.id, bestAttackerSpec.index, targetIndex);
        this.think();
    }

    private handleGuardianIntercept() {
        if (!this.game.pendingAttack) return;
        const { attackerId, attackerIndex, targetIndex } = this.game.pendingAttack;

        const attackerPower = this.game.getUnitPower(attackerId, attackerIndex);
        const targetUnit = this.state.field[targetIndex];
        const targetValue = targetUnit ? this.evaluateThreat(targetUnit, 'PROTECT') : 5000; // 5000 is base for Leader

        // Find available Guardian units
        const guardians = this.state.field
            .map((u, i) => ({ unit: u, index: i }))
            .filter(spec => spec.unit && this.game.hasKeyword(spec.unit, 'GUARDIAN') && !spec.unit.isStunned && spec.index !== targetIndex);

        if (guardians.length > 0) {
            // Pick a guardian.
            // Priority: 
            // 1. One that survives the combat.
            // 2. The least valuable one that stops the damage.

            guardians.sort((a, b) => {
                const aPower = this.game.getUnitPower(this.id, a.index);
                const bPower = this.game.getUnitPower(this.id, b.index);

                const aSurvives = aPower > attackerPower;
                const bSurvives = bPower > attackerPower;

                if (aSurvives && !bSurvives) return -1;
                if (!aSurvives && bSurvives) return 1;

                return this.evaluateThreat(a.unit!, 'SACRIFICE') - this.evaluateThreat(b.unit!, 'SACRIFICE');
            });

            const bestGuardian = guardians[0];
            const gPower = this.game.getUnitPower(this.id, bestGuardian.index);
            const gValue = this.evaluateThreat(bestGuardian.unit!, 'SACRIFICE');

            // Intercept if:
            // - Target is high value (Leader or important unit)
            // - Guardian survives (Winning trade)
            // - HP is low (Desperation)
            // - Intercepting with a "mook" (low sacrifice value) to save a "lord" (high protect value)
            if (targetValue > 2500 || gPower > attackerPower || this.state.hp <= 3 || (targetValue > 2000 && gValue < 1000)) {
                (this.game as any).addLog(`[AI] Strategic Intercept: ${bestGuardian.unit?.name} (Pwr:${gPower}) protects target (Value:${targetValue})`);
                this.game.resolveGuardianIntercept(this.id, bestGuardian.index);
                return;
            }
        }

        this.game.resolveGuardianIntercept(this.id, 'NONE');
    }

    private handleDefensePhase() {
        if (!this.game.pendingAttack) return;
        const { attackerId, attackerIndex, targetIndex } = this.game.pendingAttack;

        // Get Unit Stats
        const attackerPower = this.game.getUnitPower(attackerId, attackerIndex);
        const defenderPower = this.game.getUnitPower(this.id, targetIndex);
        const defenderUnit = this.state.field[targetIndex];

        if (!defenderUnit) {
            this.game.resolveDefense(this.id, 'TAKE');
            return;
        }

        const defenderValueSacrifice = this.evaluateThreat(defenderUnit, 'SACRIFICE');
        const defenderValueProtect = this.evaluateThreat(defenderUnit, 'PROTECT');
        const attackerCard = this.game.players[attackerId].state.field[attackerIndex];

        // Decision Logic
        let action: 'BLOCK' | 'TAKE' = 'TAKE';

        // 1. If we can WIN (Defender survives, Attacker dies), ALWAYS BLOCK.
        if (defenderPower > attackerPower) {
            action = 'BLOCK';
        }
        // 2. Revenge (道連れ): If we die but take them down
        else if (attackerCard && this.game.hasKeyword(defenderUnit, 'DEATH_TOUCH')) {
            const attackerThreat = this.evaluateThreat(attackerCard, 'KILL');
            // Block if attacker is more threatening than our unit is valuable
            if (attackerThreat > defenderValueSacrifice) {
                action = 'BLOCK';
            }
        }
        // 3. Mutual Destruction: If both die, only do it if attacker is higher threat
        else if (defenderPower === attackerPower) {
            const attackerThreat = this.evaluateThreat(attackerCard, 'KILL');
            if (attackerThreat >= defenderValueSacrifice) {
                action = 'BLOCK';
            }
        }
        // 4. Low HP: Block to trigger any potentially useful destruction effects or just slow them down
        else if (this.state.hp <= 2) {
            action = 'BLOCK';
        }
        // 4. Sacrifice check: Is this unit low value enough to just block and die to save HP?
        // Actually, in Nivel Arena, blocking with a unit that dies usually just saves the unit slot if it was target?
        // Wait, if targetIndex is the unit, blocking means we FIGHT. Taking means... Nivel Arena unit attacks usually MUST be defended if target is unit?
        // Re-read Game.ts: resolveDefense only matters if there IS a defender.
        // If we choose TAKE, the unit is destroyed anyway if power is lower? 
        // No, in Nivel Arena: 
        // If Attacker hits Unit:
        // - Block: Combat happens.
        // - Take: Unit is destroyed (trashed) and 1 damage to leader? Or just destroyed?
        // Standard Nivel rules: If unit is attacked, you can Block or Take.
        // If Take -> Unit destroyed, no damage to leader (usually).
        // If Block -> Compare power.

        // Let's stick to the value logic: If the unit is important, only block if it survives.
        // If it's a mook, block to maybe trigger something or just act as a shield.
        if (action === 'TAKE' && defenderValueSacrifice < 1000 && this.state.hp <= 5) {
            action = 'BLOCK';
        }

        this.game.resolveDefense(this.id, action);
    }

    private getCardFromGame(cardId: string): Card | null {
        // Search all players field/hand/discard
        for (const pid in this.game.players) {
            const p = this.game.players[pid];
            const inField = p.state.field.find(c => c && c.id === cardId);
            if (inField) return inField;
            const inHand = p.state.hand.find(c => c.id === cardId);
            if (inHand) return inHand;
            const inDiscard = p.state.discard.find(c => c.id === cardId);
            if (inDiscard) return inDiscard;
        }
        return null;
    }

    private evaluateThreat(card: Card, actionType: string): number {
        let score = (card.power || 0);

        // --- Personality Weights ---
        const weights = {
            PLAYER_HP: this.personality === 'AGGRO' ? 2.0 : 0.5,
            BOARD_CONTROL: this.personality === 'CONTROL' ? 1.5 : 1.0,
            VALUE: 1.0
        };

        // Utility / Lord scoring (Passive buffs, etc.)
        if (card.effects) {
            card.effects.forEach(e => {
                if (e.trigger === 'PASSIVE') {
                    if (e.action === 'BUFF_ALLY') score += 1000 * weights.BOARD_CONTROL;
                    if (e.action === 'BUFF_HIT') score += 1500 * weights.PLAYER_HP;
                }
                if (e.trigger === 'ON_ATTACK' || e.trigger === 'ON_HIT') {
                    score += 500;
                }
            });
        }

        // Keywords
        if (this.game.hasKeyword(card, 'GUARDIAN')) score += 500 * weights.BOARD_CONTROL;
        if (this.game.hasKeyword(card, 'ATTACKER')) score += 500 * weights.PLAYER_HP;
        if (this.game.hasKeyword(card, 'ITEM_SHIELD')) score += 200;
        if (this.game.hasKeyword(card, 'DEATH_TOUCH')) score += 800;
        if (this.game.hasKeyword(card, 'BREAKTHROUGH')) score += 600 * weights.PLAYER_HP;

        // Contextual Adjustments
        if (actionType === 'BOUNCE') {
            score += (card.cost || 0) * 1000 * weights.BOARD_CONTROL; // High cost is good to bounce (tempo swing)
            if (card.attachments && card.attachments.length > 0) score += 1000; // Reset equipment
        }
        if (actionType === 'KILL') {
            score += (card.power || 0) * weights.BOARD_CONTROL;
        }
        if (actionType === 'PROTECT') {
            // Priority to protect utility units
            if (card.effects?.some(e => e.trigger === 'PASSIVE')) score += 2000;
        }
        if (actionType === 'PLAY') {
            // Priority to play units with good keywords
            if (this.game.hasKeyword(card, 'ATTACKER')) score += 500 * weights.PLAYER_HP;
            if (this.game.hasKeyword(card, 'GUARDIAN')) score += 800 * weights.BOARD_CONTROL;
            if (card.effects?.some(e => e.trigger === 'PASSIVE')) score += 1000;
        }

        return score;
    }

    private handleSelection() {
        if (!this.game.selection) return;

        console.log(`[AI] Handling Selection: ${this.game.selection.action}`);

        // Mulligan (Delegated)
        if (this.game.selection.action === 'MULLIGAN') {
            this.handleMulligan();
            return;
        }

        // ITEM_SHIELD
        if (this.game.selection.action === 'RESOLVE_ITEM_SHIELD') {
            // Sacrifice least valuable item? For now, first.
            if (this.game.selection.candidateIds.length > 0) {
                this.game.resolveSelection(this.id, [this.game.selection.candidateIds[0]]);
            } else {
                this.game.resolveSelection(this.id, []);
            }
            return;
        }

        // Smart Selection Logic
        const candidates = this.game.selection.candidateIds;
        const count = this.game.selection.count;
        let selected: string[] = [];

        // Map IDs to Cards
        const cardObjects = candidates.map(id => ({ id, card: this.getCardFromGame(id) })).filter(o => o.card !== null) as { id: string, card: Card }[];

        switch (this.game.selection.action) {
            case 'RESTRICT_ATTACK_SELECTION':
            case 'DEBUFF_ENEMY_SELECTION':
            case 'KILL_UNIT_SELECTION':
                // Prioritize HIGH threat
                cardObjects.sort((a, b) => this.evaluateThreat(b.card, 'DEBUFF') - this.evaluateThreat(a.card, 'DEBUFF'));
                break;
            case 'BOUNCE_UNIT_SELECTION':
                // Prioritize HIGH threat (Cost weighted)
                cardObjects.sort((a, b) => this.evaluateThreat(b.card, 'BOUNCE') - this.evaluateThreat(a.card, 'BOUNCE'));
                break;
            case 'GRANT_ABILITY_SELECTION':
            case 'BUFF_ALLY_SELECTION':
            case 'BUFF_HIT_SELECTION':
                // Prioritize OUR HIGH threat units (Keep our carry alive/strong)
                cardObjects.sort((a, b) => this.evaluateThreat(b.card, 'PROTECT') - this.evaluateThreat(a.card, 'PROTECT'));
                break;
            case 'ADD_TO_HAND':
            case 'ADD_TO_HAND_FROM_DECK':
            case 'RECYCLE_SELECTION':
                // Prioritize Cost/Power for own hand
                cardObjects.sort((a, b) => ((b.card.cost || 0) * 1000 + (b.card.power || 0)) - ((a.card.cost || 0) * 1000 + (a.card.power || 0)));
                break;
            case 'DISCARD_HAND':
                // Discard LOWest value
                cardObjects.sort((a, b) => ((a.card.cost || 0) * 1000 + (a.card.power || 0)) - ((b.card.cost || 0) * 1000 + (b.card.power || 0)));
                break;
            default:
                // Default: First available
                break;
        }

        if (selected.length === 0) {
            // Fill from sorted list
            selected = cardObjects.map(o => o.id).slice(0, count);
        }

        // If we still don't have enough (e.g. couldn't find card objects), fallback to raw IDs
        if (selected.length < count && candidates.length >= count) {
            const remaining = candidates.filter(id => !selected.includes(id));
            selected.push(...remaining.slice(0, count - selected.length));
        }

        this.game.resolveSelection(this.id, selected);
    }
}
