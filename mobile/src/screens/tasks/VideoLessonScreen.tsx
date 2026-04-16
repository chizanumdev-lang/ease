import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ImageBackground,
    Animated,
    BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MainStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useProgramsStore } from '../../store/programsStore';
import LoadingState from '../../components/LoadingState';

type Props = NativeStackScreenProps<MainStackParamList, 'VideoLesson'>;

const { width } = Dimensions.get('window');

export default function VideoLessonScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius } = useTheme();
    const { todayPlan, completeTask, updateTask } = useProgramsStore();
    const { task } = route.params;

    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(task.totalDuration || 0);
    const [maxWatched, setMaxWatched] = useState(task.watchedSeconds || 0);
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    const [showControls, setShowControls] = useState(true);

    const playerRef = useRef<YoutubeIframeRef>(null);
    const tutorialCompleteTriggered = useRef(false);
    const lastSyncedTime = useRef(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation for the timer
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (playing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [playing]);

    // Extract YouTube video ID from URL
    const getVideoId = (url: string): string | null => {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /youtube\.com\/embed\/([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
    };

    const videoId = task.videoUrl ? getVideoId(task.videoUrl) : null;

    // Heartbeat Sync: Save progress to backend every 10 seconds of playback
    const syncProgress = useCallback(async (time: number) => {
        if (Math.abs(time - lastSyncedTime.current) > 10) {
            lastSyncedTime.current = time;
            await updateTask(task.id, { watchedSeconds: Math.floor(time) });
        }
    }, [task.id, updateTask]);

    // Anti-Skip & Progress Polling
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (playing && !isCompleted) {
            interval = setInterval(async () => {
                if (playerRef.current) {
                    const time = await playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                    
                    // Anti-Skip Enforcement
                    if (time > maxWatched + 2) {
                        playerRef.current.seekTo(maxWatched, true);
                    } else if (time > maxWatched) {
                        setMaxWatched(time);
                    }

                    syncProgress(time);
                }
            }, 1000);
        } else if (playing && isCompleted) {
            // If completed, just track current time for the UI slider/timer
            interval = setInterval(async () => {
                if (playerRef.current) {
                    const time = await playerRef.current.getCurrentTime();
                    setCurrentTime(time);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [playing, maxWatched, isCompleted, syncProgress]);

    // Handle back button and final sync
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                // Final sync on exit
                if (currentTime > 0) {
                    updateTask(task.id, { watchedSeconds: Math.floor(currentTime) });
                }
                navigation.goBack();
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [currentTime, navigation, task.id, updateTask])
    );

    const onStateChange = useCallback(async (state: string) => {
        if (state === 'playing') setPlaying(true);
        if (state === 'paused') setPlaying(false);
        
        if (state === 'ended' && !tutorialCompleteTriggered.current) {
            tutorialCompleteTriggered.current = true;
            setIsCompleted(true);
            
            // Automatic Completion
            await completeTask(task.id);
            
            // Wait a moment for the user to see the "Well Done" state before going back
            setTimeout(() => {
                navigation.goBack();
            }, 2500);
        }
    }, [task, completeTask, navigation]);

    const onReady = useCallback(async () => {
        setLoading(false);
        
        // Capture total duration if not already set
        if (playerRef.current) {
            const total = await playerRef.current.getDuration();
            setDuration(total);
            if (task.totalDuration !== total) {
                updateTask(task.id, { totalDuration: total });
            }
        }

        // Resume from last position if not completed
        if (task.watchedSeconds && task.watchedSeconds > 0 && !task.completed) {
            playerRef.current?.seekTo(task.watchedSeconds, true);
        }
    }, [task, updateTask]);

    // AI-Inspired Takeaways Logic
    const getTakeaways = () => {
        // 1. Try to parse from description if it looks like bullet points
        if (task.description) {
            const lines = task.description.split('\n')
                .map(l => l.trim())
                .filter(l => l.startsWith('-') || l.startsWith('•') || /^\d+\./.test(l));
            
            if (lines.length >= 2) {
                return lines.slice(0, 3).map((line, i) => ({
                    title: `Session Goal ${i + 1}`,
                    body: line.replace(/^([-•]|\d+\.)\s*/, ''),
                    icon: i === 0 ? 'psychology' : i === 1 ? 'waves' : 'self-improvement'
                }));
            }
        }

        // 2. High-quality contextual templates based on title/theme
        const title = task.title.toLowerCase();
        const themeName = todayPlan?.theme?.toLowerCase() || '';

        if (title.includes('science') || themeName.includes('science') || title.includes('brain')) {
            return [
                { title: 'Neural Plasticity', body: 'How focused repetition physically rewires your synaptic connections.', icon: 'psychology' },
                { title: 'Dopamine Loops', body: 'Regulating environmental triggers to maintain high-baseline motivation.', icon: 'waves' },
                { title: 'Cognitive Load', body: 'Optimizing your working memory by reducing unnecessary sensory friction.', icon: 'self-improvement' }
            ];
        }

        if (title.includes('habit') || themeName.includes('habit') || title.includes('routine')) {
            return [
                { title: 'Atomic Shifts', body: 'Making tiny, 1% improvements that compound over the duration of the plan.', icon: 'psychology' },
                { title: 'Trigger Mapping', body: 'Identifying the exact environmental cues that initiate your target behaviors.', icon: 'waves' },
                { title: 'Identity Casting', body: 'Moving from "doing the work" to "being the person who does the work."', icon: 'self-improvement' }
            ];
        }

        if (title.includes('power') || title.includes('mastery') || title.includes('focus')) {
            return [
                { title: 'Flow States', body: 'Entering the zone where challenge perfectly matches your skill level.', icon: 'psychology' },
                { title: 'Deep Work', body: 'Structuring your environment for periods of intense, distraction-free effort.', icon: 'waves' },
                { title: 'Mental Models', body: 'Building cognitive frameworks to solve complex problems more efficiently.', icon: 'self-improvement' }
            ];
        }

        // Default high-quality fallback
        return [
            { title: 'Core Insight', body: 'The fundamental principle behind today\'s session and strategy.', icon: 'psychology' },
            { title: 'Action Step', body: 'How to transition from theory into practical, daily implementation.', icon: 'waves' },
            { title: 'Long-term Gains', body: 'The compound effect of maintaining this focus consistently over time.', icon: 'self-improvement' }
        ];
    };

    const takeaways = getTakeaways();

    if (!videoId) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Invalid video URL</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
 
    const remainingTime = Math.max(0, duration - currentTime);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />

            {/* Top Progress Stepper (Circuit Steps) */}
            <View style={styles.stepperContainer}>
                {[1, 2, 3, 4, 5, 6].map((step, idx) => {
                    const taskIndex = todayPlan?.tasks?.findIndex(t => t.id === task.id) ?? 0;
                    const isCurrent = taskIndex === idx;
                    const isPast = taskIndex > idx;
                    return (
                        <View 
                            key={step} 
                            style={[
                                styles.stepItem, 
                                { backgroundColor: 'rgba(255,255,255,0.1)' },
                                isPast && { backgroundColor: colors.primary },
                                isCurrent && { 
                                    backgroundColor: colors.primary,
                                    shadowColor: colors.primary,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.8,
                                    shadowRadius: 8,
                                    elevation: 5
                                }
                            ]} 
                        />
                    );
                })}
            </View>

            {/* Immersive Header overlay */}
            <BlurView intensity={20} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={styles.headerTitle}>Day {todayPlan?.dayNumber || 1}: Mastery</Text>
                </View>
                <TouchableOpacity style={styles.headerAvatar} onPress={() => navigation.navigate('Settings')}>
                     <Ionicons name="settings-outline" size={22} color="#FFF" />
                </TouchableOpacity>
            </BlurView>

            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* Hero Video Player Section */}
                <View style={styles.heroSection}>
                    <ImageBackground 
                        source={{ uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' }}
                        style={styles.ambientAura}
                        imageStyle={{ opacity: 0.6 }}
                        blurRadius={12}
                    >
                        <LinearGradient
                            colors={['rgba(26,28,25,0.9)', 'transparent', 'rgba(26,28,25,0.8)']}
                            style={StyleSheet.absoluteFill}
                        />

                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <LoadingState variant="compact" title="Entering state..." />
                            </View>
                        )}

                        <View style={styles.playerWrapper}>
                            <View style={styles.playerContainer}>
                                <YoutubePlayer
                                    ref={playerRef}
                                    height={width * (9 / 16)}
                                    play={playing}
                                    videoId={videoId}
                                    onChangeState={onStateChange}
                                    onReady={onReady}
                                    initialPlayerParams={{
                                        controls: isCompleted ? 1 : 0, // Allow scrubbing only if already completed
                                        modestbranding: 1,
                                        rel: 0,
                                        cc_load_policy: 0,
                                        iv_load_policy: 3,
                                    }}
                                />
                            </View>

                            {/* Custom Controls Overlay (Visible if not completed or manual toggle) */}
                            {(!isCompleted && showControls) && (
                                <TouchableOpacity 
                                    activeOpacity={1} 
                                    style={styles.controlsOverlay}
                                    onPress={() => setShowControls(true)}
                                >
                                    <View style={styles.controlsRow}>
                                        <TouchableOpacity 
                                            style={styles.glassButton}
                                            onPress={() => playerRef.current?.seekTo(currentTime - 10, true)}
                                        >
                                            <MaterialIcons name="replay-10" size={32} color="#FFF" />
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.playButton}
                                            onPress={() => setPlaying(!playing)}
                                        >
                                            <MaterialIcons 
                                                name={playing ? "pause" : "play-arrow"} 
                                                size={48} 
                                                color={colors.primary} 
                                                style={{ marginLeft: playing ? 0 : 4 }}
                                            />
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={[styles.glassButton, { opacity: (isCompleted || maxWatched > currentTime + 5) ? 1 : 0.3 }]}
                                            disabled={!isCompleted && maxWatched <= currentTime + 5}
                                            onPress={() => playerRef.current?.seekTo(currentTime + 10, true)}
                                        >
                                            <MaterialIcons name="forward-10" size={32} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Sleek Progress Bar */}
                        <View style={styles.progressBarWrapper}>
                            <View style={[styles.progressBarTrack, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                <View 
                                    style={[
                                        styles.progressBarFill, 
                                        { 
                                            width: `${(currentTime / (duration || 1)) * 100}%`,
                                            backgroundColor: colors.primary,
                                        }
                                    ]} 
                                />
                                <View 
                                    style={[
                                        styles.maxWatchIndicator, 
                                        { 
                                            left: `${(maxWatched / (duration || 1)) * 100}%`,
                                            backgroundColor: isCompleted ? colors.primary : 'rgba(255,255,255,0.3)'
                                        }
                                    ]} 
                                />
                            </View>
                        </View>
                    </ImageBackground>
                </View>

                {/* Contextual Content */}
                <View style={styles.mainContent}>
                    <Animated.View style={[styles.badgeContainer, { opacity: fadeAnim }]}>
                        <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
                            <Text style={[styles.badgeText, { color: colors.primary }]}>
                                PHASE 1: THE FOUNDATION
                            </Text>
                        </View>
                    </Animated.View>

                    <Text style={[styles.title, { color: colors.text }]}>
                        {task.title}
                    </Text>

                    {/* Key Takeaways */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="lightbulb-outline" size={24} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Takeaways</Text>
                        </View>

                        <View style={styles.takeawaysGrid}>
                            {takeaways.map((item, idx) => (
                                <BlurView 
                                    key={idx} 
                                    intensity={30} 
                                    style={[
                                        styles.glassCard, 
                                        { borderLeftColor: idx % 2 === 0 ? colors.primary : colors.secondary },
                                        idx === 2 && styles.wideCard
                                    ]}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.cardIconBox, { backgroundColor: idx % 2 === 0 ? `${colors.primary}15` : `${colors.secondary}15` }]}>
                                            <MaterialIcons 
                                                name={item.icon as any} 
                                                size={20} 
                                                color={idx % 2 === 0 ? colors.primary : colors.secondary} 
                                            />
                                        </View>
                                        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                                    </View>
                                    <Text style={[styles.cardBody, { color: colors.textMuted }]}>
                                        {item.body}
                                    </Text>
                                </BlurView>
                            ))}
                        </View>
                    </View>
                    
                    <View style={{ height: 180 }} />
                </View>
            </ScrollView>

            {/* Floating Interactive Footer */}
            <View style={styles.footerContainer}>
                <View style={[styles.countdownBox, { backgroundColor: isCompleted ? '#225344' : colors.primary }]}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <MaterialIcons 
                            name={isCompleted ? "check-circle" : "schedule"} 
                            size={22} 
                            color="#FFF" 
                        />
                    </Animated.View>
                    <View>
                        <Text style={styles.countdownLabel}>{isCompleted ? 'COMPLETE' : 'REMAINING'}</Text>
                        <Text style={styles.countdownTime}>
                            {isCompleted ? 'Well Done' : formatTime(remainingTime)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[
                        styles.nextButton, 
                        { 
                            backgroundColor: isCompleted ? '#FFF' : 'rgba(255,255,255,0.05)',
                            borderColor: isCompleted ? 'transparent' : 'rgba(255,255,255,0.1)',
                            borderWidth: 1
                        }
                    ]} 
                    disabled={!isCompleted}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.nextButtonText, { color: isCompleted ? colors.primary : 'rgba(255,255,255,0.4)' }]}>
                        Next Session
                    </Text>
                    <Ionicons 
                        name="arrow-forward" 
                        size={20} 
                        color={isCompleted ? colors.primary : 'rgba(255,255,255,0.4)'} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    stepperContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 4,
    },
    stepItem: {
        height: 3,
        flex: 1,
        borderRadius: 2,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 90,
        paddingTop: 40,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        overflow: 'hidden',
    },
    headerTitles: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        width: '100%',
        height: 460,
        backgroundColor: '#000',
    },
    ambientAura: {
        flex: 1,
        justifyContent: 'center',
    },
    playerWrapper: {
        width: '100%',
        height: width * (9 / 16),
        justifyContent: 'center',
    },
    playerContainer: {
        width: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40,
    },
    glassButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    progressBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    progressBarTrack: {
        height: 6,
        borderRadius: 3,
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
        zIndex: 2,
    },
    maxWatchIndicator: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        top: 1,
        zIndex: 1,
    },
    mainContent: {
        paddingHorizontal: 24,
        marginTop: -32,
        backgroundColor: 'transparent',
    },
    badgeContainer: {
        marginBottom: 16,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        lineHeight: 44,
        marginBottom: 32,
        letterSpacing: -1,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    takeawaysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    glassCard: {
        padding: 20,
        borderRadius: 24,
        borderLeftWidth: 4,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.03)',
        width: (width - 60) / 2,
    },
    wideCard: {
        width: width - 48,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    cardIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    cardBody: {
        fontSize: 13,
        lineHeight: 18,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
    },
    countdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 30,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    countdownLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1,
    },
    countdownTime: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    nextButton: {
        height: 56,
        paddingHorizontal: 24,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 24,
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backBtnText: {
        fontWeight: '700',
    },
});
