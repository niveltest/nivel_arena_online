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
    | 'bgm_battle'
    | 'bgm_lobby'
    | 'bgm_deck'
    | 'bgm_victory'
    | 'bgm_defeat'
    | 'effect'
    | 'turn_start'
    | 'selection';

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
    'bgm_battle': '/audio/bgm_battle.mp3',
    'bgm_lobby': '/audio/bgm_lobby.mp3',
    'bgm_deck': '/audio/bgm_deck.mp3',
    'bgm_victory': '/audio/bgm_victory.mp3',
    'bgm_defeat': '/audio/bgm_defeat.mp3',
    'effect': '/audio/se_effect.mp3',
    'turn_start': '/audio/se_turn_start.mp3',
    'selection': '/audio/se_selection.mp3'
};

class AudioManager {
    private bgm: HTMLAudioElement | null = null;
    private sePool: Map<string, HTMLAudioElement[]> = new Map();
    private config: Record<AudioType, AudioConfig> = {
        bgm: { volume: 0.2, muted: false },
        se: { volume: 0.6, muted: false }
    };
    private initialized = false;
    private initializing = false;

    private pendingBGM: SoundKey | null = null;
    private pendingSE: { key: SoundKey, volume: number }[] = [];
    private currentBGMFadeId: number = 0; // Track active fade to cancel it if volume changes manually


