import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withDelay, 
    withRepeat,
    withSequence,
    Easing,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskStatus } from '../../types';

interface TaskCardProps {
    task: Task;
    onPress: (task: Task) => void;
    isLast?: boolean;
    index?: number;
}

export default function TaskCard({ task, onPress, isLast, index = 0 }: TaskCardProps) {
    const { colors, spacing, borderRadius, fonts, shadows, isDark } = useTheme();
    
    // Reanimated Shared Values
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);
    const pressScale = useSharedValue(1);
    const pulseValue = useSharedValue(1);

    const isCompleted = task.status === TaskStatus.COMPLETED;
    const isInProgress = task.status === TaskStatus.IN_PROGRESS;
    const isLocked = task.status === TaskStatus.LOCKED;

    useEffect(() => {
        // Entrance animation
        const entranceDelay = index * 80;
        scale.value = withDelay(entranceDelay, withSpring(1, { damping: 15, stiffness: 100 }));
        opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 400 }));

        if (isInProgress) {
            pulseValue.value = withRepeat(
                withSequence(
                    withTiming(1.03, { duration: 1200 }),
                    withTiming(1, { duration: 1200 })
                ),
                -1,
                true
            );
        } else {
            pulseValue.value = 1;
        }
    }, [isInProgress, index]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value * pressScale.value * (isInProgress ? pulseValue.value : 1) }
        ],
    }));

    const handlePressIn = () => {
        if (!isLocked) {
            pressScale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
        }
    };

    const handlePressOut = () => {
        pressScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    };

    const handlePress = () => {
        if (!isLocked) {
            onPress(task);
        }
    };

    const getStatusIcon = () => {
        if (isCompleted) return 'checkmark-circle';
        if (isInProgress) return 'radio-button-on';
        if (isLocked) return 'lock-closed';
        return 'radio-button-off';
    };

    const getTypeIcon = () => {
        const type = task.type?.toLowerCase() || '';
        if (type.includes('video') || type.includes('tutor')) return 'play';
        if (type.includes('quiz') || type.includes('test')) return 'help-circle';
        if (type.includes('audio') || type.includes('podcast')) return 'headset';
        if (type.includes('journal') || type.includes('write')) return 'create';
        if (type.includes('reflect')) return 'eye';
        if (type.includes('micro') || type.includes('app')) return 'apps';
        if (type.includes('consistency') || type.includes('habit')) return 'flame';
        return 'book';
    };

    const TypingAnimation = () => {
        const [text, setText] = useState('');
        const [phraseIndex, setPhraseIndex] = useState(0);
        const [isDeleting, setIsDeleting] = useState(false);
        const [typingSpeed, setTypingSpeed] = useState(150);
        
        const allPhrases = useRef([
            "heyyy friend", "im back here again😁", "i learnt", "today was better", 
            "thinking about...", "grateful for today", "breathe in, breathe out",
            "feeling peaceful ✨", "what's on your mind?", "ready to reflect?",
            "one small win", "today was a journey", "i am growing", "finding my calm",
            "let's write it down 📝", "smile, you're here", "a moment for me",
            "inner peace loading...", "how are you really?", "today's highlight was",
            "grateful for the sun", "learning to let go", "i am enough", "keep going 🚀",
            "heart is full", "mindful moments", "a letter to myself", "feeling inspired 💡",
            "today i felt...", "embrace the now", "what made you laugh?", "small steps count",
            "i am resilient", "peace begins here", "reflection time 🧘‍♂️", "your story matters",
            "capture the mood", "notes on life", "feeling light", "a quiet space",
            "speak your truth", "today was magic", "i chose joy", "progress, not perfection",
            "listening to my heart", "finding the good", "today i noticed...", "sparkle today ✨",
            "stay present", "grateful for you", "heart-to-heart", "writing my truth",
            "new day, new thoughts", "i am present", "gentle reminders", "choose kindness",
            "looking inward", "today was a gift", "morning musings", "evening echoes",
            "finding balance ⚖️", "i am focused", "let's be honest", "today i released...",
            "feeling brave", "a space to grow", "mindset matters", "grateful for family",
            "a piece of peace", "journeying within", "today was bright ☀️", "i am calm",
            "life is beautiful", "one breath at a time", "what's the vibe?", "feeling grounded",
            "create your calm", "today's lesson...", "grateful for friends", "a spark of joy",
            "be kind to yourself", "writing the future", "today i appreciated...",
            "focus on the good", "heart wide open", "finding my flow 🌊", "i am capable",
            "today's miracle", "grateful for health", "a moment of clarity", "keep it simple",
            "today was productive", "i am evolving", "notes from the soul", "feeling empowered",
            "a grateful heart", "what's your truth?", "today i am...", "welcome back! 👋",
            "just for a minute", "eyes closed, heart open", "you're doing great",
            "today was a lesson", "grateful for small things", "the world is quiet"
        ]).current;

        useEffect(() => {
            // Shuffle phrases on mount
            for (let i = allPhrases.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allPhrases[i], allPhrases[j]] = [allPhrases[j], allPhrases[i]];
            }
        }, []);

        const cursorOpacity = useSharedValue(1);

        useEffect(() => {
            cursorOpacity.value = withRepeat(
                withTiming(0, { duration: 400 }),
                -1,
                true
            );
        }, []);

        const cursorAnimatedStyle = useAnimatedStyle(() => ({
            opacity: cursorOpacity.value,
        }));

        useEffect(() => {
            const currentPhrase = allPhrases[phraseIndex];
            
            const handleTyping = () => {
                if (!isDeleting) {
                    setText(currentPhrase.substring(0, text.length + 1));
                    if (text.length + 1 === currentPhrase.length) {
                        setTypingSpeed(2000); // Wait at end
                        setIsDeleting(true);
                    } else {
                        setTypingSpeed(100);
                    }
                } else {
                    setText(currentPhrase.substring(0, text.length - 1));
                    if (text.length === 0) {
                        setIsDeleting(false);
                        setPhraseIndex((prev) => (prev + 1) % allPhrases.length);
                        setTypingSpeed(500);
                    } else {
                        setTypingSpeed(50);
                    }
                }
            };

            const timer = setTimeout(handleTyping, typingSpeed);
            return () => clearTimeout(timer);
        }, [text, isDeleting, phraseIndex, typingSpeed]);

        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ 
                    color: colors.primary, 
                    fontSize: 11, 
                    fontWeight: '700', 
                    fontFamily: fonts.body,
                    letterSpacing: 0.5,
                }}>
                    {text}
                </Text>
                <Animated.View style={[
                    { 
                        width: 2, 
                        height: 12, 
                        backgroundColor: colors.primary, 
                        marginLeft: 2 
                    },
                    cursorAnimatedStyle
                ]} />
            </View>
        );
    };

    const Visualizer = ({ active }: { active: boolean }) => {
        const bar1 = useSharedValue(1);
        const bar2 = useSharedValue(1);
        const bar3 = useSharedValue(1);
        const bar4 = useSharedValue(1);

        useEffect(() => {
            if (active) {
                const animateBar = (val: any, delay: number) => {
                    val.value = withRepeat(
                        withSequence(
                            withTiming(1.5 + Math.random(), { duration: 400 + delay }),
                            withTiming(1, { duration: 400 + delay })
                        ),
                        -1,
                        true
                    );
                };
                animateBar(bar1, 0);
                animateBar(bar2, 100);
                animateBar(bar3, 200);
                animateBar(bar4, 300);
            } else {
                bar1.value = 1;
                bar2.value = 1;
                bar3.value = 1;
                bar4.value = 1;
            }
        }, [active]);

        const createBarStyles = (val: any) => useAnimatedStyle(() => ({
            transform: [{ scaleY: val.value }]
        }));

        return (
            <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 20 }}>
                <Animated.View style={[{ width: 3, height: 10, backgroundColor: colors.secondary, borderRadius: 2 }, createBarStyles(bar1)]} />
                <Animated.View style={[{ width: 3, height: 10, backgroundColor: colors.secondary, borderRadius: 2 }, createBarStyles(bar2)]} />
                <Animated.View style={[{ width: 3, height: 10, backgroundColor: colors.secondary, borderRadius: 2 }, createBarStyles(bar3)]} />
                <Animated.View style={[{ width: 3, height: 10, backgroundColor: colors.secondary, borderRadius: 2 }, createBarStyles(bar4)]} />
            </View>
        );
    };

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = task.type === 'video' ? getYoutubeId(task.videoUrl || '') : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    const isAudio = task.type === 'audio';
    const isQuiz = task.type === 'quiz';
    const isJournal = task.type === 'journal';
    const isReflection = task.type === 'reflection';

    const getCleanTitle = (title: string) => {
        // Remove "Day X:", "Day X -", "Day 1:", etc.
        return title.replace(/^Day \d+[:\-]\s*/i, '').trim();
    };

    const getStatusColor = () => {
        if (isCompleted) return colors.success;
        if (isInProgress) return colors.primary;
        if (isLocked) return colors.textMuted;
        return colors.outline;
    };

    const getHierarchySize = () => {
        if (isInProgress) return 'large';
        if (task.type === 'video' || task.type === 'audio') return 'large';
        if (task.type === 'quiz' || task.type === 'journal' || task.type === 'reflection') return 'medium';
        return 'small';
    };

    const size = getHierarchySize();
    const isLarge = size === 'large';
    const isMedium = size === 'medium';
    const isSmall = size === 'small';

    return (
        <View style={[styles.container, isSmall && { marginBottom: 12 }]}>
            {/* Timeline Line */}
            <View style={styles.timelineWrapper}>
                {!isLast && (
                    <View 
                        style={[
                            styles.line, 
                            { 
                                backgroundColor: isLocked ? colors.surfaceContainerHighest : colors.primary,
                                borderStyle: isLocked ? 'solid' : 'dashed',
                                borderWidth: isLocked ? 0 : 1,
                                width: isLocked ? 2 : 0,
                                top: isSmall ? 30 : 40,
                            }
                        ]} 
                    />
                )}
                <View 
                    style={[
                        styles.indicator,
                        { 
                            backgroundColor: isCompleted ? colors.primary : colors.surface,
                            borderColor: isCompleted ? colors.primary : (isInProgress ? colors.primary : colors.surfaceContainerHighest),
                            borderWidth: 2,
                            width: isSmall ? 32 : 40,
                            height: isSmall ? 32 : 40,
                            borderRadius: isSmall ? 16 : 20,
                        }
                    ]}
                >
                    <Ionicons 
                        name={getStatusIcon()} 
                        size={isSmall ? 14 : (isInProgress ? 24 : 18)} 
                        color={isCompleted ? '#fff' : (isInProgress ? colors.primary : getStatusColor())} 
                    />
                </View>
            </View>

            {/* Task Card Content */}
            <Animated.View 
                style={[
                    styles.cardWrapper,
                    animatedStyle
                ]}
            >
                <Pressable
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={handlePress}
                    style={({ pressed }) => [
                        styles.card,
                        { 
                            backgroundColor: isLocked ? colors.surfaceContainerLow : 'transparent',
                            borderRadius: isSmall ? borderRadius.xl : borderRadius.xxl,
                            borderColor: isInProgress ? colors.primary : colors.outlineVariant,
                            borderWidth: isInProgress ? 2 : (isSmall ? 0 : 1),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: isInProgress ? 8 : (isSmall ? 0 : 2),
                            padding: isSmall ? 0 : 0,
                            overflow: 'hidden',
                        },
                        isLocked && { opacity: 0.85 }
                    ]}
                >
                    {!isLocked && (
                        <LinearGradient
                            colors={isInProgress ? 
                                [colors.primary + '15', colors.primary + '05'] : 
                                [colors.surface, colors.surfaceContainerLow]}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <View style={{ padding: isSmall ? 0 : 0 }}>
                    {thumbnailUrl ? (
                        <View style={styles.youtubeCardContent}>
                            <View style={[
                                styles.youtubeThumbnailContainer,
                                { 
                                    borderBottomLeftRadius: 0, 
                                    borderBottomRightRadius: 0,
                                    height: isLarge ? 200 : 140 
                                }
                            ]}>
                                <Image 
                                    source={{ uri: thumbnailUrl }} 
                                    style={styles.youtubeThumbnail}
                                    resizeMode="cover"
                                />
                                <View style={styles.thumbnailOverlay}>
                                    <Ionicons name="play" size={isLarge ? 48 : 32} color="#fff" />
                                </View>
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{task.duration || 10}:00</Text>
                                </View>
                            </View>
                            
                            <View style={styles.youtubeInfoRow}>
                                <View style={[
                                    styles.avatarIcon,
                                    { backgroundColor: isCompleted ? colors.primaryContainer : colors.surfaceContainerHighest }
                                ]}>
                                    <Ionicons 
                                        name="play" 
                                        size={14} 
                                        color={isCompleted ? colors.primary : colors.text} 
                                    />
                                </View>
                                <View style={styles.youtubeTextContainer}>
                                    <Text 
                                        numberOfLines={2}
                                        style={[
                                            styles.youtubeTitle, 
                                            { 
                                                color: colors.text, 
                                                fontFamily: fonts.display,
                                                fontSize: isLarge ? 18 : 14,
                                                lineHeight: isLarge ? 22 : 18
                                            },
                                            isCompleted && { opacity: 0.6 }
                                        ]}
                                    >{getCleanTitle(task.title)}</Text>
                                        <Text style={[styles.previewSubtitle, { color: colors.textMuted }]}>MASTERCLASS</Text>
                                    </View>
                                {isCompleted && (
                                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 4 }} />
                                )}
                            </View>
                        </View>
                    ) : isAudio ? (
                        <View style={[styles.row, { padding: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16 }]}>
                            {/* Apple Music Style Artwork */}
                            <View style={styles.appleMusicArtwork}>
                                <LinearGradient
                                    colors={[colors.secondary, colors.primary]}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.miniVisualizerCenter}>
                                    <Visualizer active={true} />
                                </View>
                            </View>
                            
                            <View style={[styles.content, { marginLeft: 12 }]}>
                                <Text 
                                    numberOfLines={1}
                                    style={[
                                        styles.title, 
                                        { color: colors.text, fontFamily: fonts.display, fontSize: 15 },
                                        isCompleted && { opacity: 0.6 }
                                    ]}
                                >{getCleanTitle(task.title)}</Text>
                                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, letterSpacing: 0.5 }]}>
                                    {task.duration || 5} MIN • AUDIO RITUAL
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Pressable 
                                    onPress={() => console.log('Play Snippet')}
                                    style={styles.applePlayButton}
                                >
                                    <Ionicons name="play" size={22} color={colors.text} />
                                </Pressable>
                            </View>

                            {isCompleted && (
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: 8 }} />
                            )}
                        </View>
                    ) : isQuiz ? (
                        <View style={[styles.row, { padding: 12 }]}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15', width: 44, height: 44, borderRadius: 12 }]}>
                                <Ionicons name="extension-puzzle-outline" size={20} color={colors.primary} />
                            </View>
                            
                            <View style={styles.content}>
                                    <View style={styles.topicBadgeSmall}>
                                        <Text style={[styles.topicTextSmall, { color: colors.primary }]}>DAILY TOPIC</Text>
                                    </View>
                                <Text 
                                    numberOfLines={1}
                                    style={[
                                        styles.title, 
                                        { color: colors.text, fontFamily: fonts.display, fontSize: 15 },
                                        isCompleted && { opacity: 0.6 }
                                    ]}
                                >{getCleanTitle(task.title)}</Text>
                                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12 }]}>
                                    {task.duration || 5} MIN • QUIZ
                                </Text>
                            </View>

                            {!isLocked && (
                                <Ionicons 
                                    name={isCompleted ? "checkmark-circle" : "chevron-forward"} 
                                    size={20} 
                                    color={isCompleted ? colors.primary : colors.outline} 
                                />
                            )}
                        </View>
                    ) : isReflection && !isSmall ? (
                        <View style={[styles.row, { padding: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(249, 250, 251, 0.5)', borderRadius: 16 }]}>
                            {/* Insight / Sparkle Style Artwork */}
                            <View style={[styles.reflectionIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="sparkles" size={22} color={colors.primary} />
                            </View>
                            
                            <View style={[styles.content, { marginLeft: 12 }]}>
                                <Text 
                                    numberOfLines={1}
                                    style={[
                                        styles.title, 
                                        { color: colors.text, fontFamily: fonts.display, fontSize: 15 },
                                        isCompleted && { opacity: 0.6 }
                                    ]}
                                >{getCleanTitle(task.title)}</Text>
                                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, letterSpacing: 0.5 }]}>
                                    INSIGHT • QUICK CHECK-IN
                                </Text>
                            </View>

                            {isCompleted && (
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: 8 }} />
                            )}
                        </View>
                    ) : isJournal && !isSmall ? (
                        <View style={[styles.row, { padding: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(249, 250, 251, 0.5)', borderRadius: 16 }]}>
                            {/* Compact Book Style Artwork */}
                            <View style={styles.journalBookCompact}>
                                <LinearGradient
                                    colors={isDark ? ['#334155', '#1e293b'] : ['#e2e8f0', '#cbd5e1']}
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.bookSpineRibs} />
                                <Ionicons name="book" size={20} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
                            </View>
                            
                            <View style={[styles.content, { marginLeft: 12 }]}>
                                <Text 
                                    numberOfLines={1}
                                    style={[
                                        styles.title, 
                                        { color: colors.text, fontFamily: fonts.display, fontSize: 15 },
                                        isCompleted && { opacity: 0.6 }
                                    ]}
                                >{getCleanTitle(task.title)}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TypingAnimation />
                                </View>
                            </View>

                            {isCompleted && (
                                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: 8 }} />
                            )}
                        </View>
                    ) : (
                        <View style={[styles.row, { padding: 16 }]}>
                            <View style={[
                                styles.iconContainer,
                                { 
                                    backgroundColor: isCompleted 
                                        ? colors.primaryContainer 
                                        : colors.surfaceContainerLow,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                }
                            ]}>
                                <Ionicons 
                                    name={getTypeIcon()} 
                                    size={18} 
                                    color={isCompleted ? colors.success : colors.primary} 
                                />
                            </View>
                            
                            <View style={styles.content}>
                                <Text 
                                    numberOfLines={1}
                                    style={[
                                        styles.title, 
                                        { color: colors.text, fontFamily: fonts.display, fontSize: 14 },
                                        isCompleted && { opacity: 0.6 }
                                    ]}
                                >{task.title}</Text>
                                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 }]}>{task.duration || 5} MIN • {task.type.toUpperCase()}</Text>
                            </View>

                            {!isLocked && (
                                <Ionicons 
                                    name={isCompleted ? "checkmark-circle" : "chevron-forward"} 
                                    size={18} 
                                    color={isCompleted ? colors.primary : colors.outline} 
                                />
                            )}
                            {isLocked && <Ionicons name="lock-closed" size={14} color={colors.textMuted} />}
                        </View>
                    )}
                    </View>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    timelineWrapper: {
        width: 30,
        alignItems: 'center',
        marginRight: 16,
    },
    line: {
        position: 'absolute',
        width: 2,
        top: 40,
        bottom: -20,
        left: 14,
    },
    indicator: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    cardWrapper: {
        flex: 1,
    },
    card: {
        flex: 1,
    },
    youtubeCardContent: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    thumbnailContainer: {
        width: 100,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
        borderWidth: 1,
    },
    youtubeThumbnailContainer: {
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    youtubeThumbnail: {
        width: '100%',
        height: '100%',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    youtubeInfoRow: {
        flexDirection: 'row',
        padding: 16,
    },
    avatarIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    youtubeTextContainer: {
        flex: 1,
    },
    youtubeTitle: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 16,
        marginTop: 0,
    },
    youtubeMetadata: {
        fontSize: 12,
    },
    thumbnailOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    progressBg: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        marginRight: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    progressText: {
        fontSize: 10,
        fontWeight: '800',
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    previewCardContent: {
        flex: 1,
    },
    previewVisualContainer: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    previewInfoRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    previewSubtitle: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    waveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        opacity: 0.4,
    },
    waveBar: {
        width: 3,
        borderRadius: 1.5,
    },
    quizPattern: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    journalLines: {
        width: '80%',
        gap: 8,
    },
    journalLine: {
        height: 2,
        width: '100%',
        borderRadius: 1,
    },
    visualizerOverlay: {
        position: 'absolute',
        top: 20,
        right: 20,
    },
    playSnippetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    snippetText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    topicBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    topicText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    journalPreview: {
        width: '100%',
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    promptText: {
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 22,
    },
    topicBadgeSmall: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    topicTextSmall: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    xpBadgeOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
    },
    xpBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    xpText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    xpBadgeRight: {
        marginLeft: 8,
        marginRight: 4,
    },
    xpBadgeSmall: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    xpTextSmall: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fff',
    },
    appleMusicArtwork: {
        width: 52,
        height: 52,
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    miniVisualizerCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    applePlayButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    journalBookCompact: {
        width: 48,
        height: 48,
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: 'rgba(0,0,0,0.1)',
    },
    reflectionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookSpineRibs: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
    }
});
