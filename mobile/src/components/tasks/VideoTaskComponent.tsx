import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    BackHandler,
    StatusBar,
} from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useProgramsStore } from '../../store/programsStore';
import { Task, TaskMetadata } from '../../types';
import PetalBackground from '../PetalBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const VIDEO_PLAYER_HEIGHT = (SCREEN_WIDTH * 9) / 16;
const CARD_OVERLAP = 24;

interface VideoTaskComponentProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

function getVideoId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTakeaways(task: Task) {
    const content = task.content || '';
    const items = content.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim().substring(1).trim());
    
    if (items.length > 0) {
        return [
            { title: 'Key Takeaway', body: items[0], icon: 'brain' },
            { title: 'Key Insights', body: items.length > 1 ? items.slice(1).join('. ') : 'Focus on the "Why" and the practical application of this technique.', icon: 'lightbulb-outline' },
        ];
    }

    return [
        { title: 'Core Intent', body: 'Master the fundamental principles of this practice.', icon: 'eye-outline' },
        { title: 'Key Insight', body: 'Learn the underlying mechanics and how to integrate them into your routine.', icon: 'lightbulb-outline' },
    ];
}

export default function VideoTaskComponent({ task, onComplete }: VideoTaskComponentProps) {
    const { colors, fonts, shadows, isDark, borderRadius } = useTheme();
    const navigation = useNavigation<any>();
    const { updateTask } = useProgramsStore();

    const [playing, setPlaying]           = useState(false);
    const [loading, setLoading]           = useState(true);
    const [currentTime, setCurrentTime]   = useState(task.watchedSeconds ?? 0);
    const [duration, setDuration]         = useState(task.totalDuration ?? 0);
    const [maxWatched, setMaxWatched]     = useState(task.watchedSeconds ?? 0);
    const [isCompleted, setIsCompleted]   = useState(task.completed ?? false);
    
    const [showSkipWarning, setShowSkipWarning] = useState(false);
    const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

    const playerRef              = useRef<YoutubeIframeRef>(null);
    const completedOnce          = useRef(false);
    const lastSyncedTime         = useRef(0);
    const skipWarningTimeout     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const videoId = task.videoUrl ? getVideoId(task.videoUrl) : null;

    // Progress bar animation
    const progressBarAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (duration > 0) {
            Animated.timing(progressBarAnim, {
                toValue: currentTime / duration,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    }, [currentTime, duration]);

    // Heartbeat sync every 10 s
    const syncProgress = useCallback(async (time: number) => {
        if (Math.abs(time - lastSyncedTime.current) > 10) {
            lastSyncedTime.current = time;
            await updateTask(task.id, { watchedSeconds: Math.floor(time) });
        }
    }, [task.id, updateTask]);

    // Anti-skip polling + progress tracking
    useEffect(() => {
        if (!playing) return;
        const interval = setInterval(async () => {
            if (!playerRef.current) return;
            const time = await playerRef.current.getCurrentTime();
            setCurrentTime(time);

            if (!isCompleted) {
                if (time > maxWatched + 3) {
                    playerRef.current.seekTo(maxWatched, true);
                    clearTimeout(skipWarningTimeout.current);
                    setShowSkipWarning(true);
                    skipWarningTimeout.current = setTimeout(() => setShowSkipWarning(false), 2500);
                } else if (time > maxWatched) {
                    setMaxWatched(time);
                }
                await syncProgress(time);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [playing, maxWatched, isCompleted, syncProgress]);

    useFocusEffect(
        useCallback(() => {
            const onBack = () => {
                if (currentTime > 0) updateTask(task.id, { watchedSeconds: Math.floor(currentTime) });
                return false;
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => sub.remove();
        }, [currentTime, task.id, updateTask])
    );

    const onStateChange = useCallback(async (state: string) => {
        if (state === 'playing') setPlaying(true);
        if (state === 'paused')  setPlaying(false);
        if (state === 'ended') {
            setPlaying(false);
            setShowCompletionOverlay(true);
            if (!completedOnce.current) {
                completedOnce.current = true;
                setIsCompleted(true);
                await updateTask(task.id, { totalDuration: Math.floor(duration), completed: true });
            }
        }
    }, [task.id, duration, updateTask]);

    const onReady = useCallback(async () => {
        setLoading(false);
        if (!playerRef.current) return;
        const total = await playerRef.current.getDuration();
        setDuration(total);
        if (task.totalDuration !== total) updateTask(task.id, { totalDuration: total });
        if ((task.watchedSeconds ?? 0) > 5 && !task.completed) {
            playerRef.current.seekTo(task.watchedSeconds!, true);
        }
    }, [task, updateTask]);

    const handleNextSession = useCallback(async () => {
        onComplete({ videoTimestamp: Math.floor(duration) });
    }, [onComplete, duration]);

    const remainingTime = Math.max(0, duration - currentTime);
    const takeaways     = getTakeaways(task);

    if (!videoId) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text, fontFamily: fonts.displayBold }]}>Invalid video URL</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            {showSkipWarning && (
                <View style={[styles.skipToast, { backgroundColor: colors.error }]}>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                    <Text style={[styles.skipToastText, { fontFamily: fonts.labelBold }]}>Watch in sequence to progress</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.3)" />
                        </View>
                    )}

                    <View style={styles.playerContainer}>
                        <YoutubePlayer
                            ref={playerRef}
                            height={VIDEO_PLAYER_HEIGHT}
                            play={playing}
                            videoId={videoId}
                            onChangeState={onStateChange}
                            onReady={onReady}
                            initialPlayerParams={{
                                controls: 1,
                                modestbranding: 1,
                                rel: 0,
                                iv_load_policy: 3,
                            }}
                        />
                    </View>

                    {showCompletionOverlay && (
                        <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, styles.completionOverlay]}>
                            <View style={styles.completionContent}>
                                <View style={[styles.successIconCircle, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="checkmark" size={32} color="#FFF" />
                                </View>
                                <Text style={[styles.completionTitle, { fontFamily: fonts.displayBold, color: colors.white }]}>Session Complete</Text>
                                <Text style={[styles.completionSubtitle, { fontFamily: fonts.body, color: 'rgba(255,255,255,0.7)' }]}>You've integrated this insight.</Text>
                                <TouchableOpacity 
                                    style={[styles.completionBtn, { backgroundColor: colors.white }]}
                                    onPress={handleNextSession}
                                >
                                    <Text style={[styles.completionBtnText, { color: colors.primary, fontFamily: fonts.labelBold }]}>Continue Journey</Text>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    )}
                </View>

                {/* Overlapping Content Card */}
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

                    <View style={styles.headerBlock}>
                        <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>CORE LESSON</Text>
                        <Text style={[styles.title, { color: colors.primary, fontFamily: fonts.displayBold }]}>{task.title}</Text>
                        <View style={[styles.divider, { backgroundColor: colors.primaryContainer }]} />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.insightsList}>
                            {takeaways.map((item, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.insightCard,
                                        {
                                            backgroundColor: colors.surfaceContainerLow,
                                            borderRadius: borderRadius.xl,
                                        },
                                    ]}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[
                                            styles.cardIcon,
                                            { backgroundColor: colors.primaryContainer },
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={item.icon as any}
                                                size={20}
                                                color={colors.white}
                                            />
                                        </View>
                                        <Text style={[styles.cardTitle, { color: colors.primary, fontFamily: fonts.labelBold }]}>{item.title}</Text>
                                    </View>
                                    <Text style={[styles.cardBody, { color: colors.textMuted, fontFamily: fonts.body }]}>{item.body}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {!showCompletionOverlay && duration > 0 && (
                        <View style={styles.subtleProgress}>
                            <View style={[styles.track, { backgroundColor: colors.outlineVariant }]}>
                                <Animated.View
                                    style={[
                                        styles.fill,
                                        {
                                            width: progressBarAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            }),
                                            backgroundColor: colors.primary,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.timeLabels}>
                                <Text style={[styles.timeText, { fontFamily: fonts.label, color: colors.textMuted }]}>{formatTime(currentTime)}</Text>
                                <Text style={[styles.timeText, { fontFamily: fonts.label, color: colors.textMuted }]}>{formatTime(duration)}</Text>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <View style={styles.footerContent}>
                    <View style={[styles.stepIndicator, { backgroundColor: colors.primaryContainer }]}>
                        <Ionicons name="close" size={24} color={colors.white} />
                        <Text style={[styles.stepText, { color: colors.white, fontFamily: fonts.labelBold }]}>
                            {isCompleted ? 'STEP COMPLETE' : `REMAINING: ${formatTime(remainingTime)}`}
                        </Text>
                    </View>
 
                    <TouchableOpacity
                        style={[
                            styles.nextBtn,
                            {
                                backgroundColor: isCompleted || task.completed ? colors.primary : colors.surfaceContainerHighest,
                            },
                        ]}
                        disabled={!isCompleted && !task.completed}
                        onPress={handleNextSession}
                    >
                        <Text style={[styles.nextBtnText, { color: isCompleted || task.completed ? colors.white : colors.textMuted, fontFamily: fonts.labelBold }]}>
                            Next
                        </Text>
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color={isCompleted || task.completed ? colors.white : colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    skipToast: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        zIndex: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    skipToastText: {
        color: '#FFF',
        fontSize: 14,
    },
    heroSection: {
        width: '100%',
        backgroundColor: '#171d18',
        justifyContent: 'center',
    },
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#171d18',
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.6,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
        marginBottom: 24,
    },
    headerBlock: {
        alignItems: 'center',
        marginBottom: 32,
    },
    label: {
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        lineHeight: 36,
        textAlign: 'center',
        marginBottom: 16,
    },
    divider: {
        width: 48,
        height: 4,
        borderRadius: 2,
    },
    section: {
        gap: 24,
    },
    insightsList: {
        gap: 16,
    },
    insightCard: {
        padding: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
    },
    cardBody: {
        fontSize: 15,
        lineHeight: 24,
    },
    subtleProgress: {
        marginTop: 40,
        gap: 8,
    },
    track: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    },
    timeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 11,
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
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 8,
    },
    stepText: {
        fontSize: 12,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 32,
        gap: 8,
    },
    nextBtnText: {
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 32,
    },
    errorText: {
        fontSize: 18,
    },
    completionOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    completionContent: {
        alignItems: 'center',
    },
    successIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    completionTitle: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 8,
    },
    completionSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 28,
    },
    completionBtn: {
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 32,
    },
    completionBtnText: {
        fontSize: 16,
    },
});


