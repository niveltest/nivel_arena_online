import React from 'react';

interface ResultModalProps {
    result: 'WIN' | 'LOSE';
    reason: string;
    onReturnToLobby: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ result, reason, onReturnToLobby }) => {
    const isWin = result === 'WIN';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]">
            <div className={`
                relative p-12 rounded-2xl shadow-2xl border-4 text-center transform transition-all scale-100
                ${isWin ? 'bg-gradient-to-b from-yellow-900 to-black border-yellow-400 shadow-yellow-500/50' : 'bg-gradient-to-b from-gray-900 to-black border-gray-600 shadow-gray-500/50'}
            `}>
                <div className={`text-6xl font-black mb-4 tracking-wider drop-shadow-lg ${isWin ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {isWin ? 'VICTORY' : 'DEFEAT'}
                </div>

                <div className="text-xl text-white/80 mb-8 font-mono">
                    {reason === 'DAMAGE' && (isWin ? '相手のHPを0にしました！' : 'HPが0になりました...')}
                    {reason === 'DECK_OUT' && (isWin ? '相手のデッキが尽きました！' : 'デッキが尽きました...')}
                    {reason === 'SURRENDER' && (isWin ? '相手が降参しました' : '降参しました')}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={onReturnToLobby}
                        className={`
                            px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg
                            ${isWin ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-gray-600 hover:bg-gray-500 text-white'}
                        `}
                    >
                        ロビーに戻る
                    </button>
                </div>

                {/* Decorative Elements */}
                {isWin && (
                    <>
                        <div className="absolute -top-4 -left-4 text-yellow-500 text-4xl animate-bounce">👑</div>
                        <div className="absolute -bottom-4 -right-4 text-yellow-500 text-4xl animate-bounce delay-100">✨</div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResultModal;
