"use client";

import React from 'react';
import Image from 'next/image';
import { Card as CardType } from '../shared/types';

interface CardDetailModalProps {
    card: CardType;
    onClose: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
    // ... (lines 13-80 suppressed)

    <div className="w-72 aspect-[2.5/3.5] bg-black/40 rounded-lg border-2 border-white/10 overflow-hidden relative shadow-2xl">
        {card.imageUrl ? (
            <Image
                src={card.imageUrl.includes('nivelarena.jp')
                    ? `${SOCKET_URL}/api/proxy-image?url=${encodeURIComponent(card.imageUrl)}`
                    : card.imageUrl
                }
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
                    </div >

    {/* Details */ }
    < div className = "flex-1 space-y-4 min-w-0" >
        {/* Stats */ }
        < div className = "grid grid-cols-2 gap-3" >
            <div className="bg-cyan-900/30 p-3 rounded border border-cyan-700/50">
                <div className="text-xs text-cyan-400 mb-1">コスト</div>
                <div className="text-2xl font-bold text-white">{card.cost}</div>
            </div>
{
    (card.type === 'UNIT' || card.type === 'LEADER') && (
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
    )
}
{
    card.rarity && (
        <div className="bg-purple-900/30 p-3 rounded border border-purple-700/50">
            <div className="text-xs text-purple-400 mb-1">レアリティ</div>
            <div className="text-2xl font-bold text-white">{card.rarity}</div>
        </div>
    )
}
                        </div >

    {/* Text */ }
    < div className = "bg-black/40 p-4 rounded border border-white/10" >
        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {card.text || 'テキストなし'}
        </div>
{
    card.awakenedText && (
        <div className="mt-3 pt-3 border-t border-yellow-500/30">
            <div className="text-yellow-400 text-xs font-bold mb-2">
                【覚醒 LV{card.awakeningLevel}】
            </div>
            <div className="text-sm text-yellow-200 whitespace-pre-wrap leading-relaxed">
                {card.awakenedText}
            </div>
        </div>
    )
}
                        </div >

    {/* ID */ }
    < div className = "text-xs text-gray-500 font-mono" >
        ID: { card.id }
                        </div >
                    </div >
                </div >

    {/* Footer */ }
    < div className = "bg-slate-800/50 p-3 text-center text-xs text-gray-400 border-t border-white/10 flex-shrink-0" >
        右クリックまたは×ボタンで閉じる
                </div >
            </div >
        </div >
    );
};

export default CardDetailModal;
