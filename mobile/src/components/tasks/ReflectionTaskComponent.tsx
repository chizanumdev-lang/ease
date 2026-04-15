import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';
import StitchCard from '../stitch/StitchCard';

interface ReflectionTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function ReflectionTaskComponent({ task, onComplete }: ReflectionTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [rating, setRating] = useState<number | null>(null);
    const [mood, setMood] = useState<string | null>(null);

    const moods = [
        { icon: 'happy', label: 'Energized', color: '#FFD700' },
        { icon: 'sunny', label: 'Calm', color: '#87CEEB' },
        { icon: 'cloudy', label: 'Focused', color: '#98FB98' },
        { icon: 'rainy', label: 'Tired', color: '#B0C4DE' },
        { icon: 'thunderstorm', label: 'Stressed', color: '#FA8072' }
    ];

    const handleComplete = () => {
        onComplete({ 
            reflectionRating: rating || 0,
            reflectionMood: mood || 'neutral'
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Quick Check-in</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    How are you feeling after completing today's core lessons?
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Rate your current focus</Text>
                <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((num) => (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.ratingButton,
                                { 
                                    backgroundColor: rating === num ? colors.primary : colors.surfaceContainerLow,
                                    borderColor: rating === num ? colors.primary : colors.outlineVariant
                                }
                            ]}
                            onPress={() => setRating(num)}
                        >
                            <Text style={[
                                styles.ratingText, 
                                { color: rating === num ? '#fff' : colors.text }
                            ]}>
                                {num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.labelRow}>
                    <Text style={[styles.labelText, { color: colors.textMuted }]}>Low</Text>
                    <Text style={[styles.labelText, { color: colors.textMuted }]}>High</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select your primary mood</Text>
                <View style={styles.moodGrid}>
                    {moods.map((m) => (
                        <TouchableOpacity
                            key={m.label}
                            style={[
                                styles.moodCard,
                                { 
                                    backgroundColor: mood === m.label ? colors.secondaryContainer : colors.surface,
                                    borderColor: mood === m.label ? colors.primary : colors.outlineVariant
                                }
                            ]}
                            onPress={() => setMood(m.label)}
                        >
                            <Ionicons 
                                name={m.icon as any} 
                                size={32} 
                                color={mood === m.label ? colors.primary : colors.textMuted} 
                            />
                            <Text style={[
                                styles.moodLabel, 
                                { color: mood === m.label ? colors.primary : colors.text }
                            ]}>
                                {m.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <StitchButton 
                    title="Finish Reflection"
                    variant="primary"
                    onPress={handleComplete}
                    disabled={!rating || !mood}
                    rightIcon="arrow-forward"
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
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
        textAlign: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    ratingButton: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    ratingText: {
        fontSize: 20,
        fontWeight: '800',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '700',
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    moodCard: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        padding: 8,
    },
    moodLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 8,
    },
    footer: {
        marginTop: 20,
    }
});
