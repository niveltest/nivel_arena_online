"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import { Card as CardType } from '../shared/types';

interface CardDetailModalProps {
    card: CardType;
    onClose: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, onClose }) => {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent scroll on body when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const imageUrl = card.imageUrl
        ? (card.imageUrl.includes('nivelarena.jp')
            ? `${SOCKET_URL}/api/proxy-image?url=${encodeURIComponent(card.imageUrl)}`
            : card.imageUrl)
        : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <div
                className="bg-slate-900 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-white/20 shadow-2xl ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Image Section */}
                <div className="w-full md:w-80 bg-black/50 p-6 flex items-center justify-center flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10">
                    <div className="relative w-64 aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-lg border border-white/10">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={card.name}
                                fill
                                className="object-contain"
                                unoptimized
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-slate-800">
                                <span>No Image</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
                    {/* Header */}
                    <div className="p-5 border-b border-white/10 bg-slate-800/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{card.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-200 border border-slate-600">
                                        {card.type}
                                    </span>
                                    {card.attribute && (
                                        <span className="text-gray-400">
                                            {card.attribute}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-cyan-950/40 p-3 rounded border border-cyan-800/50 flex flex-col items-center">
                                <span className="text-xs text-cyan-400 mb-1 font-bold">COST</span>
                                <span className="text-2xl font-bold text-white">{card.cost}</span>
                            </div>

                            {(card.type === 'UNIT' || card.type === 'LEADER') && (
                                <>
                                    <div className="bg-red-950/40 p-3 rounded border border-red-800/50 flex flex-col items-center">
                                        <span className="text-xs text-red-400 mb-1 font-bold">POWER</span>
                                        <span className="text-2xl font-bold text-white">{card.power ?? 0}</span>
                                    </div>
                                    <div className="bg-amber-950/40 p-3 rounded border border-amber-800/50 flex flex-col items-center">
                                        <span className="text-xs text-amber-400 mb-1 font-bold">HIT</span>
                                        <span className="text-2xl font-bold text-white">{card.hitCount ?? 1}</span>
                                    </div>
                                </>
                            )}

                            {card.rarity && (
                                <div className="bg-purple-950/40 p-3 rounded border border-purple-800/50 flex flex-col items-center">
                                    <span className="text-xs text-purple-400 mb-1 font-bold">RARITY</span>
                                    <span className="text-lg font-bold text-white leading-8">{card.rarity}</span>
                                </div>
                            )}
                        </div>

                        {/* Card Text */}
                        <div className="space-y-4">
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-white/5 shadow-inner">
                                <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Effect Text</h3>
                                <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {card.text || <span className="text-gray-600 italic">No text</span>}
                                </p>
                            </div>

                            {card.awakenedText && (
                                <div className="bg-yellow-950/20 p-4 rounded-lg border border-yellow-700/30 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none"></div>
                                    <h3 className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                                        <span>Awakening</span>
                                        <span className="bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded text-[10px] border border-yellow-700/50">LV.{card.awakeningLevel}</span>
                                    </h3>
                                    <p className="text-sm text-yellow-100 whitespace-pre-wrap leading-relaxed">
                                        {card.awakenedText}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-slate-950/30 border-t border-white/10 flex justify-between items-center text-xs text-gray-500 font-mono">
                        <span>ID: {card.id}</span>
                        <span>Click outside or Press ESC to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDetailModal;
