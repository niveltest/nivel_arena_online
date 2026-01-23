
import { Player } from './Player';
import { GameState, Card, CardEffect, SelectionState } from '../shared/types';
import cardsData from './data/cards.json';
import { v4 as uuid } from 'uuid';
import { validateDeck } from './deckValidation';

export class Game {
    public id: string;
    public players: Record<string, Player> = {};
    public phase: GameState['phase'] = 'WAITING';
    public turnPlayerId: string = '';
    public turnCount: number = 0;
    public debugLogs: string[] = [];
    private io: any; // Socket.io Server instance

    public pendingAttack: { attackerId: string, attackerIndex: number, defenderId: string, targetIndex: number } | null = null;
    public selection: SelectionState | null = null;

    public constructor(id: string, io: any) {
        this.id = id;
        this.io = io;
    }

    public finishGame(winnerId: string, reason: string) {
        this.endGame(winnerId, reason);
    }

    private hasKeyword(card: Card, keyword: string): boolean {
        if (!card) return false;
        const mapping: Record<string, string> = {
            'アタッカー': 'アタッカー',
            'ATTACKER': 'アタッカー',
            'PENETRATION': 'PENETRATION_',
            'LOOT': 'LOOT_',
            'BERSERKER': 'バーサーカー',
            'DUELIST': 'デュエリスト',
            'DEATH_TOUCH': '道連れ',
            'INVINCIBLE': '無敵',
            'ITEM_SHIELD': '装備ガード',
            'BREAKTHROUGH': '突破',
            'INFILTRATE': '潜入',
            'GUARDIAN': '防壁',
            'UNION': 'ユニオン',
            'LEGION': 'レギオン',
            'SHIELD': 'シールド',
            'EXIT': 'エグジット',
            'RECYCLE': '帰還'
        };

        const eng = keyword.toUpperCase();
        const prefix = mapping[eng] || keyword;

        const checkMatch = (kw: string) => {
            if (kw === eng || kw === prefix) return true;
            if (prefix.endsWith('_') && kw.startsWith(prefix)) return true;
            return false;
        };

        if (card.keywords?.some(checkMatch)) return true;
        if (card.tempKeywords?.some(checkMatch)) return true;

        const jp = (eng === 'PENETRATION') ? '貫通' : (eng === 'LOOT' ? '略奪' : prefix);

        if (card.attachments) {
            for (const item of card.attachments) {
                if (item.keywords?.some(checkMatch)) return true;
                if (item.text?.includes(jp)) return true;
            }
        }

        if (card.text?.includes(jp)) {
            if (card.text.includes('《ユニーク》を持つアイテムを装備している場合')) {
                const hasUnique = card.attachments?.some(item =>
                    item.affiliation?.includes('ユニーク') || item.text?.includes('《ユニーク》') || item.name?.includes('ユニーク')
                );
                if (!hasUnique) return false;
            }

            if (card.text.includes('枚以上なら') && card.text.includes(jp)) {
                const match = card.text.match(/(\d+)枚以上なら/);
                if (match) {
                    const threshold = parseInt(match[1], 10);
                    const itemNum = card.attachments?.length || 0;
                    if (itemNum < threshold) return false;
                }
            }
            return true;
        }

        return false;
    }

    private getKeywordValue(card: Card, keyword: string): number {
        if (!card) return 0;
        const mapping: Record<string, string> = {
            'PENETRATION': 'PENETRATION_',
            'LOOT': 'LOOT_',
            'INFILTRATE': 'INFILTRATE_'
        };
        const upper = keyword.toUpperCase();
        const prefix = mapping[upper] || (upper + '_');

        const jpMap: Record<string, string> = {
            'PENETRATION': '貫通',
            'LOOT': '略奪',
            'INFILTRATE': '潜入'
        };
        const jp = jpMap[upper] || upper;

        const getSingleCardVal = (c: Card): number => {
            const kws = [...(c.keywords || []), ...(c.tempKeywords || [])];
            let maxFound = 0;
            kws.forEach(kw => {
                if (kw === jp || kw === upper) maxFound = Math.max(maxFound, 1);
                if (kw.startsWith(prefix)) {
                    const val = parseInt(kw.replace(prefix, ''), 10);
                    if (!isNaN(val)) maxFound = Math.max(maxFound, val);
                }
            });
            // Text fallback
            const textMatch = c.text?.match(new RegExp(`\\[?${jp}\\]?\\[(\\d+)\\]`));
            if (textMatch) maxFound = Math.max(maxFound, parseInt(textMatch[1], 10));
            else if (c.text?.includes(jp)) maxFound = Math.max(maxFound, 1);

            return maxFound;
        };

        let maxValue = getSingleCardVal(card);

        if (card.attachments) {
            card.attachments.forEach(item => {
                maxValue = Math.max(maxValue, getSingleCardVal(item));
            });
        }

        return maxValue;
    }


    public addPlayer(player: Player) {
        if (Object.keys(this.players).length >= 2) return false;
        this.players[player.id] = player;
        return true;
    }

    public handleDisconnect(socketId: string) {
        if (this.phase === 'FINISHED') return;
        const playerId = socketId; // Assuming playerId is socketId initially
        const player = this.players[playerId];

        if (player) {
            player.connected = false;
            // 60 sec timer
            if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = setTimeout(() => {
                this.endGame(playerId, "接続切れによる敗北");
            }, 60000);

            this.broadcastAction(playerId, 'PLAYER_DISCONNECTED', {
                playerId,
                timeoutSec: 60
            });
            this.addLog(`${player.username} Disconnected. Waiting for reconnect...`);
        }
    }

    public handleReconnect(username: string, newSocketId: string): { success: boolean, oldSocketId?: string } {
        if (this.phase === 'FINISHED') return { success: false };

        const existingPlayerId = Object.keys(this.players).find(id => this.players[id].username === username);
        if (!existingPlayerId) return { success: false };

        const player = this.players[existingPlayerId];

        // Clear timeout
        if (player.disconnectTimeout) {
            clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = null;
        }

        player.connected = true;

        // Typically we need to update playerId in 'players' map if playerId IS socketId.
        // But changing key in map is tricky references.
        // Instead, we might need to handle ID migration or just keep old ID internally but map socket events.
        // Simplest for now: Migrate the player entry to new Key.

        // Remove old key
        delete this.players[existingPlayerId];
        // Add new key
        this.players[newSocketId] = player;
        player.id = newSocketId;
        player.state.id = newSocketId; // State also has ID

        // If it was this player's turn, update turnPlayerId reference? 
        // We handle this in migratePlayerReferences now for robustness

        this.migratePlayerReferences(existingPlayerId, newSocketId);

        this.broadcastAction(newSocketId, 'PLAYER_RECONNECTED', {
            playerId: newSocketId,
            username
        });
        this.addLog(`${username} Reconnected!`);

        // Send full state to reconnected player
        return { success: true, oldSocketId: existingPlayerId };
    }

    private migratePlayerReferences(oldId: string, newId: string) {
        // 1. Turn Player
        if (this.turnPlayerId === oldId) {
            this.turnPlayerId = newId;
        }

        // 2. Pending Attack
        if (this.pendingAttack) {
            if (this.pendingAttack.attackerId === oldId) this.pendingAttack.attackerId = newId;
            if (this.pendingAttack.defenderId === oldId) this.pendingAttack.defenderId = newId;
        }

        // 3. Selection
        if (this.selection && this.selection.playerId === oldId) {
            this.selection.playerId = newId;
        }

        // 4. Update Logs (Optional, but good for clarity in debug)
        // this.debugLogs.push(`[System] Auto-migrated ID references from ${oldId} to ${newId}`);
    }

    public removePlayer(playerId: string) {
        // Only used for cleanup or force removal. Normal disconnect calls handleDisconnect
        delete this.players[playerId];
        if (Object.keys(this.players).length < 2) {
            this.phase = 'WAITING';
            this.turnCount = 0;
        }
    }

    public start() {
        if (Object.keys(this.players).length < 2) return;

        console.log('[Game] STARTING GAME');
        this.phase = 'MULLIGAN';
        this.turnCount = 1;

        // Randomly determine P1 (first player)
        const playerIds = Object.keys(this.players);
        this.turnPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
        this.addLog(`Game Started! ${this.players[this.turnPlayerId].username} goes first.`);

        const allCards = cardsData as unknown as Card[];

        const getCompatibleCards = (leader: Card, pool: Card[]) => {
            return pool.filter(c =>
                c.type !== 'LEADER' &&
                c.attribute === leader.attribute
            );
        };

        const createDeckInstance = (baseCards: Card[]): Card[] => {
            return baseCards.map(c => ({ ...c, id: uuid() } as Card));
        };

        Object.values(this.players).forEach(p => {
            if (p.deckData) {
                const leader = allCards.find(c => c.id === p.deckData?.leaderId);
                if (leader) p.state.leader = { ...leader, id: uuid() };
                else p.state.leader = { ...allCards.find(c => c.type === 'LEADER')! };
                p.state.leaderLevel = 1;
                const deckIds = p.deckData.deckIdList;
                const cardCounts = new Map<string, number>();
                let triggerCount = 0;

                const rawDeck = deckIds.map(id => {
                    const c = allCards.find(card => card.id === id);
                    if (!c) return null;

                    // 1. Attribute Check
                    if (leader && c.attribute !== leader.attribute) {
                        console.warn(`[Game] Attribute mismatch: ${c.name}`);
                        return null;
                    }

                    // 2. 3-Copy Limit
                    const count = cardCounts.get(c.id) || 0;
                    if (count >= 3) {
                        console.warn(`[Game] 3-copy limit exceeded: ${c.name}`);
                        return null;
                    }
                    cardCounts.set(c.id, count + 1);

                    // 3. 8-Trigger Limit
                    if (c.text?.includes('[トリガー]')) {
                        if (triggerCount >= 8) {
                            console.warn(`[Game] 8-trigger limit exceeded: ${c.name}`);
                            return null;
                        }
                        triggerCount++;
                    }

                    return c;
                }).filter((c): c is Card => !!c);

                p.state.deck = createDeckInstance(rawDeck);
                p.state.deck.sort(() => Math.random() - 0.5);
            } else {
                // Default Random Deck
                const leaders = allCards.filter(c => c.type === 'LEADER');
                const baseLeader = leaders[Math.floor(Math.random() * leaders.length)];
                p.state.leader = { ...baseLeader, id: uuid() } as Card;
                p.state.leaderLevel = 1;
                const rawDeck: Card[] = [];
                const compatible = getCompatibleCards(baseLeader, allCards);
                const cardCounts = new Map<string, number>();
                while (rawDeck.length < 40) {
                    const base = compatible[Math.floor(Math.random() * compatible.length)];
                    const count = cardCounts.get(base.id) || 0;
                    if (count >= 3) continue;
                    rawDeck.push(base);
                    cardCounts.set(base.id, count + 1);
                }
                p.state.deck = createDeckInstance(rawDeck);
                p.state.deck.sort(() => Math.random() - 0.5);
            }

            p.state.unitsPlaced = [false, false, false];
            p.state.skillZone = [];
            p.state.mulliganDone = false;

            // Initial Draw (5 cards)
            for (let i = 0; i < 5; i++) {
                if (p.state.deck.length > 0) {
                    p.drawCard(p.state.deck.pop()!);
                }
            }

            // Request Mulligan UI (Official rule: All or Nothing)
            this.requestSelection(p.id, 'HAND', p.state.hand.map(c => c.id), 0, 'MULLIGAN', {
                message: 'マリガンしますか？（全交換かそのままかを選択）'
            });
        });

        this.broadcastState();
    }

