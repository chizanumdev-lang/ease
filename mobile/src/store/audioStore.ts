import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioTrack } from '../types';
import { audioService } from '../services/audio.service';
import TrackPlayer, { Event, State } from 'react-native-track-player';

interface RitualTracks {
    morning: AudioTrack | null;
    night: AudioTrack | null;
}

export type ProximityStatus = 'IDLE' | 'APPROACHING' | 'READY';

interface AudioState {
    // Playback state
    currentTrack: AudioTrack | null;
    isPlaying: boolean;
    isLoading: boolean;
    position: number;
    duration: number;
    volume: number;

    // Rituals & Proximity
    ritualTracks: RitualTracks;
    morningRitualTime: string; // HH:mm
    nightRitualTime: string; // HH:mm
    proximityStatus: ProximityStatus;
    ebbFactor: number; // 1.0 (full) to 0.2 (ebbed)

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
    seekTo: (position: number) => Promise<void>;
    setDuration: (duration: number) => void;
    setStopTimer: (minutes: number | null) => void;
    setRitualTimes: (morning: string, night: string) => void;
    setRitualTracks: (tracks: RitualTracks) => void;
    setEbbFactor: (factor: number) => void;
    checkProximity: () => void;
    fetchRituals: (date: string) => Promise<void>;
    regenerateRitualAsset: (trackId: string) => Promise<AudioTrack>;
    toggleAutoPlay: () => void;
    downloadTrack: (track: AudioTrack) => Promise<void>;
    setIsPlaying: (isPlaying: boolean) => void;
    reset: () => void;
}

export const useAudioStore = create<AudioState>()(
    persist(
        (set, get) => {
            // Internal state to track initialization
            let isInitialized = false;

            const setupListeners = () => {
                if (isInitialized) return;

                TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
                    const isPlaying = (event.state as any) === 'playing';
                    set({ isPlaying });
                });

                TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
                    set({ 
                        position: event.position, 
                        duration: event.duration 
                    });

                    // Check Timer
                    const { stopTimer, timerStartTime } = get();
                    if (stopTimer && timerStartTime) {
                        const elapsedMinutes = (Date.now() - timerStartTime) / (1000 * 60);
                        if (elapsedMinutes >= stopTimer) {
                            get().stop();
                        }
                    }
                });

                TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
                    const duration = get().duration;
                    set({ isPlaying: false, position: duration });
                    get().pause().catch(err => console.error('[AUDIO_STORE] Pause failed on queue end:', err));
                });

                isInitialized = true;
            };

            return {
            // Initial state
            currentTrack: null,
            isPlaying: false,
            isLoading: false,
            position: 0,
            duration: 0,
            volume: 0.7,
            ritualTracks: { morning: null, night: null },
            morningRitualTime: '07:00',
            nightRitualTime: '22:00',
            proximityStatus: 'IDLE',
            ebbFactor: 1.0,
            stopTimer: null,
            timerStartTime: null,
            autoPlayEnabled: false,
            downloadedTracks: [],

            setRitualTimes: (morning, night) => set({ morningRitualTime: morning, nightRitualTime: night }),
            setRitualTracks: (tracks) => set({ ritualTracks: tracks }),
            setEbbFactor: (factor) => set({ ebbFactor: factor }),

            checkProximity: () => {
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                const parseTime = (timeStr: string) => {
                    const [h, m] = timeStr.split(':').map(Number);
                    return h * 60 + m;
                };

                const rituals = [
                    parseTime(get().morningRitualTime),
                    parseTime(get().nightRitualTime)
                ];

                let newStatus: ProximityStatus = 'IDLE';

                for (const ritualMins of rituals) {
                    const diff = ritualMins - currentMinutes;
                    
                    if (currentMinutes >= ritualMins && currentMinutes < ritualMins + 60) {
                        newStatus = 'READY';
                        break;
                    } else if (diff > 0 && diff <= 30) {
                        newStatus = 'APPROACHING';
                    }
                }

                if (get().proximityStatus !== newStatus) {
                    set({ proximityStatus: newStatus });
                }
            },

            fetchRituals: async (date: string) => {
                try {
                    const data = await audioService.getRituals(date);
                    
                    // Always update the tracks we have, even if one is still null/generating
                    set({
                        ritualTracks: {
                            morning: data.morning,
                            night: data.night
                        }
                    });

                    // If status is generating, retry in 10 seconds to fetch completed URLs
                    if (data.status === 'generating') {
                        console.log('[AUDIO_STORE] Daily rituals still generating. Retrying in 10s...');
                        if ((global as any).ritualsPollTimeout) {
                            clearTimeout((global as any).ritualsPollTimeout);
                        }
                        (global as any).ritualsPollTimeout = setTimeout(() => {
                            get().fetchRituals(date);
                        }, 10000);
                    } else {
                        if ((global as any).ritualsPollTimeout) {
                            clearTimeout((global as any).ritualsPollTimeout);
                            (global as any).ritualsPollTimeout = null;
                        }
                    }
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to fetch rituals:', error);
                }
            },

            regenerateRitualAsset: async (trackId) => {
                set({ isLoading: true });
                try {
                    const updatedTrack = await audioService.regenerateRitual(trackId);
                    
                    // Update state locally
                    const current = get().currentTrack;
                    const tracks = get().ritualTracks;
                    const newRitualTracks = { ...tracks };
                    
                    if (tracks.morning && tracks.morning.id === trackId) {
                        newRitualTracks.morning = updatedTrack;
                    }
                    if (tracks.night && tracks.night.id === trackId) {
                        newRitualTracks.night = updatedTrack;
                    }
                    
                    set({ ritualTracks: newRitualTracks, isLoading: false });
                    
                    // Reload the updated track if it's currently loaded
                    if (current && current.id === trackId) {
                        set({ currentTrack: updatedTrack });
                        await get().loadTrack(updatedTrack);
                    }
                    
                    return updatedTrack;
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to regenerate ritual track:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            // Load and prepare track
            loadTrack: async (track: AudioTrack) => {
                set({ isLoading: true });
                setupListeners();
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
                setupListeners();
                try {
                    const volume = get().volume;
                    await audioService.play(2000, volume);
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

            // Seek to a specific position
            seekTo: async (position: number) => {
                try {
                    await audioService.seekTo(position);
                    set({ position });
                } catch (error) {
                    console.error('[AUDIO_STORE] Failed to seek:', error);
                    throw error;
                }
            },

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
            };
        },
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
