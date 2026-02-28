export class AudioManager {
    private audioContext: AudioContext | null = null;
    private backgroundMusicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private musicVolume: number = 0.15;
    private sfxVolume: number = 0.3;
    private muted: boolean = false;
    private musicPlaying: boolean = false;
    private musicInterval: number | null = null;

    constructor() {
        // Audio context will be created on first user interaction
    }

    private initAudioContext(): void {
        if (this.audioContext) return;
        
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create gain nodes for volume control
        this.backgroundMusicGain = this.audioContext.createGain();
        this.backgroundMusicGain.gain.value = this.musicVolume;
        this.backgroundMusicGain.connect(this.audioContext.destination);
        
        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.gain.value = this.sfxVolume;
        this.sfxGain.connect(this.audioContext.destination);
    }

    // Synthesized bubble sound - light, bubbly tone
    private playBubbleSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        
        // Create two oscillators for a richer, more noticeable bubble sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        // Main bubble tone
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(600, now);
        oscillator1.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        
        // Harmonic for richer sound
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(900, now);
        oscillator2.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
        
        // Louder volume with more presence
        gainNode.gain.setValueAtTime(0.7, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.2);
        oscillator2.stop(now + 0.2);
    }

    // Synthesized claw attack - sharp, percussive sound
    private playClawSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        
        // Create noise for snap sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    // Synthesized hit sound - impact
    private playHitSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.08);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }

    // Synthesized enemy death sound
    private playEnemyDeathSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    // Synthesized creature hurt sound
    private playCreatureHurtSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.linearRampToValueAtTime(400, now + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    // Mission complete - happy ascending notes
    private playMissionCompleteSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext!.createOscillator();
            const gainNode = this.audioContext!.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGain!);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + index * 0.15);
            
            gainNode.gain.setValueAtTime(0.3, now + index * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + 0.4);
            
            oscillator.start(now + index * 0.15);
            oscillator.stop(now + index * 0.15 + 0.4);
        });
    }

    // Mission failed - sad descending notes
    private playMissionFailedSound(): void {
        if (!this.audioContext || !this.sfxGain) return;
        
        const now = this.audioContext.currentTime;
        const notes = [523.25, 493.88, 440.00, 392.00]; // C5, B4, A4, G4
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext!.createOscillator();
            const gainNode = this.audioContext!.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGain!);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + index * 0.2);
            
            gainNode.gain.setValueAtTime(0.25, now + index * 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.2 + 0.5);
            
            oscillator.start(now + index * 0.2);
            oscillator.stop(now + index * 0.2 + 0.5);
        });
    }

    // Background music - simple underwater-themed melody
    private playBackgroundMusicNote(): void {
        if (!this.audioContext || !this.backgroundMusicGain || !this.musicPlaying) return;
        
        const now = this.audioContext.currentTime;
        
        // Underwater ambient melody (pentatonic scale)
        const melody = [
            { freq: 261.63, duration: 0.4 }, // C4
            { freq: 293.66, duration: 0.4 }, // D4
            { freq: 329.63, duration: 0.6 }, // E4
            { freq: 392.00, duration: 0.4 }, // G4
            { freq: 329.63, duration: 0.4 }, // E4
            { freq: 293.66, duration: 0.6 }, // D4
        ];
        
        const noteIndex = Math.floor(Math.random() * melody.length);
        const note = melody[noteIndex];
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.backgroundMusicGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.freq, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.05, now + note.duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0.01, now + note.duration);
        
        oscillator.start(now);
        oscillator.stop(now + note.duration);
    }

    playBackgroundMusic(): void {
        if (this.muted || this.musicPlaying) return;
        
        this.initAudioContext();
        this.musicPlaying = true;
        
        // Play a note every 800ms for ambient underwater feel
        this.playBackgroundMusicNote();
        this.musicInterval = window.setInterval(() => {
            this.playBackgroundMusicNote();
        }, 800);
    }

    stopBackgroundMusic(): void {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    playSound(soundName: string): void {
        if (this.muted) return;
        
        this.initAudioContext();
        
        switch(soundName) {
            case 'bubble':
                this.playBubbleSound();
                break;
            case 'claw':
                this.playClawSound();
                break;
            case 'hit':
                this.playHitSound();
                break;
            case 'enemy-death':
                this.playEnemyDeathSound();
                break;
            case 'creature-hurt':
                this.playCreatureHurtSound();
                break;
            case 'mission-complete':
                this.playMissionCompleteSound();
                break;
            case 'mission-failed':
                this.playMissionFailedSound();
                break;
        }
    }

    setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusicGain) {
            this.backgroundMusicGain.gain.value = this.musicVolume;
        }
    }

    setSFXVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    toggleMute(): void {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
    }

    isMuted(): boolean {
        return this.muted;
    }

    enableAudio(): void {
        this.initAudioContext();
        this.playBackgroundMusic();
    }
}

