import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    Animated, 
    Easing, 
    Dimensions, 
    Image, 
    StatusBar,
    ScrollView
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, AudioTrack } from '../../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useProgramsStore } from '../../store/programsStore';
import { useAudioStore } from '../../store/audioStore';
import { useAuthStore } from '../../store/authStore';
import { canAutoPlayAudio } from '../../utils/sleepWindow.util';
import { BlurView } from 'expo-blur';
import PetalBackground from '../PetalBackground';
import { useProgress } from 'react-native-track-player';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_OVERLAP = 24;

interface AudioTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function AudioTaskComponent({ task, onComplete }: AudioTaskProps) {
    const { colors, fonts, shadows, isDark, borderRadius } = useTheme();
    const { todayPlan, fetchTodayPlan, currentProgram, startTask, completeTask } = useProgramsStore();
    const { user } = useAuthStore();
    const audioStore = useAudioStore();
    const { isPlaying, isLoading, autoPlayEnabled } = audioStore;
    const { position, duration } = useProgress(500); // 500ms intervals for smooth UI

    
    const [gaveUp, setGaveUp] = useState(false);
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    const [playError, setPlayError] = useState<string | null>(null);
    
    const taskAudioUrl: string | null = 
        task.metadata?.audioUrl
        ?? task.metadata?.externalLink
        ?? null;

