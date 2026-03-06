import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioTrack } from '../types';
import { audioService } from '../services/audio.service';

interface AudioState {
    // Playback state
    currentTrack: AudioTrack | null;
    isPlaying: boolean;
    isLoading: boolean;
    position: number;
    duration: number;
    volume: number;

    // Timer
    stopTimer: number | null; // minutes: 15, 30, 60, or null
    timerStartTime: number | null;

    // Settings
    autoPlayEnabled: boolean;
    downloadedTracks: string[]; // Track IDs

    // Actions
    loadTrack: (track: AudioTrack) => Promise<void>;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    stop: () => Promise<void>;
    setVolume: (volume: number) => Promise<void>;
    setPosition: (position: number) => void;
    setDuration: (duration: number) => void;
    setStopTimer: (minutes: number | null) => void;
    toggleAutoPlay: () => void;
    downloadTrack: (track: AudioTrack) => Promise<void>;
    setIsPlaying: (isPlaying: boolean) => void;
    reset: () => void;
}

export const useAudioStore = create<AudioState>()(
    persist(
        (set, get) => ({
            // Initial state
            currentTrack: null,
            isPlaying: false,
            isLoading: false,
            position: 0,
            duration: 0,
            volume: 0.7,
            stopTimer: null,
            timerStartTime: null,
            autoPlayEnabled: false,
            downloadedTracks: [],

            // Load and prepare track
            loadTrack: async (track: AudioTrack) => {
                set({ isLoading: true });
                try {
                    await audioService.loadAudio(track);
                    set({
                        currentTrack: track,
                        isLoading: false,
                        position: 0,
                    });
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to load track:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            // Play audio
            play: async () => {
                try {
                    await audioService.play();
                    set({
                        isPlaying: true,
                        timerStartTime: Date.now(),
                    });
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to play:', error);
                    throw error;
                }
            },

            // Pause audio
            pause: async () => {
                try {
                    await audioService.pause();
                    set({ isPlaying: false });
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to pause:', error);
                    throw error;
                }
            },

            // Stop audio
            stop: async () => {
                try {
                    await audioService.stop();
                    set({
                        isPlaying: false,
                        position: 0,
                        stopTimer: null,
                        timerStartTime: null,
                    });
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to stop:', error);
                    throw error;
                }
            },

            // Set volume
            setVolume: async (volume: number) => {
                try {
                    await audioService.setVolume(volume);
                    set({ volume });
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to set volume:', error);
                    throw error;
                }
            },

            // Update position (called by service)
            setPosition: (position: number) => set({ position }),

            // Update duration (called by service)
            setDuration: (duration: number) => set({ duration }),

            // Set stop timer
            setStopTimer: (minutes: number | null) => {
                set({
                    stopTimer: minutes,
                    timerStartTime: minutes ? Date.now() : null,
                });
            },

            // Toggle auto-play
            toggleAutoPlay: () => {
                set((state) => ({ autoPlayEnabled: !state.autoPlayEnabled }));
            },

            // Download track
            downloadTrack: async (track: AudioTrack) => {
                try {
                    const localUri = await audioService.downloadTrack(track);
                    set((state) => ({
                        downloadedTracks: [...state.downloadedTracks, track.id],
                        currentTrack:
                            state.currentTrack?.id === track.id
                                ? { ...track, localUri }
                                : state.currentTrack,
                    }));
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to download track:', error);
                    throw error;
                }
            },

            // Set playing state (called by service)
            setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

            // Reset state
            reset: () =>
                set({
                    currentTrack: null,
                    isPlaying: false,
                    position: 0,
                    duration: 0,
                    stopTimer: null,
                    timerStartTime: null,
                }),
        }),
        {
            name: 'audio-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                volume: state.volume,
                autoPlayEnabled: state.autoPlayEnabled,
                downloadedTracks: state.downloadedTracks,
            }),
        }
    )
);
