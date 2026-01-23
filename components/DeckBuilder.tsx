"use client";

import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../shared/types';
const BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

import Card from './Card'; // Reuse existing Card component
import CardDetailModal from './CardDetailModal';

interface DeckBuilderProps {
    onBack: () => void;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ onBack }) => {
    const [allCards, setAllCards] = useState<CardType[]>([]);
    const [deck, setDeck] = useState<CardType[]>([]);
    const [leader, setLeader] = useState<CardType | null>(null);
    const [detailCard, setDetailCard] = useState<CardType | null>(null);

    // Filters
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterAttr, setFilterAttr] = useState<string>('ALL');
    const [filterCost, setFilterCost] = useState<number | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [deckName, setDeckName] = useState<string>('My Deck');
    const [sortMethod, setSortMethod] = useState<'COST' | 'POWER' | 'NAME'>('COST'); // Add Sort State

    useEffect(() => {
        // Fetch cards from API
        fetch(`${BASE_URL}/api/cards`)
            .then(res => res.json())
            .then((data: CardType[]) => {
                setAllCards(data);
                // Load saved deck
                const savedDeck = localStorage.getItem('myDeck');
                const savedLeader = localStorage.getItem('myLeader');
                if (savedDeck) {
                    const deckIds = JSON.parse(savedDeck) as string[];
                    const loadedDeck = deckIds.map(id => data.find(c => c.id === id)).filter((c): c is CardType => !!c);
                    setDeck(loadedDeck);
                }
                if (savedLeader) {
                    const l = data.find(c => c.id === savedLeader);
                    if (l) setLeader(l);
                }
            })
            .catch(err => console.error('Failed to fetch cards:', err));
    }, []);

    const isCardCompatible = (leaderCard: CardType, card: CardType) => {
        // No attribute or neutral cards are always compatible (adjust logic if '無' or similar exists)
        if (!card.attribute) return true;
        if (!leaderCard.attribute) return true; // Leader has no attribute restriction?

        // Leader attribute might be "炎/闇" etc.
        const leaderAttrs = leaderCard.attribute.split('/');
        const cardAttrs = card.attribute.split('/');

        // Compatible if ANY of card's attributes match ANY of leader's attributes
        return cardAttrs.some(ca => leaderAttrs.includes(ca));
    };

    const filteredCards = allCards.filter(c => {
        if (filterType !== 'ALL' && c.type !== filterType) return false;
        if (filterAttr !== 'ALL') {
            if (!c.attribute && !c.affiliation) return false; // Basic check
            const attrMatch = (c.attribute && c.attribute.includes(filterAttr)) || (c.affiliation && c.affiliation.includes(filterAttr));
            if (!attrMatch) return false;
        }
        if (filterCost !== 'ALL' && c.cost !== filterCost) return false;
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            if (!c.name.toLowerCase().includes(lowerSearch) && !c.text?.toLowerCase().includes(lowerSearch)) return false;
        }
        // Exclude Leader from main list if filtering type UNIT/ITEM/SKILL
        if (c.type === 'LEADER' && filterType !== 'LEADER' && filterType !== 'ALL') return false;

        return true;
    }).sort((a, b) => {
        if (sortMethod === 'COST') return (a.cost || 0) - (b.cost || 0);
        if (sortMethod === 'POWER') return (b.power || 0) - (a.power || 0);
        if (sortMethod === 'NAME') return a.name.localeCompare(b.name);
        return 0;
    });

    const handleCardClick = (card: CardType) => {
        if (card.type === 'LEADER') {
            setLeader(card);
        } else {
            // Check limits
            const copies = deck.filter(c => c.id === card.id).length;
            if (copies >= 3) {
                alert('同名カードは3枚までです');
                return;
            }
            if (deck.length >= 40) {
                alert('デッキは40枚までです');
                return;
            }

            // Check Attribute Compatibility
            if (leader && !isCardCompatible(leader, card)) {
                alert(`リーダーの属性(${leader.attribute})と一致しないカードは追加できません`);
                return;
            }

            // Check triggers
            const isTrigger = (c: CardType) => c.effects?.some(e => e.trigger === 'ON_DAMAGE_TRIGGER') ?? false;
            const triggerCount = deck.filter(isTrigger).length;

            if (isTrigger(card) && triggerCount >= 8) {
                alert('トリガーカードは8枚までです'); // Max 8 Triggers
                return;
            }

            setDeck([...deck, card]);
        }
    };

    const handleDeckCardClick = (index: number) => {
        const newDeck = [...deck];
        newDeck.splice(index, 1);
        setDeck(newDeck);
    };

    const saveDeck = async () => {
        if (!leader) {
            alert('リーダーを選択してください');
            return;
        }
        if (deck.length !== 40) {
            alert(`デッキは40枚必要です (現在: ${deck.length}枚)`);
            return;
        }

        const isTrigger = (c: CardType) => c.effects?.some(e => e.trigger === 'ON_DAMAGE_TRIGGER') ?? false;
        const triggerCount = deck.filter(isTrigger).length;
        if (triggerCount > 8) {
            alert(`トリガーカードは8枚までです (現在: ${triggerCount})`);
            return;
        }

        const incompatibleCards = deck.filter(c => !isCardCompatible(leader, c));
        if (incompatibleCards.length > 0) {
            alert(`属性ルールに違反しているカードがあります (${incompatibleCards.length}枚)。リーダーの属性に合わせてください。`);
            return;
        }

        // Local Save
        localStorage.setItem('myDeck', JSON.stringify(deck.map(c => c.id)));
        localStorage.setItem('myLeader', leader.id);

        // Server Save
        const username = localStorage.getItem('username') || 'Anonymous';
        const deckData = {
            name: deckName,
            leaderId: leader.id,
            deckIdList: deck.map(c => c.id)
        };

        try {
            const res = await fetch(`${BASE_URL}/api/decks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, deck: deckData })
            });
            if (res.ok) {
                alert('デッキをサーバーに保存しました！');
            }
        } catch (e) {
            console.error('Server save failed', e);
            alert('ローカルには保存されましたが、サーバーへの保存に失敗しました。');
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-900 text-white overflow-hidden">
            {detailCard && <CardDetailModal card={detailCard} onClose={() => setDetailCard(null)} />}

            {/* Left: Library */}
            <div className="w-1/2 flex flex-col border-r border-white/10 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">カード一覧</h2>
                    <button onClick={onBack} className="text-gray-400 hover:text-white">戻る</button>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap items-center">
                    <select aria-label="カードタイプで絞り込み" className="bg-slate-800 border border-white/20 rounded px-2 py-1" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="ALL">全てのタイプ</option>
                        <option value="UNIT">ユニット</option>
                        <option value="ITEM">アイテム</option>
                        <option value="SKILL">スキル</option>
                        <option value="LEADER">リーダー</option>
                    </select>
                    <select aria-label="属性で絞り込み" className="bg-slate-800 border border-white/20 rounded px-2 py-1" value={filterAttr} onChange={e => setFilterAttr(e.target.value)}>
                        <option value="ALL">全ての属性</option>
                        <option value="炎">炎</option>
                        <option value="波濤">波濤 (水)</option>
                        <option value="嵐">嵐</option>
                        <option value="大地">大地</option>
                        <option value="稲妻">稲妻</option>
                        <option value="光">光</option>
                        <option value="闇">闇</option>
                    </select>
                    <select aria-label="コストで絞り込み" className="bg-slate-800 border border-white/20 rounded px-2 py-1" value={filterCost} onChange={e => setFilterCost(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}>
                        <option value="ALL">全コスト</option>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(cost => (
                            <option key={cost} value={cost}>コスト {cost}</option>
                        ))}
                    </select>

                    {/* Sort Control */}
                    <div className="flex bg-slate-800 border border-white/20 rounded overflow-hidden">
                        {(['COST', 'POWER', 'NAME'] as const).map(method => (
                            <button
                                key={method}
                                onClick={() => setSortMethod(method)}
                                className={`px-2 py-1 text-xs font-bold ${sortMethod === method ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                {method === 'COST' ? 'Cost' : method === 'POWER' ? 'Pow' : 'Name'}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="検索 (名前/効果)..."
                        className="bg-slate-800 border border-white/20 rounded px-2 py-1 flex-1 min-w-[100px]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-4 content-start p-4 bg-white/5 rounded-lg border border-white/10">
                    {filteredCards.map((card) => (
                        <div key={card.id} className="relative group cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => handleCardClick(card)}
                            onContextMenu={(e) => { e.preventDefault(); setDetailCard(card); }}
                        >
                            <Card card={card} isHidden={false} />
                            {/* Overlay for count in deck */}
                            {card.type !== 'LEADER' && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-1 rounded-bl">
                                    {deck.filter(c => c.id === card.id).length}/3
                                </div>
                            )}
                            {/* Incompatible Overlay */}
                            {leader && !isCardCompatible(leader, card) && card.type !== 'LEADER' && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg pointer-events-none">
                                    <div className="text-red-500 font-bold border-2 border-red-500 rounded px-2 -rotate-12">TYPE MISMATCH</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Current Deck */}
            <div className="w-1/2 flex flex-col p-4 bg-black/20">
                <div className="flex justify-between items-center mb-4 gap-4">
                    <input
                        type="text"
                        className="bg-transparent border-b border-white/30 text-xl font-bold focus:border-blue-500 outline-none flex-1"
                        value={deckName}
                        onChange={e => setDeckName(e.target.value)}
                        placeholder="デッキ名を入力..."
                    />
                    <button
                        onClick={saveDeck}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold shadow-lg transition-colors"
                    >
                        サーバー保存
                    </button>
                </div>

                {/* Leader Section */}
                <div className="mb-4 p-4 border border-white/10 rounded flex items-center gap-4 bg-white/5 min-h-[120px]">
                    <div className="text-sm text-gray-400 w-20">リーダー</div>
                    {leader ? (
                        <div className="scale-75 origin-left cursor-pointer" onClick={() => setDetailCard(leader)}>
                            <Card card={leader} isHidden={false} />
                        </div>
                    ) : (
                        <div className="text-gray-500">リーダーを選択してください</div>
                    )}
                    {leader && (
                        <div className="flex-1">
                            <div className="text-lg font-bold">{leader.name}</div>
                            <div className="text-xs text-gray-400">{leader.attribute} / HP: {leader.life || 10}</div>
                        </div>
                    )}
                </div>

                {/* Deck Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="grid grid-cols-5 gap-y-12 gap-x-2 content-start">
                        {deck.sort((a, b) => (a.cost || 0) - (b.cost || 0)).map((card, i) => (
                            <div key={i} className="scale-90 hover:scale-105 transition-transform cursor-pointer relative z-0 hover:z-10"
                                onClick={() => handleDeckCardClick(i)}
                                onContextMenu={(e) => { e.preventDefault(); setDetailCard(card); }}
                            >
                                <Card card={card} isHidden={false} />
                                {leader && !isCardCompatible(leader, card) && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        <div className="text-4xl">⚠️</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Summary */}
                {/* Stats Summary & Mana Curve */}
                <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex gap-4">
                            <div>ユニット: <span className="text-white font-bold">{deck.filter(c => c.type === 'UNIT').length}</span></div>
                            <div>スペル: <span className="text-white font-bold">{deck.filter(c => c.type === 'SKILL').length}</span></div>
                            <div>アイテム: <span className="text-white font-bold">{deck.filter(c => c.type === 'ITEM').length}</span></div>
                            <div>トリガー: <span className={`font-bold ${deck.filter(c => c.effects?.some(e => e.trigger === 'ON_DAMAGE_TRIGGER')).length > 8 ? 'text-red-500' : 'text-blue-400'}`}>{deck.filter(c => c.effects?.some(e => e.trigger === 'ON_DAMAGE_TRIGGER')).length}</span>/8</div>
                        </div>
                        <div className="text-xs">合計: {deck.length}/40</div>
                    </div>

                    {/* Mana Curve Bar Chart */}
                    <div className="flex items-end h-24 gap-1 mt-4 px-2 pb-2 bg-black/40 rounded border border-white/5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(cost => {
                            const count = deck.filter(c => (c.cost || 0) === cost || (cost === 8 && (c.cost || 0) >= 8)).length;
                            const maxCount = Math.max(...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(c => deck.filter(ce => (ce.cost || 0) === c || (c === 8 && (ce.cost || 0) >= 8)).length), 1);
                            const heightPercent = (count / maxCount) * 100;
                            return (
                                <div key={cost} className="flex-1 flex flex-col items-center group relative">
                                    <div className="text-[10px] mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">{count}</div>
                                    <div
                                        className="w-full bg-blue-500/50 hover:bg-blue-400 transition-colors rounded-t"
                                        style={{ height: `${Math.max(heightPercent, 0)}%`, minHeight: count > 0 ? '4px' : '0' }}
                                    ></div>
                                    <div className="text-[10px] mt-1 text-gray-500">{cost === 8 ? '8+' : cost}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeckBuilder;
