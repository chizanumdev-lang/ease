import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';
import Slider from '@react-native-community/slider';
import { useProgramsStore } from '../../store/programsStore';

interface AudioTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function AudioTaskComponent({ task, onComplete }: AudioTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { todayPlan, fetchTodayPlan, currentProgram } = useProgramsStore();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMixing, setIsMixing] = useState(false);
    const [gaveUp, setGaveUp] = useState(false);
    const [maxPosition, setMaxPosition] = useState(0);
    const [isCompleted, setIsCompleted] = useState(task.completed || false);

    // Resolve audio URL: the backend stores the URL on the DayPlan's audioTracks relation.
    // The task itself only has an id; we match by dayPlanId or just grab the first track.
    const audioTrack = todayPlan?.audioTracks?.find(t => t.dayPlanId === task.dayPlanId)
        ?? todayPlan?.audioTracks?.[0];
    const audioUrl = audioTrack?.url ?? task.metadata?.externalLink ?? null;

    // Detect if we're still on the static placeholder (the async job hasn't finished yet).
    // Static URLs contain 'static_binaural' — the mixed/generated ones are uploaded to Cloudinary
    // under a different path.
    const isStillGenerating = (audioUrl?.includes('static_binaural') ?? false) && !gaveUp;

    // Poll every 8s while still generating to pick up the mixed URL when the job completes.
    // Give up after 90s — if the job hasn't finished by then (e.g. Redis is down), let the
    // user play the static binaural fallback rather than waiting indefinitely.
    useEffect(() => {
        if (!isStillGenerating && !gaveUp) {
            setIsMixing(false);
            return;
        }
        if (gaveUp) return;

        setIsMixing(true);
        let polls = 0;
        const interval = setInterval(async () => {
            polls++;
            if (polls >= 11) { // ~90s (11 × 8s)
                clearInterval(interval);
                setGaveUp(true);
                setIsMixing(false);
                return;
            }
            if (currentProgram?.id) {
                await fetchTodayPlan(currentProgram.id);
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [isStillGenerating, currentProgram?.id, gaveUp]);

    // When URL changes (job finished), reload the sound
    useEffect(() => {
        if (!audioUrl || isStillGenerating) return;
        if (sound) {
            sound.stopAsync().then(() => sound.unloadAsync()).catch(() => {});
            setSound(null);
            setIsPlaying(false);
            setPosition(0);
        }
    }, [audioUrl]);

    async function playPause() {
        if (!audioUrl || isStillGenerating) return;
        if (!sound) {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
            setIsPlaying(true);
        } else {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        }
    }

    const onPlaybackStatusUpdate = async (status: any) => {
        if (status.isLoaded) {
            const currentPos = status.positionMillis;
            setPosition(currentPos);
            setDuration(status.durationMillis || 0);

            // Anti-Skip Logic (only for Ritual tasks that aren't already completed)
            if (!isCompleted && currentPos > maxPosition + 3000) {
                // User jumped ahead more than 3 seconds
                if (sound) {
                    await sound.setPositionAsync(maxPosition);
                }
            } else if (!isCompleted && currentPos > maxPosition) {
                setMaxPosition(currentPos);
            }

            // 80% Threshold Check
            if (!isCompleted && status.durationMillis && currentPos >= status.durationMillis * 0.8) {
                setIsCompleted(true);
            }

            if (status.didJustFinish) {
                setIsPlaying(false);
                setIsCompleted(true);
            }
        }
    };

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const formatTime = (millis: number) => {
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    const handleComplete = () => {
        onComplete({ audioPosition: position });
    };

    return (
        <View style={styles.container}>
            {!audioUrl ? (
                <View style={styles.artworkSection}>
                    <Text style={[styles.title, { color: colors.text }]}>Audio not available yet</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>The audio for this session is still being generated. Check back shortly.</Text>
                </View>
            ) : (
            <>
            <View style={styles.artworkSection}>
                <View style={[styles.artworkContainer, { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xxl }]}>
                    <Ionicons name="musical-notes" size={80} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
                    {audioTrack?.title || task.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    {audioTrack?.type ? audioTrack.type.charAt(0).toUpperCase() + audioTrack.type.slice(1) : 'Guided Session'} • {audioTrack?.duration || task.duration || 10} MIN
                </Text>

                {/* Mixing banner — shown while the voiceover job hasn't finished yet */}
                {isStillGenerating && (
                    <View style={[styles.mixingBanner, { backgroundColor: colors.primaryContainer + '30', borderColor: colors.primaryContainer }]}>
                        <Ionicons name="musical-notes" size={14} color={colors.primary} />
                        <Text style={[styles.mixingText, { color: colors.primary }]}>
                            Mixing your AI voiceover… usually takes ~30 seconds
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.controlsSection}>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration}
                    value={position}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.surfaceContainerHighest}
                    thumbTintColor={isStillGenerating ? colors.outlineVariant : colors.primary}
                    disabled={isStillGenerating}
                    onSlidingComplete={async (value) => {
                        if (sound) {
                            // Don't allow seeking ahead of max position if not completed
                            if (!isCompleted && value > maxPosition) {
                                await sound.setPositionAsync(maxPosition);
                            } else {
                                await sound.setPositionAsync(value);
                            }
                        }
                    }}
                />
                <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(position)}</Text>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
                </View>

                <View style={styles.playbackButtons}>
                    <TouchableOpacity style={styles.secondaryControl}>
                        <Ionicons name="refresh-outline" size={32} color={colors.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.playButton, { backgroundColor: isStillGenerating ? colors.outlineVariant : colors.primary, opacity: isStillGenerating ? 0.5 : 1 }]}
                        onPress={playPause}
                        disabled={isStillGenerating}
                    >
                        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryControl}>
                        <Ionicons name="stopwatch-outline" size={32} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            </>
            )}
            <View style={styles.footer}>
                <StitchButton 
                    title={isCompleted ? "Finish Listening" : `Finish (${Math.ceil(Math.max(0, (duration * 0.8 - position) / 1000))}s remaining)`}
                    variant={isCompleted ? "primary" : "secondary"}
                    onPress={handleComplete}
                    disabled={!isCompleted}
                    rightIcon={isCompleted ? "checkmark-circle" : "lock-closed"}
                    style={{ opacity: isCompleted ? 1 : 0.6 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    artworkSection: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 48,
    },
    artworkContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    controlsSection: {
        marginBottom: 48,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    playbackButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        marginTop: 24,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    secondaryControl: {
        opacity: 0.6,
    },
    footer: {
        marginTop: 'auto',
    },
    mixingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    mixingText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
