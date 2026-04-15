import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';

import { useTheme } from '../hooks/useTheme';

interface Props {
    task: Task;
    onPress: (task: Task) => void;
    onAction: (taskId: string) => void;
}

export default function TimelineTaskCard({ task, onPress, onAction }: Props) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Determine state
    const isCompleted = task.completed;
    // For demo purposes, we'll treat the first uncompleted task as active
    // In a real app, this would be based on time or current status
    const isActive = !isCompleted && task.type === 'video'; // Typical active state in the design
    const isUpcoming = !isCompleted && !isActive;

    const getIconName = (type?: string): any => {
        switch (type) {
            case 'video': return 'videocam-outline';
            case 'quiz': return 'help-circle-outline';
            case 'audio': return 'headset-outline';
            case 'exercise': return 'fitness-outline';
            case 'lesson': return 'book-outline';
            case 'mindfulness': return 'leaf-outline';
            case 'practice': return 'construct-outline';
            default: return 'ellipse-outline';
        }
    };

    const getCircleIcon = () => {
        if (isCompleted) return <Ionicons name="checkmark" size={20} color={isDark ? colors.background : "#fff"} />;
        if (isActive) return <Ionicons name="play" size={20} color={colors.primary} />;
        return <Ionicons name="lock-closed" size={18} color={colors.textMuted} />;
    };

    return (
        <View style={[styles.container, { paddingHorizontal: spacing.xl, marginBottom: spacing.lg }, isUpcoming && styles.upcomingOpacity]}>
            {/* Timeline Line */}
            <View style={[styles.timelineColumn, { marginRight: spacing.md }]}>
                <View style={[styles.line, { backgroundColor: colors.outlineVariant }]} />
                <View style={[
                    styles.circle,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHighest },
                    isCompleted && { backgroundColor: colors.primary, borderWidth: 0 },
                    isActive && { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceContainerHighest },
                    isUpcoming && { backgroundColor: colors.surfaceContainerHighest }
                ]}>
                    {getCircleIcon()}
                </View>
            </View>

            {/* Task Card */}
            <TouchableOpacity
                style={[
                    styles.card,
                    { 
                        backgroundColor: colors.surface, 
                        borderColor: colors.outlineVariant,
                        padding: spacing.md,
                        borderRadius: borderRadius.xl
                    },
                    isActive && { borderColor: colors.primary, borderWidth: 2 },
                    isUpcoming && { borderStyle: 'dashed', backgroundColor: colors.surfaceVariant + '20' }
                ]}
                onPress={() => onPress(task)}
                onLongPress={() => onAction(task.id)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.content}>
                        {isActive && (
                            <View style={[styles.activeBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                                <Text style={[styles.activeBadgeText, { color: colors.primary }]}>ACTIVE NOW</Text>
                            </View>
                        )}
                        <Text style={[
                            styles.title, 
                            { color: colors.text, fontFamily: fonts.display },
                            isCompleted && { color: colors.textMuted }
                        ]}>
                            {task.title}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {task.duration || 15} mins • {isCompleted ? `Completed` : (isActive ? 'Active' : `Upcoming`)}
                        </Text>
                    </View>
                    <Ionicons
                        name={getIconName(task.type)}
                        size={24}
                        color={isCompleted || isActive ? colors.primary : colors.textMuted}
                    />
                </View>

                {isActive && (
                    <TouchableOpacity
                        style={[styles.resumeButton, { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing.md }]}
                        onPress={() => onPress(task)}
                    >
                        <Text style={[styles.resumeButtonText, { color: isDark ? colors.background : "#fff" }]}>Resume Session</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    upcomingOpacity: {
        opacity: 0.6,
    },
    timelineColumn: {
        width: 40,
        alignItems: 'center',
    },
    line: {
        position: 'absolute',
        width: 2,
        top: 4,
        bottom: -30,
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        zIndex: 10,
    },
    card: {
        flex: 1,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    content: {
        flex: 1,
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    resumeButton: {
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    resumeButtonText: {
        fontWeight: '700',
        fontSize: 15,
    }
});
