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

const Card: React.FC<CardProps> = ({ card, onClick, isHidden = false, onShowDetail, onUseActive, canUseActive = false, layoutId, className, isAwakened = false, minimal = false }) => {

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onShowDetail) {
            onShowDetail(card);
        }
    };

    if (isHidden) {
        return (
            <motion.div
                layoutId={layoutId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-24 h-32 bg-indigo-900 rounded-lg border-2 border-indigo-500 shadow-md relative group cursor-default"
            >
                <div className="absolute inset-0 bg-[url('/card-back.svg')] bg-cover opacity-50"></div>
            </motion.div>
        );
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'UNIT': return 'bg-slate-800 border-slate-600';
            case 'SKILL': return 'bg-red-900/80 border-red-500';
            case 'ITEM': return 'bg-blue-900/80 border-blue-500';
            case 'LEADER': return 'bg-yellow-900/80 border-yellow-500';
            default: return 'bg-gray-800 border-gray-600';
        }
    };

    const getAttributeColor = (attr: string) => {
        switch (attr) {
            case '炎': return 'bg-orange-600 text-white';
            case '大地': return 'bg-emerald-700 text-white';
            case '嵐': return 'bg-indigo-600 text-white';
            case '波濤': return 'bg-blue-600 text-white';
            case '稲妻': return 'bg-yellow-400 text-black';
            case '光': return 'bg-amber-200 text-black';
            case '闇': return 'bg-purple-900 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    return (
        <motion.div
            layoutId={layoutId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1, zIndex: 50, rotate: card.type === 'LEADER' ? 0 : 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            onContextMenu={handleRightClick}
            className={`${card.type === 'LEADER' ? 'w-40 h-28' : 'w-28 h-40'} ${getTypeColor(card.type)} rounded-lg border-2 flex flex-col p-2 relative shadow-xl cursor-pointer select-none group ${className || ''}`}
        >
            {/* Type Badge (Top Left Corner) */}
            {!minimal && (
                <div className="absolute top-0 left-0 flex flex-col items-start">
                    <div className={`px-1 rounded-br text-[8px] font-bold text-white bg-black/50 border-r border-b border-white/20`}>
                        {card.type}
                    </div>
                </div>
            )}

            {/* Keywords (Top Right) */}
            {!minimal && card.keywords && card.keywords.length > 0 && (
                <div className="absolute top-0 right-0 flex flex-col items-end gap-0.5">
                    {card.keywords.map((kw, i) => (
                        <div key={i} className="px-1 py-0.5 rounded-bl bg-amber-500/90 text-black text-[6px] font-bold border-l border-b border-white/20 whitespace-nowrap">
                            {kw}
                        </div>
                    ))}
                </div>
            )}

            {/* Affiliation Badge (Top Center) */}
            {!minimal && card.affiliation && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                    {card.affiliation.split('/').map((aff, i) => (
                        <div key={i} className="px-1.5 rounded-b text-[7px] font-bold text-cyan-300 bg-black/70 border-x border-b border-white/20 whitespace-nowrap shadow-sm">
                            {aff.trim()}
                        </div>
                    ))}
                </div>
            )}

            {/* Attribute Badge (Below Affiliation) */}
            {!minimal && card.attribute && (
                <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-1.5 rounded text-[8px] font-bold ${getAttributeColor(card.attribute)} border border-white/20 shadow-sm z-10`}>
                    {card.attribute}
                </div>
            )}

            {/* Cost Badge (Top Left) */}
            {!minimal && (
                <div className="absolute -top-2 -left-2 w-7 h-7 rounded-sm rotate-45 bg-cyan-500 flex items-center justify-center border border-white shadow-lg z-10">
                    <span className="-rotate-45 font-bold text-black text-sm">{card.cost}</span>
                </div>
            )}

            {/* Name */}
            {!minimal && (
                <div className="text-[10px] font-bold text-center text-white mb-0.5 truncate shadow-black drop-shadow-md bg-black/30 rounded px-1 mt-1">
                    {card.name}
                </div>
            )}

            {/* Image */}
            <div className="flex-1 bg-black/40 rounded border border-white/10 mb-0.5 overflow-hidden relative">
                {card.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={card.imageUrl.replace(/^https:\/\/nivelarena\.jp/, 'http://nivelarena.jp')}
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
            {!minimal && (
                <div className="h-12 text-[8px] leading-[10px] text-gray-300 overflow-hidden bg-black/40 p-1 rounded border border-white/5 flex flex-col gap-0.5">
                    <div>{card.text}</div>
                    {card.awakenedText && (
                        <div className="text-yellow-300 border-t border-white/10 pt-0.5 mt-0.5">
                            <span className="font-bold text-[7px] border border-yellow-500 rounded px-0.5 mr-1">覚醒LV{card.awakeningLevel}</span>
                            {card.awakenedText}
                        </div>
                    )}
                </div>
            )}

            {/* Status Icons Overlay */}
            {!minimal && (
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
            )}

            {/* Stats Check */}
            {!minimal && (card.type === 'UNIT' || card.type === 'LEADER') && (
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
            )}

            {/* Active Ability Button */}
            {!minimal && canUseActive && onUseActive && (
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
            )}
        </motion.div>
    );
};

export default Card;
