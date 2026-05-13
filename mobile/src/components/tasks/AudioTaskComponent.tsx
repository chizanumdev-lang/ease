import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, AudioTrack } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useProgramsStore } from '../../store/programsStore';
import { useAudioStore } from '../../store/audioStore';

interface AudioTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function AudioTaskComponent({ task, onComplete }: AudioTaskProps) {
    const { colors, fonts, shadows, isDark } = useTheme();
    const { todayPlan, fetchTodayPlan, currentProgram } = useProgramsStore();
    const audioStore = useAudioStore();
    
    const [gaveUp, setGaveUp] = useState(false);
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    const [playError, setPlayError] = useState<string | null>(null);
    
    // Resolve audio URL — prefer the task's own audio first, then fall back to ritual tracks
    const taskAudioUrl: string | null = 
        task.metadata?.audioUrl
        ?? task.metadata?.externalLink
        ?? null;

    const ritualAudioTrack: AudioTrack | undefined = 
        todayPlan?.audioTracks?.find(t => t.dayPlanId === task.dayPlanId)
        ?? todayPlan?.audioTracks?.[0];

    // Build the AudioTrack object we'll actually play
    const audioTrack: AudioTrack | undefined = taskAudioUrl
        ? {
            id: task.id,
            url: taskAudioUrl,
            title: task.title,
            type: task.metadata?.subtype ?? 'guided',
            dayPlanId: task.dayPlanId,
          } as AudioTrack
        : ritualAudioTrack;

    const audioUrl = audioTrack?.url ?? null;

    console.log('[AudioTask] Resolved audioUrl:', audioUrl, '| task.metadata:', task.metadata);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    const isStillGenerating = (audioUrl?.includes('static_binaural') ?? false) && !gaveUp;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (!isStillGenerating || gaveUp) return;

