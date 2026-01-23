"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType } from '../shared/types';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    isEnemy?: boolean;
    isHidden?: boolean;
    onShowDetail?: (card: CardType) => void;
    onUseActive?: () => void;
    canUseActive?: boolean;
    layoutId?: string;
    className?: string;
    isAwakened?: boolean;
    minimal?: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const Card: React.FC<CardProps> = ({ card, onClick, isHidden = false, onShowDetail, onUseActive, canUseActive = false, layoutId, className, isAwakened = false, minimal = false }) => {
    // ... existing hook ...

    // ... (lines 22-128 suppressed)

    {/* Image */ }
    <div className="flex-1 bg-black/40 rounded border border-white/10 mb-0.5 overflow-hidden relative">
        {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={card.imageUrl.includes('nivelarena.jp')
                    ? `${SOCKET_URL}/api/proxy-image?url=${encodeURIComponent(card.imageUrl)}`
                    : card.imageUrl
                }
                alt={card.name}


                className={
                    card.type === 'LEADER'
                        ? `absolute w-full h-[200%] object-cover ${isAwakened ? 'bottom-0' : 'top-0'}`
                        : 'w-full h-full object-cover object-center'
                }
                onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerText = 'IMG';
                }}
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">
                IMG
            </div>
        )}
    </div>

    {/* Text */ }
    {
        !minimal && (
            <div className="h-12 text-[8px] leading-[10px] text-gray-300 overflow-hidden bg-black/40 p-1 rounded border border-white/5 flex flex-col gap-0.5">
                <div>{card.text}</div>
                {card.awakenedText && (
                    <div className="text-yellow-300 border-t border-white/10 pt-0.5 mt-0.5">
                        <span className="font-bold text-[7px] border border-yellow-500 rounded px-0.5 mr-1">覚醒LV{card.awakeningLevel}</span>
                        {card.awakenedText}
                    </div>
                )}
            </div>
        )
    }

    {/* Status Icons Overlay */ }
    {
        !minimal && (
            <div className="absolute bottom-8 w-full flex justify-center gap-1 pointer-events-none z-10 px-1">
                {/* Breakthrough Icon */}
                {(card.keywords?.includes('BREAKTHROUGH') || card.text?.includes('防御できない')) && (
                    <div className="w-4 h-4 rounded-full bg-purple-600 border border-white flex items-center justify-center shadow-md animate-pulse" title="BREAKTHROUGH">
                        <span className="text-[10px]">⚔️</span>
                    </div>
                )}
                {/* Guardian Icon */}
                {(card.keywords?.some(k => k.startsWith('GUARDIAN')) || card.text?.includes('防壁')) && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-md" title="GUARDIAN">
                        <span className="text-[10px]">🛡️</span>
                    </div>
                )}
                {/* Cannot Attack Icon */}
                {(card.cannotAttack || card.keywords?.includes('PERMANENT_CANNOT_ATTACK')) && (
                    <div className="w-4 h-4 rounded-full bg-gray-800 border border-red-500 flex items-center justify-center shadow-md" title="CANNOT ATTACK">
                        <span className="text-[8px] text-red-500 font-bold">🚫</span>
                    </div>
                )}
            </div>
        )
    }

    {/* Stats Check */ }
    {
        !minimal && (card.type === 'UNIT' || card.type === 'LEADER') && (
            <>
                {/* Power (Bottom Right) */}
                <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-red-600 flex items-center justify-center border-2 border-white shadow-lg z-10" title="Power">
                    <span className="font-bold text-white text-[10px]">{card.power ?? 0}</span>
                </div>

                {/* Hit Count (Bottom Left) */}
                {(card.hitCount !== undefined) && (
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-md bg-yellow-500 flex items-center justify-center border border-white shadow-lg z-10" title="Hit Count">
                        <span className="font-bold text-black text-xs">{card.hitCount}</span>
                    </div>
                )}
            </>
        )
    }

    {/* Active Ability Button */ }
    {
        !minimal && canUseActive && onUseActive && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUseActive();
                }}
                className={`absolute top-1 right-1 bg-green-600 hover:bg-green-500 text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg border border-white/50 z-20 transition-all hover:scale-110 ${card.activeUsedThisTurn ? 'opacity-50' : 'opacity-100'}`}
                disabled={card.activeUsedThisTurn}
            >
                {card.activeUsedThisTurn ? '使用済' : 'アクティブ'}
            </button>
        )
    }
        </motion.div >
    );
};

export default Card;
