export class SoundManager {
    static sounds: Record<string, string> = {
        'play_card': 'https://freesound.org/data/previews/324/324896_3248244-lq.mp3', // Placeholder (Card Flip)
        'attack': 'https://freesound.org/data/previews/566/566435_11674759-lq.mp3', // Placeholder (Sword Swoosh)
        'draw': 'https://freesound.org/data/previews/369/369515_7086082-lq.mp3', // Placeholder (Card Draw)
        'destroy': 'https://freesound.org/data/previews/175/175944_2577457-lq.mp3', // Placeholder (Break)
        'damage': 'https://assets.mixkit.co/sfx/preview/mixkit-explosion-hit-1704.mp3', // Placeholder
        'levelUp': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3', // Placeholder
        'bgm_battle': '' // Placeholder
    };

    static audioCache: Record<string, HTMLAudioElement> = {};

    static preload() {
        if (typeof window === 'undefined') return;
        Object.keys(this.sounds).forEach(key => {
            if (this.sounds[key]) {
                const audio = new Audio(this.sounds[key]);
                audio.volume = 0.5;
                this.audioCache[key] = audio;
            }
        });
    }

    static play(key: string) {
        if (typeof window === 'undefined') return;

        const url = this.sounds[key];
        if (!url) return;

        // Silently fail if audio cannot be loaded - don't disrupt gameplay
        try {
            const audio = new Audio(url);
            audio.volume = 0.4;
            audio.play().catch(() => {
                // Silently ignore audio playback errors
                // These are typically caused by:
                // - User hasn't interacted with page yet (browser autoplay policy)
                // - Audio file not found or CORS issues
                // - Network problems
            });
        } catch (e) {
            // Silently ignore audio loading errors
        }
    }
}