    public switchTurn() {
        const playerIds = Object.keys(this.players);
        const currentIdx = playerIds.indexOf(this.turnPlayerId);
        const nextIdx = (currentIdx + 1) % playerIds.length;
        this.turnPlayerId = playerIds[nextIdx];
        this.turnCount++;
        this.phase = 'LEVEL_UP';
        this.addLog(`Turn ${this.turnCount}: ${this.players[this.turnPlayerId].username}'s turn`);

        this.handleLevelUpPhase();
        this.broadcastState();
    }

    public nextPhase() {
        switch (this.phase) {
            case 'LEVEL_UP':
                this.phase = 'DRAW';
                this.handleDrawPhase();
                break;
            case 'DRAW':
                this.phase = 'MAIN';
                break;
            case 'MAIN':
                this.phase = 'ATTACK';
                break;
            case 'ATTACK':
                if (this.checkBerserkerMustAttack()) {
                    this.addLog(`バーサーカーを持つユニットが攻撃していません。必ず攻撃を行ってください。`);
                    return;
                }
                // Recycle logic
                Object.keys(this.players).forEach(pId => {
                    const p = this.players[pId];
                    const toHand: Card[] = [];
                    p.state.discard = p.state.discard.filter(c => {
                        if (c.isRecycle) {
                            toHand.push(c);
                            return false;
                        }
                        return true;
                    });
                    toHand.forEach(c => {
                        p.drawCard(c);
                        this.addLog(`${c.name} [RECYCLE] returned from trash.`);
                    });
                });

                this.phase = 'END';
                this.handleEndPhase();
                break;
            case 'END':
                this.switchTurn();
                break;
        }
        this.broadcastState();
    }

    public handleLevelUpPhase() {
        const player = this.players[this.turnPlayerId];
        if (!player) return;
        const oldLevel = player.state.leaderLevel;
        const targetLevel = Math.min(10, Math.ceil(this.turnCount / 2) + 1);
        player.state.leaderLevel = targetLevel;
        this.addLog(`${player.username} Level Up -> ${player.state.leaderLevel}`);
        if (player.state.leaderLevel > oldLevel) {
            this.broadcastAction(this.turnPlayerId, 'LEVEL_UP', { newLevel: player.state.leaderLevel });
        }
        const awakenLv = player.state.leader.id === 'ST01-001' ? 5 : (player.state.leader.awakeningLevel || 3);
        if (oldLevel < awakenLv && player.state.leaderLevel >= awakenLv) {
            this.addLog(`${player.username} Leader Awakened!`);
            this.broadcastAction(this.turnPlayerId, 'AWAKEN', { leader: player.state.leader.name });
            if (player.state.leader.effects) {
                player.state.leader.effects.forEach(effect => {
                    if (effect.trigger === 'ON_AWAKEN') {
                        this.applyEffect(this.turnPlayerId, player.state.leader, 'ON_AWAKEN', undefined, effect);
                    }
                });
            }
        }
    }

    public handleDrawPhase() {
        if (this.turnCount === 1) return;
        const player = this.players[this.turnPlayerId];
        if (!player) return;
        if (player.state.deck.length > 0) {
            player.drawCard(player.state.deck.pop()!);
        } else {
            // Deck Out during Draw Phase
            this.endGame(this.turnPlayerId, "山札切れ");
            return;
        }
        this.broadcastState();
    }

    public handleEndPhase() {
        const player = this.players[this.turnPlayerId];
        if (player) {
            // Move all skills from skillZone to discard at end of turn
            player.state.discard.push(...player.state.skillZone);
            player.state.skillZone = [];

            // Official Rule: Hand Size Limit (Max 7)
            if (player.state.hand.length > 7) {
                const discardCount = player.state.hand.length - 7;
                this.addLog(`${player.username} has ${player.state.hand.length} cards. Must discard ${discardCount}.`);
                this.requestSelection(this.turnPlayerId, 'HAND', player.state.hand.map(c => c.id), discardCount, 'DISCARD_HAND', {
                    message: `手札が上限(7枚)を超えています。${discardCount}枚選んで捨ててください。`
                });
            }
        }

        // Reset turn-based effects for ALL units (both players)
        Object.keys(this.players).forEach(pId => {
            const p = this.players[pId];
            p.state.field.forEach(u => {
                if (u) {
                    u.tempPowerBuff = 0;
                    u.tempPowerDebuff = 0;
                    u.tempHitBuff = 0;
                    u.tempKeywords = [];
                    u.attackedThisTurn = false;
                    u.activeUsedThisTurn = false;
                    if (!this.hasKeyword(u, 'PERMANENT_CANNOT_ATTACK')) {
                        u.cannotAttack = false;
                    }
                    // Clear stun at the end of the owner's turn
                    if (pId === this.turnPlayerId) {
                        u.isStunned = false;
                    }
                }
            });
            // Reset "unit placed" flags for the current player
            if (pId === this.turnPlayerId) {
                p.state.unitsPlaced = [false, false, false];
            }
        });

        this.broadcastAction(this.turnPlayerId, 'END_PHASE', {});
    }

    public playCard(playerId: string, cardIndex: number, targetInfo?: { slotIndex?: number, targetId?: string }) {
        if (this.phase === 'FINISHED') return;
        if (playerId !== this.turnPlayerId) return;
        if (this.phase !== 'MAIN') return;
        const player = this.players[playerId];
        if (!player) return;
        const hand = player.state.hand;
        if (cardIndex < 0 || cardIndex >= hand.length) return;
        const card = hand[cardIndex];
        const currentSize = player.state.field.reduce((sum, c) => {
            if (!c) return sum;
            let unitTotal = c.cost;
            if (c.attachments) {
                unitTotal += c.attachments.reduce((aSum, a) => aSum + a.cost, 0);
            }
            return sum + unitTotal;
        }, 0) + player.state.skillZone.reduce((sum, s) => sum + s.cost, 0);
        const sizeLimit = this.getSizeLimit(playerId);

        if (card.type === 'UNIT') {
            const slotIndex = targetInfo?.slotIndex;
            if (slotIndex === undefined || slotIndex < 0 || slotIndex > 2) return;

            const unitsPlayed = player.state.unitsPlayedThisTurn || 0;
            if (unitsPlayed >= 2) return; // Limit 2 units per turn
            player.state.unitsPlayedThisTurn = unitsPlayed + 1;

            const existingUnit = player.state.field[slotIndex];
            if (existingUnit) {
                if (card.cost <= existingUnit.cost) return;
                // Move unit and its attachments to discard (No ON_EXIT trigger per rule)
                player.state.discard.push(existingUnit);
                if (existingUnit.attachments) {
                    player.state.discard.push(...existingUnit.attachments);
                    existingUnit.attachments = [];
                }
                this.addLog(`${player.username} upgraded ${existingUnit.name} to ${card.name}.`);
            }
            if (currentSize + card.cost - (existingUnit ? existingUnit.cost : 0) > sizeLimit) return;
            player.state.hand.splice(cardIndex, 1);
            player.state.field[slotIndex] = card;
            if (player.state.unitsPlaced) player.state.unitsPlaced[slotIndex] = true;
            this.applyEffect(playerId, card, 'ON_ENTRY', { slotIndex });
            this.applyEffect(playerId, card, 'ON_PLAY', { slotIndex }); // Keep ON_PLAY for compatibility
        } else if (card.type === 'ITEM') {
            const slotIndex = targetInfo?.slotIndex;
            const targetId = targetInfo?.targetId || (slotIndex !== undefined ? playerId : undefined); // Default to self if targetId missing
            if (slotIndex === undefined || slotIndex < 0 || slotIndex > 2 || !targetId) return;

            const targetPlayer = this.players[targetId];
            if (!targetPlayer) return;
            const targetUnit = targetPlayer.state.field[slotIndex];
            if (!targetUnit) return;
            if (currentSize + card.cost > sizeLimit) return;

            // Equip Condition Check
            if (card.equipCondition) {
                const condition = card.equipCondition;
                if (condition === 'アームド' || condition === 'ARMED') {
                    if (!this.hasKeyword(targetUnit, 'ARMED')) return;
                } else if (condition === 'ディフェンダー' || condition === 'DEFENDER') {
                    if (!this.hasKeyword(targetUnit, 'DEFENDER')) return;
                } else if (condition === 'ガーディアンを持つユニット' || condition === 'GUARDIAN') {
                    if (!this.hasKeyword(targetUnit, 'GUARDIAN')) return;
                } else if (condition === 'ベースを持つユニット' || condition === 'BASE') {
                    if (!targetUnit.affiliation?.includes('ベース')) return;
                } else if (condition.includes('コスト') && condition.includes('以下')) {
                    const costMatch = condition.match(/コスト(\d+)以下/);
                    if (costMatch) {
                        const maxCost = parseInt(costMatch[1], 10);
                        if ((targetUnit.cost || 0) > maxCost) return;
                    }
                } else if (condition.includes('コスト') && condition.includes('以上')) {
                    const costMatch = condition.match(/コスト(\d+)以上/);
                    if (costMatch) {
                        const minCost = parseInt(costMatch[1], 10);
                        if ((targetUnit.cost || 0) < minCost) return;
                    }
                } else {
                    // General Keyword Check
                    if (!this.hasKeyword(targetUnit, condition)) return;
                }
            }

            player.state.hand.splice(cardIndex, 1);
            if (!targetUnit.attachments) targetUnit.attachments = [];
            targetUnit.attachments.push(card);
            this.applyEffect(playerId, card, 'ON_ENTRY', { slotIndex, targetId });
            this.applyEffect(playerId, card, 'ON_PLAY', { slotIndex, targetId }); // Keep ON_PLAY for compatibility
        } else if (card.type === 'SKILL') {
            if (currentSize + card.cost > sizeLimit) return;
            player.state.hand.splice(cardIndex, 1);
            player.state.skillZone.push(card);
            this.applyEffect(playerId, card, 'ON_PLAY', targetInfo);
        }
        this.broadcastState();
    }

