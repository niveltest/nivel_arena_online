"use client";

import React, { useState } from 'react';
import { Card as CardType, SelectionState } from '../shared/types';
import Card from './Card';

interface SelectionModalProps {
    selection: SelectionState;
    allCards: CardType[]; // もしくは GameState から取得
    onConfirm: (selectedIds: string[]) => void;
    onShowDetail?: (card: CardType) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ selection, allCards, onConfirm, onShowDetail }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const candidateCards = allCards.filter(c => selection.candidateIds.includes(c.id));

    const toggleSelect = (id: string) => {
        if (selection.action === 'MULLIGAN') {
            // All or nothing rule: In MULLIGAN phase, selecting ONE selects ALL.
            if (selectedIds.length > 0) {
                setSelectedIds([]); // Deselect all
            } else {
                setSelectedIds(selection.candidateIds); // Select all
            }
            return;
        }

        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            if (selectedIds.length < selection.count) {
                setSelectedIds([...selectedIds, id]);
            }
        }
    };

    const handleConfirm = () => {
        // Mulliganの場合は0枚（全キープ）でも送信可能。それ以外は選択数チェック。
        if (selection.action === 'MULLIGAN' || selectedIds.length === selection.count || (selectedIds.length > 0 && selectedIds.length <= selection.count)) {
            onConfirm(selectedIds);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-900/20 to-transparent">
                    <div className="flex items-center gap-6">
                        {selection.triggerCard && (
                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-[10px] text-cyan-400 font-bold mb-1 uppercase tracking-widest opacity-80">Effect Source</span>
                                <div
                                    className="w-14 h-20 relative ring-2 ring-cyan-500/50 rounded shadow-lg shadow-cyan-900/40 transform hover:scale-110 transition-transform duration-300 cursor-pointer group/source"
                                    onClick={() => onShowDetail?.(selection.triggerCard!)}
                                >
                                    <div className="absolute inset-0 scale-[0.45] origin-top-left" style={{ width: '200%', height: '200%' }}>
                                        <Card card={selection.triggerCard} onShowDetail={onShowDetail} />
                                    </div>
                                    <div className="absolute inset-0 bg-cyan-400/0 group-hover/source:bg-cyan-400/10 transition-colors pointer-events-none rounded"></div>
                                </div>
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-wider">
                                {selection.action === 'DISCARD_HAND' ? '👋 カードを捨てる' :
                                    selection.action === 'MULLIGAN' ? '🔄 マリガン (初期手札の引き直し)' :
                                        '🃏 カード選択'} <span className="text-cyan-400">[{
                                            selection.type === 'HAND' ? '手札' :
                                                selection.type === 'DECK' ? '山札' :
                                                    selection.type === 'DISCARD' ? '捨て札' :
                                                        selection.type === 'FIELD' ? 'フィールド' :
                                                            selection.type === 'DAMAGE_ZONE' ? 'ダメージゾーン' : selection.type
                                        }]</span>
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {selection.action === 'MULLIGAN' ?
                                    '手札を引き直す場合はカードをクリックしてください（全て入れ替わります）' :
                                    `選択してください: ${selectedIds.length} / ${selection.count}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-950/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
                        {candidateCards.map(card => {
                            const isSelected = selectedIds.includes(card.id);
                            return (
                                <div
                                    key={card.id}
                                    className={`relative transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                    onClick={() => toggleSelect(card.id)}
                                >
                                    <Card card={card} onShowDetail={onShowDetail} />
                                    {isSelected && (
                                        <div className="absolute inset-0 border-4 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.5)] pointer-events-none flex items-center justify-center">
                                            <div className="bg-cyan-500 text-black font-bold px-3 py-1 rounded-full text-xs shadow-lg transform -translate-y-12">
                                                選択済み
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-slate-900/80">
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.length === 0 && selection.action !== 'MULLIGAN'}
                        className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 ${(selectedIds.length > 0 || selection.action === 'MULLIGAN')
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transform hover:-translate-y-1'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {selection.action === 'DISCARD_HAND' ? '選択したカードを捨てる' :
                            selection.action === 'MULLIGAN' ? (selectedIds.length === 0 ? 'KEEP ALL (このまま開始)' : 'MULLIGAN ALL (すべて引き直す)') :
                                '選択を確定する'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectionModal;
