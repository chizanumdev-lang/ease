import { Audio, AVPlaybackStatus, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import { AudioTrack } from '../types';
import api from './api';

class AudioService {
    private sound: Audio.Sound | null = null;
    private fadeInterval: NodeJS.Timeout | null = null;
    private timerInterval: NodeJS.Timeout | null = null;
    private isInitialized = false;
    private statusCallback: ((status: AVPlaybackStatus) => void) | null = null;

    // Initialize audio mode for background playback
    async initialize() {
        if (this.isInitialized) return;

        try {
            await Audio.setAudioModeAsync({
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                playThroughEarpieceAndroid: false,
            });
            this.isInitialized = true;
            console.log('[AUDIO_SERVICE] Initialized with background & interruption modes');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to initialize:', error);
            throw error;
        }
    }

    // Load audio from URL or local file
    async loadAudio(track: AudioTrack) {
        await this.initialize();

        // Unload previous sound
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
        }

        try {
            const uri = track.localUri || track.url;
            console.log('[AUDIO_SERVICE] Loading audio from:', uri);

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false, volume: 0 }, // Start at 0 for fade-in
                this.onPlaybackStatusUpdate
            );

            this.sound = sound;
            console.log('[AUDIO_SERVICE] Audio loaded successfully');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to load audio:', error);
            throw error;
        }
    }

    // Registration for status updates
    setStatusCallback(callback: (status: AVPlaybackStatus) => void) {
        this.statusCallback = callback;
    }

    // Playback status update callback
    private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        
        // Notify listener if registered
        if (this.statusCallback) {
            this.statusCallback(status);
        }
    };

    // Play with fade-in
    async play(fadeInDuration: number = 2000, targetVolume: number = 1.0) {
        if (!this.sound) {
            throw new Error('No audio loaded');
        }

        try {
            if (fadeInDuration > 0) {
                // Start playback at volume 0
                await this.sound.setVolumeAsync(0);
                await this.sound.playAsync();
                // Fade in over specified duration
                this.fadeIn(targetVolume, fadeInDuration);
            } else {
                await this.sound.setVolumeAsync(targetVolume);
                await this.sound.playAsync();
            }

            // Start timer check
            // Note: Timer check is now managed by the store using the status callback

            console.log(`[AUDIO_SERVICE] Playing (fade-in: ${fadeInDuration}ms)`);
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to play:', error);
            throw error;
        }
    }

    // Pause playback
    async pause() {
        if (!this.sound) return;

        try {
            await this.sound.pauseAsync();
            this.clearIntervals();
            console.log('[AUDIO_SERVICE] Paused');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to pause:', error);
            throw error;
        }
    }

    // Stop playback
    async stop() {
        if (!this.sound) return;

        try {
            await this.sound.stopAsync();
            await this.sound.setPositionAsync(0);
            this.clearIntervals();
            console.log('[AUDIO_SERVICE] Stopped');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to stop:', error);
            throw error;
        }
    }

    // Set volume
    async setVolume(volume: number) {
        if (!this.sound) return;

        try {
            await this.sound.setVolumeAsync(volume);
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to set volume:', error);
            throw error;
        }
    }

    // Fade in over duration
    private fadeIn(targetVolume: number, durationMs: number) {
        this.clearFadeInterval();

        const steps = 100;
        const stepDuration = durationMs / steps;
        const volumeIncrement = targetVolume / steps;
        let currentStep = 0;

        this.fadeInterval = setInterval(async () => {
            if (!this.sound || currentStep >= steps) {
                this.clearFadeInterval();
                return;
            }

            currentStep++;
            const newVolume = Math.min(volumeIncrement * currentStep, targetVolume);

            try {
                await this.sound.setVolumeAsync(newVolume);
            } catch (error) {
                console.error('[AUDIO_SERVICE] Fade-in error:', error);
                this.clearFadeInterval();
            }
        }, stepDuration);
    }

    // Fade out over duration
    private async fadeOut(durationMs: number = 5000) {
        if (!this.sound) return;

        const status = await this.sound.getStatusAsync();
        if (!status.isLoaded) return;

        const currentVolume = status.volume || 0;
        const steps = 50;
        const stepDuration = durationMs / steps;
        const volumeDecrement = currentVolume / steps;

        return new Promise<void>((resolve) => {
            let currentStep = 0;

            const interval = setInterval(async () => {
                if (!this.sound || currentStep >= steps) {
                    clearInterval(interval);
                    resolve();
                    return;
                }

                currentStep++;
                const newVolume = Math.max(currentVolume - volumeDecrement * currentStep, 0);

                try {
                    await this.sound.setVolumeAsync(newVolume);
                } catch (error) {
                    console.error('[AUDIO_SERVICE] Fade-out error:', error);
                    clearInterval(interval);
                    resolve();
                }
            }, stepDuration);
        });
    }

    // Timer check removed from service to break store dependency
    // Store now handles timer logic based on status callbacks

    // Download track to device
    async downloadTrack(track: AudioTrack): Promise<string> {
        try {
            const fileUri = `${documentDirectory}audio_${track.id}.mp3`;

            console.log('[AUDIO_SERVICE] Downloading track:', track.url, 'to', fileUri);

            const downloadResult = await downloadAsync(track.url, fileUri);

            console.log('[AUDIO_SERVICE] Download complete:', downloadResult.uri);
            return downloadResult.uri;
        } catch (error) {
            console.error('[AUDIO_SERVICE] Download failed:', error);
            throw error;
        }
    }

    // Clear intervals
    private clearFadeInterval() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    private clearTimerInterval() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private clearIntervals() {
        this.clearFadeInterval();
        this.clearTimerInterval();
    }

    // Cleanup
    async cleanup() {
        this.clearIntervals();
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
        }
    }

    // Fetch rituals for a date
    async getRituals(date: string) {
        try {
            const response = await api.get(`/audio/rituals/${date}`);
            return response.data;
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to fetch rituals:', error);
            throw error;
        }
    }
}

export const audioService = new AudioService();