    public attack(playerId: string, attackerIndex: number, targetIndex: number) {
        if (playerId !== this.turnPlayerId) return;
        if (this.phase !== 'ATTACK') return;
        const player = this.players[playerId];
        if (!player) return;
        const attacker = player.state.field[attackerIndex];
        if (!attacker || attacker.type !== 'UNIT' || attacker.isStunned || attacker.cannotAttack || attacker.attackedThisTurn) return;
        const opponentId = Object.keys(this.players).find(id => id !== playerId);
        if (!opponentId) return;
        const opponent = this.players[opponentId];


        // targetIndex はアタッカーのレーン(attackerIndex)と同じである必要がある（対向ユニットへの攻撃）
        // クライアント側でリーダーをクリックした際に -1 が送られてくる場合は、attackerIndex に読み替える
        const effectiveTargetIndex = targetIndex === -1 ? attackerIndex : targetIndex;
        if (effectiveTargetIndex !== attackerIndex) return;


        // Duelist prevents adjacent Guardians.
        let guardianCandidates: number[] = [];
        if (!this.hasKeyword(attacker, 'DUELIST')) {
            const adjacentSlots = [attackerIndex - 1, attackerIndex + 1].filter(s => s >= 0 && s <= 2);
            guardianCandidates = adjacentSlots.filter(s => {
                const u = opponent.state.field[s];
                return u && this.hasKeyword(u, 'GUARDIAN');
            });
        }

        // Official Rule: Duelist prevents adjacent Guardians if there's a unit in front.
        const unitInFront = opponent.state.field[effectiveTargetIndex];
        if (unitInFront && this.hasKeyword(attacker, 'DUELIST')) {
            this.addLog(`${attacker.name} [DUELIST] prevents adjacent Guardians!`);
            guardianCandidates = [];
        }

        attacker.attackedThisTurn = true;
        this.applyEffect(playerId, attacker, 'ON_ATTACK', { slotIndex: attackerIndex });
        this.pendingAttack = { attackerId: playerId, attackerIndex, defenderId: opponentId, targetIndex: effectiveTargetIndex };
        if (guardianCandidates.length > 0) {
            this.phase = 'GUARDIAN_INTERCEPT';
            this.broadcastState();
            return;
        }
        this.finalizeAttackResolution();
    }

    private finalizeAttackResolution() {
        if (!this.pendingAttack) return;
        const { attackerId, attackerIndex, defenderId, targetIndex } = this.pendingAttack;

        // Emit Attack Animation
        this.emitAnimation('ATTACK', {
            attackerId,
            attackerIndex,
            defenderId,
            targetIndex
        });

        const defenderPlayer = this.players[defenderId];
        const defender = defenderPlayer.state.field[targetIndex];

        if (!defender) {
            // Direct Attack
            const attacker = this.players[attackerId].state.field[attackerIndex];
            if (attacker) {
                const hitCount = this.getUnitHitCount(attackerId, attackerIndex);
                this.dealDamage(defenderId, hitCount);
                this.addLog(`${this.players[attackerId].username}'s unit dealt ${hitCount} damage to leader.`);
            }
            if ((this.phase as any) !== 'SELECT_CARD') {
                this.phase = 'ATTACK';
            }
            this.pendingAttack = null;
        } else {
            const attacker = this.players[attackerId].state.field[attackerIndex];
            if (attacker && this.hasKeyword(attacker, 'DUELIST')) {
                this.addLog(`${attacker.name} [DUELIST] forces defense!`);
                this.phase = 'DEFENSE';
                this.resolveDefense(defenderId, 'BLOCK');
            } else {
                this.phase = 'DEFENSE';
            }
        }
        this.broadcastState();
    }

    public resolveGuardianIntercept(playerId: string, interceptSlot: number | 'NONE') {
        if (this.phase !== 'GUARDIAN_INTERCEPT' || !this.pendingAttack) return;
        if (playerId !== this.pendingAttack.defenderId) return;
        if (interceptSlot === 'NONE') {
            this.finalizeAttackResolution();
        } else {
            const defender = this.players[playerId];
            const unit = defender.state.field[interceptSlot];
            if (unit && this.hasKeyword(unit, 'GUARDIAN')) {
                this.pendingAttack.targetIndex = interceptSlot;
                this.finalizeAttackResolution();
            }
        }
    }

    public resolveDefense(playerId: string, action: 'BLOCK' | 'TAKE') {
        if (this.phase !== 'DEFENSE' || !this.pendingAttack) return;
        if (playerId !== this.pendingAttack.defenderId) return;
        const { attackerId, attackerIndex, defenderId, targetIndex } = this.pendingAttack;
        const attackerPlayer = this.players[attackerId];
        const defenderPlayer = this.players[defenderId];
        const attacker = attackerPlayer.state.field[attackerIndex];
        const defender = defenderPlayer.state.field[targetIndex];

        if (action === 'BLOCK' && attacker && this.hasKeyword(attacker, 'BREAKTHROUGH')) {
            // Cannot block due to Breakthrough
            return;
        }
        if (!attacker || !defender) {
            this.phase = 'ATTACK';
            this.pendingAttack = null;
            this.broadcastState();
            return;
        }

        if (action === 'BLOCK') {
            const attPower = this.getUnitPower(attackerId, attackerIndex);
            const defPower = this.getUnitPower(defenderId, targetIndex);

            const attackerInvincible = this.hasKeyword(attacker, 'INVINCIBLE');
            const defenderInvincible = this.hasKeyword(defender, 'INVINCIBLE');

            if (attPower >= defPower) {
                if (!defenderInvincible) {
                    this.destroyUnit(defenderId, targetIndex, attackerId, attackerIndex, 'BATTLE');

                    // PENETRATION (貫通) Logic
                    if (attacker && this.hasKeyword(attacker, 'PENETRATION')) {
                        const val = this.getKeywordValue(attacker, 'PENETRATION');
                        this.addLog(`${attacker.name} [PENETRATION] dealt ${val} damage.`);
                        this.dealDamage(defenderId, val);
                    }

                    // LOOT Keyword
                    if (this.hasKeyword(attacker, 'LOOT')) {
                        const lootValue = this.getKeywordValue(attacker, 'LOOT');
                        for (let i = 0; i < lootValue; i++) {
                            if (attackerPlayer.state.deck.length > 0) {
                                attackerPlayer.drawCard(attackerPlayer.state.deck.pop()!);
                            }
                        }
                        this.addLog(`${attacker.name} activated LOOT! Drawn ${lootValue} card(s).`);
                    }
                } else {
                    this.addLog(`${defender.name} is INVINCIBLE! Not destroyed.`);
                }
            } else {
                if (!attackerInvincible) {
                    this.destroyUnit(attackerId, attackerIndex, defenderId, targetIndex, 'BATTLE');
                } else {
                    this.addLog(`${attacker.name} is INVINCIBLE! Not destroyed.`);
                }
            }

        } else {
            const hitCount = this.getUnitHitCount(attackerId, attackerIndex);
            this.dealDamage(defenderId, hitCount);

            // INFILTRATE (潜入) Logic
            if (attacker && this.hasKeyword(attacker, 'INFILTRATE')) {
                const val = this.getKeywordValue(attacker, 'INFILTRATE');
                this.addLog(`${attacker.name} [INFILTRATE] activated! Drawing ${val} card(s).`);
                for (let i = 0; i < val; i++) {
                    if (attackerPlayer.state.deck.length > 0) {
                        attackerPlayer.drawCard(attackerPlayer.state.deck.pop()!);
                    }
                }
            }
        }
        if (action === 'BLOCK' && defender.isSelfDestruct) {
            this.addLog(`${defender.name} の [自壊] 効果が発動しました。`);
            this.destroyUnit(defenderId, targetIndex, undefined, undefined, 'EFFECT');
        }

        // --- FIX: Prevent overwriting selection phase ---
        if ((this.phase as any) !== 'SELECT_CARD') {
            this.phase = 'ATTACK';
        }
        this.pendingAttack = null;
        this.checkStateBasedActions();
        this.broadcastState();
    }

