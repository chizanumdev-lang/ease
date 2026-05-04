import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskStatus } from '../../types';

interface TaskCardProps {
    task: Task;
    onPress: (task: Task) => void;
    isLast?: boolean;
}

export default function TaskCard({ task, onPress, isLast }: TaskCardProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    
    // Animation for pulse effect (for in-progress tasks)
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const isCompleted = task.status === TaskStatus.COMPLETED;
    const isInProgress = task.status === TaskStatus.IN_PROGRESS;
    const isLocked = task.status === TaskStatus.LOCKED;

    useEffect(() => {
        if (isInProgress) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isInProgress, pulseAnim]);

    const getStatusIcon = () => {
        if (isCompleted) return 'checkmark-circle';
        if (isInProgress) return 'radio-button-on';
        if (isLocked) return 'lock-closed';
        return 'radio-button-off';
    };

    const getTypeIcon = () => {
        switch (task.type) {
            case 'video': return 'play';
            case 'quiz': return 'help-circle';
            case 'audio': return 'headset';
            case 'journal': return 'create';
            case 'reflection': return 'eye';
            case 'micro-app': return 'apps';
            case 'consistency': return 'flame';
            default: return 'book';
        }
    };

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = task.type === 'video' ? getYoutubeId(task.videoUrl || '') : null;
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

    const getStatusColor = () => {
        if (isCompleted) return colors.primary;
        if (isInProgress) return colors.primary;
        if (isLocked) return colors.textMuted;
        return colors.outline;
    };

    return (
        <View style={styles.container}>
            {/* Timeline Line */}
            <View style={styles.timelineWrapper}>
                {!isLast && (
                    <View 
                        style={[
                            styles.line, 
                            { 
                                backgroundColor: isCompleted ? colors.primary : colors.surfaceContainerHighest,
                                borderStyle: isLocked ? 'dashed' : 'solid',
                                borderWidth: isLocked ? 1 : 0,
                                width: isLocked ? 0 : 2,
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
                        }
                    ]}
                >
                    <Ionicons 
                        name={getStatusIcon()} 
                        size={isInProgress ? 24 : 18} 
                        color={isCompleted ? '#fff' : (isInProgress ? colors.primary : getStatusColor())} 
                    />
                </View>
            </View>

            {/* Task Card Content */}
            <Animated.View 
                style={[
                    styles.cardWrapper,
                    { transform: [{ scale: pulseAnim }] }
                ]}
            >
                <Pressable
                    style={[
                        styles.card,
                        { 
                            backgroundColor: isLocked ? colors.surfaceContainerLow : (isInProgress ? colors.surface : colors.surface),
                            borderRadius: borderRadius.xl,
                            borderColor: isInProgress ? colors.primary : colors.outlineVariant,
                            borderWidth: isInProgress ? 2 : 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.2 : 0.04,
                            shadowRadius: 10,
                            elevation: isInProgress ? 4 : 1,
                            padding: thumbnailUrl ? 0 : 16,
                            overflow: 'hidden',
                        },
                        isLocked && { opacity: 0.5 }
                    ]}
                    onPress={() => !isLocked && onPress(task)}
                >
                    {thumbnailUrl ? (
                        <View style={styles.youtubeCardContent}>
                            <View style={[
                                styles.youtubeThumbnailContainer,
                                { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                            ]}>
                                <Image 
                                    source={{ uri: thumbnailUrl }} 
                                    style={styles.youtubeThumbnail}
                                    resizeMode="cover"
                                />
                                <View style={styles.thumbnailOverlay}>
                                    <Ionicons name="play" size={28} color="#fff" />
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
                                            { color: colors.text, fontFamily: fonts.display },
                                            isCompleted && { opacity: 0.6 }
                                        ]}
                                    >{task.title}</Text>
                                    <Text style={[styles.youtubeMetadata, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                        Ease Lesson • {task.duration || 10} min
                                    </Text>
                                </View>
                                {isCompleted && (
                                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.row}>
                            <View style={[
                                styles.iconContainer,
                                { 
                                    backgroundColor: isCompleted ? colors.primaryContainer : (isInProgress ? colors.secondaryContainer : colors.surfaceContainerLow)
                                }
                            ]}>
                                <Ionicons 
                                    name={getTypeIcon()} 
                                    size={22} 
                                    color={isCompleted ? colors.primary : (isInProgress ? colors.primary : colors.textMuted)} 
                                />
                            </View>
                            
                            <View style={styles.content}>
                                <Text 
                                    style={[
                                        styles.title, 
                                        { color: colors.text, fontFamily: fonts.display },
                                        isCompleted && { opacity: 0.6 }
                                    ]}
                                >{task.title}</Text>
                                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>{task.duration || 10} MIN • {task.type.toUpperCase()}</Text>
                                
                                {isInProgress && (
                                    <View style={styles.activeIndicator}>
                                        <View style={[styles.pulseDot, { backgroundColor: colors.primary }]} />
                                        <Text style={[styles.activeText, { color: colors.primary }]}>CONTINUE TASK</Text>
                                        <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                                    </View>
                                )}

                                {isCompleted && task.next_task_id && (
                                    <View style={[styles.activeIndicator, { opacity: 0.8 }]}>
                                        <Ionicons name="link-outline" size={12} color={colors.primary} />
                                        <Text style={[styles.activeText, { color: colors.primary }]}>CONTINUE TO NEXT</Text>
                                        <Ionicons name="arrow-forward" size={12} color={colors.primary} />
                                    </View>
                                )}
                            </View>

                            {!isLocked && (
                                <Ionicons 
                                    name={isCompleted ? "checkmark-circle" : "chevron-forward"} 
                                    size={20} 
                                    color={isCompleted ? colors.primary : colors.outline} 
                                />
                            )}
                            {isLocked && <Ionicons name="lock-closed" size={16} color={colors.textMuted} />}
                        </View>
                    )}
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
    youtubeCardContent: {
        flex: 1,
    },
    youtubeThumbnailContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
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
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 2,
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
    }
});
