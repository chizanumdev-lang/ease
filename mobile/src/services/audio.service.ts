import TrackPlayer, { 
    Capability, 
    Event, 
    State, 
    AppKilledPlaybackBehavior 
} from 'react-native-track-player';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import { AudioTrack } from '../types';
import api from './api';

class AudioService {
    private isInitialized = false;
    private statusCallback: ((status: any) => void) | null = null;

    // Initialize audio mode for background playback
    async initialize() {
        if (this.isInitialized) return;

        try {
            await TrackPlayer.setupPlayer({
                autoHandleInterruptions: true,
            });

            await TrackPlayer.updateOptions({
                android: {
                    appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
                },
                progressUpdateEventInterval: 1,
                capabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.Stop,
                    Capability.SeekTo,
                ],
                compactCapabilities: [
                    Capability.Play,
                    Capability.Pause,
                ],
            });

            this.isInitialized = true;
            console.log('[AUDIO_SERVICE] Initialized TrackPlayer with Dynamic Island support');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to initialize:', error);
            // If already initialized, we can ignore
            if ((error as any).message?.includes('already initialized')) {
                this.isInitialized = true;
                return;
            }
            throw error;
        }
    }

    // Load audio from URL or local file
    async loadAudio(track: AudioTrack) {
        await this.initialize();

        try {
            const uri = track.localUri || track.url;
            console.log('[AUDIO_SERVICE] Loading track into TrackPlayer:', track.title);

            await TrackPlayer.reset();
            await TrackPlayer.add({
                id: track.id,
                url: uri,
                title: track.title,
                artist: track.artist || 'Ease Rituals',
                artwork: track.artwork || 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=300&auto=format&fit=crop', // Fallback for Dynamic Island
            });

            console.log('[AUDIO_SERVICE] Audio loaded successfully');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to load audio:', error);
            throw error;
        }
    }

    // Play with fade-in (Simulated as TrackPlayer doesn't have native fade-in yet in all versions)
    async play(fadeInDuration: number = 2000, targetVolume: number = 1.0) {
        await this.initialize();

        try {
            await TrackPlayer.setVolume(fadeInDuration > 0 ? 0 : targetVolume);
            await TrackPlayer.play();
            
            if (fadeInDuration > 0) {
                this.fadeIn(targetVolume, fadeInDuration);
            }
            console.log(`[AUDIO_SERVICE] Playing (TrackPlayer)`);
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to play:', error);
            throw error;
        }
    }

    // Pause playback
    async pause() {
        try {
            await TrackPlayer.pause();
            console.log('[AUDIO_SERVICE] Paused');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to pause:', error);
            throw error;
        }
    }

    // Stop playback
    async stop() {
        try {
            await TrackPlayer.stop();
            console.log('[AUDIO_SERVICE] Stopped');
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to stop:', error);
            throw error;
        }
    }

    // Set volume
    async setVolume(volume: number) {
        try {
            await TrackPlayer.setVolume(volume);
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to set volume:', error);
            throw error;
        }
    }

    // Fade in over duration (Simulated)
    private fadeIn(targetVolume: number, durationMs: number) {
        const steps = 20;
        const stepDuration = durationMs / steps;
        const volumeIncrement = targetVolume / steps;
        let currentStep = 0;

        const interval = setInterval(async () => {
            currentStep++;
            const newVolume = Math.min(volumeIncrement * currentStep, targetVolume);

            try {
                await TrackPlayer.setVolume(newVolume);
                if (currentStep >= steps) clearInterval(interval);
            } catch (error) {
                clearInterval(interval);
            }
        }, stepDuration);
    }

    // Download track to device
    async downloadTrack(track: AudioTrack): Promise<string> {
        try {
            const fileUri = `${documentDirectory}audio_${track.id}.mp3`;
            const downloadResult = await downloadAsync(track.url, fileUri);
            return downloadResult.uri;
        } catch (error) {
            console.error('[AUDIO_SERVICE] Download failed:', error);
            throw error;
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

    // Regenerate a ritual by ID
    async regenerateRitual(id: string) {
        try {
            const response = await api.post(`/audio/rituals/${id}/regenerate`);
            return response.data;
        } catch (error) {
            console.error('[AUDIO_SERVICE] Failed to regenerate ritual:', error);
            throw error;
        }
    }

    // Cleanup
    async cleanup() {
        await TrackPlayer.reset();
    }
}

export const audioService = new AudioService();