    public resolveSelection(playerId: string, selectedIds: string[]) {
        if (!this.selection || playerId !== this.selection.playerId) return;
        const player = this.players[playerId];
        const action = this.selection.action;
        if (action === 'ADD_TO_HAND_FROM_DECK') {
            const candidateIds = (this.selection.context as any)?.candidates || [];
            selectedIds.forEach(id => {
                const idx = player.state.deck.findIndex(c => c.id === id);
                if (idx !== -1) player.drawCard(player.state.deck.splice(idx, 1)[0]);
            });
            // Return remaining candidates to bottom of deck (randomly shuffled rest)
            const remainingCandidateIds = candidateIds.filter((id: string) => !selectedIds.includes(id));
            if (remainingCandidateIds.length > 0) {
                const remainingCards: Card[] = [];
                remainingCandidateIds.forEach((id: string) => {
                    const idx = player.state.deck.findIndex(c => c.id === id);
                    if (idx !== -1) {
                        remainingCards.push(player.state.deck.splice(idx, 1)[0]);
                    }
                });
                // Shuffle the rest and put at bottom
                remainingCards.sort(() => Math.random() - 0.5);
                player.state.deck.unshift(...remainingCards);
                this.addLog(`${remainingCards.length} cards returned to bottom of deck.`);
            }
        } else if (action === 'ADD_TO_HAND') {
            selectedIds.forEach(id => {
                const idx = player.state.discard.findIndex(c => c.id === id);
                if (idx !== -1) player.drawCard(player.state.discard.splice(idx, 1)[0]);
            });
        } else if (action === 'DISCARD_HAND' || action === 'MULLIGAN') {
            if (this.phase === 'MULLIGAN' && action === 'MULLIGAN') {
                if (selectedIds.length > 0) {
                    // Mulligan All
                    const returnedCards = [...player.state.hand];
                    player.state.hand = [];
                    player.state.deck.unshift(...returnedCards);
                    player.state.deck.sort(() => Math.random() - 0.5);
                    for (let i = 0; i < 5; i++) {
                        if (player.state.deck.length > 0) player.drawCard(player.state.deck.pop()!);
                    }
                    this.addLog(`${player.username} performed MULLIGAN (All).`);
                } else {
                    this.addLog(`${player.username} kept original hand.`);
                }

                player.state.mulliganDone = true;

                // Check if both players are ready
                const allDone = Object.values(this.players).every(p => p.state.mulliganDone);
                if (allDone) {
                    this.addLog(`All players ready. Starting first turn!`);
                    this.phase = 'LEVEL_UP';
                    this.handleLevelUpPhase();
                }
            } else {
                selectedIds.forEach(id => {
                    const idx = player.state.hand.findIndex(c => c.id === id);
                    if (idx !== -1) {
                        const [card] = player.state.hand.splice(idx, 1);
                        player.state.discard.push(card);
                        this.addLog(`${player.username} discarded ${card.name}.`);
                    }
                });
            }
        } else if (action === 'KILL_UNIT_SELECTION') {
            const opponentId = (this.selection.context as any)?.opponentId;
            if (opponentId && selectedIds.length > 0) {
                const opponent = this.players[opponentId];
                const selectedId = selectedIds[0];
                const slotIndex = opponent.state.field.findIndex(u => u?.id === selectedId);
                if (slotIndex !== -1) {
                    this.destroyUnit(opponentId, slotIndex);
                }
            }
        } else if (action === 'BOUNCE_UNIT_SELECTION') {
            const opponentId = (this.selection.context as any)?.opponentId;
            if (opponentId && selectedIds.length > 0) {
                const opponent = this.players[opponentId];
                const selectedId = selectedIds[0];
                const slotIndex = opponent.state.field.findIndex(u => u?.id === selectedId);
                if (slotIndex !== -1) {
                    const unit = opponent.state.field[slotIndex];
                    if (unit) {
                        opponent.drawCard(unit);
                        if (unit.attachments) {
                            unit.attachments.forEach(item => opponent.drawCard(item));
                            unit.attachments = [];
                        }
                        opponent.state.field[slotIndex] = null;
                        this.addLog(`${unit.name} and its items were returned to hand.`);
                    }
                }
            }
        } else if (action === 'SWAP_DAMAGE_STEP_1') {
            if (selectedIds.length > 0) {
                const selectedId = selectedIds[0];
                const idx = player.state.damageZone.findIndex(c => c.id === selectedId);
                if (idx !== -1) {
                    const [card] = player.state.damageZone.splice(idx, 1);
                    player.drawCard(card);
                    this.addLog(`${card.name} moved from damage zone to hand.`);
                    if (player.state.hand.length > 0) {
                        this.requestSelection(playerId, 'HAND', player.state.hand.map(c => c.id), 1, 'SWAP_DAMAGE_STEP_2');
                    }
                }
            }
        } else if (action === 'SWAP_DAMAGE_STEP_2') {
            if (selectedIds.length > 0) {
                const selectedId = selectedIds[0];
                const idx = player.state.hand.findIndex(c => c.id === selectedId);
                if (idx !== -1) {
                    const [card] = player.state.hand.splice(idx, 1);
                    player.state.damageZone.push(card);
                    this.addLog(`${card.name} moved from hand to damage zone.`);
                }
            }
        } else if (action === 'DEBUFF_ENEMY_SELECTION') {
            if (selectedIds.length > 0) {
                const selectedId = selectedIds[0];
                const opponentId = (this.selection.context as any)?.opponentId;
                const value = (this.selection.context as any)?.value || 0;
                const drawOnKill = (this.selection.context as any)?.drawOnKill;
                if (opponentId) {
                    const opponent = this.players[opponentId];
                    const slotIndex = opponent.state.field.findIndex(u => u?.id === selectedId);
                    if (slotIndex !== -1) {
                        const unit = opponent.state.field[slotIndex];
                        if (unit) {
                            if (!unit.tempPowerDebuff) unit.tempPowerDebuff = 0;
                            unit.tempPowerDebuff += value;
                            this.addLog(`${unit.name} power -${value} by trigger.`);
                            this.checkDrawOnKill(playerId, opponentId, slotIndex, drawOnKill);
                        }
                    }
                }
            }
        } else if (action === 'GRANT_ABILITY_SELECTION') {
            const keywords = (this.selection.context as any)?.keywords?.split(',') || [];
            selectedIds.forEach(id => {
                const unit = player.state.field.find(u => u?.id === id);
                if (unit) {
                    if (!unit.tempKeywords) unit.tempKeywords = [];
                    unit.tempKeywords.push(...keywords);
                    this.addLog(`Granted ${keywords.join(',')} to ${unit.name}.`);
                }
            });
        } else if (action === 'SUMMON_SELECTION') {
            if (selectedIds.length > 0) {
                const id = selectedIds[0];
                const idx = player.state.discard.findIndex(c => c.id === id);
                if (idx !== -1) {
                    const [card] = player.state.discard.splice(idx, 1);
                    const freeSlot = player.state.field.findIndex(s => s === null);
                    if (freeSlot !== -1) {
                        player.state.field[freeSlot] = card;
                        this.addLog(`${card.name} resurrected to field.`);
                        this.applyEffect(playerId, card, 'ON_ENTRY', { slotIndex: freeSlot });
                    } else {
                        player.state.discard.push(card);
                        this.addLog(`No space on field for ${card.name}.`);
                    }
                }
            }
        } else if (action === 'COST_BASED_KILL_STEP_1') {
            const opponentId = (this.selection.context as any)?.opponentId;
            if (selectedIds.length > 0 && opponentId) {
                const id = selectedIds[0];
                const idx = player.state.hand.findIndex(c => c.id === id);
                if (idx !== -1) {
                    const [card] = player.state.hand.splice(idx, 1);
                    player.state.discard.push(card);
                    const discardedCost = card.cost || 0;
                    this.addLog(`${card.name} discarded for cost-based kill.`);
                    const opponent = this.players[opponentId];
                    const validIds = opponent.state.field.filter(u => u && (u.cost || 0) < discardedCost).map(u => u!.id);

                    if (validIds.length > 0) {
                        this.requestSelection(playerId, 'FIELD', validIds, 1, 'COST_BASED_KILL_STEP_2', { opponentId });
                    }
                }
            }
        } else if (action === 'COST_BASED_KILL_STEP_2') {
            const opponentId = (this.selection.context as any)?.opponentId;
            if (opponentId && selectedIds.length > 0) {
                const opponent = this.players[opponentId];
                const slotIndex = opponent.state.field.findIndex(u => u?.id === selectedIds[0]);
                if (slotIndex !== -1) this.destroyUnit(opponentId, slotIndex);
            }
        } else if (action === 'RECYCLE_SELECTION') {
            selectedIds.forEach(id => {
                const idx = player.state.discard.findIndex(c => c.id === id);
                if (idx !== -1) player.drawCard(player.state.discard.splice(idx, 1)[0]);
            });
            this.addLog(`${player.username} recycled ${selectedIds.length} cards.`);
        }

        this.selection = null;
        this.checkStateBasedActions();
        this.broadcastState();
    }

    public useActiveAbility(playerId: string, slotIndex: number) {
        if (this.phase !== 'MAIN' || playerId !== this.turnPlayerId) return;
        const player = this.players[playerId];
        const unit = player.state.field[slotIndex];
        if (!unit || unit.activeUsedThisTurn) return;
        if (unit.effects) {
            unit.effects.forEach(e => {
                if (e.trigger === 'ACTIVE') this.applyEffect(playerId, unit, 'ACTIVE', { slotIndex });
            });
        }
        unit.activeUsedThisTurn = true;
        this.checkStateBasedActions();
        this.broadcastState();
    }