        let polls = 0;
        const interval = setInterval(async () => {
            polls++;
            if (polls >= 12) {
                clearInterval(interval);
                setGaveUp(true);
                return;
            }
            if (currentProgram?.id) {
                await fetchTodayPlan(currentProgram.id);
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [isStillGenerating, currentProgram?.id, gaveUp]);

    // Sync with audio store on mount/unmount
    useEffect(() => {
        if (audioTrack && !isStillGenerating) {
            audioStore.loadTrack(audioTrack);
        }
    }, [audioUrl, isStillGenerating]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlayPause = async () => {
        setPlayError(null);
        try {
            if (audioStore.isPlaying) {
                await audioStore.pause();
            } else {
                await audioStore.play();
            }
        } catch (err: any) {
            console.error('[AudioTask] Play error:', err);
            setPlayError('Could not play audio. Please try again.');
        }
    };

    const handleComplete = () => {
        onComplete({ audioPosition: audioStore.position * 1000 });
    };

    const progress = audioStore.duration > 0 ? audioStore.position / audioStore.duration : 0;
    if (progress >= 0.85 && !isCompleted) {
        setIsCompleted(true);
    }

    return (
        <Animated.View style={[styles.root, { opacity: fadeAnim, backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <View style={styles.artworkSection}>
                    <Animated.View style={[
                        styles.artworkContainer, 
                        { 
                            backgroundColor: colors.surfaceContainerLow,
                            opacity: isStillGenerating ? pulseAnim : 1,
                            ...(isDark ? {} : shadows.ambient)
                        }
                    ]}>
                        <Ionicons 
                            name={isStillGenerating ? "sparkles" : "musical-notes"} 
                            size={72} 
                            color={colors.primary} 
                            style={{ opacity: 0.85 }} 
                        />
                    </Animated.View>
                    
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
                        {isStillGenerating ? "Preparing Your Session" : (audioTrack?.title || task.title)}
                    </Text>
                    
                    <Text style={[styles.subtitle, { color: colors.primary, fontFamily: fonts.label }]}>
                        {isStillGenerating 
                            ? "CRAFTING PERSONALIZED FREQUENCIES" 
                            : `${(audioTrack?.type || 'Guided Ritual').toUpperCase()} • ${Math.round(audioStore.duration / 60) || task.duration || 10} MIN`}
                    </Text>

                    {isStillGenerating && (
                        <Text style={[styles.statusNote, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            This usually takes about 30 seconds. Feel free to stay here or come back later.
                        </Text>
                    )}
                </View>

                <View style={[styles.playerCard, { backgroundColor: colors.surfaceContainerLow, ...(isDark ? {} : shadows.ambient) }]}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={audioStore.duration || 1}
                        value={audioStore.position}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.surfaceContainerHighest}
                        thumbTintColor={isStillGenerating ? colors.outlineVariant : colors.primary}
                        disabled={isStillGenerating || !audioUrl}
                        onSlidingComplete={(value) => {
                            audioStore.setPosition(value);
                        }}
                    />
                    <View style={styles.timeRow}>
                        <Text style={[styles.timeText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {formatTime(audioStore.position)}
                        </Text>
                        <Text style={[styles.timeText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {formatTime(audioStore.duration)}
                        </Text>
                    </View>

                    <View style={styles.controls}>
                        <TouchableOpacity 
                            onPress={() => audioStore.setPosition(Math.max(0, audioStore.position - 15))}
                            style={styles.controlBtn}
                            disabled={isStillGenerating || !audioUrl}
                        >
                            <Ionicons name="refresh" size={28} color={colors.text} style={{ transform: [{ scaleX: -1 }] }} />
                            <Text style={[styles.skipIndicator, { color: colors.text, fontFamily: fonts.label }]}>15</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.playBtn, 
                                { backgroundColor: (isStillGenerating || !audioUrl) ? colors.surfaceContainerHighest : colors.primary }
                            ]}
                            onPress={handlePlayPause}
                            disabled={isStillGenerating || !audioUrl}
                            activeOpacity={0.9}
                        >
                            <Ionicons 
                                name={audioStore.isPlaying ? "pause" : "play"} 
                                size={40} 
                                color={colors.white} 
                                style={{ marginLeft: audioStore.isPlaying ? 0 : 4 }} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => audioStore.setPosition(Math.min(audioStore.duration, audioStore.position + 15))}
                            style={styles.controlBtn}
                            disabled={isStillGenerating || !audioUrl}
                        >
                            <Ionicons name="refresh" size={28} color={colors.text} />
                            <Text style={[styles.skipIndicator, { color: colors.text, fontFamily: fonts.label }]}>15</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        { 
                            backgroundColor: isCompleted ? colors.primary : colors.surfaceContainerHighest,
                            ...(isCompleted ? shadows.ambient : {})
                        }
                    ]}
                    onPress={handleComplete}
                    disabled={!isCompleted}
                    activeOpacity={0.88}
                >
                    <Text style={[
                        styles.completeBtnText, 
                        { 
                            fontFamily: fonts.display,
                            color: isCompleted ? colors.white : colors.textMuted
                        }
                    ]}>
                        {isCompleted ? "Complete Ritual" : `Ritual in Progress`}
                    </Text>
                    <Ionicons 
                        name={isCompleted ? "checkmark-circle" : "lock-closed"} 
                        size={22} 
                        color={isCompleted ? colors.white : colors.textMuted} 
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 40,
    },
    artworkSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    artworkContainer: {
        width: 240,
        height: 240,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 36,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 12,
        letterSpacing: 2,
        textAlign: 'center',
    },
    statusNote: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 22,
        paddingHorizontal: 20,
        opacity: 0.7,
    },
    playerCard: {
        borderRadius: 32,
        padding: 24,
        marginTop: 'auto',
        marginBottom: 90,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: -4,
    },
    timeText: {
        fontSize: 12,
        opacity: 0.6,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        marginTop: 24,
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipIndicator: {
        fontSize: 9,
        position: 'absolute',
        top: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
    },
    completeBtn: {
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    completeBtnText: {
        fontSize: 18,
    },
});
