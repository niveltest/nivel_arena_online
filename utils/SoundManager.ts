import { audioManager, SoundKey } from './AudioManager';

/**
 * Legacy SoundManager Adapter
 * Forwards calls to the new AudioManager
 */
export class SoundManager {
    // Map legacy keys to new SoundKeys
    private static KEY_MAP: Record<string, SoundKey> = {
        'play_card': 'play_card',
        'attack': 'attack',
        'draw': 'draw',
        'destroy': 'destroy',
        'damage': 'damage', // Maps to damage received sound
        'levelUp': 'levelUp',
        'bgm_battle': 'bgm_battle',
        'bgm_lobby': 'bgm_lobby',
        'bgm_deck': 'bgm_deck',
        'bgm_victory': 'bgm_victory',
        'bgm_defeat': 'bgm_defeat',
        'effect': 'effect',
        'turn_start': 'turn_start',
        'selection': 'selection'
    };

    static preload() {
        // AudioManager handles initialization and preloading lazily or explicitly
        if (typeof window !== 'undefined') {
            audioManager.initialize().catch(console.error);
        }
    }

    static play(key: string) {
        if (typeof window === 'undefined') return;

        const mappedKey = this.KEY_MAP[key];
        if (mappedKey) {
            // Debug: Log stack trace for BGM calls to identify trigger source
            if (mappedKey.startsWith('bgm_')) {
                console.log(`[SoundManager] play(${key}) -> mapped to ${mappedKey}`);
                console.trace('[SoundManager] BGM call stack:');
                audioManager.playBGM(mappedKey);
            } else {
                console.log(`[SoundManager] play(${key}) -> mapped to ${mappedKey}`);
                audioManager.playSE(mappedKey);
            }
        } else {
            console.warn(`[SoundManager] Unknown sound key: ${key}`);
        }
    }
}