    public dealDamage(playerId: string, amount: number = 1) {
        const player = this.players[playerId];
        if (!player) return;
        for (let i = 0; i < amount; i++) {
            if (player.state.deck.length > 0) {
                const damageCard = player.state.deck.pop()!;
                player.state.hp++;
                const isTrigger = !!(damageCard.effects?.some(e => e.trigger === 'ON_DAMAGE_TRIGGER'));
                this.broadcastAction(playerId, 'DAMAGE_REVEAL', {
                    card: damageCard,
                    isTrigger,
                    playerName: player.username
                });

                if (isTrigger) {
                    this.applyEffect(playerId, damageCard, 'ON_DAMAGE_TRIGGER');

                    // Check if any trigger effect requires trashing this card
                    const shouldTrash = damageCard.effects?.some(e =>
                        e.trigger === 'ON_DAMAGE_TRIGGER' && e.isSelfTrash
                    );

                    if (shouldTrash) {
                        // Move to discard instead of damage zone
                        player.state.discard.push(damageCard);
                        this.addLog(`${damageCard.name} was trashed by trigger effect.`);
                    } else if (!(damageCard as any)._skipDamageZone) {
                        player.state.damageZone.push(damageCard);
                    }

                    // Official Rule: Immediately end damage check on trigger
                    this.addLog(`Trigger revealed! Ending damage check.`);
                    break;
                } else if (!(damageCard as any)._skipDamageZone) {
                    player.state.damageZone.push(damageCard);
                }

                // Check Damage Loss
                if (player.state.damageZone.length >= 10) {
                    this.endGame(playerId, "ダメージが10に達した");
                    return;
                }
            } else {
                // Deck Out during Damage
                this.endGame(playerId, "山札切れ（ダメージ）");
                return;
            }
        }
        this.broadcastState();
    }

