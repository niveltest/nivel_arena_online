"use client";
import React, { useState } from 'react';
import { io } from 'socket.io-client';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
console.log('[Lobby] Expected Socket URL:', SOCKET_URL);
import { useEffect } from 'react';
import { SoundManager } from '../utils/SoundManager';
import { audioManager } from '../utils/AudioManager';
import AudioSettingsModal from './AudioSettingsModal';


interface LobbyProps {
    onJoin: (username: string, roomId: string, password?: string, isSpectator?: boolean) => void;
    onDeckBuilder: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ onJoin, onDeckBuilder }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [password, setPassword] = useState(''); // For Join
    const [createPassword, setCreatePassword] = useState(''); // For Create
    const [isSpectator, setIsSpectator] = useState(false);
    const [mode, setMode] = useState<'MENU' | 'JOIN' | 'CREATE_CONFIG'>('MENU');
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedDeck, setSelectedDeck] = useState<string>('CUSTOM');
    const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

    useEffect(() => {
        // Initialize Audio System
        console.log('[Lobby] Initializing audio system...');
        audioManager.initialize().catch(console.error);
        SoundManager.preload();

        // Also initialize on first user interaction (for browsers with strict autoplay policies)
        const handleFirstInteraction = () => {
            console.log('[Lobby] First user interaction detected, ensuring audio is initialized');
            audioManager.initialize().catch(console.error);
            // Remove listeners after first interaction
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };

        document.addEventListener('click', handleFirstInteraction, { once: true });
        document.addEventListener('keydown', handleFirstInteraction, { once: true });

        // Try to play lobby BGM (will be pending if blocked)
        SoundManager.play('bgm_lobby');

        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

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

        const socket = io(SOCKET_URL, {
            timeout: 15000,
            reconnection: false,
            transports: ['polling', 'websocket'], // Start with polling for better compatibility
            withCredentials: true
        });

        const connectionTimeout = setTimeout(() => {
            if (socket.connected) return;
            socket.disconnect();
            setIsConnecting(false);
            alert("サーバーへの接続がタイムアウトしました。");
        }, 15000);

        socket.on('connect_error', (err) => {
            console.error("Socket connection error:", err);
            clearTimeout(connectionTimeout);
            socket.disconnect();
            setIsConnecting(false);
            alert(`サーバー接続エラー (${SOCKET_URL}): ${err.message}`);
        });

        socket.emit('createGame', username, selectedDeck, createPassword, (newRoomId: string) => {
            console.log("Room created successfully:", newRoomId);
            clearTimeout(connectionTimeout);
            socket.disconnect();
            localStorage.setItem('selectedStarterDeck', selectedDeck);
            setIsConnecting(false);
            onJoin(username, newRoomId, createPassword, false);
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

        localStorage.setItem('selectedStarterDeck', selectedDeck);
        onJoin(username, roomId, password, isSpectator);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Grid background using CSS instead of SVG file to avoid 404 */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid-pattern">
            </div>

            {/* Audio Settings Button */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={() => setIsAudioSettingsOpen(true)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group active:scale-90"
                    title="Audio Settings"
                >
                    <span className="text-xl group-hover:rotate-90 transition-transform inline-block">⚙️</span>
                </button>
            </div>

            <AudioSettingsModal
                isOpen={isAudioSettingsOpen}
                onClose={() => setIsAudioSettingsOpen(false)}
            />

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

                {mode === 'MENU' && (
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
                )}

                {mode === 'MENU' ? (
                    <div className="space-y-4">
                        <button
                            onClick={() => setMode('CREATE_CONFIG')}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold text-lg shadow-lg transform transition hover:scale-105"
                        >
                            CREATE ROOM
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
                ) : mode === 'CREATE_CONFIG' ? (
                    <div className="space-y-4 animate-fadeIn">
                        <h2 className="text-xl font-bold mb-4">Create Room Settings</h2>
                        <div className="mb-6">
                            <label htmlFor="create-password" className="block text-xs text-gray-400 mb-1">PASSWORD (Optional)</label>
                            <input
                                id="create-password"
                                type="text"
                                placeholder="Leave empty for no password"
                                autoComplete="off"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition"
                                value={createPassword}
                                onChange={(e) => setCreatePassword(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={isConnecting}
                            className={`w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold text-lg shadow-lg transform transition hover:scale-105 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isConnecting ? 'CONNECTING...' : 'START GAME'}
                        </button>
                        <button
                            onClick={() => setMode('MENU')}
                            className="w-full py-2 text-sm text-gray-400 hover:text-white transition"
                        >
                            Back
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
                        <div className="mb-4">
                            <label htmlFor="join-password" className="block text-xs text-gray-400 mb-1">PASSWORD</label>
                            <input
                                id="join-password"
                                type="text"
                                placeholder="If required"
                                autoComplete="off"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 mb-4">
                            <input
                                type="checkbox"
                                id="spectator-mode"
                                checked={isSpectator}
                                onChange={(e) => setIsSpectator(e.target.checked)}
                                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600 ring-offset-gray-800"
                            />
                            <label htmlFor="spectator-mode" className="text-sm font-medium text-gray-300">Join as Spectator</label>
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
                v0.6.2 - Audio Fix Applied
            </div>
        </div>
    );
};

export default Lobby;
