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
    private currentBGMKey: SoundKey | null = null;
    private pendingBGM: SoundKey | null = null;
    private pendingSE: { key: SoundKey, volume: number }[] = [];
    private currentBGMFadeId: number = 0; // Track active fade to cancel it if volume changes manually


    private fadingBGMs: HTMLAudioElement[] = [];

    // Track sounds that failed to load (404 etc.) to prevent repeated attempts
    private missingSounds: Set<string> = new Set();

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
        console.log('[AudioManager] Initializing audio system...');

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
            }
        }

        this.initialized = true;
        this.initializing = false;
        console.log('[AudioManager] Initialized successfully');

        // Preload commonly used SE
        this.preloadSE(['play_card', 'attack', 'attack_hit', 'damage', 'draw', 'destroy', 'levelUp'], true);

        // Play pending sounds
        if (this.pendingBGM) {
            this.playBGM(this.pendingBGM);
            this.pendingBGM = null;
        }

        if (this.pendingSE.length > 0) {
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

        keys.forEach(key => {
            const src = SOUND_MAP[key];
            if (!src || this.missingSounds.has(src)) return;

            const audio = new Audio(src);
            audio.load();
            if (!this.sePool.has(src)) {
                this.sePool.set(src, [audio]);
            }

            audio.onerror = () => {
                if (!silent) console.warn(`[AudioManager] Missing expected file: ${src} (Key: ${key})`);
                this.missingSounds.add(src);
            };
        });
    }

    /**
     * Play background music with optional fade-in
     */
    public playBGM(key: SoundKey, fadeInDuration: number = 1000): void {
        if (typeof window === 'undefined') return;

        const src = SOUND_MAP[key];
        if (!src || this.missingSounds.has(src)) {
            console.warn(`[AudioManager] Skipping BGM "${key}" - file missing or invalid.`);
            return;
        }

        if (!this.initialized) {
            this.pendingBGM = key;
            this.currentBGMKey = key;
            return;
        }

        if (this.currentBGMKey === key && this.bgm && !this.bgm.paused) return;

        console.log(`[AudioManager] playBGM: ${key} -> ${src}`);
        this.currentBGMKey = key;

        if (this.bgm) {
            this.bgm.pause();
            this.bgm.src = "";
            this.bgm = null;
        }

        this.fadingBGMs.forEach(audio => { audio.pause(); audio.src = ""; });
        this.fadingBGMs = [];

        const audio = new Audio(src);
        this.bgm = audio;
        audio.loop = true;

        const targetVolume = this.config.bgm.muted ? 0 : this.config.bgm.volume;
        audio.volume = 0;

        audio.play().then(() => {
            if (this.bgm === audio) {
                if (targetVolume > 0 && fadeInDuration > 0) {
                    this.currentBGMFadeId++;
                    this.fadeVolume(audio, 0, targetVolume, fadeInDuration);
                } else {
                    audio.volume = targetVolume;
                }
            } else {
                audio.pause();
                audio.src = "";
            }
        }).catch(err => {
            console.error(`[AudioManager] BGM play failed: ${key} (${src}) -`, err.message);
            audio.pause();
            audio.src = "";
        });

        audio.onerror = () => {
            console.error(`[AudioManager] 404: BGM file not found: ${src}`);
            this.missingSounds.add(src);
        };
    }

    /**
     * Stop background music with optional fade-out
     */
    public stopBGM(fadeOutDuration: number = 500, keepKey: boolean = false): void {
        if (!keepKey) {
            this.currentBGMKey = null;
            this.pendingBGM = null;
        }
        if (!this.bgm) return;

        const audio = this.bgm;
        this.bgm = null;
        this.currentBGMFadeId++;

        if (fadeOutDuration > 0 && !audio.paused) {
            this.fadingBGMs.push(audio);
            this.fadeVolume(audio, audio.volume, 0, fadeOutDuration, () => {
                audio.pause();
                this.fadingBGMs = this.fadingBGMs.filter(a => a !== audio);
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

        const src = SOUND_MAP[key];
        if (!src || this.missingSounds.has(src)) {
            // Silence if missing
            return;
        }

        if (!this.initialized) {
            if (this.pendingSE.length < 10) this.pendingSE.push({ key, volume: volumeScale });
            return;
        }

        if (this.config.se.muted) return;

        if (!this.sePool.has(src)) this.sePool.set(src, []);
        const pool = this.sePool.get(src)!;

        let audio = pool.find(a => a.paused || a.ended);
        if (!audio) {
            audio = new Audio(src);
            pool.push(audio);
            if (pool.length > 5) pool.shift();
        }

        audio.volume = Math.max(0, Math.min(1, this.config.se.volume * volumeScale));
        audio.currentTime = 0;

        audio.play().then(() => {
            console.log(`[AudioManager] playSE: ${key} -> ${src} (vol: ${audio.volume.toFixed(2)})`);
        }).catch(err => {
            if (err.name !== 'NotAllowedError') {
                console.error(`[AudioManager] SE play error: ${key} -`, err.message);
            }
        });

        audio.onerror = () => {
            console.error(`[AudioManager] 404: SE file not found: ${src}`);
            this.missingSounds.add(src);
        };
    }

    /**
     * Set volume for a specific audio type
     */
    public setVolume(type: AudioType, volume: number): void {
        const validatedVolume = Math.max(0, Math.min(1, volume));
        this.config[type].volume = validatedVolume;

        if (type === 'bgm') {
            this.currentBGMFadeId++;
            if (this.bgm) {
                const targetVolume = this.config.bgm.muted ? 0 : validatedVolume;
                this.bgm.volume = targetVolume;
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
            this.currentBGMFadeId++;
            if (this.bgm) {
                const targetVolume = this.config.bgm.muted ? 0 : this.config.bgm.volume;
                this.bgm.volume = targetVolume;
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
            if (this.currentBGMFadeId !== fadeId) return;
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