    public applyEffect(playerId: string, card: Card, trigger: string, context?: Record<string, unknown>, specificEffect?: CardEffect) {
        const player = this.players[playerId];
        if (!player) return;

        const effectContext = context as {
            tempPowerRef?: { power: number },
            slotIndex?: number,
            targetSlot?: number,
            killSlot?: number,
            value?: number
        } | undefined;

        const opponentId = Object.keys(this.players).find(id => id !== playerId);
        const opponent = opponentId ? this.players[opponentId] : null;

        let effectsToProcess = [...(card?.effects || [])];
        if (card.attachments) {
            card.attachments.forEach(item => {
                if (item.effects) {
                    effectsToProcess.push(...item.effects);
                }
            });
        }

        if (specificEffect) {
            effectsToProcess = [specificEffect];
        }

        effectsToProcess.forEach(effect => {
            if (effect.trigger !== trigger) return;

            // --- Awakening Check ---
            if (effect.isAwakening && player.state.leaderLevel < (card.awakeningLevel || 0)) {
                console.log(`[Game] Skipping Awakening Effect: ${effect.action} (Leader Level ${player.state.leaderLevel} < ${card.awakeningLevel})`);
                return;
            }

            // --- Condition Check ---
            if (effect.condition) {
                if (effect.condition === 'ARMED_GE_3') {
                    const itemNum = card.attachments?.length || 0;
                    if (itemNum < 3) return;
                }
                if (effect.condition === 'ARMED_IF_EQUIPPED') {
                    const itemNum = card.attachments?.length || 0;
                    if (itemNum === 0) return;
                }
                if (effect.condition === 'ARMED_UNIQUE_IF_EQUIPPED') {
                    const hasUnique = card.attachments?.some(item =>
                        item.affiliation?.includes('ユニーク') || item.text?.includes('《ユニーク》') || item.name?.includes('ユニーク')
                    );
                    if (!hasUnique) return;
                }
                if (effect.condition === 'OPPONENT_HAND_GE_3') {
                    if (!opponent || opponent.state.hand.length < 3) return;
                }
                if (effect.condition === 'OPPONENT_HAND_GE_4') {
                    if (!opponent || opponent.state.hand.length < 4) return;
                }
                if (effect.condition === 'MY_HAND_LE_2') {
                    if (player.state.hand.length > 2) return;
                }
            }

            console.log(`[Game] Applying Effect: ${effect.action} (Trigger: ${trigger})`);

            switch (effect.action) {
                case 'DRAW': {
                    const amount = effect.value || 1;
                    for (let i = 0; i < amount; i++) {
                        if (player.state.deck.length > 0) {
                            const drawn = player.state.deck.pop();
                            if (drawn) player.drawCard(drawn);
                        }
                    }
                    break;
                }
                case 'SEARCH_DECK': {
                    let candidates: Card[] = [];
                    if (effect.targetType === 'DECK_TOP') {
                        const count = effect.value || 3;
                        candidates = player.state.deck.slice(-count).reverse();
                    } else {
                        candidates = player.state.deck;
                    }

                    // Apply all filters
                    if (effect.condition) {
                        const conditions = effect.condition.split('_AND_');
                        conditions.forEach(cond => {
                            if (cond === 'TYPE_UNIT') {
                                candidates = candidates.filter(c => c.type === 'UNIT');
                            } else if (cond === 'TYPE_ITEM') {
                                candidates = candidates.filter(c => c.type === 'ITEM');
                            } else if (cond.startsWith('COST_LE_')) {
                                const cost = parseInt(cond.replace('COST_LE_', ''), 10);
                                candidates = candidates.filter(c => (c.cost || 0) <= cost);
                            }
                        });
                    }

                    const candidateIds = candidates.map(c => c.id);
                    if (candidateIds.length > 0) {
                        this.requestSelection(playerId, 'DECK', candidateIds, 1, 'ADD_TO_HAND_FROM_DECK', {
                            targetType: effect.targetType,
                            candidates: candidateIds // Store candidates for returning rest to bottom
                        }, card);
                    }
                    break;
                }
                case 'DAMAGE_UNIT': {
                    if (!opponent) return;
                    const slotIndex = effectContext?.slotIndex ?? effectContext?.targetSlot;
                    if (effect.targetType === 'ALL_ENEMIES') {
                        opponent.state.field.forEach((u, i) => {
                            if (u && u.power !== undefined && effect.value) {
                                u.power -= effect.value;
                                // Emit Damage (Unit Debuff) - technically damage/debuff? let's call it damage for popup
                                this.emitAnimation('DAMAGE', {
                                    targetId: opponentId,
                                    slotIndex: i,
                                    value: effect.value,
                                    location: 'UNIT'
                                });
                            }
                        });
                    } else if (effect.targetType === 'OPPOSING') {
                        const slotIndex = effectContext?.slotIndex;
                        if (typeof slotIndex === 'number') {
                            const targetUnit = opponent.state.field[slotIndex];
                            if (targetUnit && targetUnit.power !== undefined && effect.value) {
                                targetUnit.power -= effect.value;
                                this.emitAnimation('DAMAGE', {
                                    targetId: opponentId,
                                    slotIndex: slotIndex,
                                    value: effect.value,
                                    location: 'UNIT'
                                });
                            }
                        }
                    } else if (typeof slotIndex === 'number') {
                        const targetUnit = opponent.state.field[slotIndex];
                        if (targetUnit && targetUnit.power !== undefined && effect.value) {
                            // ITEM_SHIELD Check
                            if (this.hasKeyword(targetUnit, 'ITEM_SHIELD') && targetUnit.attachments && targetUnit.attachments.length > 0) {
                                this.addLog(`!! ${targetUnit.name} blocked damage with ITEM_SHIELD.`);
                                return;
                            }
                            targetUnit.power -= effect.value;
                            this.emitAnimation('DAMAGE', {
                                targetId: opponentId,
                                slotIndex: slotIndex,
                                value: effect.value,
                                location: 'UNIT'
                            });
                        }
                    }
                    break;
                }
                case 'BUFF_ALLY': {
                    const slotIndex = effectContext?.slotIndex;
                    if (typeof slotIndex === 'number') {
                        const targetUnit = player.state.field[slotIndex];
                        if (targetUnit && targetUnit.power !== undefined) {
                            if (!targetUnit.tempPowerBuff) targetUnit.tempPowerBuff = 0;
                            targetUnit.tempPowerBuff += (effect.value || 0);
                        }
                    } else if (effect.targetType === 'SELF') {
                        const selfIndex = player.state.field.findIndex(u => u && u.id === card.id);
                        if (selfIndex !== -1 && player.state.field[selfIndex]) {
                            const unit = player.state.field[selfIndex]!;
                            if (!unit.tempPowerBuff) unit.tempPowerBuff = 0;
                            unit.tempPowerBuff += (effect.value || 0);
                        }
                    } else if (effect.targetType === 'ALL_ALLIES') {
                        player.state.field.forEach(u => {
                            if (u) {
                                if (!u.tempPowerBuff) u.tempPowerBuff = 0;
                                u.tempPowerBuff += (effect.value || 0);
                            }
                        });
                    }
                    break;
                }
                case 'BUFF_HIT': {
                    const slotIndex = effectContext?.slotIndex;
                    if (typeof slotIndex === 'number') {
                        const targetUnit = player.state.field[slotIndex];
                        if (targetUnit) {
                            if (!targetUnit.tempHitBuff) targetUnit.tempHitBuff = 0;
                            targetUnit.tempHitBuff += (effect.value || 0);
                        }
                    } else if (effect.targetType === 'SELF') {
                        const selfIndex = player.state.field.findIndex(u => u && u.id === card.id);
                        if (selfIndex !== -1 && player.state.field[selfIndex]) {
                            const unit = player.state.field[selfIndex]!;
                            if (!unit.tempHitBuff) unit.tempHitBuff = 0;
                            unit.tempHitBuff += (effect.value || 0);
                        }
                    }
                    break;
                }
                case 'DEAL_DAMAGE_PLAYER': {
                    if (!opponentId) return;
                    this.dealDamage(opponentId, effect.value || 1);
                    break;
                }
                case 'DEBUFF_ENEMY': {
                    if (!opponent) return;
                    if (effect.targetType === 'ALL_ENEMIES') {
                        opponent.state.field.forEach(u => {
                            if (u) {
                                if (!u.tempPowerDebuff) u.tempPowerDebuff = 0;
                                u.tempPowerDebuff += (effect.value || 0);
                            }
                        });
                    } else if (effect.targetType === 'OPPOSING') {
                        const slotIndex = effectContext?.slotIndex;
                        if (typeof slotIndex === 'number') {
                            const u = opponent.state.field[slotIndex];
                            if (u) {
                                if (!u.tempPowerDebuff) u.tempPowerDebuff = 0;
                                u.tempPowerDebuff += (effect.value || 0);
                                if (opponentId) this.checkDrawOnKill(playerId, opponentId, slotIndex, effect.drawOnKill);
                            }
                        }
                    } else if (effect.targetType === 'SINGLE') {
                        // Request selection for manual target
                        const candidates = opponent.state.field.filter(u => u !== null).map(u => u!.id);
                        if (candidates.length > 0 && opponentId) {
                            this.requestSelection(playerId, 'FIELD', candidates, 1, 'DEBUFF_ENEMY_SELECTION', {
                                opponentId,
                                value: effect.value,
                                drawOnKill: effect.drawOnKill
                            }, card);
                        }
                    }
                    break;
                }
                case 'STUN_UNIT': {
                    if (!opponent) return;
                    if (effect.targetType === 'SINGLE' && typeof effectContext?.targetSlot === 'number') {
                        const u = opponent.state.field[effectContext.targetSlot];
                        if (u) u.isStunned = true;
                    } else if (effect.targetType === 'OPPOSING') {
                        const slotIndex = effectContext?.slotIndex;
                        if (typeof slotIndex === 'number') {
                            const u = opponent.state.field[slotIndex];
                            if (u) u.isStunned = true;
                        }
                    }
                    break;
                }
                case 'HEAL_LEADER': {
                    const heal = effect.value || 1;
                    if (player.state.hp > 0) {
                        player.state.hp = Math.max(0, player.state.hp - heal);
                    }
                    break;
                }
                case 'KILL_UNIT': {
                    if (!opponent) return;
                    const targetSlot = effectContext?.targetSlot;

                    if (effect.targetType === 'OPPOSING') {
                        const slotIndex = effectContext?.slotIndex;
                        if (typeof slotIndex === 'number' && opponentId) {
                            this.destroyUnit(opponentId, slotIndex);
                        }
                    } else if (effect.targetType === 'SINGLE') {
                        // For trigger effects, need to select from valid targets
                        if (trigger === 'ON_DAMAGE_TRIGGER' || trigger === 'ON_PLAY') {
                            // Filter candidates by cost condition
                            const candidates: number[] = [];
                            opponent.state.field.forEach((unit, idx) => {
                                if (!unit) return;

                                // Check cost condition
                                if (effect.condition && effect.condition.startsWith('COST_LE_')) {
                                    const maxCost = parseInt(effect.condition.replace('COST_LE_', ''), 10);
                                    if ((unit.cost || 0) > maxCost) return;
                                }

                                candidates.push(idx);
                            });

                            if (candidates.length > 0 && opponentId) {
                                // Request selection from valid targets
                                this.requestSelection(playerId, 'FIELD', candidates.map(idx => opponent.state.field[idx]!.id), 1, 'KILL_UNIT_SELECTION', { opponentId }, card);
                            }
                        } else if (typeof targetSlot === 'number' && opponentId) {
                            this.destroyUnit(opponentId, targetSlot);
                        }
                    }
                    break;
                }
                case 'BOUNCE_UNIT': {
                    if (!opponent || !opponentId) return;

                    if (effect.targetType === 'SINGLE') {
                        if (trigger === 'ON_DAMAGE_TRIGGER' || trigger === 'ON_PLAY') {
                            // Filter candidates by condition
                            let candidates: number[] = [];

                            if (effect.condition === 'LOWEST_COST') {
                                // Find lowest cost unit(s)
                                let lowestCost = Infinity;
                                opponent.state.field.forEach((unit, idx) => {
                                    if (unit && (unit.cost || 0) < lowestCost) {
                                        lowestCost = unit.cost || 0;
                                    }
                                });

                                opponent.state.field.forEach((unit, idx) => {
                                    if (unit && (unit.cost || 0) === lowestCost) {
                                        candidates.push(idx);
                                    }
                                });
                            } else {
                                // All units are candidates
                                opponent.state.field.forEach((unit, idx) => {
                                    if (unit) candidates.push(idx);
                                });
                            }

                            if (candidates.length > 0) {
                                this.requestSelection(playerId, 'FIELD', candidates.map(idx => opponent.state.field[idx]!.id), 1, 'BOUNCE_UNIT_SELECTION', { opponentId }, card);
                            }
                        }
                    }
                    break;
                }
                case 'SWAP_DAMAGE_HAND': {
                    // Step 1: Select item card from damage zone to add to hand
                    let candidates: Card[] = [];

                    if (effect.targetType === 'DAMAGE_ITEM') {
                        // Filter damage zone for item cards
                        candidates = player.state.damageZone.filter(c => c.type === 'ITEM');
                    }

                    if (candidates.length > 0) {
                        this.requestSelection(playerId, 'DAMAGE_ZONE', candidates.map(c => c.id), 1, 'SWAP_DAMAGE_STEP_1', undefined, card);
                    }
                    break;
                }
                case 'COST_BASED_KILL': {
                    // Step 1: Select unit card from hand to discard
                    if (effect.targetType === 'HAND_UNIT') {
                        const unitCards = player.state.hand.filter(c => c.type === 'UNIT');
                        if (unitCards.length > 0) {
                            this.requestSelection(playerId, 'HAND', unitCards.map(c => c.id), 1, 'COST_BASED_KILL_STEP_1', { opponentId }, card);
                        }
                    }
                    break;
                }
                case 'DISCARD': {
                    if (effect.targetType === 'SELF') {
                        // Player discards from own hand
                        const count = effect.value || 1;
                        if (player.state.hand.length > 0) {
                            this.requestSelection(playerId, 'HAND', player.state.hand.map(c => c.id), count, 'DISCARD_HAND', undefined, card);
                        }
                    } else {
                        // Opponent discards
                        if (!opponentId || !opponent) return;
                        const count = effect.value || 1;
                        if (opponent.state.hand.length > 0) {
                            this.requestSelection(opponentId, 'HAND', opponent.state.hand.map(c => c.id), count, 'DISCARD_HAND', undefined, card);
                        }
                    }
                    break;
                }
                case 'ADD_FROM_DISCARD': {
                    // Often used as [Trigger] to add the trigger card to hand
                    if (effect.targetType === 'SELF') {
                        // In dealDamage, the card is pushed to damageZone AFTER applyEffect.
                        // So we need to remove it from where it's about to be or handle it specially.
                        // However, current dealDamage implementation:
                        // 1. pop from deck
                        // 2. applyEffect
                        // 3. push to damageZone
                        // So if we add to hand here, we should prevent it from being pushed to damageZone in dealDamage?
                        // That's tricky with current structure.
                        // Let's modify applyEffect return or state flag.
                        player.drawCard(card);
                        (card as any)._skipDamageZone = true;
                    } else if (effect.targetType === 'DISCARD') {
                        // Filter discard pile by conditions
                        let candidates = player.state.discard;

                        if (effect.condition) {
                            const conditions = effect.condition.split('_AND_');
                            conditions.forEach(cond => {
                                if (cond === 'TYPE_UNIT') {
                                    candidates = candidates.filter(c => c.type === 'UNIT');
                                } else if (cond === 'TYPE_ITEM') {
                                    candidates = candidates.filter(c => c.type === 'ITEM');
                                } else if (cond.startsWith('COST_LE_')) {
                                    const cost = parseInt(cond.replace('COST_LE_', ''), 10);
                                    candidates = candidates.filter(c => (c.cost || 0) <= cost);
                                }
                            });
                        }

                        if (candidates.length > 0) {
                            this.requestSelection(playerId, 'DISCARD', candidates.map(c => c.id), effect.value || 1, 'ADD_TO_HAND', undefined, card);
                        }
                    }
                    break;
                }
                case 'LEVEL_UP': {
                    const amount = effect.value || 1;
                    if (player.state.leaderLevel < 10) {
                        const oldLevel = player.state.leaderLevel;
                        player.state.leaderLevel = Math.min(10, player.state.leaderLevel + amount);
                        if (player.state.leaderLevel > oldLevel) {
                            this.broadcastAction(playerId, 'LEVEL_UP', { level: player.state.leaderLevel });
                        }
                    }
                    break;
                }
                case 'RECYCLE': {
                    const count = effect.value || 1;
                    if (player.state.discard.length > 0) {
                        const candidates = player.state.discard;
                        this.requestSelection(playerId, 'DISCARD', candidates.map(c => c.id), count, 'RECYCLE_SELECTION', undefined, card);
                    }
                    break;
                }
                case 'SET_POWER': {
                    const targets: { pId: string, idx: number }[] = [];
                    if (effect.targetType === 'SELF') {
                        const idx = player.state.field.findIndex(u => u && u.id === card.id);
                        if (idx !== -1) targets.push({ pId: playerId, idx });
                    } else if (effect.targetType === 'OPPOSING') {
                        const slotIndex = effectContext?.slotIndex;
                        if (typeof slotIndex === 'number' && opponentId) {
                            targets.push({ pId: opponentId, idx: slotIndex });
                        }
                    }

                    targets.forEach(t => {
                        const targetPlayer = this.players[t.pId];
                        const unit = targetPlayer.state.field[t.idx];
                        if (unit) {
                            const currentPower = this.getUnitPower(t.pId, t.idx);
                            const diff = (effect.value || 0) - currentPower;
                            if (!unit.tempPowerBuff) unit.tempPowerBuff = 0;
                            unit.tempPowerBuff += diff;
                            this.addLog(`${unit.name} のパワーが ${effect.value} に変更されました。`);
                        }
                    });
                    break;
                }
                case 'SALVAGE_EQUIPMENT': {
                    const items = card.attachments || [];
                    if (items.length > 0) {
                        // Simplified: Automically salvage the first item
                        const item = items[0];
                        player.drawCard(item);
                        this.addLog(`${item.name} salvaged from destroyed unit.`);
                    }
                    break;
                }
                case 'POWER_COPY_FRIEND': {
                    let maxPower = 0;
                    player.state.field.forEach((u, i) => {
                        if (u && this.hasKeyword(u, 'GUARDIAN')) {
                            const p = this.getUnitPower(playerId, i);
                            if (p > maxPower) maxPower = p;
                        }
                    });

                    if (maxPower > 0) {
                        const selfIndex = player.state.field.findIndex(u => u && u.id === card.id);
                        if (selfIndex !== -1) {
                            const self = player.state.field[selfIndex]!;
                            const currentSelf = this.getUnitPower(playerId, selfIndex);
                            const diff = maxPower - currentSelf;
                            if (!self.tempPowerBuff) self.tempPowerBuff = 0;
                            self.tempPowerBuff += diff;
                        }
                    }
                    break;
                }
                case 'RESTRICT_ATTACK': {
                    const targetType = effect.targetType;
                    if (targetType === 'SELF') {
                        const slotIndex = player.state.field.findIndex(u => u && u.id === card.id);
                        if (slotIndex !== -1 && player.state.field[slotIndex]) {
                            const unit = player.state.field[slotIndex]!;
                            if (effect.value === 0) { // Permanent
                                if (!unit.keywords) unit.keywords = [];
                                if (!unit.keywords.includes('PERMANENT_CANNOT_ATTACK')) {
                                    unit.keywords.push('PERMANENT_CANNOT_ATTACK');
                                }
                            }
                            unit.cannotAttack = true;
                        }
                    }
                    break;
                }
                case 'GRANT_ABILITY': {
                    const keywords = effect.grantedKeyword?.split(',') || [];
                    const targets: Card[] = [];
                    if (effect.targetType === 'SELF') {
                        const selfIndex = player.state.field.findIndex(u => u && u.id === card.id);
                        if (selfIndex !== -1 && player.state.field[selfIndex]) targets.push(player.state.field[selfIndex]!);
                    } else if (effect.targetType === 'SINGLE') {
                        // For play/trigger effects, request selection
                        if (trigger === 'ON_PLAY' || trigger === 'ON_DAMAGE_TRIGGER' || trigger === 'ACTIVE') {
                            const alliedUnits = player.state.field.filter(u => u !== null) as Card[];
                            if (alliedUnits.length > 0) {
                                this.requestSelection(playerId, 'FIELD', alliedUnits.map(u => u.id), 1, 'GRANT_ABILITY_SELECTION', { keywords: effect.grantedKeyword }, card);
                                return;
                            }
                        }
                    } else if (effect.targetType === 'ALL_ALLIES') {
                        player.state.field.forEach(u => { if (u) targets.push(u); });
                    }

                    targets.forEach(t => {
                        if (!t.tempKeywords) t.tempKeywords = [];
                        keywords.forEach((k: string) => {
                            if (!t.tempKeywords!.includes(k)) t.tempKeywords!.push(k);
                        });
                        this.addLog(`${t.name} gained [${keywords.join(', ')}] until turn end.`);
                    });
                    break;
                }
                case 'RESURRECT': {
                    let candidates = player.state.discard;
                    if (effect.condition) {
                        if (effect.condition.startsWith('COST_LE_')) {
                            const cost = parseInt(effect.condition.replace('COST_LE_', ''), 10);
                            candidates = candidates.filter(c => (c.cost || 0) <= cost);
                        }
                    }
                    if (candidates.length > 0) {
                        this.requestSelection(playerId, 'DISCARD', candidates.map(c => c.id), 1, 'SUMMON_SELECTION', undefined, card);
                    }
                    break;
                }
                case 'SPECIAL_VICTORY': {
                    if (this.checkSpecialVictory(playerId)) {
                        const opponentId = Object.keys(this.players).find(id => id !== playerId);
                        if (opponentId) this.endGame(opponentId, "Special Victory Condition Met!");
                    }
                    break;
                }
            }

            // Handle isSelfTrash (for units/items with one-time triggers)
            if (effect.isSelfTrash && (trigger === 'ON_PLAY' || trigger === 'ACTIVE' || trigger === 'ON_ENTRY')) {
                // If it's in hand (skills usually move elsewhere first, but just in case)
                const handIdx = player.state.hand.findIndex(c => c.id === card.id);
                if (handIdx !== -1) {
                    player.state.hand.splice(handIdx, 1);
                    player.state.discard.push(card);
                    this.addLog(`${card.name} was trashed by its own effect.`);
                } else {
                    // If it's on field (unit or equipped item)
                    const fieldIdx = player.state.field.findIndex(c => c && c.id === card.id);
                    if (fieldIdx !== -1) {
                        this.destroyUnit(playerId, fieldIdx, undefined, undefined, 'RULE');
                        this.addLog(`${card.name} was trashed from field by its own effect.`);
                    }
                }
            }
        });
        this.checkStateBasedActions();
    }

