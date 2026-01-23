"use client";
import React, { useState } from 'react';
import { io } from 'socket.io-client';

interface LobbyProps {
    onJoin: (username: string, roomId: string) => void;
    onDeckBuilder: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin, onDeckBuilder }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [mode, setMode] = useState<'MENU' | 'JOIN'>('MENU');
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedDeck, setSelectedDeck] = useState<string>('CUSTOM');

    const starterDecks = [
        { id: 'ST01', name: 'Starter Deck: Counters (炎)', attribute: '炎' },
        { id: 'ST02', name: 'Starter Deck: Real Kindness (大地)', attribute: '大地' },
        { id: 'ST03', name: 'Starter Deck: Heretic (嵐)', attribute: '嵐' },
        { id: 'ST04', name: 'Starter Deck: Inherit (波濤)', attribute: '波濤' },
        { id: 'ST05', name: 'Starter Deck: Maid For You (稲妻)', attribute: '稲妻' }
    ];

    const handleCreate = () => {
        console.log("Create button clicked. Username:", username, "SelectedDeck:", selectedDeck);
        if (!username.trim()) {
            return alert("プレイヤー名を入力してください。");
        }

        setIsConnecting(true);

        // Request server to create room
        const socket = io('http://localhost:3001', {
            timeout: 5000,
            reconnection: false
        });

        const connectionTimeout = setTimeout(() => {
            if (socket.connected) return;
            socket.disconnect();
            setIsConnecting(false);
            alert("サーバーに接続できませんでした。サーバーが起動しているか確認してください。\n(npm run dev:all での起動を推奨します)");
        }, 5000);

        socket.on('connect_error', (err) => {
            console.error("Socket connection error:", err);
            clearTimeout(connectionTimeout);
            socket.disconnect();
            setIsConnecting(false);
            alert("サーバー接続エラー: サーバーが起動していない可能性があります。");
        });

        socket.emit('createGame', username, selectedDeck, (newRoomId: string) => {
            console.log("Room created successfully:", newRoomId);
            clearTimeout(connectionTimeout);
            socket.disconnect(); // Disconnect temp socket, GameBoard handles main connection
            localStorage.setItem('selectedStarterDeck', selectedDeck);
            setIsConnecting(false);
            onJoin(username, newRoomId);
        });
    };

    const handleJoin = () => {
        console.log("Join button clicked. Username:", username, "RoomId:", roomId);
        if (!username.trim()) {
            return alert("プレイヤー名を入力してください。");
        }
        if (!roomId.trim()) {
            return alert("ルームIDを入力してください。");
        }

        // Pass selected deck when joining
        // Note: The server needs to handle deck selection for both creator and joiner
        localStorage.setItem('selectedStarterDeck', selectedDeck);
        onJoin(username, roomId);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

            <div className="p-8 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl w-full max-w-md z-10">
                <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Nivel Arena
                </h1>

                <div className="mb-6">
                    <label htmlFor="player-name" className="block text-xs text-gray-400 mb-1">PLAYER NAME</label>
                    <input
                        id="player-name"
                        type="text"
                        placeholder="Enter your name"
                        autoComplete="off"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="mb-8">
                    <label htmlFor="deck-select" className="block text-xs text-gray-400 mb-1">DECK SELECTION</label>
                    <select
                        id="deck-select"
                        title="Deck Selection"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition appearance-none cursor-pointer"
                        value={selectedDeck}
                        onChange={(e) => setSelectedDeck(e.target.value)}
                    >
                        <option value="CUSTOM" className="bg-slate-900">Custom Deck (From Builder)</option>
                        {starterDecks.map(deck => (
                            <option key={deck.id} value={deck.id} className="bg-slate-900">
                                {deck.name}
                            </option>
                        ))}
                    </select>
                </div>

                {mode === 'MENU' ? (
                    <div className="space-y-4">
                        <button
                            onClick={handleCreate}
                            disabled={isConnecting}
                            className={`w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold text-lg shadow-lg transform transition hover:scale-105 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isConnecting ? 'CONNECTING...' : 'CREATE ROOM'}
                        </button>
                        <button
                            onClick={() => setMode('JOIN')}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-lg border border-white/10 transition"
                        >
                            JOIN ROOM
                        </button>
                        <button
                            onClick={onDeckBuilder}
                            className="w-full py-2 mt-2 text-yellow-500 hover:text-yellow-400 font-bold border border-yellow-500/30 rounded hover:bg-yellow-500/10 transition"
                        >
                            DECK BUILDER
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label htmlFor="room-id" className="block text-xs text-gray-400 mb-1">ROOM ID</label>
                            <input
                                id="room-id"
                                type="text"
                                placeholder="ex. A1B2C3"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 transition font-mono uppercase"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            />
                        </div>
                        <button
                            onClick={handleJoin}
                            disabled={!roomId.trim()}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            JOIN GAME
                        </button>
                        <button
                            onClick={() => setMode('MENU')}
                            className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 text-xs text-gray-600">
                v0.5.0 - Lobby System Implemented
            </div>
        </div>
    );
};

export default Lobby;
