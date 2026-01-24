"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Card from './Card';
import SelectionModal from './SelectionModal';
import CardDetailModal from './CardDetailModal';
import ResultModal from './ResultModal';
import { GameState, Card as CardType, type AnimationEvent, AnimationType, AttackAnimationData, DamageAnimationData, DestroyAnimationData } from '../shared/types';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
import { SoundManager } from '../utils/SoundManager';

// Playmat Layout Types
interface PlaymatZoneConfig {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    translate?: string;
    gap?: string;
    scale?: string;
    rotation?: string;
}

interface PlaymatThemeConfig {
    leader: PlaymatZoneConfig;
    field0: PlaymatZoneConfig;
    field1: PlaymatZoneConfig;
    field2: PlaymatZoneConfig;
    deck?: PlaymatZoneConfig;
    trash?: PlaymatZoneConfig;
    skill?: PlaymatZoneConfig;
    damage?: PlaymatZoneConfig;
    level: {
        showSidebar: boolean;
        position: 'official-side' | 'left-edge' | 'left-overlap';
    };
}

const PLAYMAT_CONFIGS: Record<'official' | 'mermaid' | 'cyber', PlaymatThemeConfig> = {
    official: {
        leader: { top: '75.0%', left: '13.1%', rotation: '0deg', bottom: 'auto', right: 'auto', scale: '1.0' },
        field0: { top: '20.0%', left: '35.0%', scale: '0.8', bottom: 'auto', right: 'auto' },
        field1: { top: '20.0%', left: '50.0%', scale: '0.8', bottom: 'auto', right: 'auto' },
        field2: { top: '20.0%', left: '65.0%', scale: '0.8', bottom: 'auto', right: 'auto' },
        deck: { top: '29.4%', left: '88.5%', scale: '0.67', bottom: 'auto', right: 'auto' },
        trash: { top: '72.3%', left: '88.2%', scale: '0.67', bottom: 'auto', right: 'auto' },
        skill: { bottom: 'auto', right: 'auto', scale: '0.65', left: '69.3%', top: '84.7%' },
        damage: { top: '83.3%', left: '32.1%', bottom: 'auto', right: 'auto', scale: '1.2' },
        level: { showSidebar: true, position: 'official-side' }
    },
    mermaid: {
        leader: { bottom: '15%', left: '12%' },
        field0: { bottom: '45%', left: '40%', scale: '0.7' },
        field1: { bottom: '45%', left: '50%', scale: '0.7' },
        field2: { bottom: '45%', left: '60%', scale: '0.7' },
        deck: { bottom: '10%', right: '5%' },
        trash: { bottom: '25%', right: '5%' },
        skill: { bottom: '40%', right: '5%' },
        damage: { bottom: '4%', left: '28%' },
        level: { showSidebar: true, position: 'left-edge' }
    },
    cyber: {
        leader: { bottom: '15%', left: '15%' },
        field0: { bottom: '35%', left: '35%', scale: '0.8' },
        field1: { bottom: '35%', left: '50%', scale: '0.8' },
        field2: { bottom: '35%', left: '65%', scale: '0.8' },
        deck: { bottom: '15%', right: '12%' },
        trash: { bottom: '40%', right: '12%' },
        skill: { bottom: '65%', right: '12%' },
        damage: { bottom: '5%', right: '15%' },
        level: { showSidebar: true, position: 'left-edge' }
    }
};

// SoundManager handles SFX

type PlaymatId = 'official' | 'mermaid' | 'cyber';

interface PlaymatAreaProps {
    p: GameState['players'][string];
    isOpponent: boolean;
    matId: PlaymatId;
    config: PlaymatThemeConfig;
    renderSlot: (cards: (CardType | null)[], index: number, isEnemy: boolean) => React.ReactNode;
    handleShowDetail: (card: CardType) => void;
    setShowDamageZoneFor: (player: string | null) => void;
    isEditMode: boolean;
    onLayoutChange: (zoneKey: keyof PlaymatThemeConfig, newPos: Partial<PlaymatZoneConfig>) => void;
    onEnemyTargetClick?: (index: number) => void;
    onSkillZoneClick?: () => void;
}

const DraggableZone: React.FC<{
    zoneKey: keyof PlaymatThemeConfig;
    config: PlaymatZoneConfig;
    isEditMode: boolean;
    onLayoutChange: (key: keyof PlaymatThemeConfig, pos: Partial<PlaymatZoneConfig>) => void;
    children: React.ReactNode;
    className?: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
    isOpponent?: boolean;
}> = ({ zoneKey, config, isEditMode, onLayoutChange, children, className, containerRef, isOpponent }) => {
    const zoneRef = useRef<HTMLDivElement>(null);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        // Calculate percentages
        const newLeft = ((info.point.x - rect.left) / rect.width) * 100;
        const newTop = ((info.point.y - rect.top) / rect.height) * 100;

        onLayoutChange(zoneKey, {
            left: `${newLeft.toFixed(1)}%`,
            top: `${newTop.toFixed(1)}%`,
            bottom: 'auto',
            right: 'auto'
        });
    };

    const handleResizeDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!zoneRef.current) return;
        const rect = zoneRef.current.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        // Calculate distance from center to drag point
        const dx = info.point.x - center.x;
        const dy = info.point.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Base distance roughly corresponds to scale 1.0
        // Small tweak: use a reference distance (e.g., 60px)
        const baseDistance = 60;
        const newScale = (distance / baseDistance);

        // Clamp scale
        const clampedScale = Math.max(0.2, Math.min(3.0, newScale));

        onLayoutChange(zoneKey, {
            scale: clampedScale.toFixed(2)
        });
    };

    const currentScale = parseFloat(config.scale || '1');

    return (
        <motion.div
            ref={zoneRef}
            drag={isEditMode}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className={`${className} draggable-zone ${isEditMode ? 'cursor-move ring-2 ring-yellow-400 ring-dashed z-[100]' : ''}`}
            style={{
                position: 'absolute',
                top: config.top || 'auto',
                bottom: config.bottom || 'auto',
                left: config.left || 'auto',
                right: config.right || 'auto',
                transform: `translate(-50%, -50%) scale(${currentScale}) rotate(${config.rotation || '0deg'}) ${isOpponent ? 'rotate(180deg)' : ''}`,
                transformOrigin: 'center center',
                pointerEvents: isEditMode ? 'auto' : 'none',
                zIndex: className?.includes('z-') ? undefined : (isEditMode ? 100 : 20),
            } as React.CSSProperties}
        >
            {isEditMode && (
                <>
                    <div className="absolute -top-7 left-0 bg-yellow-400 text-black text-[10px] px-1 font-bold whitespace-nowrap z-50">
                        {zoneKey} (SC: {currentScale})
                    </div>
                    {/* Resize Handle */}
                    <motion.div
                        drag
                        dragMomentum={false}
                        onDrag={handleResizeDrag}
                        dragConstraints={zoneRef}
                        className="absolute bottom-[-10px] right-[-10px] w-5 h-5 bg-yellow-400 rounded-full cursor-nwse-resize flex items-center justify-center shadow-lg border-2 border-white z-50 hover:scale-125 transition-transform"
                    >
                        <div className="w-1.5 h-1.5 bg-black rotate-45" />
                    </motion.div>
                </>
            )}
            <div className={isEditMode ? 'pointer-events-none' : 'pointer-events-auto'}>
                {children}
            </div>
        </motion.div>
    );
};