    private getUnitPower(playerId: string, slotIndex: number): number {
        const player = this.players[playerId];
        const unit = player.state.field[slotIndex];
        if (!unit) return 0;
        let power = unit.power || 0;
        power += (unit.tempPowerBuff || 0);
        power -= (unit.tempPowerDebuff || 0);
        if (unit.attachments) {
            unit.attachments.forEach(a => {
                if (a.power) power += a.power;
                if (a.effects) {
                    a.effects.forEach(eff => {
                        if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_ALLY') {
                            power += (eff.value || 0);
                        }
                    });
                }
            });
        }

        // Leader Passives (Mirror GameBoard.tsx logic)
        if (player.state.leader.effects) {
            const isAwakened = player.state.leaderLevel >= (player.state.leader.awakeningLevel || 5);
            player.state.leader.effects.forEach(eff => {
                if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_ALLY') {
                    // Check Awakening requirement
                    if (eff.isAwakening && !isAwakened) return;

                    // Check MY_TURN if applicable
                    if (eff.condition?.includes('MY_TURN') && this.turnPlayerId !== playerId) return;

                    if (eff.condition === 'COUNT_UNITS') {
                        const count = player.state.field.filter(u => u !== null).length;
                        power += (eff.value || 0) * count;
                    } else if (eff.condition && eff.condition.startsWith('KEYWORD_')) {
                        const targetKeyword = eff.condition.replace('KEYWORD_', '');
                        if (this.hasKeyword(unit, targetKeyword)) {
                            power += (eff.value || 0);
                        }
                    } else if (player.state.leader.text?.includes('[アタッカー]') && player.state.leader.text?.includes('パワー+')) {
                        // Fallback for missing keyword condition in JSON
                        if (this.hasKeyword(unit, 'アタッカー')) {
                            power += (eff.value || 0);
                        }
                    } else if (!eff.condition || eff.condition === 'MY_TURN') {
                        // General buff to all allies
                        power += (eff.value || 0);
                    }
                }
            });
        }


        // DEFENDER Bonus: Dynamic power bonus when defending (being attacked)
        if ((this.phase === 'DEFENSE' || this.phase === 'GUARDIAN_INTERCEPT') &&
            this.pendingAttack &&
            this.pendingAttack.defenderId === playerId &&
            this.pendingAttack.targetIndex === slotIndex &&
            this.hasKeyword(unit, 'DEFENDER')
        ) {
            power += (unit.defenderBonus || 0);
        }

        return Math.max(0, power);

    }



    private getUnitHitCount(playerId: string, slotIndex: number): number {
        const player = this.players[playerId];
        const unit = player.state.field[slotIndex];
        if (!unit) return 0;

        let hitCount = unit.hitCount || 1;
        if (unit.tempHitBuff) hitCount += unit.tempHitBuff;

        // INFILTRATE (潜入) no longer adds hitCount. It's an effect on hit.

        // Attached Item Passives
        if (unit.attachments) {
            unit.attachments.forEach(a => {
                if (a.effects) {
                    a.effects.forEach(eff => {
                        if (eff.trigger === 'PASSIVE') {
                            if (eff.action === 'BUFF_HIT' || eff.action === 'SET_HIT') {
                                hitCount += (eff.value || 0);
                            }
                        }
                    });
                }
            });
        }

        // Card Passives (Mirror GameBoard.tsx logic)
        if (unit.effects) {
            unit.effects.forEach(eff => {
                if (eff.trigger === 'PASSIVE' && eff.action === 'SET_HIT') {
                    if (eff.condition === 'FIELD_FULL') {
                        const isFull = player.state.field.every(u => u !== null);
                        if (isFull) hitCount += (eff.value || 0);
                    }
                    if (eff.condition === 'COUNT_BASE') {
                        const baseCount = player.state.field.filter(u => u?.affiliation?.includes('ベース')).length;
                        hitCount += (eff.value || 1) * baseCount;
                    }
                }
            });
        }

        return hitCount;
    }

    private destroyUnit(playerId: string, slotIndex: number, killerId?: string, killerSlot?: number, reason: 'BATTLE' | 'EFFECT' | 'RULE' | 'FORCE' = 'RULE') {
        const player = this.players[playerId];
        const unit = player.state.field[slotIndex];
        if (!unit) return;
        const unitId = unit.id;

        // INVINCIBLE Logic (Official Q&A: Rule-based trashing bypasses immunity)
        if (this.hasKeyword(unit, 'INVINCIBLE') && reason !== 'RULE' && reason !== 'FORCE') {
            this.addLog(`${unit.name} is INVINCIBLE! Not destroyed.`);
            return;
        }

        // ITEM_SHIELD Logic (Optional Selection)
        if (reason !== 'FORCE' && reason !== 'RULE' && this.hasKeyword(unit, 'ITEM_SHIELD') && unit.attachments && unit.attachments.length > 0) {
            // Check if already prompted? (For now, assume single prompt)

            // Allow user to select WHICH item to sacrifice
            this.requestSelection(
                playerId,
                'FIELD', // Technically selecting from attachments, but we'll handle context
                unit.attachments.map(a => a.id),
                1,
                'RESOLVE_ITEM_SHIELD',
                { unitSlot: slotIndex, unitId: unit.id }, // Context
                unit
            );
            return;
        }

        // Trigger ON_DESTROY effects
        this.applyEffect(playerId, unit, 'ON_DESTROY');
        this.applyEffect(playerId, unit, 'ON_EXIT');

        // Emit Destroy Animation
        this.emitAnimation('DESTROY', {
            playerId,
            slotIndex,
            unitId: unit.id
        });

        player.state.discard.push(unit);
        player.state.field[slotIndex] = null;
        this.addLog(`${unit.name} destroyed`);

        // Death Touch Logic
        if (this.hasKeyword(unit, 'DEATH_TOUCH') && killerId && typeof killerSlot === 'number' && reason === 'BATTLE') {
            const killerPlayer = this.players[killerId];
            const killerUnit = killerPlayer.state.field[killerSlot];
            if (killerUnit && !this.hasKeyword(killerUnit, 'INVINCIBLE')) {
                const killerCost = killerUnit.cost || 0;
                const selfCost = unit.cost || 0;
                if (killerCost <= selfCost) {
                    this.addLog(`${unit.name}'s DEATH_TOUCH activated! Destroying ${killerUnit.name} (Cost ${killerCost} <= ${selfCost}).`);
                    // Note: We call destroyUnit recursively, but without killer info to avoid infinite loop
                    this.destroyUnit(killerId, killerSlot, undefined, undefined, 'EFFECT');
                } else {
                    this.addLog(`${unit.name}'s DEATH_TOUCH failed. (Killer Cost ${killerCost} > ${selfCost}).`);
                }
            }
        }

        // Trigger ON_OTHER_UNIT_DESTROY for other units on the field
        Object.keys(this.players).forEach(pId => {
            const p = this.players[pId];
            p.state.field.forEach((u, i) => {
                if (u && u.id !== unitId && u.effects) {
                    u.effects.forEach(e => {
                        if (e.trigger === 'ON_OTHER_UNIT_DESTROY') {
                            this.applyEffect(pId, u, 'ON_OTHER_UNIT_DESTROY', { slotIndex: i, destroyedUnitId: unitId });
                        }
                    });
                }
            });
        });
    }

    private checkBerserkerMustAttack(): boolean {
        const player = this.players[this.turnPlayerId];
        if (!player) return false;
        return player.state.field.some(u => u && this.hasKeyword(u, 'BERSERKER') && !u.isStunned && !u.cannotAttack && !u.attackedThisTurn);
    }

    private checkStateBasedActions() {
        let stateChanged = false;

        // 1. Check Special Victory
        for (const playerId of Object.keys(this.players)) {
            if (this.checkSpecialVictory(playerId)) {
                this.finishGame(playerId, "Special Victory Condition Met!");
                return;
            }
        }

        // 2. Check for units with 0 or less power and destroy them
        Object.keys(this.players).forEach(playerId => {
            const player = this.players[playerId];
            player.state.field.forEach((unit, slotIndex) => {
                if (unit) {
                    const currentPower = this.getUnitPower(playerId, slotIndex);
                    if (currentPower <= 0) {
                        this.addLog(`!! ${unit.name} destroyed due to 0 power.`);
                        this.destroyUnit(playerId, slotIndex, undefined, undefined, 'RULE');
                        stateChanged = true;
                    }
                }
            });
        });

        if (stateChanged) {
            this.broadcastState();
        }
    }

    private checkSpecialVictory(playerId: string): boolean {
        const player = this.players[playerId];

        // Check Field Units for SPECIAL_VICTORY effects
        for (const unit of player.state.field) {
            if (!unit) continue;
            // Check for explicit SPECIAL_VICTORY action in effects
            const victoryEffects = unit.effects?.filter(e => e.action === 'SPECIAL_VICTORY');
            if (victoryEffects) {
                for (const eff of victoryEffects) {
                    // Condition: HAS_SPECIFIC_CARDS_IN_GRAVE
                    // We expect 'value' to be an array of card IDs (or a string we can parse)
                    if (eff.condition === 'HAS_SPECIFIC_CARDS_IN_GRAVE') {
                        const requiredIds = Array.isArray(eff.value) ? eff.value : [];
                        const trashIds = player.state.discard.map(c => c.id);

                        // Check if all required IDs exist in discard
                        if (requiredIds.length > 0 && requiredIds.every((reqId: string) => trashIds.includes(reqId))) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private endGame(loserId: string, reason: string) {
        if (this.phase === 'FINISHED') return;

        const winnerId = Object.keys(this.players).find(id => id !== loserId);
        if (!winnerId) return; // Should not happen

        this.phase = 'FINISHED';
        this.broadcastAction(winnerId, 'GAME_OVER', {
            winnerId,
            loserId,
            reason
        });

        const winnerName = this.players[winnerId].username;
        this.addLog(`${winnerName} Wins! Reason: ${reason}`);
    }

    public broadcastState() {
        const state: any = {
            roomId: this.id,
            phase: this.phase,
            turnPlayerId: this.turnPlayerId,
            turnCount: this.turnCount,
            players: {},
            selection: this.selection,
            pendingAttack: this.pendingAttack,
            debugLogs: this.debugLogs
        };
        Object.values(this.players).forEach(p => {
            state.players[p.id] = p.state;
        });

        Object.values(this.players).forEach(p => {
            if (p.socket && (p.socket as any).emit) {
                p.socket.emit('gameState', state);
            }
        });

        // Check for AI Actions
        Object.values(this.players).forEach(p => {
            if (p.isCPU && (p as any).think) {
                // If it's the CPU's turn or CPU needs to select something
                if (this.turnPlayerId === p.id || this.selection?.playerId === p.id || this.phase === 'MULLIGAN') {
                    (p as any).think();
                }
            }
        });
    }

    public broadcastAction(playerId: string, actionType: string, data: unknown) {
        Object.values(this.players).forEach(p => {
            p.socket.emit('gameAction', { playerId, actionType, data });
        });
    }

    public union(playerId: string, baseIndex: number, materialIndex: number) {
        if (this.phase !== 'MAIN' || playerId !== this.turnPlayerId) return;
        const player = this.players[playerId];
        const baseUnit = player.state.field[baseIndex];
        const materialUnit = player.state.field[materialIndex];

        if (!baseUnit || !materialUnit) return;
        if (baseIndex === materialIndex) return;

        // Initialize unionCards if needed
        if (!baseUnit.unionCards) baseUnit.unionCards = [];

        // Add material to base
        baseUnit.unionCards.push(materialUnit);
        materialUnit.unionSourceId = baseUnit.id;

        // Remove material from field
        player.state.field[materialIndex] = null;

        this.addLog(`${player.username} combined ${materialUnit.name} into ${baseUnit.name}!`);

        this.checkStateBasedActions();
        this.broadcastState();
    }

    private addLog(msg: string) {
        this.debugLogs.push(msg);
        if (this.debugLogs.length > 50) this.debugLogs.shift();
        console.log(`[Game Log] ${msg}`);
    }

    private emitAnimation(type: 'ATTACK' | 'DAMAGE' | 'DESTROY', data: any) {
        this.io.to(this.id).emit('animation', { type, ...data });
    }

    private requestSelection(playerId: string, type: 'DECK' | 'DISCARD' | 'HAND' | 'FIELD' | 'DAMAGE_ZONE', candidateIds: string[], count: number, action: string, context?: Record<string, unknown>, triggerCard?: Card) {
        this.selection = { playerId, type, candidateIds, count, action, context, triggerCard, previousPhase: this.phase };
        this.phase = 'SELECT_CARD';
        this.broadcastState();
    }

    private getSizeLimit(playerId: string): number {
        const player = this.players[playerId];
        if (!player) return 0;
        const damage = player.state.damageZone.length;
        return player.state.leaderLevel + damage;
    }

    private checkDrawOnKill(playerId: string, opponentId: string, slotIndex: number, drawOnKill?: number) {
        if (!drawOnKill) return;
        const opponent = this.players[opponentId];
        if (!opponent.state.field[slotIndex]) {
            const player = this.players[playerId];
            for (let i = 0; i < drawOnKill; i++) {
                if (player.state.deck.length > 0) player.drawCard(player.state.deck.pop()!);
            }
        }
    }

    public resolveMulligan(playerId: string, selectedIds: string[]) {
        const player = this.players[playerId];
        if (!player || player.state.mulliganDone) return;

        if (selectedIds.length > 0) {
            // Official Rule: Complete Redraw
            const hand = [...player.state.hand];
            player.state.hand = [];
            hand.forEach(c => player.state.deck.push(c));
            player.state.deck.sort(() => Math.random() - 0.5);

            for (let i = 0; i < 5; i++) {
                if (player.state.deck.length > 0) player.drawCard(player.state.deck.pop()!);
            }
            this.addLog(`${player.username} performed Mulligan.`);
        } else {
            this.addLog(`${player.username} kept original hand.`);
        }

        player.state.mulliganDone = true;

        // Start game if both ready
        const allReady = Object.values(this.players).every(p => p.state.mulliganDone);
        if (allReady) {
            this.phase = 'LEVEL_UP';
            this.handleLevelUpPhase();
        }
        this.broadcastState();
    }
}
