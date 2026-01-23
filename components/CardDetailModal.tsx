"use client";

import React from 'react';
import Image from 'next/image';
import { Card as CardType } from '../shared/types';

interface CardDetailModalProps {
    card: CardType;
    onClose: () => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
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

    console.log('[CardDetailModal] Rendering with z-index 200');

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 z-[9999]"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <div
                className="bg-slate-900 rounded-xl border-2 border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="text-2xl font-bold text-white">{card.name}</div>
                            {card.attribute && (
                                <div className={`px-3 py-1 rounded text-sm font-bold ${getAttributeColor(card.attribute)}`}>
                                    {card.attribute}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white text-2xl px-3 py-1 hover:bg-white/10 rounded transition flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-300 flex-wrap">
                        <span className="px-2 py-0.5 bg-white/10 rounded">{
                            card.type === 'UNIT' ? 'ユニット' :
                                card.type === 'ITEM' ? 'アイテム' :
                                    card.type === 'SKILL' ? 'スキル' :
                                        card.type === 'LEADER' ? 'リーダー' : card.type
                        }</span>
                        {card.affiliation && (
                            <span className="px-2 py-0.5 bg-cyan-900/50 rounded text-cyan-300">{card.affiliation}</span>
                        )}
                        {card.keywords && card.keywords.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {card.keywords.map((kw, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-amber-600/50 rounded text-amber-200 text-xs">{kw}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col md:flex-row gap-6 flex-1 overflow-auto">
                    {/* Image */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <div className="w-72 aspect-[2.5/3.5] bg-black/40 rounded-lg border-2 border-white/10 overflow-hidden relative shadow-2xl">
                            {card.imageUrl ? (
                                <Image
                                    src={card.imageUrl.replace(/^https:\/\/nivelarena\.jp/, 'http://nivelarena.jp')}
                                    alt={card.name}
                                    fill

                                    className="object-contain"
                                    unoptimized
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    画像なし
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4 min-w-0">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-cyan-900/30 p-3 rounded border border-cyan-700/50">
                                <div className="text-xs text-cyan-400 mb-1">コスト</div>
                                <div className="text-2xl font-bold text-white">{card.cost}</div>
                            </div>
                            {(card.type === 'UNIT' || card.type === 'LEADER') && (
                                <>
                                    <div className="bg-red-900/30 p-3 rounded border border-red-700/50">
                                        <div className="text-xs text-red-400 mb-1">パワー</div>
                                        <div className="text-2xl font-bold text-white">{card.power ?? 0}</div>
                                    </div>
                                    <div className="bg-yellow-900/30 p-3 rounded border border-yellow-700/50">
                                        <div className="text-xs text-yellow-400 mb-1">ヒット</div>
                                        <div className="text-2xl font-bold text-white">{card.hitCount ?? 1}</div>
                                    </div>
                                </>
                            )}
                            {card.rarity && (
                                <div className="bg-purple-900/30 p-3 rounded border border-purple-700/50">
                                    <div className="text-xs text-purple-400 mb-1">レアリティ</div>
                                    <div className="text-2xl font-bold text-white">{card.rarity}</div>
                                </div>
                            )}
                        </div>

                        {/* Text */}
                        <div className="bg-black/40 p-4 rounded border border-white/10">
                            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {card.text || 'テキストなし'}
                            </div>
                            {card.awakenedText && (
                                <div className="mt-3 pt-3 border-t border-yellow-500/30">
                                    <div className="text-yellow-400 text-xs font-bold mb-2">
                                        【覚醒 LV{card.awakeningLevel}】
                                    </div>
                                    <div className="text-sm text-yellow-200 whitespace-pre-wrap leading-relaxed">
                                        {card.awakenedText}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ID */}
                        <div className="text-xs text-gray-500 font-mono">
                            ID: {card.id}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-800/50 p-3 text-center text-xs text-gray-400 border-t border-white/10 flex-shrink-0">
                    右クリックまたは×ボタンで閉じる
                </div>
            </div>
        </div >
    );
};

export default CardDetailModal;
