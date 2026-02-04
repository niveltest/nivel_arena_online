"use client";
import React, { useState, useEffect } from 'react';
import { audioManager } from '../utils/AudioManager';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
    const [bgmVolume, setBgmVolume] = useState(() => audioManager.getVolume('bgm'));
    const [seVolume, setSeVolume] = useState(() => audioManager.getVolume('se'));
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    // Sync state when opening without an effect to avoid cascading renders
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setBgmVolume(audioManager.getVolume('bgm'));
            setSeVolume(audioManager.getVolume('se'));
        }
    }

    const handleBgmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setBgmVolume(value);
        audioManager.setVolume('bgm', value);
    };

    const handleSeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setSeVolume(value);
        audioManager.setVolume('se', value);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-blue-400">⚙️</span> AUDIO SETTINGS
                            </h2>

                            <div className="space-y-8">
                                {/* BGM Volume */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label htmlFor="bgm-volume" className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            BGM Volume
                                        </label>
                                        <span className="text-sm font-mono text-blue-400">
                                            {Math.round(bgmVolume * 100)}%
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            id="bgm-volume"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={bgmVolume}
                                            onChange={handleBgmChange}
                                            aria-label="BGM Volume"
                                            className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all border border-white/5"
                                        />
                                    </div>
                                </div>

                                {/* SE Volume */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label htmlFor="se-volume" className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                            SE Volume
                                        </label>
                                        <span className="text-sm font-mono text-purple-400">
                                            {Math.round(seVolume * 100)}%
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            id="se-volume"
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={seVolume}
                                            onChange={handleSeChange}
                                            aria-label="SE Volume"
                                            className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all border border-white/5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-10 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold appearance-none transition-all active:scale-95 text-gray-300 hover:text-white"
                            >
                                CLOSE
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AudioSettingsModal;
