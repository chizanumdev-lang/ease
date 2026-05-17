import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Task, TaskMetadata } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface ProblemSolvingProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function ProblemSolvingPattern({ task, onComplete }: ProblemSolvingProps) {
    const { colors, fonts, shadows, borderRadius } = useTheme();
    const metadata = task.metadata as any;
    
    const scenario = metadata?.scenario || "A team member is consistently missing deadlines, affecting the sprint. They are talented but seem disengaged.";
    const options = metadata?.options || [
        { id: '1', text: "Address it publicly in the standup to ensure accountability.", feedback: "Public criticism often causes defensiveness and lowers morale. Private coaching is usually better.", correct: false },
        { id: '2', text: "Schedule a private 1-on-1 to understand the root cause.", feedback: "Correct. This builds trust and allows you to identify blockers (personal or technical) without shame.", correct: true },
        { id: '3', text: "Assign their work to someone else to keep the project on track.", feedback: "This solves the immediate delay but ignores the team health and potentially wastes talent.", correct: false }
    ];

    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleSelect = (id: string) => {
        setSelectedId(id);
    };

    const selectedOption = options.find((o: any) => o.id === selectedId);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Scenario Header */}
                <View style={[styles.scenarioCard, { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg }]}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primaryContainer }]}>
                        <Ionicons name="bulb-outline" size={24} color={colors.white} />
                    </View>
                    <Text style={[styles.scenarioLabel, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>THE SCENARIO</Text>
                    <Text style={[styles.scenarioText, { color: colors.text, fontFamily: fonts.body }]}>
                        {scenario}
                    </Text>
                </View>

                <Text style={[styles.choiceLabel, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>HOW WOULD YOU REACT?</Text>

                {/* Options */}
                <View style={styles.optionsGrid}>
                    {options.map((option: any) => (
                        <TouchableOpacity
                            key={option.id}
                            disabled={selectedId !== null}
                            style={[
                                styles.optionBtn,
                                { 
                                    backgroundColor: colors.surface, 
                                    borderColor: selectedId === option.id ? (option.correct ? '#10B981' : '#EF4444') : colors.outline,
                                    opacity: selectedId && selectedId !== option.id ? 0.5 : 1
                                }
                            ]}
                            onPress={() => handleSelect(option.id)}
                        >
                            <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.body }]}>{option.text}</Text>
                            {selectedId === option.id && (
                                <Ionicons 
                                    name={option.correct ? "checkmark-circle" : "close-circle"} 
                                    size={20} 
                                    color={option.correct ? '#10B981' : '#EF4444'} 
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Feedback Slate */}
                {selectedId && (
                    <Animated.View 
                        entering={FadeIn}
                        style={[
                            styles.feedbackSlate, 
                            { 
                                backgroundColor: selectedOption?.correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                borderColor: selectedOption?.correct ? '#10B981' : '#EF4444'
                            }
                        ]}
                    >
                        <Text style={[styles.feedbackTitle, { color: selectedOption?.correct ? '#065F46' : '#991B1B', fontFamily: fonts.labelBold }]}>
                            {selectedOption?.correct ? 'STRATEGIC INSIGHT' : 'CONSIDER THIS'}
                        </Text>
                        <Text style={[styles.feedbackText, { color: colors.text, fontFamily: fonts.body }]}>
                            {selectedOption?.feedback}
                        </Text>
                    </Animated.View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer Action */}
            {selectedId && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.completeBtn, { backgroundColor: colors.primary }]}
                        onPress={() => onComplete({ selection: selectedId, correct: selectedOption?.correct })}
                    >
                        <Text style={[styles.completeBtnText, { color: colors.white, fontFamily: fonts.labelBold }]}>CONTINUE</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: 24,
    },
    scenarioCard: {
        padding: 24,
        paddingTop: 40,
        marginBottom: 32,
        position: 'relative',
    },
    iconCircle: {
        position: 'absolute',
        top: -20,
        left: 24,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scenarioLabel: {
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 12,
    },
    scenarioText: {
        fontSize: 18,
        lineHeight: 26,
    },
    choiceLabel: {
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 16,
    },
    optionsGrid: {
        gap: 12,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        gap: 12,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 20,
    },
    feedbackSlate: {
        marginTop: 24,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    feedbackTitle: {
        fontSize: 11,
        letterSpacing: 1,
        marginBottom: 6,
    },
    feedbackText: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.8,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
    },
    completeBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    completeBtnText: {
        fontSize: 16,
        letterSpacing: 1,
    }
});
