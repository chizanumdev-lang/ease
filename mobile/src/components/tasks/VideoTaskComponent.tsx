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
} from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';

import { useProgramsStore } from '../../store/programsStore';
import { Task, TaskMetadata } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_PLAYER_HEIGHT = (SCREEN_WIDTH * 9) / 16;

interface VideoTaskComponentProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
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

function getTakeaways(task: Task, theme: string) {
    const content = task.content || '';
    const items = content.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim().substring(1).trim());
    
    if (items.length >= 1) {
        return [
            { title: 'Key Takeaway', body: items[0], icon: 'brain' },
            { title: 'Key Insights', body: items.length > 1 ? items.slice(1).join('. ') : 'Focus on the "Why" and the practical application of this technique.', icon: 'lightbulb-on-outline' },
        ];
    }

    return [
        { title: 'Key Takeaway', body: `Master the core of ${theme.toLowerCase()}.`, icon: 'eye-outline' },
        { title: 'Key Insights', body: 'Learn the underlying mechanics and how to integrate them into your routine.', icon: 'lightbulb-on-outline' },
    ];
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function VideoTaskComponent({ task, onComplete }: VideoTaskComponentProps) {
    const { colors, fonts, shadows, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const { todayPlan, updateTask } = useProgramsStore();

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

    // Pulse animation for the timer icon
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (playing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [playing]);

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
                if (time > maxWatched + 2.5) {
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

    // Back-button final sync
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
                await updateTask(task.id, { totalDuration: Math.floor(duration) });
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
    const takeaways     = getTakeaways(task, todayPlan?.theme ?? '');
    const maxPct        = duration > 0 ? (maxWatched  / duration) * 100 : 0;

    if (!videoId) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text, fontFamily: fonts.display }]}>Invalid video URL</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            {showSkipWarning && (
                <View style={[styles.skipToast, { backgroundColor: colors.error + 'EE' }]}>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                    <Text style={[styles.skipToastText, { fontFamily: fonts.body }]}>Watch in order to continue</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.scroll}
                bounces={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroSection}>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <Ionicons name="videocam-outline" size={40} color="rgba(255,255,255,0.5)" />
                            <Text style={[styles.loadingText, { fontFamily: fonts.body }]}>Loading video…</Text>
                        </View>
                    )}

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

                    {showCompletionOverlay && (
                        <BlurView intensity={100} tint="dark" style={[StyleSheet.absoluteFill, styles.completionOverlay]}>
                            <View style={styles.completionContent}>
                                <View style={[styles.successIconCircle, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="checkmark" size={32} color="#FFF" />
                                </View>
                                <Text style={[styles.completionTitle, { fontFamily: fonts.display }]}>Lesson Complete</Text>
                                <Text style={[styles.completionSubtitle, { fontFamily: fonts.body }]}>You've mastered today's core insight.</Text>
                                <TouchableOpacity 
                                    style={[styles.completionBtn, { backgroundColor: colors.white, ...shadows.ambient }]}
                                    onPress={handleNextSession}
                                >
                                    <Text style={[styles.completionBtnText, { color: colors.primary, fontFamily: fonts.display }]}>Continue Circuit</Text>
                                    <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    )}

                    {!showCompletionOverlay && (
                        <View style={styles.progressWrapper}>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressMaxZone,
                                        { width: `${maxPct}%`, backgroundColor: 'rgba(255,255,255,0.15)' },
                                    ]}
                                />
                                <Animated.View
                                    style={[
                                        styles.progressFill,
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
                            <View style={styles.timeRow}>
                                <Text style={[styles.timeLabel, { fontFamily: fonts.label }]}>{formatTime(currentTime)}</Text>
                                <Text style={[styles.timeLabel, { fontFamily: fonts.label }]}>{formatTime(duration)}</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={[styles.contentArea, { backgroundColor: colors.background }]}>
                    <View style={styles.titleBlock}>
                        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{task.title}</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="sparkles" size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Key Insights</Text>
                        </View>

                        <View style={styles.cardsGrid}>
                            {takeaways.map((item, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.takeawayCard,
                                        {
                                            backgroundColor: colors.surfaceContainerLow,
                                        },
                                    ]}
                                >
                                    <View style={styles.cardInner}>
                                        <View style={[
                                            styles.cardIcon,
                                            { backgroundColor: colors.primary + '1A' },
                                        ]}>
                                            <Ionicons
                                                name={item.icon === 'brain' ? 'bulb' : (item.icon as any)}
                                                size={20}
                                                color={colors.primary}
                                            />
                                        </View>
                                        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.display }]}>{item.title}</Text>
                                    </View>
                                    <Text style={[styles.cardBody, { color: colors.textMuted, fontFamily: fonts.body }]}>{item.body}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            <View style={styles.footer} pointerEvents="box-none">
                <View style={[styles.countdownPill, { backgroundColor: isCompleted ? colors.primary : colors.surfaceContainerHighest, ...shadows.ambient }]}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons
                            name={isCompleted ? 'checkmark-circle' : 'time'}
                            size={22}
                            color={isCompleted ? colors.white : colors.primary}
                        />
                    </Animated.View>
                    <View>
                        <Text style={[styles.countdownLabel, { color: isCompleted ? colors.white + 'CC' : colors.textMuted, fontFamily: fonts.label }]}>{isCompleted ? 'COMPLETE' : 'REMAINING'}</Text>
                        <Text style={[styles.countdownValue, { color: isCompleted ? colors.white : colors.text, fontFamily: fonts.display }]}>
                            {isCompleted ? 'Finished' : formatTime(remainingTime)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        {
                            backgroundColor: isCompleted ? colors.primary : colors.surfaceContainerHighest,
                            ...(isCompleted ? shadows.ambient : {})
                        },
                    ]}
                    disabled={!isCompleted}
                    onPress={handleNextSession}
                >
                    <Text style={[styles.nextBtnText, { color: isCompleted ? colors.white : colors.textMuted, fontFamily: fonts.display }]}>
                        {todayPlan?.tasks?.findIndex(t => t.id === task.id) === (todayPlan?.tasks?.length || 0) - 1 
                            ? 'Finish' 
                            : 'Next'}
                    </Text>
                    <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={isCompleted ? colors.white : colors.textMuted}
                    />
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
    },
    skipToastText: {
        color: '#FFF',
        fontSize: 14,
    },
    heroSection: {
        width: '100%',
        backgroundColor: '#000',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: VIDEO_PLAYER_HEIGHT,
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    progressWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 28,
        gap: 6,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
        position: 'relative',
    },
    progressMaxZone: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1,
    },
    progressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 2,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
    },
    contentArea: {
        marginTop: -24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        zIndex: 5,
    },
    titleBlock: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    section: {
        gap: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        fontSize: 20,
    },
    cardsGrid: {
        gap: 12,
    },
    takeawayCard: {
        borderRadius: 24,
        padding: 24,
        gap: 12,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: 16,
        flexShrink: 1,
    },
    cardBody: {
        fontSize: 14,
        lineHeight: 22,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
    },
    countdownPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 32,
        gap: 12,
    },
    countdownLabel: {
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    countdownValue: {
        fontSize: 17,
    },
    nextBtn: {
        height: 64,
        paddingHorizontal: 28,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: VIDEO_PLAYER_HEIGHT,
        zIndex: 100,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    completionContent: {
        alignItems: 'center',
    },
    successIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    completionTitle: {
        fontSize: 26,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    completionSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    completionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 32,
        gap: 10,
    },
    completionBtnText: {
        fontSize: 17,
    },
});
