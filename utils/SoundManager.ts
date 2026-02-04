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
        'bgm_battle': 'bgm_battle'
    };

    static preload() {
        // AudioManager handles initialization and preloading lazily or explicitly
        if (typeof window !== 'undefined') {
            audioManager.initialize().catch(console.error);
        }
    }

    static play(key: string) {
        if (typeof window === 'undefined') return;

        // Special handling for legacy keys that might not match 1:1
        // 'damage' is ambiguous in legacy (giving or taking?), assuming taking damage for now
        // 'attack' might need 'attack_hit' too? 

        const mappedKey = this.KEY_MAP[key];
        if (mappedKey) {
            if (mappedKey === 'bgm_battle') {
                audioManager.playBGM(mappedKey);
            } else {
                audioManager.playSE(mappedKey);
            }
        } else {
            console.warn(`[SoundManager] Unknown sound key: ${key}`);
        }
    }
}
