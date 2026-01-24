"use client";
import React from 'react';
import { motion } from 'framer-motion';
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
    showDetailOverlay?: boolean;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const Card: React.FC<CardProps> = ({
    card,
    onClick,
    isHidden = false,
    onShowDetail,
    onUseActive,
    canUseActive = false,
    layoutId,
    className,
    isAwakened = false,
    minimal = false,
    showDetailOverlay = false
}) => {

    // Calculate card border color based on rarity/type
    const getBorderColor = () => {
        if (isAwakened) return 'border-yellow-400';
        if (card.rarity === 'UR') return 'border-purple-500';
        if (card.rarity === 'SR') return 'border-yellow-600';
        if (card.rarity === 'R') return 'border-blue-400';
        return 'border-gray-600';
    };

    if (isHidden) {
        return (
            <div
                className={`bg-slate-800 border-2 border-slate-600 rounded-lg w-full h-full flex items-center justify-center ${className || ''}`}
                onClick={onClick}
            >
                <div className="w-full h-full bg-[url('/images/card_back.png')] bg-cover bg-center opacity-80" />
            </div>
        );
    }

    return (
        <motion.div
            layoutId={layoutId}
            className={`
                relative flex flex-col bg-slate-900 rounded border-2 select-none shadow-md
                ${getBorderColor()} 
                ${className || (card.type === 'LEADER' ? 'w-20 h-16 sm:w-32 sm:h-24 md:w-40 md:h-30' : 'w-16 h-[5.55rem] sm:w-24 sm:h-[8.08rem] md:w-28 md:h-[9.4rem]')}
                ${isAwakened ? 'ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
            `}
            onClick={() => {
                if (onClick) onClick();
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (onShowDetail) onShowDetail(card);
            }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Image */}
            <div className="flex-1 bg-black/40 border-b border-white/10 overflow-hidden relative rounded-t-sm">
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

            {/* Text */}
            {
                !minimal && (
                    <div className="h-8 sm:h-12 text-[6px] sm:text-[8px] leading-[8px] sm:leading-[10px] text-gray-300 overflow-hidden bg-black/40 p-1 flex flex-col gap-0.5 rounded-b-sm">
                        <div className="font-bold text-white truncate flex justify-center items-center gap-1">
                            <span>{card.name}</span>
                        </div>
                        <div className="line-clamp-2 sm:line-clamp-3">{card.text}</div>
                        {card.awakenedText && (
                            <div className="text-yellow-300 border-t border-white/10 pt-0.5 mt-0.5">
                                <span className="font-bold text-[7px] border border-yellow-500 rounded px-0.5 mr-1">覚醒LV{card.awakeningLevel}</span>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Status Icons Overlay */}
            {
                !minimal && (
                    <div className="absolute bottom-14 w-full flex justify-center gap-1 pointer-events-none z-10 px-1">
                        {/* Breakthrough Icon */}
                        {(card.keywords?.includes('BREAKTHROUGH') || card.text?.includes('防御できない') || card.tempKeywords?.includes('BREAKTHROUGH')) && (
                            <div className="w-4 h-4 rounded-full bg-purple-600 border border-white flex items-center justify-center shadow-md animate-pulse" title="BREAKTHROUGH">
                                <span className="text-[10px]">⚔️</span>
                            </div>
                        )}
                        {/* Guardian Icon */}
                        {(card.keywords?.some(k => k.startsWith('GUARDIAN')) || card.text?.includes('防壁') || card.tempKeywords?.some(k => k.startsWith('GUARDIAN'))) && (
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

            {/* Cost Display - Top Left */}
            {
                !minimal && (
                    <div className="absolute -top-1 -left-1 sm:-top-1.5 sm:-left-1.5 w-4 h-4 sm:w-6 sm:h-6 bg-cyan-600 rotate-45 flex items-center justify-center border border-white z-20 shadow-md">
                        <span className="-rotate-45 font-bold text-white text-[8px] sm:text-xs">{card.cost}</span>
                    </div>
                )
            }

            {/* Affiliation - Top Center */}
            {
                !minimal && card.affiliation && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-800/90 border border-white/20 rounded-b text-[6px] font-bold text-cyan-300 z-20 shadow-sm whitespace-nowrap">
                        {card.affiliation.split('/')[0]}
                    </div>
                )
            }

            {/* Stats Check */}
            {
                !minimal && (card.type === 'UNIT' || card.type === 'LEADER') && (
                    <div className="absolute -top-1.5 -right-1.5 flex flex-col items-center gap-0.5 sm:gap-1 z-20">
                        {/* Power */}
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-red-600 flex items-center justify-center border border-white shadow-lg" title="Power">
                            <span className="font-bold text-white text-[7px] sm:text-[10px]">{card.power ?? 0}</span>
                        </div>

                        {/* Hit Count */}
                        {(card.hitCount !== undefined) && (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-yellow-500 flex items-center justify-center border border-white shadow-lg" title="Hit Count">
                                <span className="font-bold text-black text-[7px] sm:text-[10px]">{card.hitCount}</span>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Active Ability Button */}
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

            {/* Mobile/Selection Detail Overlay */}
            {showDetailOverlay && onShowDetail && (
                <div className="absolute inset-0 z-40 flex items-center justify-center p-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowDetail(card);
                        }}
                        className="w-full h-2/3 bg-cyan-500/80 backdrop-blur-sm rounded-lg border-2 border-white flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse"
                    >
                        <span className="text-xl sm:text-2xl">🔍</span>
                        <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-tighter">Details</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default Card;
