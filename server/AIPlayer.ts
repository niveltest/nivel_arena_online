
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

export class CPUPlayer extends Player {
    private game: Game;

    constructor(game: Game, username: string, deckData?: { deckIdList: string[], leaderId: string }) {
        super(new MockSocket() as any as Socket, username, deckData);
        this.game = game;
        this.isCPU = true;
    }

    public async think() {
        if (this.game.turnPlayerId !== this.id && this.game.phase !== 'MULLIGAN' && !this.isSelecting()) return;

        // Add a small delay to simulate human "thinking"
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            switch (this.game.phase) {
                case 'MULLIGAN':
                    this.handleMulligan();
                    break;
                case 'LEVEL_UP':
                    // Usually automatic or simple choice
                    break;
                case 'DRAW':
                    // Automatic
                    break;
                case 'MAIN':
                    this.handleMainPhase();
                    break;
                case 'ATTACK':
                    this.handleAttackPhase();
                    break;
                case 'DEFENSE':
                    this.handleDefensePhase();
                    break;
                case 'SELECT_CARD':
                    this.handleSelection();
                    break;
                case 'GUARDIAN_INTERCEPT':
                    this.handleGuardianIntercept();
                    break;
            }
        } catch (e) {
            console.error("[AI ERROR]", e);
        }
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

