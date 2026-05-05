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
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const { todayPlan, updateTask } = useProgramsStore();

    const [playing, setPlaying]           = useState(false);
    const [loading, setLoading]           = useState(true);
    const [currentTime, setCurrentTime]   = useState(task.watchedSeconds ?? 0);
    const [duration, setDuration]         = useState(task.totalDuration ?? 0);
    const [maxWatched, setMaxWatched]     = useState(task.watchedSeconds ?? 0);
    const [isCompleted, setIsCompleted]   = useState(task.completed ?? false);
    
    // Anti-skip toast
    const [showSkipWarning, setShowSkipWarning] = useState(false);
    const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

    const playerRef              = useRef<YoutubeIframeRef>(null);
    const completedOnce          = useRef(false);
    const lastSyncedTime         = useRef(0);
    const skipWarningTimeout     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const videoId = task.videoUrl ? getVideoId(task.videoUrl) : null;

    // ── Pulse animation on the timer icon ──
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

    // ── Progress bar slide-in ──
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

    // ── Heartbeat sync every 10 s ──
    const syncProgress = useCallback(async (time: number) => {
        if (Math.abs(time - lastSyncedTime.current) > 10) {
            lastSyncedTime.current = time;
            await updateTask(task.id, { watchedSeconds: Math.floor(time) });
        }
    }, [task.id, updateTask]);

    // ── Anti-skip polling + progress tracking ──
    useEffect(() => {
        if (!playing) return;
        const interval = setInterval(async () => {
            if (!playerRef.current) return;
            const time = await playerRef.current.getCurrentTime();
            setCurrentTime(time);

            if (!isCompleted) {
                // ANTI-SKIP: user tried to jump ahead
                if (time > maxWatched + 2.5) {
                    playerRef.current.seekTo(maxWatched, true);
                    // Show warning toast
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

    // ── Back-button final sync ──
    useFocusEffect(
        useCallback(() => {
            const onBack = () => {
                if (currentTime > 0) updateTask(task.id, { watchedSeconds: Math.floor(currentTime) });
                return false; // bubble up to navigation
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => sub.remove();
        }, [currentTime, task.id, updateTask])
    );

    // ── YouTube state changes ──
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

    // ── Player ready ──
    const onReady = useCallback(async () => {
        setLoading(false);
        if (!playerRef.current) return;
        const total = await playerRef.current.getDuration();
        setDuration(total);
        if (task.totalDuration !== total) updateTask(task.id, { totalDuration: total });
        // Resume from saved position
        if ((task.watchedSeconds ?? 0) > 5 && !task.completed) {
            playerRef.current.seekTo(task.watchedSeconds!, true);
        }
    }, [task, updateTask]);

    const handleNextSession = useCallback(async () => {
        // Signal completion to the parent (TaskScreenRouter), which handles navigation
        onComplete({ videoTimestamp: Math.floor(duration) });
    }, [onComplete, duration]);


    const remainingTime = Math.max(0, duration - currentTime);
    const takeaways     = getTakeaways(task, todayPlan?.theme ?? '');
    const progressPct   = duration > 0 ? (currentTime / duration) * 100 : 0;
    const maxPct        = duration > 0 ? (maxWatched  / duration) * 100 : 0;

    const phaseBadge = todayPlan?.theme
        ? todayPlan.theme.toUpperCase()
        : 'TODAY\'S LESSON';

    if (!videoId) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Invalid video URL</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            {showSkipWarning && (
                <View style={styles.skipToast} pointerEvents="none">
                    <MaterialIcons name="lock" size={16} color="#FFF" />
                    <Text style={styles.skipToastText}>Watch in order to continue</Text>
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
                            <Text style={styles.loadingText}>Loading video…</Text>
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
                                <Text style={styles.completionTitle}>Lesson Complete</Text>
                                <Text style={styles.completionSubtitle}>You've mastered today's core insight.</Text>
                                <TouchableOpacity 
                                    style={[styles.completionBtn, { backgroundColor: '#FFF' }]}
                                    onPress={handleNextSession}
                                >
                                    <Text style={[styles.completionBtnText, { color: colors.primary }]}>Continue Circuit</Text>
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
                                        { width: `${maxPct}%`, backgroundColor: 'rgba(255,255,255,0.2)' },
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
                                            shadowColor: colors.primary,
                                        },
                                    ]}
                                />
                            </View>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeLabel}>{formatTime(currentTime)}</Text>
                                <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={[styles.contentArea, { backgroundColor: colors.background }]}>
                    <View style={styles.titleBlock}>
                        <View style={[styles.phaseBadge, { backgroundColor: colors.primaryContainer }]}>
                            <Text style={[styles.phaseBadgeText, { color: colors.primary }]}>
                                {phaseBadge}
                            </Text>
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Takeaways</Text>
                        </View>

                        <View style={styles.cardsGrid}>
                            {takeaways.map((item, idx) => (
                                <BlurView
                                    key={idx}
                                    intensity={28}
                                    style={[
                                        styles.takeawayCard,
                                        {
                                            borderLeftColor: idx % 2 === 0 ? colors.primary : colors.secondary,
                                            width: '100%',
                                        },
                                    ]}
                                >
                                    <View style={styles.cardInner}>
                                        <View style={[
                                            styles.cardIcon,
                                            { backgroundColor: (idx % 2 === 0 ? colors.primary : colors.secondary) + '18' },
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={item.icon as any}
                                                size={20}
                                                color={idx % 2 === 0 ? colors.primary : colors.secondary}
                                            />
                                        </View>
                                        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                                    </View>
                                    <Text style={[styles.cardBody, { color: colors.textMuted }]}>{item.body}</Text>
                                </BlurView>
                            ))}
                        </View>
                    </View>
                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            <View style={styles.footer} pointerEvents="box-none">
                <View style={[styles.countdownPill, { backgroundColor: isCompleted ? '#1B4332' : colors.primary }]}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <MaterialIcons
                            name={isCompleted ? 'check-circle' : 'schedule'}
                            size={22}
                            color="#FFF"
                        />
                    </Animated.View>
                    <View>
                        <Text style={styles.countdownLabel}>{isCompleted ? 'COMPLETE' : 'REMAINING'}</Text>
                        <Text style={styles.countdownValue}>
                            {isCompleted ? 'Well Done!' : formatTime(remainingTime)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        {
                            backgroundColor: isCompleted ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                            borderColor: isCompleted ? 'transparent' : 'rgba(255,255,255,0.12)',
                        },
                    ]}
                    disabled={!isCompleted}
                    onPress={handleNextSession}
                    accessibilityLabel="Next Session"
                >
                    <Text style={[styles.nextBtnText, { color: isCompleted ? colors.primary : 'rgba(255,255,255,0.3)' }]}>
                        {todayPlan?.tasks?.findIndex(t => t.id === task.id) === (todayPlan?.tasks?.length || 0) - 1 
                            ? 'Finish Day' 
                            : 'Next Session'}
                    </Text>
                    <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={isCompleted ? colors.primary : 'rgba(255,255,255,0.3)'}
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
        top: 80,
        alignSelf: 'center',
        zIndex: 999,
        backgroundColor: 'rgba(30,30,30,0.92)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    skipToastText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
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
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600',
    },
    progressWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 36,
        gap: 6,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.12)',
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
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 4,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    timeLabel: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        fontWeight: '600',
    },
    contentArea: {
        marginTop: -28,
        paddingHorizontal: 24,
        paddingTop: 28,
        zIndex: 5,
    },
    titleBlock: {
        marginBottom: 28,
        gap: 14,
    },
    phaseBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    phaseBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.8,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        lineHeight: 44,
        letterSpacing: -0.8,
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
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    cardsGrid: {
        flexDirection: 'column',
        gap: 12,
    },
    takeawayCard: {
        borderRadius: 20,
        borderLeftWidth: 4,
        overflow: 'hidden',
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 8,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        flexShrink: 1,
    },
    cardBody: {
        fontSize: 13,
        lineHeight: 19,
        paddingLeft: 50,
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
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 12,
    },
    countdownPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 32,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 18,
        elevation: 6,
    },
    countdownLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.65)',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    countdownValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    nextBtn: {
        height: 56,
        paddingHorizontal: 22,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
    },
    nextBtnText: {
        fontSize: 15,
        fontWeight: '700',
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
        fontWeight: '700',
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
        maxWidth: 280,
    },
    successIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    completionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    completionSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    completionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    completionBtnText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
    },
});
