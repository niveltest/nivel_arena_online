export type CardType = 'UNIT' | 'SKILL' | 'ITEM' | 'LEADER';

export type EffectTrigger = 'ON_PLAY' | 'ON_ATTACK' | 'ON_DESTROY' | 'ON_DAMAGE_TRIGGER' | 'PASSIVE' | 'ON_AWAKEN' | 'ACTIVE' | 'ON_OTHER_UNIT_DESTROY' | 'ON_EXIT' | 'ON_ENTRY';
export type EffectAction = 'DRAW' | 'DAMAGE_UNIT' | 'BUFF_ALLY' | 'DEAL_DAMAGE_PLAYER' | 'KILL_UNIT' | 'ADD_FROM_DISCARD' | 'SET_HIT' | 'LEVEL_UP' | 'SET_POWER' | 'DEBUFF_ENEMY' | 'STUN_UNIT' | 'HEAL_LEADER' | 'RESTRICT_ATTACK' | 'DISCARD' | 'RECYCLE' | 'SWAP_DAMAGE_HAND' | 'COST_BASED_KILL' | 'SALVAGE_EQUIPMENT' | 'POWER_COPY_FRIEND' | 'SEARCH_DECK' | 'BOUNCE_UNIT' | 'BUFF_HIT' | 'GRANT_ABILITY' | 'RESURRECT' | 'SPECIAL_VICTORY';

export interface CardEffect {
    trigger: EffectTrigger;
    action: EffectAction;
    value?: number;
    targetType?: 'SELF' | 'ALLY' | 'ENEMY' | 'ALL' | 'DISCARD' | 'ALL_ALLIES' | 'ALL_ENEMIES' | 'SINGLE' | 'OPPOSING' | 'DECK_TOP' | 'DAMAGE_ITEM' | 'HAND_UNIT' | 'DECK_ALL';
    condition?: string; // e.g. "SEARCH_TOP_3_LV3", "SEARCH_BASE", "COUNT_BASE", "FIELD_FULL", "LEVEL_UP"
    drawOnKill?: number;
    grantedKeyword?: string;
    isAwakening?: boolean; // 新規：覚醒効果かどうか
    isSelfTrash?: boolean; // 新規：この効果発動時に自身をトラッシュするかどうか
}

export interface Card {
    id: string;
    name: string;
    type: CardType;
    cost: number;
    power?: number; // Only for Units
    hitCount?: number; // Only for Units (Damage dealt to Leader)
    text: string;
    life?: number; // For Leaders
    awakeningLevel?: number; // For Leaders
    awakenedText?: string; // For Leaders
    imageUrl?: string;
    affiliation?: string;
    attribute?: string; // e.g. "炎", "大地", "水", "風", "光", "闇"
    attachments?: Card[]; // For Units holding items
    effects?: CardEffect[];
    keywords?: string[]; // e.g. ["DUELIST", "BERSERKER", "HIT_PLUS_1"]
    hasAttacked?: boolean; // Tracking per turn
    isStunned?: boolean; // If true, cannot attack
    tempPowerDebuff?: number; // Temporary power reduction (positive value = reduction amount)
    tempPowerBuff?: number; // Temporary power increase
    tempHitBuff?: number; // Temporary hit count increase
    tempKeywords?: string[]; // Keywords granted by effects for the turn
    cannotAttack?: boolean; // Temporary effect
    activeUsedThisTurn?: boolean; // Track if active ability was used this turn
    attackedThisTurn?: boolean; // Track if unit attacked this turn
    rarity?: string; // e.g. "C", "R", "SR", "SSR"
    defenderBonus?: number; // Dynamic bonus for DEFENDER keyword
    isSelfDestruct?: boolean; // If unit should be trashed after defending
    equipCondition?: string; // e.g. "ARMED", "DEFENDER", "COST_3_OR_LESS"
    isRecycle?: boolean; // If unit should be returned to hand at end of turn
    unionCards?: Card[]; // Cards combined into this unit
    unionSourceId?: string; // If this card is part of a union, the base card ID
}

export interface Deck {
    leader: Card;
    cards: Card[];
}

export interface Player {
    id: string;
    username: string;
    hp: number; // Damage taken (0 to 10)
    maxHp: number; // 10
    leader: Card; // current leader state? (Level might change)
    leaderLevel: number;
    hand: Card[];
    deck: Card[];
    discard: Card[];
    field: (Card | null)[]; // Fixed 3 slots: [Left, Center, Right]
    damageZone: Card[]; // Cards in damage zone
    skillZone: Card[]; // Skills used this turn (cleared at end of turn)
    resources: number; // Current available resources (Size)
    unitsPlaced?: boolean[]; // Tracking per turn per slot [Left, Center, Right]
    unitsPlayedThisTurn?: number; // Total units played this turn
    mulliganDone?: boolean;
}

export interface PendingAttack {
    attackerId: string;
    attackerIndex: number;
    defenderId: string;
    targetIndex: number;
}

export interface SelectionState {
    playerId: string;
    type: 'DECK' | 'DISCARD' | 'HAND' | 'FIELD' | 'DAMAGE_ZONE';
    candidateIds: string[]; // IDs of cards to choose from
    count: number;
    action: string; // The action to perform after selection (e.g. 'ADD_TO_HAND')
    context?: Record<string, unknown>;
    triggerCard?: Card; // The card that triggered this selection
    previousPhase: GameState['phase']; // The phase to return to after selection
}

// Animation Types
export interface AttackAnimationData {
    attackerId: string;
    attackerIndex: number;
    defenderId: string;
    targetIndex: number;
}

export interface DamageAnimationData {
    targetId: string;
    slotIndex: number;
    value: number;
    location: 'UNIT' | 'LEADER';
}

export interface DestroyAnimationData {
    playerId: string;
    slotIndex: number;
    unitId: string;
}

export type AnimationType = 'ATTACK' | 'DAMAGE' | 'DESTROY';

export type AnimationEvent =
    | { id: string; type: 'ATTACK'; data: AttackAnimationData }
    | { id: string; type: 'DAMAGE'; data: DamageAnimationData }
    | { id: string; type: 'DESTROY'; data: DestroyAnimationData };

export interface GameState {
    roomId: string;
    phase: 'WAITING' | 'MULLIGAN' | 'LEVEL_UP' | 'DRAW' | 'MAIN' | 'ATTACK' | 'DEFENSE' | 'SELECT_CARD' | 'DISCARD' | 'GUARDIAN_INTERCEPT' | 'END' | 'FINISHED';
    turnPlayerId: string;
    players: Record<string, Player>; // Map playerId to Player
    turnCount: number;
    pendingAttack?: PendingAttack | null;
    selection?: SelectionState | null;
    debugLogs?: string[];
}