    const ritualAudioTrack: AudioTrack | undefined = 
        todayPlan?.audioTracks?.find(t => t.dayPlanId === task.dayPlanId)
        ?? todayPlan?.audioTracks?.[0];

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
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.4)).current;

    const isStillGenerating = (!audioUrl || audioUrl === '') && !gaveUp;

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

    useEffect(() => {
        const prepareTrack = async () => {
            if (audioTrack && !isStillGenerating) {
                try {
                    await audioStore.loadTrack(audioTrack);
                    // Trigger auto-play if permitted
                    if (canAutoPlayAudio(user, autoPlayEnabled)) {
                        await audioStore.play();
                        if (task.status === 'pending') {
                            await startTask(task.id);
                        }
                    }
                } catch (err) {
                    console.error('[AudioTask] Preparation failed:', err);
                    setPlayError('Failed to prepare audio session.');
                }
            }
        };
        prepareTrack();
    }, [audioUrl, isStillGenerating]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlayPause = async () => {
        setPlayError(null);
        try {
            if (isPlaying) {
                await audioStore.pause();
            } else {
                await audioStore.play();
                // Mark task as in progress when played manually
                if (task.status === 'pending') {
                    await startTask(task.id);
                }
            }
        } catch (err: any) {
            console.error('[AudioTask] Play error:', err);
            setPlayError('Could not play audio. Please try again.');
        }
    };

    const handleComplete = () => {
        onComplete({ audioPosition: position * 1000 });
    };

    const progress = duration > 0 ? position / duration : 0;
    
    // Automatically mark the task as complete once user completes 95% of the duration
    useEffect(() => {
        if (progress >= 0.95 && !isCompleted) {
            setIsCompleted(true);
            completeTask(task.id, { audioPosition: position * 1000 });
        }
    }, [progress, isCompleted]);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Header */}
                <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2560&auto=format&fit=crop' }} 
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <Ionicons 
                            name={isStillGenerating ? "sparkles" : "pulse"} 
                            size={48} 
                            color={colors.white} 
                        />
                    </View>
                </View>

                {/* Content Card */}
                <View style={[
                    styles.contentArea, 
                    { 
                        backgroundColor: colors.surfaceContainerLowest,
                        borderTopLeftRadius: borderRadius.xxxl,
                        borderTopRightRadius: borderRadius.xxxl,
                        marginTop: -CARD_OVERLAP,
                    }
                ]}>
                    <View style={styles.dragHandle} />

                    <View style={styles.headerSection}>
                        <Text style={[styles.ritualType, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>
                            {(audioTrack?.type || 'Guided Ritual').toUpperCase()}
                        </Text>
                        <Text style={[styles.title, { color: colors.primary, fontFamily: fonts.displayBold }]}>
                            {isStillGenerating ? "Preparing Your Session" : (audioTrack?.title || task.title)}
                        </Text>
                        <Text style={[styles.duration, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {Math.round(duration / 60) || task.duration || 10} MIN SESSION
                        </Text>
                    </View>

                    {isStillGenerating && (
                        <View style={styles.generationNotice}>
                            <Text style={[styles.statusNote, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                {gaveUp ? "PREPARATION HALTED" : "CRAFTING PERSONALIZED FREQUENCIES..."}
                            </Text>
                            {gaveUp ? (
                                <TouchableOpacity 
                                    onPress={() => setGaveUp(false)}
                                    style={styles.retryButton}
                                >
                                    <Text style={{ color: colors.primary, fontFamily: fonts.displayBold }}>RETRY GENERATION</Text>
                                </TouchableOpacity>
                            ) : (
                                <Animated.View style={[styles.loadingBar, { opacity: pulseAnim, backgroundColor: colors.primary }]} />
                            )}
                        </View>
                    )}

                    {playError && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.error, fontFamily: fonts.body }]}>{playError}</Text>
                        </View>
                    )}

                    <View style={[styles.playerCard, { backgroundColor: colors.surfaceContainerLow }]}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { 
                                        width: `${progress * 100}%`, 
                                        backgroundColor: colors.primary 
                                    }
                                ]} 
                            />
                        </View>
                        <View style={styles.timeRow}>
                            <Text style={[styles.timeText, { color: colors.textMuted, fontFamily: fonts.label }]}>
                                {formatTime(position)}
                            </Text>
                            <Text style={[styles.timeText, { color: colors.textMuted, fontFamily: fonts.label }]}>
                                {formatTime(duration)}
                            </Text>
                        </View>
 
                        <View style={styles.controls}>
                            <TouchableOpacity 
                                onPress={() => audioStore.setPosition(Math.max(0, position - 15))}
                                style={styles.controlBtn}
                                disabled={isStillGenerating || !audioUrl}
                            >
                                <Ionicons name="refresh" size={24} color={colors.primary} style={{ transform: [{ scaleX: -1 }] }} />
                                <Text style={[styles.skipIndicator, { color: colors.primary, fontFamily: fonts.labelBold }]}>15</Text>
                            </TouchableOpacity>
  
                            <TouchableOpacity 
                                style={[
                                    styles.playBtn, 
                                    { backgroundColor: (isStillGenerating || !audioUrl) ? colors.surfaceContainerHigh : colors.primary }
                                ]}
                                onPress={handlePlayPause}
                                disabled={isStillGenerating || !audioUrl}
                                activeOpacity={0.9}
                            >
                                <Ionicons 
                                    name={isPlaying ? "pause" : "play"} 
                                    size={32} 
                                    color={colors.white} 
                                    style={{ marginLeft: isPlaying ? 0 : 4 }} 
                                />
                            </TouchableOpacity>
  
                            {/* Symmetric empty placeholder to balance controls since skip forward is disabled */}
                            <View style={styles.controlBtn} />
                        </View>
                    </View>

                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <TouchableOpacity
                    style={[
                        styles.completeBtn,
                        { 
                            backgroundColor: isCompleted ? colors.primary : colors.surfaceContainerHighest,
                        }
                    ]}
                    onPress={handleComplete}
                    disabled={!isCompleted}
                    activeOpacity={0.88}
                >
                    <Text style={[
                        styles.completeBtnText, 
                        { 
                            fontFamily: fonts.labelBold,
                            color: isCompleted ? colors.white : colors.textMuted
                        }
                    ]}>
                        {isCompleted ? "Complete Ritual" : `Ritual in Progress`}
                    </Text>
                    <Ionicons 
                        name={isCompleted ? "checkmark-circle" : "lock-closed"} 
                        size={20} 
                        color={isCompleted ? colors.white : colors.textMuted} 
                    />
                </TouchableOpacity>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroContent: {
        zIndex: 10,
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.65,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
        marginBottom: 32,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    ritualType: {
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 12,
    },
    title: {
        fontSize: 32,
        lineHeight: 38,
        textAlign: 'center',
        marginBottom: 8,
    },
    duration: {
        fontSize: 13,
        letterSpacing: 1,
        opacity: 0.8,
    },
    generationNotice: {
        alignItems: 'center',
        marginBottom: 40,
    },
    statusNote: {
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 16,
    },
    loadingBar: {
        width: 60,
        height: 2,
        borderRadius: 1,
    },
    playerCard: {
        borderRadius: 24,
        padding: 24,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
        marginTop: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: 0,
    },
    timeText: {
        fontSize: 12,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        marginTop: 24,
    },
    playBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        top: 20,
    },
    retryButton: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        padding: 12,
        backgroundColor: 'rgba(255,0,0,0.05)',
        borderRadius: 12,
    },
    errorText: {
        fontSize: 13,
        fontWeight: '600',
    },
    patternBox: {
        marginTop: 40,
        padding: 20,
        borderRadius: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        paddingBottom: 20,
        justifyContent: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    completeBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 24,
    },
    completeBtnText: {
        fontSize: 16,
    },
});

