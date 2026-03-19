import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';

interface Props {
    task: Task;
    onPress: (task: Task) => void;
    onAction: (taskId: string) => void;
}

export default function TimelineTaskCard({ task, onPress, onAction }: Props) {
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
        if (isCompleted) return <Ionicons name="checkmark" size={20} color="#fff" />;
        if (isActive) return <Ionicons name="play" size={20} color="#4211d4" />;
        return <Ionicons name="lock-closed" size={18} color="#94a3b8" />;
    };

    return (
        <View style={[styles.container, isUpcoming && styles.upcomingOpacity]}>
            {/* Timeline Line */}
            <View style={styles.timelineColumn}>
                <View style={styles.line} />
                <View style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                    isUpcoming && styles.circleUpcoming
                ]}>
                    {getCircleIcon()}
                </View>
            </View>

            {/* Task Card */}
            <TouchableOpacity
                style={[
                    styles.card,
                    isActive && styles.cardActive,
                    isUpcoming && styles.cardUpcoming
                ]}
                onPress={() => onPress(task)}
                onLongPress={() => onAction(task.id)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.content}>
                        {isActive && (
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ACTIVE NOW</Text>
                            </View>
                        )}
                        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
                            {task.title}
                        </Text>
                        <Text style={styles.subtitle}>
                            {task.duration || 15} mins • {isCompleted ? `Completed at ${formatTime(task.scheduledAt)}` : (isActive ? '8 minutes remaining' : `Scheduled for ${formatTime(task.scheduledAt) || 'Anytime'}`)}
                        </Text>
                    </View>
                    <Ionicons
                        name={getIconName(task.type)}
                        size={24}
                        color={isCompleted || isActive ? '#4211d4' : '#cbd5e1'}
                    />
                </View>

                {isActive && (
                    <TouchableOpacity
                        style={styles.resumeButton}
                        onPress={() => onPress(task)}
                    >
                        <Text style={styles.resumeButtonText}>Resume Session</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    upcomingOpacity: {
        opacity: 0.6,
    },
    timelineColumn: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    line: {
        position: 'absolute',
        width: 2,
        top: 4,
        bottom: -30,
        backgroundColor: '#f1f5f9',
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 4,
        borderColor: '#f6f6f8', // matches container bg
        zIndex: 10,
    },
    circleCompleted: {
        backgroundColor: '#4211d4',
        borderWidth: 0,
    },
    circleActive: {
        backgroundColor: 'rgba(66, 17, 212, 0.12)',
        borderColor: '#f6f6f8',
        borderWidth: 4,
    },
    circleUpcoming: {
        backgroundColor: '#f1f5f9',
        borderWidth: 4,
        borderColor: '#f6f6f8',
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardActive: {
        borderColor: '#4211d4',
        borderWidth: 2,
        shadowColor: '#4211d4',
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardUpcoming: {
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderColor: '#e2e8f0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    content: {
        flex: 1,
        marginRight: 12,
    },
    activeBadge: {
        backgroundColor: 'rgba(66, 17, 212, 0.08)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    activeBadgeText: {
        color: '#4211d4',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: -0.3,
    },
    titleCompleted: {
        color: '#94a3b8',
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 18,
    },
    resumeButton: {
        backgroundColor: '#4211d4',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#4211d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    resumeButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    }
});
