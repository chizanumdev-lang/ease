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
    const { colors, fonts, shadows, isDark } = useTheme();
    const [rating, setRating] = useState<number | null>(null);
    const [mood, setMood] = useState<string | null>(null);

    const moods = [
        { icon: 'happy', label: 'Energized' },
        { icon: 'sunny', label: 'Calm' },
        { icon: 'cloudy', label: 'Focused' },
        { icon: 'rainy', label: 'Tired' },
        { icon: 'thunderstorm', label: 'Stressed' }
    ];

    const handleComplete = () => {
        onComplete({ 
            reflectionRating: rating || 0,
            reflectionMood: mood || 'neutral'
        });
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Quick Check-in</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        How are you feeling after completing today's core lessons?
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 1.5 }]}>Focus Level</Text>
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((num) => {
                            const isSelected = rating === num;
                            return (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.ratingButton,
                                        { 
                                            backgroundColor: isSelected ? colors.primary : colors.surfaceContainerLow,
                                            ...(isSelected ? shadows.ambient : {})
                                        }
                                    ]}
                                    onPress={() => setRating(num)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[
                                        styles.ratingText, 
                                        { color: isSelected ? colors.white : colors.text, fontFamily: fonts.display }
                                    ]}>
                                        {num}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={styles.labelRow}>
                        <Text style={[styles.labelText, { color: colors.textMuted, fontFamily: fonts.label }]}>Subtle</Text>
                        <Text style={[styles.labelText, { color: colors.textMuted, fontFamily: fonts.label }]}>Intense</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 1.5 }]}>Primary Mood</Text>
                    <View style={styles.moodGrid}>
                        {moods.map((m) => {
                            const isSelected = mood === m.label;
                            return (
                                <TouchableOpacity
                                    key={m.label}
                                    style={[
                                        styles.moodCard,
                                        { 
                                            backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceContainerLow,
                                            ...(isSelected ? shadows.ambient : {})
                                        }
                                    ]}
                                    onPress={() => setMood(m.label)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons 
                                        name={isSelected ? (m.icon + '') as any : (m.icon + '-outline') as any} 
                                        size={28} 
                                        color={isSelected ? colors.primary : colors.textMuted} 
                                    />
                                    <Text style={[
                                        styles.moodLabel, 
                                        { color: isSelected ? colors.primary : colors.text, fontFamily: fonts.body }
                                    ]}>
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    style={[
                        styles.finishBtn,
                        { 
                            backgroundColor: (rating && mood) ? colors.primary : colors.surfaceContainerHighest,
                            ...((rating && mood) ? shadows.ambient : {})
                        }
                    ]}
                    onPress={handleComplete}
                    disabled={!rating || !mood}
                    activeOpacity={0.88}
                >
                    <Text style={[
                        styles.finishBtnText, 
                        { 
                            fontFamily: fonts.display,
                            color: (rating && mood) ? colors.white : colors.textMuted
                        }
                    ]}>
                        Complete Reflection
                    </Text>
                    <Ionicons 
                        name="checkmark-circle" 
                        size={22} 
                        color={(rating && mood) ? colors.white : colors.textMuted} 
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 48,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        lineHeight: 36,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 12,
    },
    section: {
        marginBottom: 44,
    },
    sectionTitle: {
        fontSize: 13,
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
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 22,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    labelText: {
        fontSize: 12,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    moodCard: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    moodLabel: {
        fontSize: 12,
        marginTop: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    finishBtn: {
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    finishBtnText: {
        fontSize: 18,
    },
});