const PlaymatArea: React.FC<PlaymatAreaProps> = ({ p, isOpponent, matId, config, renderSlot, handleShowDetail, setShowDamageZoneFor, isEditMode, onLayoutChange, onEnemyTargetClick, onSkillZoneClick }) => {
    const containerId = `playmat-${isOpponent ? 'opp' : 'me'}`;
    const canvasRef = useRef<HTMLDivElement>(null);

    // Calculate dynamic leader position based on level
    // Base position (Lv.1) is 75%, and moves up by approx 5.5% per level
    const dynamicLeaderTop = config.leader.top ?
        `${parseFloat(config.leader.top) - (p.leaderLevel - 1) * 5.5}%` :
        '75%';

    // We only apply dynamic positioning in normal mode (not edit mode)
    const effectiveLeaderConfig = isEditMode ? config.leader : { ...config.leader, top: dynamicLeaderTop };

    return (
        <div id={containerId} className={`
            flex-1 relative w-full flex items-center justify-center overflow-hidden transition-all duration-700 p-2 sm:p-4
            ${isOpponent ? 'opacity-90 border-b border-white/10 rotate-180' : ''}
        `}>
            <style>{`
                #${containerId} .playmat-canvas {
                    --leader-top: ${config.leader.top || 'auto'};
                    --leader-bottom: ${config.leader.bottom || 'auto'};
                    --leader-left: ${config.leader.left || 'auto'};
                    --leader-right: ${config.leader.right || 'auto'};
                    --leader-rotate: ${config.leader.rotation || '0deg'};

                    --field0-scale: ${config.field0.scale || '1'};
                    --field1-scale: ${config.field1.scale || '1'};
                    --field2-scale: ${config.field2.scale || '1'};

                    --mat-opacity: ${matId === 'mermaid' ? '0.9' : '0.7'};
                    --opponent-rotate: ${isOpponent ? 'rotate(180deg)' : 'rotate(0deg)'};
                    --mat-bg-url: url(${matId === 'mermaid' ? '/images/playmat_mermaid.png' :
                    matId === 'cyber' ? '/images/playmat_bg.png' :
                        '/images/playmat_official.jpg'});
                }
                
                #${containerId} .playmat-bg {
                    background-image: var(--mat-bg-url);
                    opacity: var(--mat-opacity);
                }

                #${containerId} .damage-card-container {
                    transition: all 0.2s ease-out;
                }

                #${containerId} .damage-card-container:first-child {
                    margin-left: 0;
                }

                #${containerId} .damage-card-container:hover {
                    transform: translateY(-15px) scale(1.05);
                    z-index: 100 !important;
                }

            `}</style>
            <div className="relative h-full max-w-full max-h-full flex items-center justify-center p-1 sm:p-4">
                <div className="relative h-full w-auto max-w-full max-h-full aspect-video flex items-center justify-center playmat-canvas" ref={canvasRef}>
                    <div className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 playmat-bg`}></div>

                    {/* Level Zone Sidebar - Positioned relatively to layout but mostly fixed currently */}
                    {config.level.showSidebar && (
                        <div className={`absolute 
                        ${config.level.position === 'official-side'
                                ? 'left-[10.5%] top-[24%] h-[55%] w-[5%] flex flex-col-reverse justify-between py-1'
                                : config.level.position === 'left-overlap'
                                    ? 'left-[4%] bottom-[12%] h-[40%] flex-row-reverse w-[200px] flex gap-2'
                                    : 'left-[2%] top-[15%] h-[70%] w-[40px] flex flex-col-reverse justify-between'} 
                        pointer-events-none z-10`}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lv => (
                                <div key={lv} className={`
                                flex items-center justify-center font-black transition-all duration-300 relative
                                ${config.level.position === 'official-side' ? 'text-[12px] h-6 border-b border-white/5 w-full' : 'text-xl w-full'}
                                ${p.leaderLevel === lv
                                        ? `text-white scale-125 z-10 ${isOpponent ? 'bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.5)]'}`
                                        : 'text-slate-600 opacity-20 bg-black/10'}
                                ${isOpponent ? 'rotate-180' : ''}
                            `}>
                                    {p.leaderLevel === lv && (
                                        <div className="absolute -left-8 text-[8px] font-bold text-white/80 whitespace-nowrap hidden sm:block">
                                            CAP
                                        </div>
                                    )}
                                    {lv}
                                    {p.leaderLevel === lv && (
                                        <div className={`absolute inset-0 border-2 ${isOpponent ? 'border-red-400/50' : 'border-cyan-400/50'} animate-pulse`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Draggable Components */}
                    <DraggableZone zoneKey="leader" config={effectiveLeaderConfig} isEditMode={isEditMode} onLayoutChange={onLayoutChange} containerRef={canvasRef} className="leader-zone" isOpponent={isOpponent}>
                        <div
                            className={`relative group tactical-border p-1 ${isOpponent ? 'border-red-500/30' : 'border-cyan-500/30'} 
                            ${isOpponent && !isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-red-500 transition-all' : ''}
                        `}
                            onClick={() => {
                                if (isOpponent && !isEditMode && onEnemyTargetClick) {
                                    // アタッカーが選択されている場合、正面のレーンへのアタックとして処理
                                    // サーバー側で attackerIndex === targetIndex が期待されているため
                                    // ここでは具体的なレーンを特定できないが、アタッカー自身のインデックスで送信する
                                    // (handleEnemyTargetClick は GameBoard 側で attackingUnitIndex を知っている)
                                    onEnemyTargetClick(-1); // -1 を渡して「リーダーへの意図」を伝える
                                }
                            }}
                        >
                            <div className={`absolute -bottom-4 -left-4 text-[10px] font-black ${isOpponent ? 'text-red-500/50 bg-red-500/10 border-red-500/20' : 'text-cyan-500/50 bg-cyan-500/10 border-cyan-500/20'} px-2 py-0.5 border`}>
                                {isOpponent ? 'TARGET_LOCKED' : 'COMMANDER_ID:001'}
                            </div>
                            <div className="shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden ring-1 ring-white/10">
                                <Card
                                    card={p.leader}
                                    isEnemy={isOpponent}
                                    onShowDetail={handleShowDetail}
                                    isAwakened={p.leaderLevel >= (p.leader.awakeningLevel || 6)}
                                    minimal={true}
                                />
                            </div>
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                <div className={`px-3 py-0.5 ${isOpponent ? 'bg-red-600' : 'bg-cyan-600'} text-white font-black rounded-full shadow-lg border border-white/20 text-xs`}>LV {p.leaderLevel}</div>
                            </div>
                        </div>
                    </DraggableZone>

                    {[0, 1, 2].map(i => {
                        const key = `field${i}` as keyof PlaymatThemeConfig;
                        // 対角線配置の整合性を保つため、相手側のみスロットのインデックスを反転させる (0<->2)
                        // これにより、自分のスロット0(左)の正面に相手のスロット0が配置されるようになる
                        const dataIdx = isOpponent ? (2 - i) : i;

                        return (
                            <DraggableZone key={i} zoneKey={key} config={config[key] as PlaymatZoneConfig} isEditMode={isEditMode} onLayoutChange={onLayoutChange} containerRef={canvasRef} className={`field-slot-${i} z-30`} isOpponent={isOpponent}>
                                {renderSlot(p.field, dataIdx, isOpponent)}
                            </DraggableZone>
                        );
                    })}

                    <DraggableZone zoneKey="deck" config={config.deck || {}} isEditMode={isEditMode} onLayoutChange={onLayoutChange} containerRef={canvasRef} className="canvas-zone z-20" isOpponent={isOpponent}>
                        <div className="relative group perspective-1000">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">Deck ({p.deck.length})</div>
                            {p.deck.length > 0 ? (
                                <div className="w-28 h-40 bg-slate-800 border-2 border-white/20 rounded-lg shadow-xl flex items-center justify-center transform group-hover:rotate-y-12 transition-transform">
                                    <span className="text-3xl opacity-20">🎴</span>
                                </div>
                            ) : (
                                <div className="w-28 h-40 border-2 border-dashed border-white/10 rounded-lg opacity-30"></div>
                            )}
                        </div>
                    </DraggableZone>

                    <DraggableZone zoneKey="trash" config={config.trash || {}} isEditMode={isEditMode} onLayoutChange={onLayoutChange} containerRef={canvasRef} className="canvas-zone z-20" isOpponent={isOpponent}>
                        <div className="relative group">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded italic">Trash ({p.discard.length})</div>
                            {p.discard.length > 0 ? (
                                <div className="w-28 h-40 transition-transform group-hover:scale-105 cursor-pointer">
                                    <Card card={p.discard[p.discard.length - 1]} isHidden={false} onShowDetail={handleShowDetail} className="w-full h-full" />
                                </div>
                            ) : (
                                <div className="w-28 h-40 border-2 border-white/10 rounded-lg flex items-center justify-center text-sm text-white/20 font-bold uppercase">Empty</div>
                            )}
                        </div>
                    </DraggableZone>

                    {config.skill && (
                        <DraggableZone zoneKey="skill" config={config.skill} isEditMode={isEditMode} onLayoutChange={onLayoutChange} containerRef={canvasRef} className="canvas-zone z-20" isOpponent={isOpponent}>
                            <div
                                className={`relative group italic transition-all duration-300
                                ${!isOpponent && !isEditMode ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
                            `}
                                onClick={() => {
                                    if (!isOpponent && !isEditMode && onSkillZoneClick) {
                                        onSkillZoneClick();
                                    }
                                }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-cyan-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">Skill Zone</div>
                                <div className={`w-28 h-40 border-2 rounded-lg flex items-center justify-center text-sm font-bold uppercase backdrop-blur-sm relative overflow-visible transition-colors
                                ${!isOpponent && !isEditMode ? 'border-cyan-500/40 text-cyan-500/40 hover:border-cyan-400 hover:text-cyan-400' : 'border-cyan-500/20 text-cyan-500/20'}
                                ${p.skillZone.length > 0 ? 'border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : ''}
                            `}>
                                    {p.skillZone.length > 0 ? (
                                        <div className="relative w-full h-full">
                                            {p.skillZone.map((card, idx) => (
                                                <div
                                                    key={card.id}
                                                    className={`absolute inset-0 transition-transform duration-300 stack-offset-${idx}`}
                                                >
                                                    <Card card={card} onShowDetail={handleShowDetail} className="w-full h-full shadow-lg" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse"></div>
                                            <span className="relative z-10">Slot</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </DraggableZone>
                    )}

                    <DraggableZone zoneKey="damage" config={config.damage || {}} isEditMode={isEditMode} onLayoutChange={onLayoutChange} containerRef={canvasRef} className="canvas-zone" isOpponent={isOpponent}>
                        <div className="relative flex items-center h-40 cursor-pointer"
                            onClick={() => setShowDamageZoneFor(isOpponent ? 'opponent' : 'me')}
                        >
                            {/* Overlapping Cards - Stable Flex Layout anchored to start/left */}
                            <div className={`flex items-center justify-start ${isOpponent ? 'flex-row-reverse' : 'flex-row'}`}>
                                {p.damageZone.map((card, i) => (
                                    <div key={i}
                                        data-index={i}
                                        className={`relative transition-all duration-300 overflow-visible damage-card-container z-index-${i} ${i > 0 ? (isOpponent ? 'mr-[-3.9rem]' : 'ml-[-3.9rem]') : ''}`}
                                    >
                                        <div className="origin-center shadow-[0_8px_16px_rgba(0,0,0,0.8)] ring-1 ring-white/30 rounded-lg overflow-hidden bg-black/90">
                                            <Card card={card} isHidden={false} onShowDetail={handleShowDetail} minimal={true} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DraggableZone>
                </div>
            </div>
        </div>
    );
};

interface GameBoardProps {
    username: string;
    roomId: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ username, roomId }) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string>('');
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [attackingUnitIndex, setAttackingUnitIndex] = useState<number | null>(null);
    const [showDamageZoneFor, setShowDamageZoneFor] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const isProcessingRef = useRef(false);
    const [detailCard, setDetailCard] = useState<CardType | null>(null);
    const [damageCardReveal, setDamageCardReveal] = useState<{ card: CardType; isTrigger: boolean; playerName: string } | null>(null);
    const [gameResult, setGameResult] = useState<{ result: 'WIN' | 'LOSE'; reason: string } | null>(null);
    const [isDamaging, setIsDamaging] = useState(false);
    const [opponentDisconnected, setOpponentDisconnected] = useState<{ timeoutSec: number; remaining: number } | null>(null);
    const [showDebugLogs, setShowDebugLogs] = useState(false);
    const [playmatId, setPlaymatId] = useState<PlaymatId>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedPlaymat') : null;
        return (saved === 'mermaid' || saved === 'cyber' || saved === 'official') ? saved : 'official';
    });
    const [opponentPlaymatId, setOpponentPlaymatId] = useState<PlaymatId>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedOpponentPlaymat') : null;
        return (saved === 'mermaid' || saved === 'cyber' || saved === 'official') ? saved : 'official';
    });
    const [showPlaymatSelector, setShowPlaymatSelector] = useState(false);
    const [customLayout, setCustomLayout] = useState<PlaymatThemeConfig>(PLAYMAT_CONFIGS[playmatId]);
    const [activeAnimations, setActiveAnimations] = useState<AnimationEvent[]>([]);

    // Update customLayout if playmatId changes externally (via selector)
    useEffect(() => {
        setCustomLayout(PLAYMAT_CONFIGS[playmatId]);
    }, [playmatId]);

    const selectedCard = gameState && playerId && gameState.players[playerId] && selectedCardIndex !== null
        ? gameState.players[playerId].hand[selectedCardIndex]
        : null;

    // Playmat state initialized from localStorage in useState initializers to avoid cascaded renders

    useEffect(() => {
        SoundManager.preload();
        const newSocket = io(SOCKET_URL);
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('Connected to server:', newSocket.id);
            setPlayerId(newSocket.id || '');

            // Load deck from localStorage
            let deckData = undefined;
            const savedDeck = localStorage.getItem('myDeck');
            const savedLeader = localStorage.getItem('myLeader');
            if (savedDeck && savedLeader) {
                deckData = {
                    deckIdList: JSON.parse(savedDeck),
                    leaderId: savedLeader
                };
            }

            const starterDeckId = localStorage.getItem('selectedStarterDeck');

            newSocket.emit('joinGame', {
                username: username || 'Player-' + newSocket.id?.substr(0, 4),
                roomId,
                deckData,
                starterDeckId
            });
        });

        // Animation Listener
        newSocket.on('animation', (evt: { type: AnimationType;[key: string]: unknown }) => {
            const animId = Math.random().toString(36).substring(7);
            const { type, ...data } = evt;
            setActiveAnimations(prev => [...prev, { id: animId, type: type, data: data as unknown } as AnimationEvent]);

            // Auto-remove animation after duration
            setTimeout(() => {
                setActiveAnimations(prev => prev.filter(a => a.id !== animId));
            }, 2000); // 2 seconds duration
        });

        newSocket.on('gameState', (newState: GameState) => {
            console.log('Game State Update:', newState);

            setGameState(prevState => {
                // Play sounds on certain state changes
                if (prevState && newSocket.id) {
                    const myState = newState.players[newSocket.id];
                    const myOldState = prevState.players[newSocket.id];
                    if (myState && myOldState) {
                        if (myState.hand.length > myOldState.hand.length) SoundManager.play('draw');
                        if (myState.resources > myOldState.resources) SoundManager.play('levelUp');
                    }
                }
                return newState;
            });

            setSelectedCardIndex(null);
            setAttackingUnitIndex(null);
        });

        // Playmat preference handled in useState initializers for better performance

        newSocket.on('error', (msg: string) => {
            alert(`エラー: ${msg}`);
            window.location.reload(); // Go back to lobby
        });

        newSocket.on('gameAction', (action: { playerId: string; actionType: string; data: unknown }) => {
            if (action.actionType === 'DAMAGE_REVEAL') {
                const drData = action.data as { card: CardType; isTrigger: boolean; playerName: string };
                setDamageCardReveal(drData);
                const isMe = drData.playerName === username;
                if (isMe) {
                    setIsDamaging(true);
                    SoundManager.play('damage');
                    setTimeout(() => setIsDamaging(false), 500);
                } else {
                    SoundManager.play('damage');
                }
                // Auto-hide after 3 seconds
                setTimeout(() => setDamageCardReveal(null), 3000);
            } else if (action.actionType === 'ATTACK') {
                SoundManager.play('attack');
            } else if (action.actionType === 'GAME_OVER') {
                const data = action.data as { winnerId: string; reason: string };
                const { winnerId, reason } = data;
                if (socketRef.current && socketRef.current.id === winnerId) {
                    setGameResult({ result: 'WIN', reason });
                } else {
                    setGameResult({ result: 'LOSE', reason });
                }
            }
        });

        newSocket.on('action', (action: { actionType: string; data: unknown }) => {
            if (action.actionType === 'PLAYER_DISCONNECTED') {
                const dcData = action.data as { playerId: string; timeoutSec: number };
                if (dcData.playerId !== newSocket.id) {
                    setOpponentDisconnected({ timeoutSec: dcData.timeoutSec, remaining: dcData.timeoutSec });
                }
            } else if (action.actionType === 'PLAYER_RECONNECTED') {
                const rcData = action.data as { playerId: string };
                if (rcData.playerId !== newSocket.id) {
                    setOpponentDisconnected(null);
                }
            } else if (action.actionType === 'GAME_OVER') {
                const data = action.data as { winnerId: string; reason: string };
                const { winnerId, reason } = data;
                if (socketRef.current && socketRef.current.id === winnerId) {
                    setGameResult({ result: 'WIN', reason });
                } else {
                    setGameResult({ result: 'LOSE', reason });
                }
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [roomId, username]);

    // Timer for disconnection countdown
    useEffect(() => {
        if (!opponentDisconnected) return;
        const timer = setInterval(() => {
            setOpponentDisconnected(prev => {
                if (!prev || prev.remaining <= 0) return prev;
                return { ...prev, remaining: prev.remaining - 1 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [opponentDisconnected]);

    if (!gameState || !playerId || Object.keys(gameState.players).length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white gap-4">
                <div className="text-xl animate-pulse">対戦相手を待っています...</div>
                <div className="text-3xl font-mono font-bold text-yellow-500 bg-white/10 px-8 py-4 rounded-lg border border-yellow-500/30">
                    Room ID: {roomId}
                </div>
                <div className="text-sm text-gray-400">このIDを対戦相手に共有してください</div>
                <button
                    onClick={() => {
                        const starterDeckId = localStorage.getItem('selectedStarterDeck') || 'ST01';
                        socketRef.current?.emit('addCPU', { roomId, starterDeckId });
                    }}
                    className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition transform hover:scale-105"
                >
                    CPU対戦を開始する (Solo Play)
                </button>
            </div>
        );
    }

    const me = gameState.players[playerId];
    const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
    const opponent = opponentId ? gameState.players[opponentId] : null;

    if (!me || !opponent) return <div>同期中...</div>;

    const isMyTurn = gameState.turnPlayerId === playerId;



    const handleEndTurn = () => {
        if (isMyTurn && !isProcessingRef.current) {
            isProcessingRef.current = true;
            socketRef.current?.emit('nextPhase');
            // Prevent double clicks for 500ms
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 500);
        }
    };


    const handleHandCardClick = (index: number) => {
        if (!isMyTurn || gameState.phase !== 'MAIN') return;
        setAttackingUnitIndex(null); // Clear attack selection
        if (selectedCardIndex === index) {
            setSelectedCardIndex(null);
        } else {
            setSelectedCardIndex(index);
        }
    };

    const handleFieldSlotClick = (slotIndex: number) => {
        // Play Phase Logic
        if (gameState.phase === 'MAIN' && selectedCardIndex !== null) {
            const card = me.hand[selectedCardIndex];
            // ユニットとアイテムのみフィールドスロットでのプレイを許可
            if (card.type === 'UNIT' || card.type === 'ITEM') {
                SoundManager.play('play_card');
                socketRef.current?.emit('playCard', { cardIndex: selectedCardIndex, targetInfo: { slotIndex } });
            }
        }
    };

    const handleSkillZoneClick = () => {
        if (!isMyTurn || gameState.phase !== 'MAIN' || selectedCardIndex === null) return;
        const card = me.hand[selectedCardIndex];
        if (card.type === 'SKILL') {
            SoundManager.play('play_card');
            // スキルカードはスロット指定なしでプレイ（サーバー側で skillZone に追加される）
            socketRef.current?.emit('playCard', { cardIndex: selectedCardIndex });
        }
    };

    const handleMyUnitClick = (unitIndex: number) => {
        if (!isMyTurn || gameState.phase !== 'ATTACK') return;

        // Select attacker
        if (attackingUnitIndex === unitIndex) {
            setAttackingUnitIndex(null);
        } else {
            const card = me.field[unitIndex];
            if (card && !card.attackedThisTurn && !card.isStunned && !card.cannotAttack) {
                setAttackingUnitIndex(unitIndex);
            }
        }
    };

    const handleEnemyTargetClick = (targetIndex: number) => {
        // targetIndex -1 is Leader
        if (!isMyTurn || gameState.phase !== 'ATTACK' || attackingUnitIndex === null) return;

        SoundManager.play('attack');
        // リーダーをクリックした場合（-1）は、アタッカーと同じレーンを攻撃対象とする
        const finalTargetIndex = targetIndex === -1 ? attackingUnitIndex : targetIndex;
        socketRef.current?.emit('attack', { attackerIndex: attackingUnitIndex, targetIndex: finalTargetIndex });
        setAttackingUnitIndex(null);
    };

    const handleUseActive = (slotIndex: number) => {
        socketRef.current?.emit('useActiveAbility', { slotIndex });
    };

    const handleGuardianIntercept = (interceptSlot: number | 'NONE') => {
        socketRef.current?.emit('resolveGuardianIntercept', { interceptSlot });
    };

    const handleShowDetail = (card: CardType) => {
        setDetailCard(card);
    };

    const hasKeyword = (card: CardType, keyword: string): boolean => {
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
            'GUARDIAN': '防壁'
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
        if (card.text?.includes(jp)) {
            return true;
        }

        return false;
    };

    const getCalculatedStats = (targetPlayerId: string, card: CardType) => {
        if (!gameState || card.type !== 'UNIT') return { power: card.power || 0, hitCount: card.hitCount || 1 };

        const p = gameState.players[targetPlayerId];
        let totalPower = card.power || 0;
        let totalHit = card.hitCount || 1;

        // Apply temporary buffs from server state
        totalPower += (card.tempPowerBuff || 0);
        totalPower -= (card.tempPowerDebuff || 0);
        totalHit += (card.tempHitBuff || 0);

        // Attached Items Stat Buffs
        if (card.attachments) {
            card.attachments.forEach(a => {
                if (a.power) totalPower += a.power;
                if (a.effects) {
                    a.effects.forEach(eff => {
                        if (eff.trigger === 'PASSIVE') {
                            if (eff.action === 'BUFF_ALLY') {
                                totalPower += (eff.value || 0);
                            } else if (eff.action === 'BUFF_HIT' || eff.action === 'SET_HIT') {
                                totalHit += (eff.value || 0);
                            }
                        }
                    });
                }
            });
        }

        // Leader Passives (Synced with Game.ts)
        if (p.leader.effects) {
            const isAwakened = p.leaderLevel >= (p.leader.awakeningLevel || 5);
            p.leader.effects.forEach(eff => {
                if (eff.trigger === 'PASSIVE' && eff.action === 'BUFF_ALLY') {
                    // Check Awakening requirement
                    if (eff.isAwakening && !isAwakened) return;

                    // Check MY_TURN if applicable
                    if (eff.condition?.includes('MY_TURN') && gameState.turnPlayerId !== targetPlayerId) return;

                    if (eff.condition === 'COUNT_UNITS') {
                        const count = p.field.filter(u => u !== null).length;
                        totalPower += (eff.value || 0) * count;
                    } else if (eff.condition && eff.condition.startsWith('KEYWORD_')) {
                        const targetKeyword = eff.condition.replace('KEYWORD_', '');
                        if (hasKeyword(card, targetKeyword)) {
                            totalPower += (eff.value || 0);
                        }
                    } else if (p.leader.text?.includes('[アタッカー]') && p.leader.text?.includes('パワー+')) {
                        // Fallback for missing keyword condition in JSON
                        if (hasKeyword(card, 'アタッカー')) {
                            totalPower += (eff.value || 0);
                        }
                    } else if (!eff.condition || eff.condition === 'MY_TURN') {
                        totalPower += (eff.value || 0);
                    }
                }
            });
        }

        // Card Passives & Keywords
        if (hasKeyword(card, 'INFILTRATE')) {
            const val = card.keywords?.find(k => k.startsWith('INFILTRATE_'))?.split('_')[1];
            totalHit += val ? parseInt(val) : 1;
        }

        if (card.effects) {
            card.effects.forEach(eff => {
                if (eff.trigger === 'PASSIVE' && eff.action === 'SET_HIT') {
                    if (eff.condition === 'FIELD_FULL') {
                        const isFull = p.field.every(u => u !== null);
                        if (isFull) totalHit += (eff.value || 0);
                    }
                    if (eff.condition === 'COUNT_BASE') {
                        const baseCount = p.field.filter(u => u?.affiliation?.includes('ベース')).length;
                        totalHit += (eff.value || 1) * baseCount;
                    }
                }
            });
        }

        // --- DEFENDER Keyword ---
        if (gameState.phase === 'DEFENSE' && gameState.pendingAttack?.defenderId === targetPlayerId) {
            const slotIdx = p.field.findIndex(u => u?.id === card.id);
            if (slotIdx !== -1 && gameState.pendingAttack.targetIndex === slotIdx) {
                if (hasKeyword(card, 'DEFENDER')) {
                    totalPower += 2000;
                }
            }
        }

        return { power: totalPower, hitCount: totalHit };
    };

    const renderSlot = (cards: (CardType | null)[], i: number, isOpponent: boolean) => {
        const targetPlayerId = isOpponent ? opponentId! : playerId;
        const card = cards[i];

        // ... (ハイライトロジック)
        let isValidPlayTarget = false;
        if (!isOpponent && gameState.phase === 'MAIN' && selectedCard) {
            if (selectedCard.type === 'UNIT' && !card) isValidPlayTarget = true;
            if (selectedCard.type === 'ITEM' && card) isValidPlayTarget = true;
            // スキルカードはスキルゾーンでプレイするため、フィールドスロットは対象外
        }

        let isValidAttackTarget = false;
        if (isOpponent && gameState.phase === 'ATTACK' && attackingUnitIndex !== null) {
            if (i === attackingUnitIndex) isValidAttackTarget = true;
        }

        // Calculate dynamic stats
        const stats = card ? getCalculatedStats(targetPlayerId, card) : null;

        // Check Active Ability availability
        const hasActive = card?.effects?.some(e => e.trigger === 'ACTIVE') ?? false;
        const canUseActive = !isOpponent && isMyTurn && gameState.phase === 'MAIN' && hasActive;

        return (
            <div
                className={`w-28 h-40 border-2 rounded-lg flex items-center justify-center transition-all relative 
                    ${card ? 'border-transparent' : 'border-white/5 bg-transparent'} 
                    ${isValidPlayTarget ? 'border-green-400 bg-green-400/20 cursor-pointer animate-pulse ring-2 ring-green-400' : ''}
                    ${isValidAttackTarget ? 'cursor-crosshair ring-2 ring-red-500 bg-red-500/10' : ''}
                `}
                onClick={() => {
                    if (!isOpponent) handleFieldSlotClick(i);
                    if (isOpponent) handleEnemyTargetClick(i);
                }}
            >
                {card ? (
                    <div className={`
                        ${!isOpponent && isMyTurn && gameState.phase === 'ATTACK' && !card.attackedThisTurn ? 'cursor-pointer hover:scale-105' : ''} 
                        ${isValidPlayTarget ? 'cursor-pointer' : ''}
                        ${card.attackedThisTurn || card.isStunned || card.cannotAttack ? 'opacity-50 grayscale select-none' : 'opacity-100'}
                        ${!isOpponent && attackingUnitIndex === i ? 'ring-4 ring-red-600 scale-110 z-10' : ''}
                        `}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isOpponent) {
                                if (gameState.phase === 'ATTACK') handleMyUnitClick(i);
                                else handleFieldSlotClick(i);
                            } else {
                                handleEnemyTargetClick(i);
                            }
                        }}
                    >
                        <div className={isValidPlayTarget ? "ring-2 ring-green-400 rounded-lg pointer-events-none absolute inset-0 z-20" : ""}></div>
                        <div className={isValidAttackTarget ? "ring-2 ring-red-500 rounded-lg pointer-events-none absolute inset-0 z-20 animate-pulse bg-red-500/20" : ""}></div>

                        <Card
                            card={{ ...card, ...(stats ? { power: stats.power, hitCount: stats.hitCount } : {}) }}
                            isEnemy={isOpponent}
                            isHidden={false}
                            onShowDetail={handleShowDetail}
                            onUseActive={() => handleUseActive(i)}
                            canUseActive={canUseActive}
                            showDetailOverlay={(!isOpponent && attackingUnitIndex === i) || isValidAttackTarget || isValidPlayTarget}
                        />

                        {/* Attached Items Visualization (Bottom) */}
                        {card.attachments && card.attachments.length > 0 && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-max flex flex-row justify-center gap-1 p-1 pointer-events-auto z-50">
                                {card.attachments.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        whileHover={{ scale: 1.8, zIndex: 60, y: -20 }}
                                        className="w-12 h-16 shadow-2xl relative"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowDetail(item);
                                        }}
                                    >
                                        <Card
                                            card={item}
                                            minimal={true}
                                            className="w-full h-full border border-blue-400/50"
                                        />
                                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-500 rounded-sm rotate-45 flex items-center justify-center border border-white z-10">
                                            <span className="-rotate-45 text-[7px] font-bold text-black">{item.cost}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {stats && (stats.power !== card.power || stats.hitCount !== card.hitCount) && (
                            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] px-1 rounded-bl font-bold animate-bounce z-20 shadow-md">
                                BUFF!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center opacity-20 group-hover:opacity-40 transition-opacity">
                        <span className="text-[8px] font-black uppercase tracking-widest">{playmatId === 'official' ? 'Unit Zone' : `Slot ${i + 1}`}</span>
                        {playmatId === 'official' && <div className="w-8 h-[1px] bg-white/20 mt-1"></div>}
                    </div>
                )}
            </div>
        );
    };

    const handleDefense = (action: 'BLOCK' | 'TAKE') => {
        socketRef.current?.emit('resolveDefense', { action });
    };

    const renderDefenseModal = () => {
        if (gameState.phase !== 'DEFENSE') return null;
        if (!gameState.pendingAttack) return null;

        // Only show for defender
        if (gameState.pendingAttack.defenderId !== playerId) {
            return (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/20 p-8 rounded-xl shadow-2xl text-center">
                        <h2 className="text-xl font-bold mb-4 animate-pulse">相手が防御を選択中...</h2>
                    </div>
                </div>
            );
        }

        const attacker = opponent.field[gameState.pendingAttack.attackerIndex];
        const defender = me.field[gameState.pendingAttack.targetIndex];

        if (!attacker || !defender) {
            return (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/20 p-8 rounded-xl shadow-2xl text-center">
                        <h2 className="text-xl font-bold mb-4 animate-pulse">データを読み込み中...</h2>
                    </div>
                </div>
            );
        }

        const attackerStats = getCalculatedStats(opponentId!, attacker);
        const defenderStats = getCalculatedStats(playerId, defender);

        const hasBreakthrough = attacker.keywords?.includes('突破') ||
            attacker.tempKeywords?.includes('突破') ||
            attacker.text?.includes('【突破】') ||
            attacker.keywords?.includes('BREAKTHROUGH') ||
            attacker.tempKeywords?.includes('BREAKTHROUGH');

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-red-500/50 p-8 rounded-xl shadow-2xl max-w-lg w-full">
                    <h2 className="text-2xl font-bold text-red-500 mb-6 text-center">防御の選択</h2>

                    <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="text-xs mb-2 text-red-400">攻撃側</div>
                            <div className="scale-75 origin-top"><Card card={{ ...attacker, power: attackerStats.power }} isEnemy={true} isHidden={false} onShowDetail={handleShowDetail} /></div>
                            <div className="text-xl font-bold mt-[-20px] text-red-400">{attackerStats.power}</div>
                        </div>
                        <div className="flex items-center text-3xl font-bold text-slate-500">VS</div>
                        <div className="text-center">
                            <div className="text-xs mb-2 text-blue-400">防御側</div>
                            <div className="scale-75 origin-top"><Card card={{ ...defender, power: defenderStats.power }} onShowDetail={handleShowDetail} /></div>
                            <div className="text-xl font-bold mt-[-20px] text-blue-400">{defenderStats.power}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleDefense('BLOCK')}
                            disabled={hasBreakthrough}
                            className={`py-4 rounded-lg font-bold text-lg shadow-lg border group transition-all
                                ${hasBreakthrough
                                    ? 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'}
                            `}
                        >
                            <div className="text-2xl mb-1">🛡️ 防御</div>
                            <div className="text-xs font-normal">
                                {hasBreakthrough ? '突破持ちのため防御不可' : 'バトルが発生します。'}
                            </div>
                        </button>
                        <button
                            onClick={() => handleDefense('TAKE')}
                            className="bg-red-600 hover:bg-red-500 text-white py-4 rounded-lg font-bold text-lg shadow-lg border border-red-400 group"
                        >
                            <div className="text-2xl mb-1">💔 受ける</div>
                            <div className="text-xs text-red-200 font-normal">リーダーがダメージを受けます。</div>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleSelectCard = (selectedIds: string[]) => {
        socketRef.current?.emit('selectCard', { selectedIds });
    };

    const renderSelectionModal = () => {
        if ((gameState.phase !== 'SELECT_CARD' && gameState.phase !== 'DISCARD') || !gameState.selection) return null;
        if (gameState.selection.playerId !== playerId) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/20 p-8 rounded-xl shadow-2xl text-center">
                        <h2 className="text-xl font-bold mb-4 animate-pulse">相手がカードを選択中...</h2>
                    </div>
                </div>
            );
        }

        // 全ての候補カードのプールを作成
        const allCardsPool = [
            ...me.deck,
            ...me.hand,
            ...me.field.filter((f): f is CardType => f !== null),
            ...me.discard,
            ...opponent.field.filter((f): f is CardType => f !== null),
            ...opponent.discard
        ];

        return (
            <SelectionModal
                selection={gameState.selection}
                allCards={allCardsPool}
                onConfirm={handleSelectCard}
                onShowDetail={handleShowDetail}
            />
        );
    };

    const renderGuardianInterceptModal = () => {
        if (gameState.phase !== 'GUARDIAN_INTERCEPT' || !gameState.pendingAttack) return null;

        // Only show for defender
        if (gameState.pendingAttack.defenderId !== playerId) {
            return (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/20 p-8 rounded-xl shadow-2xl text-center">
                        <h2 className="text-xl font-bold mb-4 animate-pulse">相手が「防壁」の発動を確認中...</h2>
                    </div>
                </div>
            );
        }

        const { attackerIndex } = gameState.pendingAttack;
        const attacker = opponent.field[attackerIndex];

        if (!attacker) {
            return (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/20 p-8 rounded-xl shadow-2xl text-center">
                        <h2 className="text-xl font-bold mb-4 animate-pulse">データを読み込み中...</h2>
                    </div>
                </div>
            );
        }
        const adjSlots = [attackerIndex - 1, attackerIndex + 1].filter(s => s >= 0 && s <= 2);
        const candidates = adjSlots.filter(s => {
            const u = me.field[s];
            return u && u.keywords?.some(k => k.startsWith('GUARDIAN_'));
        });

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-blue-500/50 p-8 rounded-xl shadow-2xl max-w-lg w-full">
                    <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">ガーディアン（防壁）の発動</h2>
                    <p className="text-sm text-gray-300 mb-6 text-center">
                        相手のユニットが隣のレーンから攻撃しています。<br />
                        手札をコストとして支払い、ガーディアンで攻撃を遮ることができます。
                    </p>

                    <div className="flex flex-col gap-4">
                        {candidates.map(slotIdx => {
                            const unit = me.field[slotIdx]!;
                            const costMatch = unit.keywords?.find(k => k.startsWith('GUARDIAN_'))?.split('_')[1];
                            const cost = costMatch ? parseInt(costMatch) : 1;
                            const canAfford = me.hand.length >= cost;

                            return (
                                <button
                                    key={slotIdx}
                                    disabled={!canAfford}
                                    onClick={() => handleGuardianIntercept(slotIdx)}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${canAfford ? 'bg-blue-900/40 border-blue-500 hover:bg-blue-800/60' : 'bg-gray-800/40 border-gray-600 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold">
                                            {slotIdx + 1}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">{unit.name}</div>
                                            <div className="text-xs text-blue-300">防壁 [{cost}]</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-yellow-500">
                                        手札 {cost} 枚トラッシュ
                                    </div>
                                </button>
                            );
                        })}

                        <button
                            onClick={() => handleGuardianIntercept('NONE')}
                            className="mt-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold border border-slate-500"
                        >
                            発動しない
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDamageZoneModal = () => {
        if (!showDamageZoneFor) return null;
        const targetPlayer = showDamageZoneFor === 'me' ? me : opponent;

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setShowDamageZoneFor(null)}>
                <div className="p-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4 text-center">{targetPlayer.username}のダメージゾーン</h2>
                    <div className="flex flex-wrap gap-4 justify-center">
                        {targetPlayer.damageZone.length === 0 && <div className="text-gray-500">ダメージなし</div>}
                        {targetPlayer.damageZone.map((c, i) => (
                            <div key={i} className="scale-100">
                                <Card card={c} isEnemy={false} isHidden={false} onShowDetail={handleShowDetail} />
                            </div>
                        ))}
                    </div>
                    <button className="mt-8 mx-auto block px-6 py-2 bg-gray-700 rounded text-center" onClick={() => setShowDamageZoneFor(null)}>閉じる</button>
                </div>
            </div>
        );
    };

    // PlaymatArea component moved outside GameBoard to follow React best practices

    const renderPlaymatSelector = () => {
        if (!showPlaymatSelector) return null;

        const options = [
            { id: 'official', name: 'レッドフード (NIKKE公式)', img: '/images/playmat_official.jpg' },
            { id: 'mermaid', name: 'アビスフラワー (NIKKE公式)', img: '/images/playmat_mermaid.png' },
            { id: 'cyber', name: 'タクティカルHUD (AI生成)', img: '/images/playmat_bg.png' },
        ];

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-8 max-w-4xl w-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-cyan-400 italic uppercase">Tactical Playmat Selector</h2>
                        <button onClick={() => setShowPlaymatSelector(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    <div className="mb-8">
                        <div className="text-cyan-500 text-[10px] font-bold uppercase mb-4 tracking-widest">Select Your Playmat</div>
                        <div className="grid grid-cols-3 gap-6">
                            {options.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`
                                        cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all
                                        ${playmatId === opt.id ? 'border-cyan-400 scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'border-white/10 opacity-60 hover:opacity-100'}
                                    `}
                                    onClick={() => {
                                        setPlaymatId(opt.id as PlaymatId);
                                        localStorage.setItem('selectedPlaymat', opt.id);
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={opt.img} alt={opt.name} className="w-full aspect-[16/9] object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                                        <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{opt.name}</span>
                                    </div>
                                    {playmatId === opt.id && (
                                        <div className="absolute top-2 right-2 bg-cyan-500 text-black text-[10px] font-black px-2 py-0.5 rounded">PLAYER AREA</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-8 border-t border-white/10 pt-8">
                        <div className="text-red-500 text-[10px] font-bold uppercase mb-4 tracking-widest">Select Opponent&apos;s Playmat Theme</div>
                        <div className="grid grid-cols-3 gap-6">
                            {options.map(opt => (
                                <div
                                    key={`opp-${opt.id}`}
                                    className={`
                                        cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all
                                        ${opponentPlaymatId === opt.id ? 'border-red-400 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'border-white/10 opacity-60 hover:opacity-100'}
                                    `}
                                    onClick={() => {
                                        setOpponentPlaymatId(opt.id as PlaymatId);
                                        localStorage.setItem('selectedOpponentPlaymat', opt.id);
                                    }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={opt.img} alt={opt.name} className="w-full aspect-[16/9] object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                                        <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">{opt.name}</span>
                                    </div>
                                    {opponentPlaymatId === opt.id && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-black text-[10px] font-black px-2 py-0.5 rounded">OPPONENT AREA</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setShowPlaymatSelector(false)}
                            className="px-8 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase rounded shadow-lg transition-all"
                        >
                            Complete Tactical Setup
                        </button>
                    </div>
                </div>
            </div >
        );
    };

    const renderMulliganModal = () => {
        if (!me || gameState.phase !== 'MULLIGAN' || me.mulliganDone) return null;

        const selection = {
            playerId: playerId,
            type: 'HAND' as const,
            candidateIds: me.hand.map(c => c.id),
            count: me.hand.length,
            action: 'MULLIGAN',
            previousPhase: 'MULLIGAN' as const
        };

        return (
            <SelectionModal
                selection={selection}
                allCards={me.hand}
                onConfirm={(selectedIds) => {
                    socketRef.current?.emit('mulligan', { selectedIds });
                }}
                onShowDetail={handleShowDetail}
            />
        );
    };

    return (
        <div className={`
            flex flex-col h-screen w-screen bg-black text-white overflow-hidden relative font-sans
            ${isDamaging ? 'shake' : ''}
        `}>
            {/* Top Status Bar (Phase Tracker) - Moved to top to avoid hand overlap */}
            <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-12 bg-black/80 border-b border-white/5 relative z-40 backdrop-blur-2xl">
                <div className="hidden sm:flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Room // Turn</span>
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-black text-cyan-400">T-{gameState.turnCount}</div>
                            <div className="text-[10px] text-slate-600 font-mono">{roomId}</div>
                        </div>
                    </div>
                </div>

                {/* Official Phase Track */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-3">
                    {[
                        { id: 'LEVEL_UP', label: 'レベルアップ' },
                        { id: 'DRAW', label: 'ドロー' },
                        { id: 'MAIN', label: 'メイン' },
                        { id: 'ATTACK', label: 'アタック' },
                        { id: 'GUARDIAN_INTERCEPT', label: '防壁' },
                        { id: 'DEFENSE', label: '防御' },
                        { id: 'END', label: 'エンド' }
                    ].map((p, idx, arr) => {
                        const isActive = gameState.phase === p.id;
                        const isPast = arr.findIndex(item => item.id === gameState.phase) > idx;

                        return (
                            <React.Fragment key={p.id}>
                                <div className={`
                                    flex flex-col items-center transition-all duration-300
                                    ${isActive ? 'scale-105 sm:scale-110' : 'opacity-40'}
                                `}>
                                    <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-tighter mb-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>Phase</span>
                                    <div className={`
                                        px-2 sm:px-3 py-0.5 sm:py-1 rounded-sm border skew-x-[-15deg] transition-all
                                        ${isActive ? 'bg-cyan-500 text-black font-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-transparent text-slate-300 border-white/10'}
                                    `}>
                                        <span className="skew-x-[15deg] block text-[8px] sm:text-[11px] font-bold whitespace-nowrap">{p.label}</span>
                                    </div>
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className={`text-slate-700 font-black text-xs transition-colors ${isPast ? 'text-cyan-900 animate-pulse' : ''} tracking-tighter`}>
                                        ≫≫≫
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Central NIKKE Logo Decoration */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none scale-75">
                    <div className="text-4xl font-black text-white italic tracking-tighter border-y-2 border-white/10 px-8 py-1">NIKKE</div>
                    <div className="text-[8px] text-center font-bold tracking-[0.5em] mt-1">GODDESS OF VICTORY</div>
                </div>

                <div className="flex gap-2 sm:gap-4">
                    <div className="hidden xs:flex flex-col items-end mr-1 sm:mr-4">
                        <span className="text-[8px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase">System</span>
                        {isMyTurn ? (
                            <div className="px-2 sm:px-3 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-[7px] sm:text-[9px] text-green-400 font-black animate-pulse">YOUR ACTION</div>
                        ) : (
                            <div className="px-2 sm:px-3 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] sm:text-[9px] text-red-500 font-black">OPPONENT ACTING</div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowPlaymatSelector(true)}
                        className="p-2 hover:bg-white/10 rounded transition-colors group relative border border-white/5"
                        title="プレイマット変更"
                    >
                        <span className="text-lg">🖼️</span>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity rounded border border-white/10">プレイマット変更</div>
                    </button>
                    <button
                        onClick={handleEndTurn}
                        disabled={!isMyTurn || gameState.phase === 'DEFENSE'}
                        className={`
                            px-4 sm:px-8 py-2 text-[8px] sm:text-[11px] font-black rounded skew-x-[-15deg] transition-all transform active:scale-95 shadow-xl
                            ${isMyTurn && gameState.phase !== 'DEFENSE'
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-black border border-cyan-400 cursor-pointer'
                                : 'bg-slate-800 text-slate-600 border border-white/5 cursor-not-allowed opacity-50'}
                        `}
                    >
                        <span className="skew-x-[15deg] block">
                            {isMyTurn && gameState.phase === 'END' ? 'END TURN' : 'NEXT'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Split Playmat Areas */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <PlaymatArea
                    p={opponent}
                    isOpponent={true}
                    matId={opponentPlaymatId}
                    config={PLAYMAT_CONFIGS[opponentPlaymatId]}
                    renderSlot={renderSlot}
                    handleShowDetail={handleShowDetail}
                    setShowDamageZoneFor={setShowDamageZoneFor}
                    isEditMode={false}
                    onLayoutChange={() => { }}
                    onEnemyTargetClick={handleEnemyTargetClick}
                />
                <PlaymatArea
                    p={me}
                    isOpponent={false}
                    matId={playmatId}
                    config={customLayout || PLAYMAT_CONFIGS[playmatId]}
                    renderSlot={renderSlot}
                    handleShowDetail={handleShowDetail}
                    setShowDamageZoneFor={setShowDamageZoneFor}
                    isEditMode={false}
                    onLayoutChange={(key, pos) => {
                        if (!customLayout) return;
                        setCustomLayout({
                            ...customLayout,
                            [key]: { ...(customLayout[key as keyof PlaymatThemeConfig] as PlaymatZoneConfig), ...pos }
                        });
                    }}
                    onEnemyTargetClick={handleEnemyTargetClick}
                    onSkillZoneClick={handleSkillZoneClick}
                />
            </div>

            {/* Tactical HUD Overlays (Global) */}
            <div className="absolute inset-0 hex-grid opacity-20 pointer-events-none z-0"></div>
            <div className="absolute inset-0 pointer-events-none z-40">
                <div className="w-full h-1 bg-cyan-500/10 absolute animate-scanline"></div>
                <div className="w-full h-full border-[2px] border-cyan-500/10 shadow-[inset_0_0_100px_rgba(6,182,212,0.1)]"></div>
            </div>

            {/* Warning Overlay */}
            <AnimatePresence>
                {isDamaging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-[2px] animate-warning"
                    >
                        <div className="text-8xl font-black text-red-500 animate-glitch tracking-tighter">WARNING</div>
                        <div className="text-xl font-bold text-red-400 mt-4 tracking-widest uppercase">Damage Detected // System Critical</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals & Reveal Overlays */}
            {renderDefenseModal()}
            {renderSelectionModal()}
            {renderGuardianInterceptModal()}
            {renderDamageZoneModal()}
            {renderMulliganModal()}
            {renderPlaymatSelector()}

            {damageCardReveal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-4 border-red-500 rounded-2xl p-8 shadow-2xl shadow-red-500/50 animate-[fadeIn_0.3s_ease-out] max-w-md">
                        <div className="text-center mb-4">
                            <div className="text-sm text-gray-400 mb-2">{damageCardReveal.playerName}</div>
                            <div className="text-2xl font-bold text-red-400 mb-2">💔 ダメージカード</div>
                            {damageCardReveal.isTrigger && (
                                <div className="text-3xl font-bold text-yellow-400 animate-pulse mb-2">
                                    ⚡ トリガー発動! ⚡
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center mb-4">
                            <Card card={damageCardReveal.card} onShowDetail={() => { }} />
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-white mb-1">{damageCardReveal.card.name}</div>
                            <div className="text-sm text-gray-400">{damageCardReveal.card.text}</div>
                        </div>
                    </div>
                </div>
            )}

            {opponentDisconnected && !gameResult && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-xl border border-white/20 shadow-2xl text-center max-w-md animate-pulse">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-yellow-500 mb-2">OPPONENT DISCONNECTED</h2>
                        <p className="text-gray-300 mb-4">Waiting for opponent to reconnect...</p>
                        <div className="text-3xl font-mono font-bold text-white">
                            {opponentDisconnected.remaining}s
                        </div>
                    </div>
                </div>
            )}

            {gameResult && <ResultModal result={gameResult.result} reason={gameResult.reason} onReturnToLobby={() => window.location.reload()} />}
            {detailCard && <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} />}


            {/* Fixed Overlay for Hand Cards - Bottom Left Horizontal */}
            <div className="fixed left-4 bottom-4 z-[45] flex flex-col items-start pointer-events-none w-full md:h-64">
                {/* Help Text - Positioned above the hand */}
                <AnimatePresence>
                    {isMyTurn && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mb-4 ml-4 text-cyan-400 text-[10px] font-black tracking-widest uppercase bg-cyan-400/90 text-black px-4 py-2 rounded-t-lg border-x border-t border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.6)] backdrop-blur-md"
                        >
                            {gameState.phase === 'MAIN'
                                ? (selectedCardIndex === null ? "PLAY CARD" : "SELECT TARGET")
                                : gameState.phase === 'ATTACK'
                                    ? (attackingUnitIndex === null ? "ATTACK PHASE" : "SELECT ENEMY")
                                    : "WAITING..."
                            }
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-row items-end transition-all duration-500 pl-4 pb-2">
                    {me.hand.map((c, i) => (
                        <div key={i}
                            className={`
                                -ml-6 sm:-ml-12 transition-all duration-300 z-1 origin-bottom cursor-pointer first:ml-0 pointer-events-auto
                                ${selectedCardIndex === i
                                    ? '-translate-y-8 sm:-translate-y-12 scale-110 sm:scale-125 z-50 ring-2 sm:ring-4 ring-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)] rounded-lg rotate-0'
                                    : 'hover:-translate-y-8 hover:scale-110 hover:z-40 hover:-rotate-3'}
                                ${selectedCardIndex !== null && selectedCardIndex !== i ? 'opacity-40 grayscale-[0.5]' : ''}
                            `}
                            onClick={() => handleHandCardClick(i)}
                        >
                            <Card
                                card={c}
                                onShowDetail={handleShowDetail}
                                showDetailOverlay={selectedCardIndex === i}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Server Debug Logs Overlay - Enhanced with Toggle and Drag */}
            <motion.div
                drag
                dragMomentum={false}
                className="absolute top-20 left-4 z-50 pointer-events-auto"
            >
                <div className="bg-black/90 backdrop-blur-xl border-2 border-cyan-500/50 rounded-lg p-3 font-mono text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] min-w-[200px] max-w-sm">
                    <div className="flex justify-between items-center border-b border-white/20 mb-2 pb-2 cursor-move">
                        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setShowDebugLogs(!showDebugLogs)}>
                            <span className="text-[10px] hover:text-white transition-colors">
                                {showDebugLogs ? '▼' : '▶'}
                            </span>
                            <span className="text-white font-bold tracking-wider text-[10px]">SERVER LOGS</span>
                        </div>
                        {showDebugLogs && (
                            <div className="flex gap-2 ml-4">
                                <button
                                    onClick={() => socketRef.current?.emit('debugForceLevelUp')}
                                    className="bg-red-900/50 hover:bg-red-800 text-red-100 text-[7px] px-1.5 py-0.5 rounded border border-red-500/30 transition-colors"
                                >
                                    LVL UP
                                </button>
                                <button
                                    onClick={() => socketRef.current?.emit('debugForceWin')}
                                    className="bg-yellow-900/50 hover:bg-yellow-800 text-yellow-100 text-[7px] px-1.5 py-0.5 rounded border border-yellow-500/30 transition-colors"
                                >
                                    WIN
                                </button>
                            </div>
                        )}
                    </div>
                    {showDebugLogs && (
                        <div className="space-y-1 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                            {gameState.debugLogs && gameState.debugLogs.length > 0 ? (
                                gameState.debugLogs.map((log, i) => (
                                    <div key={i} className="text-[9px] bg-white/5 p-1 rounded border border-white/5 leading-tight break-words">{log}</div>
                                ))
                            ) : (
                                <div className="text-[9px] text-slate-500 italic py-2">No logs recorded...</div>
                            )}
                        </div>
                    )}
                    {!showDebugLogs && (
                        <div className="text-[7px] text-slate-500 italic">Click to expand logs</div>
                    )}
                </div>
            </motion.div>


            {/* Render Active Animations */}
            <AnimatePresence>
                {activeAnimations.map(anim => {
                    switch (anim.type) {
                        case 'ATTACK':
                            return <AttackAnimation key={anim.id} anim={anim} />;
                        case 'DAMAGE':
                            return <DamagePopup key={anim.id} anim={anim} />;
                        case 'DESTROY':
                            return <DestroyAnimation key={anim.id} anim={anim} />;
                        default:
                            return null;
                    }
                })}
            </AnimatePresence>
        </div>
    );
};

const AttackAnimation: React.FC<{ anim: { id: string; type: 'ATTACK'; data: AttackAnimationData } }> = ({ anim }) => {
    // Note: anim.data has attackerId, attackerIndex, defenderId, targetIndex if needed for position-based FX
    console.log('Animation Data:', anim.data);

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -45 }}
            animate={{ scale: 2, opacity: 1, rotate: 0 }}
            exit={{ scale: 5, opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-[200]"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
                <span className="text-8xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,0,0,1)] uppercase -skew-x-12">
                    ATTACK!
                </span>
            </div>
        </motion.div>
    );
};

const DamagePopup: React.FC<{ anim: { id: string; type: 'DAMAGE'; data: DamageAnimationData } }> = ({ anim }) => {
    const { value } = anim.data;

    return (
        <motion.div
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ y: -100, opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, y: -200 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-[200]"
        >
            <span className="text-6xl font-black text-red-500 drop-shadow-[0_0_5px_black] stroke-2 stroke-white">
                -{value}
            </span>
        </motion.div>
    );
};

const DestroyAnimation: React.FC<{ anim: { id: string; type: 'DESTROY'; data: DestroyAnimationData } }> = ({ anim }) => {
    console.log('Destroying Unit:', anim.data.unitId);
    return (
        <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0, rotate: 180 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-[200]"
        >
            <div className="text-8xl">💥</div>
        </motion.div>
    );
};

export default GameBoard;