        this.game.resolveMulligan(this.id, discardIds);
    }

    private handleMainPhase() {
        // AI: Play cards if possible
        let acted = false;

        // 1. Level up if possible (handled in phase change usually, but just in case)

        // 2. Use Active Abilities (New)
        this.state.field.forEach((unit, index) => {
            if (unit && !unit.activeUsedThisTurn && !unit.isStunned && !unit.cannotAttack) {
                // Check if it has active ability
                const hasActive = unit.effects?.some(e => e.trigger === 'ACTIVE');
                if (hasActive) {
                    // Simple heuristic: always use if available
                    this.game.useActiveAbility(this.id, index);
                    acted = true;
                    return;
                }
            }
        });
        if (acted) {
            this.think();
            return;
        }

        // 3. Play units
        const units = this.state.hand
            .filter(c => c.type === 'UNIT' && c.cost <= (this.state.resources || 0))
            .sort((a, b) => (b.power || 0) - (a.power || 0));

        for (const unit of units) {
            const freeSlot = this.state.field.findIndex(s => s === null);
            if (freeSlot !== -1) {
                const handIndex = this.state.hand.findIndex(c => c.id === unit.id);
                this.game.playCard(this.id, handIndex, { slotIndex: freeSlot });
                acted = true;
                break; // One action per think tick
            }
        }

        // 4. Play items if we have units
        if (!acted) {
            const items = this.state.hand
                .filter(c => c.type === 'ITEM' && c.cost <= (this.state.resources || 0));
            const unitsOnField = this.state.field.filter(u => u !== null) as Card[];

            if (items.length > 0 && unitsOnField.length > 0) {
                const item = items[0];
                const unit = unitsOnField[0];
                const handIndex = this.state.hand.findIndex(c => c.id === item.id);
                const unitIndex = this.state.field.findIndex(u => u?.id === unit.id);
                this.game.playCard(this.id, handIndex, { slotIndex: unitIndex });
                acted = true;
            }
        }

        // 5. Play SKILL Cards (New)
        if (!acted) {
            const skills = this.state.hand
                .filter(c => c.type === 'SKILL' && c.cost <= (this.state.resources || 0));

            if (skills.length > 0) {
                // Simple AI: Just play the first playable skill
                // For target selection, Game.requestSelection involves AI thinking later.
                // We just need to trigger 'playCard'.
                const skill = skills[0];
                const handIndex = this.state.hand.findIndex(c => c.id === skill.id);
                this.game.playCard(this.id, handIndex);
                acted = true;
            }
        }

        // 6. End phase if no more actions
        if (!acted) {
            this.game.nextPhase();
        } else {
            // If we acted, schedule another think
            this.think();
        }
    }

    private handleAttackPhase() {
        // AI: Attack with all ready units
        const readyUnitsSpecs = this.state.field
            .map((u, i) => ({ unit: u, index: i }))
            .filter(spec => spec.unit && !spec.unit.attackedThisTurn && !spec.unit.cannotAttack && !spec.unit.isStunned);

        if (readyUnitsSpecs.length > 0) {
            const spec = readyUnitsSpecs[0];
            const opponentId = Object.keys(this.game.players).find(id => id !== this.id);
            if (opponentId) {
                const opponent = (this.game as any).players[opponentId];

                // Smart Attack Logic:
                // 1. If opponent has a weak unit (power < my power), attack it to board clear.
                // 2. Otherwise attack leader.

                let targetIndex = -1; // -1 means Leader (usually implicitly handled by index mapping in attack() or dedicated constant, let's assume same-lane logic for now or specific target)

                // Note: Game.attack(attackerIndex, targetIndex). 
                // If targetIndex is 0-4 => Unit slot. 
                // Need a way to target leader. Game.ts `attack` might expect a specific setup or assumes lane if valid.
                // Let's check Game.ts attack logic briefly... 
                // Actually, in `attack(attackeridx, targetidx)`, if targetidx is valid unit, it battles unit.
                // If targetidx corresponds to Leader (e.g. implicitly or -1?), checked previously.
                // The current Game.ts attack(attackerId, attackerIndex, targetIndex) checks:
                // targetUnit = opponent.state.field[targetIndex]
                // If targetUnit exists -> Unit Battle.
                // If targetUnit null -> Direct Attack (Leader).

                // So, if we want to attack leader, we pick an empty slot or a specific flag?
                // The frontend Logic passes 'targetIndex'. If opponent field[targetIndex] is null, it's a direct attack ONLY IF there are no guards?
                // Actually, typically in Nivel Arena, generic attacks might go to leader if not blocked.
                // Re-reading Game.ts attack logic is safer, but assuming targetIndex corresponding to opponent field slot:
                // If accessing `attack`, we specify which slot we are attacking.
                // Wait, typically you attack a *target*. 
                // If we want to attack Leader, what index do we send?
                // In `Game.ts` previously viewed: `attack(playerId, attackerIndex, targetIndex)`
                // It does `const targetUnit = opponent.state.field[targetIndex];`
                // If `targetUnit` is defined -> Battle.
                // If `targetUnit` is undefined/null -> Direct Attack on Leader?
                // Let's assume sending a valid index with existing unit = attack unit.
                // Sending an index with NO unit = direct attack?
                // Or maybe there is a LEADER_INDEX = -1?

                // Let's scan for a killable unit
                const killableUnitIndex = opponent.state.field.findIndex(u => u && (u.power || 0) < (spec.unit?.power || 0));

                if (killableUnitIndex !== -1) {
                    targetIndex = killableUnitIndex;
                } else {
                    // Attack Leader (pick an empty slot? or -1?)
                    // Let's assume hitting an empty slot triggers direct attack check, or we need to clear this up.
                    // For now, let's try to hit the same lane (spec.index) if empty, or just standard face.
                    // Frontend usually sends Leader click as a specific action or index?
                    // Let's check `GameBoard.tsx`: `handleEnemyClick`.
                    // It calls `socket.emit('attack', { attackerIndex: selectedAttacker, targetIndex: index })`.
                    // If clicking Leader, it might send a specific index?
                    // Actually, let's assume -1 or handled by `playCard`? No `attack` event.

                    // Simple fallback: attack same index (frontal assault)
                    targetIndex = spec.index;
                }

                this.game.attack(this.id, spec.index, targetIndex);
                this.think();
            }
        } else {
            this.game.nextPhase();
        }
    }

    private handleDefensePhase() {
        if (!this.game.pendingAttack) return;
        const { attackerId, attackerIndex, targetIndex } = this.game.pendingAttack;

        // Get Unit Stats
        const attackerPower = this.game.getUnitPower(attackerId, attackerIndex);
        const defenderPower = this.game.getUnitPower(this.id, targetIndex);

        // Decision Logic
        let action: 'BLOCK' | 'TAKE' = 'TAKE';

        // 1. If we can WIN (One-sided destruction), BLOCK.
        // Nivel Arena: Attacker >= Defender -> Defender destroys.
        // Defender > Attacker -> Attacker destroys.
        // Mutual destruction does NOT exist.
        if (defenderPower > attackerPower) {
            action = 'BLOCK';
        }

        // 2. If we are low on HP (<= 5), BLOCK to survive even if we lose the unit.
        if (this.state.hp <= 5) {
            action = 'BLOCK';
        }

        // 3. Otherwise (Lose or Tie), TAKE to save the unit.
        // (defenderPower <= attackerPower means if we block, we die and attacker likely survives or at best survives unscathed? 
        // Wait, if Attacker == Defender, Defender dies. Attacker survives. 
        // So blocking is purely a sacrifice.)

        this.game.resolveDefense(this.id, action);
    }

    private handleSelection() {
        if (!this.game.selection) return;

        // ITEM_SHIELD: AI always chooses to sacrifice an item to protect the unit
        if (this.game.selection.action === 'RESOLVE_ITEM_SHIELD') {
            if (this.game.selection.candidateIds.length > 0) {
                // Pick the first item (logic could be improved to pick least valuable)
                this.game.resolveSelection(this.id, [this.game.selection.candidateIds[0]]);
            } else {
                this.game.resolveSelection(this.id, []);
            }
            return;
        }

        // Simple: Pick the first required count
        const selected = this.game.selection.candidateIds.slice(0, this.game.selection.count);
        this.game.resolveSelection(this.id, selected);
    }

    private handleGuardianIntercept() {
        if (!this.game.pendingAttack) return;
        const { targetIndex } = this.game.pendingAttack;

        // Find valid guardians
        // Guardians must be adjacent to the target slot
        const candidates: number[] = [];
        const left = targetIndex - 1;
        const right = targetIndex + 1;

        [left, right].forEach(slot => {
            if (slot >= 0 && slot <= 2) {
                const u = this.state.field[slot];
                if (u && this.game.hasKeyword(u, 'GUARDIAN') && !u.isStunned && !u.cannotAttack) {
                    candidates.push(slot);
                }
            }
        });

        if (candidates.length > 0) {
            // AI Logic: Always intercept if it protects Leader or Value Unit?
            const targetUnit = this.state.field[targetIndex];
            const isDirectAttack = !targetUnit;

            // 1. If Direct Attack (Leader is target), Intercept!
            if (isDirectAttack) {
                this.game.resolveGuardianIntercept(this.id, candidates[0]);
                return;
            }

            // 2. If Unit is target, intercept.
            this.game.resolveGuardianIntercept(this.id, candidates[0]);
        } else {
            this.game.resolveGuardianIntercept(this.id, 'NONE');
        }
    }
}
