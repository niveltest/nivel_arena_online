/**
 * AudioManager - Manages BGM and SE playback for the game
 * Supports volume control, fading, and multiple audio channels
 */

export type AudioType = 'bgm' | 'se';

// Define available sound keys
export type SoundKey =
    | 'play_card'
    | 'attack'
    | 'attack_hit'
    | 'draw'
    | 'destroy'
    | 'damage'
    | 'levelUp'
    | 'victory'
    | 'defeat'
    | 'bgm_battle';

export interface AudioConfig {
    volume: number; // 0.0 to 1.0
    muted: boolean;
}

// Map logical keys to physical file paths (relative to public/)
const SOUND_MAP: Record<SoundKey, string> = {
    'play_card': '/audio/se_play_card.mp3',
    'attack': '/audio/se_attack_start.mp3',
    'attack_hit': '/audio/se_attack_hit.mp3',
    'draw': '/audio/se_draw.mp3',
    'destroy': '/audio/se_destroy.mp3',
    'damage': '/audio/se_damage.mp3',
    'levelUp': '/audio/se_levelup.mp3',
    'victory': '/audio/se_victory.mp3',
    'defeat': '/audio/se_defeat.mp3',
    'bgm_battle': '/audio/bgm_battle.mp3'
};

class AudioManager {
    private bgm: HTMLAudioElement | null = null;
    private sePool: Map<string, HTMLAudioElement[]> = new Map();
    private config: Record<AudioType, AudioConfig> = {
        bgm: { volume: 0.4, muted: false },
        se: { volume: 0.6, muted: false }
    };
    private initialized = false;

    /**
     * Initialize the audio system
     * Must be called after user interaction due to browser autoplay policies
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Load saved settings from localStorage
        if (typeof window !== 'undefined') {
            const savedConfig = localStorage.getItem('audioConfig');
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    // Merge saved config with defaults to ensure structure
                    this.config = { ...this.config, ...parsed };
                } catch (e) {
                    console.warn('Failed to load audio config:', e);
                }
            }
        }

        this.initialized = true;
        console.log('[AudioManager] Initialized');

        // Preload commonly used SE
        this.preloadSE(['play_card', 'attack', 'attack_hit', 'damage']);
    }

    private preloadSE(keys: SoundKey[]) {
        if (typeof window === 'undefined') return;

        keys.forEach(key => {
            const src = SOUND_MAP[key];
            const audio = new Audio(src);
            audio.load(); // Hint browser to preload
            // Store one instance in the pool
            this.sePool.set(src, [audio]);
        });
    }

    /**
     * Play background music with optional fade-in
     */
    public playBGM(key: SoundKey, fadeInDuration: number = 1000): void {
        if (typeof window === 'undefined') return;
        const src = SOUND_MAP[key];
        if (!src) return;

        // If already playing the same track, do nothing
        if (this.bgm && this.bgm.src.endsWith(src) && !this.bgm.paused) return;

        // Stop current BGM if playing
        if (this.bgm) {
            this.stopBGM(500); // Quick fade out for old track
        }

        // Create new BGM instance
        this.bgm = new Audio(src);
        this.bgm.loop = true;
        // Start silent if not muted, or stay silent if muted
        this.bgm.volume = 0;

        // Play logic
        if (!this.config.bgm.muted) {
            const targetVolume = this.config.bgm.volume;
            this.bgm.play().then(() => {
                this.fadeVolume(this.bgm!, 0, targetVolume, fadeInDuration);
            }).catch(err => {
                // Autoplay policy might block this
                console.warn('[AudioManager] BGM play failed (Autoplay?):', err);
            });
        }
    }

    /**
     * Stop background music with optional fade-out
     */
    public stopBGM(fadeOutDuration: number = 500): void {
        if (!this.bgm) return;

        const audio = this.bgm;
        this.bgm = null; // Detach immediately

        if (fadeOutDuration > 0 && !audio.paused) {
            this.fadeVolume(audio, audio.volume, 0, fadeOutDuration, () => {
                audio.pause();
            });
        } else {
            audio.pause();
        }
    }

    /**
     * Play a sound effect
     */
    public playSE(key: SoundKey, volumeScale: number = 1.0): void {
        if (!this.initialized && typeof window !== 'undefined') {
            // Auto-init on first user interaction-triggered sound if possible
            this.initialized = true;
        }

        if (this.config.se.muted) return;

        const src = SOUND_MAP[key];
        if (!src) return;

        // Get or create audio pool for this SE
        if (!this.sePool.has(src)) {
            this.sePool.set(src, []);
        }

        const pool = this.sePool.get(src)!;

        // Find available audio element or create new one
        let audio = pool.find(a => a.paused || a.ended);
        if (!audio) {
            audio = new Audio(src);
            pool.push(audio);

            // Limit pool size to prevent memory leaks
            if (pool.length > 5) {
                // If pool is full, reuse the oldest one (index 0) even if playing
                // but better to just shift and let GC handle it, creating a new one
                pool.shift();
            }
        }

        // Apply volume (Master SE Volume * Event Specific Scale)
        audio.volume = Math.max(0, Math.min(1, this.config.se.volume * volumeScale));
        audio.currentTime = 0;

        audio.play().catch(err => {
            // Common error: "The play() request was interrupted" or user didn't interact yet
            // Minimal logging to avoid console spam
            // console.debug('[AudioManager] SE play failed:', err);
        });
    }

    /**
     * Set volume for a specific audio type
     */
    public setVolume(type: AudioType, volume: number): void {
        this.config[type].volume = Math.max(0, Math.min(1, volume));

        if (type === 'bgm' && this.bgm) {
            this.bgm.volume = this.config[type].muted ? 0 : this.config[type].volume;
        }

        this.saveConfig();
    }

    /**
     * Get current volume for a specific audio type
     */
    public getVolume(type: AudioType): number {
        return this.config[type].volume;
    }

    /**
     * Toggle mute for a specific audio type
     */
    public toggleMute(type: AudioType): boolean {
        this.config[type].muted = !this.config[type].muted;

        if (type === 'bgm' && this.bgm) {
            if (this.config.bgm.muted) {
                this.bgm.volume = 0;
            } else {
                this.bgm.volume = this.config.bgm.volume;
            }
        }

        this.saveConfig();
        return this.config[type].muted;
    }

    /**
     * Check if a specific audio type is muted
     */
    public isMuted(type: AudioType): boolean {
        return this.config[type].muted;
    }

    /**
     * Fade audio volume over time
     */
    private fadeVolume(
        audio: HTMLAudioElement,
        from: number,
        to: number,
        duration: number,
        onComplete?: () => void
    ): void {
        const startTime = Date.now();
        const volumeDiff = to - from;

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Check if audio is still valid (not paused externally)
            try {
                audio.volume = Math.max(0, Math.min(1, from + volumeDiff * progress));
            } catch (e) {
                // Element might be in invalid state
                return;
            }

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else if (onComplete) {
                onComplete();
            }
        };

        fade();
    }

    /**
     * Save configuration to localStorage
     */
    private saveConfig(): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('audioConfig', JSON.stringify(this.config));
        }
    }
}

// Singleton instance
export const audioManager = new AudioManager();
