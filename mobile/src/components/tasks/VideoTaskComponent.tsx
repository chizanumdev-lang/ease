import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import YoutubePlayer from "react-native-youtube-iframe";
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';

interface VideoTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function VideoTaskComponent({ task, onComplete }: VideoTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [playing, setPlaying] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [completedLocally, setCompletedLocally] = useState(task.status === TaskStatus.COMPLETED);

    const onStateChange = useCallback((state: string) => {
        if (state === "ended") {
            setPlaying(false);
            setCompletedLocally(true);
        }
    }, []);

    const handleComplete = () => {
        onComplete({ videoTimestamp: elapsedSeconds });
    };

    // Extract video ID from URL
    const videoId = task.videoUrl?.split('v=')[1]?.split('&')[0] || "dQw4w9WgXcQ";

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.playerCard, { backgroundColor: colors.surface, borderRadius: borderRadius.xl }]}>
                <YoutubePlayer
                    height={220}
                    play={playing}
                    videoId={videoId}
                    onChangeState={onStateChange}
                />
                
                <View style={styles.infoSection}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
                        {task.title}
                    </Text>
                    <Text style={[styles.description, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        {task.description || "Watch this video to understand the core principles of today's focus area."}
                    </Text>
                </View>
            </View>

            {/* Key Takeaways - High Fidelity detail */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Takeaways</Text>
                <View style={styles.takeawayList}>
                    {[
                        "Identity the 'Routine Pulse' in your daily habits.",
                        "Understand why consistency trumps intensity.",
                        "Learn the 2-minute rule for new habit formation."
                    ].map((item, i) => (
                        <View key={i} style={styles.takeawayItem}>
                            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.takeawayText, { color: colors.text }]}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <StitchButton 
                    title={completedLocally ? "Complete Lesson" : "Watch to Complete"}
                    variant="primary"
                    disabled={!completedLocally}
                    onPress={handleComplete}
                    rightIcon="checkmark-circle"
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    playerCard: {
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    infoSection: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    takeawayList: {
        gap: 12,
    },
    takeawayItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
    },
    takeawayText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    footer: {
        marginTop: 20,
    }
});