    /**
     * Initialize the audio system
     * Must be called after user interaction due to browser autoplay policies
     */
    public async initialize(): Promise<void> {
        if (this.initialized || this.initializing) {
            console.log('[AudioManager] Already initialized or initializing');
            return;
        }

        this.initializing = true;
        console.log('[AudioManager] Initializing...');

        // Load saved settings from localStorage
        if (typeof window !== 'undefined') {
            const savedConfig = localStorage.getItem('audioConfig');
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    // Merge saved config with defaults to ensure structure
                    this.config = { ...this.config, ...parsed };
                    console.log('[AudioManager] Loaded saved config:', this.config);
                } catch (e) {
                    console.warn('[AudioManager] Failed to load audio config:', e);
                }
            } else {
                console.log('[AudioManager] No saved config, using defaults');
            }
        }

        this.initialized = true;
        this.initializing = false;
        console.log('[AudioManager] Initialized successfully');

        // Apply loaded volume settings to any already active/pending objects
        if (this.bgm) {
            this.bgm.volume = this.config.bgm.muted ? 0 : this.config.bgm.volume;
            // Ensure it's playing if volume > 0 and not paused
            if (!this.config.bgm.muted && this.config.bgm.volume > 0 && this.bgm.paused) {
                this.bgm.play().catch(() => { });
            }
        }

        // Preload commonly used SE
        this.preloadSE(['play_card', 'attack', 'attack_hit', 'damage', 'draw', 'destroy', 'levelUp'], true);

        // Play pending BGM if any
        if (this.pendingBGM) {
            const key = this.pendingBGM;
            this.pendingBGM = null;
            console.log(`[AudioManager] Playing pending BGM: ${key}`);
            this.playBGM(key);
        }

        // Play pending SE if any
        if (this.pendingSE.length > 0) {
            console.log(`[AudioManager] Playing ${this.pendingSE.length} pending sounds`);
            this.pendingSE.forEach(se => this.playSE(se.key, se.volume));
            this.pendingSE = [];
        }
    }

    /**
     * Check if the audio system is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    private preloadSE(keys: SoundKey[], silent: boolean = false) {
        if (typeof window === 'undefined') return;

        if (!silent) console.log(`[AudioManager] Preloading ${keys.length} sound effects...`);
        keys.forEach(key => {
            const src = SOUND_MAP[key];
            if (!src) {
                if (!silent) console.warn(`[AudioManager] Sound key "${key}" not found in SOUND_MAP`);
                return;
            }

            const audio = new Audio(src);
            if (!silent) {
                audio.addEventListener('canplaythrough', () => {
                    console.log(`[AudioManager] Preloaded: ${key} (${src})`);
                }, { once: true });
                audio.addEventListener('error', (e) => {
                    console.error(`[AudioManager] Failed to preload: ${key} (${src})`, e);
                }, { once: true });
            }

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

        // If not initialized, queue but don't play yet to ensure volume settings are loaded
        if (!this.initialized) {
            console.log(`[AudioManager] System not initialized, queuing BGM: ${key}`);
            this.pendingBGM = key;
            return;
        }

        const src = SOUND_MAP[key];
        if (!src) return;

        // If already playing the same track, do nothing
        if (this.bgm && this.bgm.src.endsWith(src) && !this.bgm.paused) return;

        // Stop current BGM if playing
        if (this.bgm) {
            this.stopBGM(500); // Quick fade out for old track
        }

        // Create new BGM instance
        const audio = new Audio(src);
        this.bgm = audio;
        audio.loop = true;

        // Explicit loop handling for browsers that struggle with the loop property
        audio.addEventListener('ended', () => {
            if (audio.loop) {
                console.log(`[AudioManager] BGM loop restart: ${key}`);
                audio.currentTime = 0;
                // Re-apply current volume from config just in case
                audio.volume = this.config.bgm.muted ? 0 : this.config.bgm.volume;
                audio.play().catch(err => console.error('[AudioManager] BGM loop failed:', err));
            }
        });

        // Start silent or at current volume if fade is short
        const targetVolume = this.config.bgm.muted ? 0 : this.config.bgm.volume;
        audio.volume = 0;

        audio.play().then(() => {
            // Ensure we only fade the current BGM after play starts
            if (this.bgm === audio) {
                if (targetVolume > 0 && fadeInDuration > 0) {
                    this.fadeVolume(audio, 0, targetVolume, fadeInDuration);
                } else {
                    audio.volume = targetVolume;
                }
            }
        }).catch(err => {
            console.warn('[AudioManager] BGM play failed (Autoplay?):', err.message);
            this.pendingBGM = key;
        });
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
        if (typeof window === 'undefined') return;

        if (!this.initialized) {
            // Store for later playback once user interacts
            if (this.pendingSE.length < 10) { // Limit queue size
                this.pendingSE.push({ key, volume: volumeScale });
            }
            return;
        }

        if (this.config.se.muted) {
            console.log(`[AudioManager] SE muted, skipping: ${key}`);
            return;
        }

        const src = SOUND_MAP[key];
        if (!src) {
            console.warn(`[AudioManager] Unknown SE key: ${key}`);
            return;
        }

        // Get or create audio pool for this SE
        if (!this.sePool.has(src)) {
            this.sePool.set(src, []);
        }

        const pool = this.sePool.get(src)!;

        // Find available audio element or create new one
        let audio = pool.find(a => a.paused || a.ended);
        if (!audio) {
            console.log(`[AudioManager] Creating new audio instance for: ${key}`);
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
        const finalVolume = Math.max(0, Math.min(1, this.config.se.volume * volumeScale));
        audio.volume = finalVolume;
        audio.currentTime = 0;

        audio.play()
            .then(() => {
                console.log(`[AudioManager] Playing SE: ${key} (volume: ${audio.volume.toFixed(2)})`);
            })
            .catch(err => {
                // Common error: "The play() request was interrupted" or user didn't interact yet
                console.warn(`[AudioManager] SE play failed for ${key}:`, err.message);
            });
    }

    /**
     * Set volume for a specific audio type
     */
    public setVolume(type: AudioType, volume: number): void {
        const validatedVolume = Math.max(0, Math.min(1, volume));
        this.config[type].volume = validatedVolume;

        if (type === 'bgm') {
            // If there's an active fade, "cancel" it by incrementing the ID
            this.currentBGMFadeId++;

            if (this.bgm) {
                const targetVolume = this.config.bgm.muted ? 0 : validatedVolume;
                this.bgm.volume = targetVolume;

                // If volume becomes > 0, ensure it's playing
                if (!this.config.bgm.muted && targetVolume > 0 && this.bgm.paused) {
                    this.bgm.play().catch(() => { });
                }
            }
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

        if (type === 'bgm') {
            this.currentBGMFadeId++; // Cancel any active fade
            if (this.bgm) {
                const targetVolume = this.config.bgm.muted ? 0 : this.config.bgm.volume;
                this.bgm.volume = targetVolume;

                // If unmuting and volume > 0, ensure it's playing
                if (!this.config.bgm.muted && targetVolume > 0 && this.bgm.paused) {
                    this.bgm.play().catch(() => { });
                }
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
        const fadeId = this.currentBGMFadeId;

        const fade = () => {
            // Cancel if a different fade has started or manual volume set
            if (this.currentBGMFadeId !== fadeId) {
                console.log('[AudioManager] Fade cancelled by new volume command');
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            try {
                audio.volume = Math.max(0, Math.min(1, from + volumeDiff * progress));
            } catch (e) {
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
