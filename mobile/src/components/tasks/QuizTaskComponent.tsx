import React, { useState } from 'react';

import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';
import StitchCard from '../stitch/StitchCard';

interface QuizTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function QuizTaskComponent({ task, onComplete }: QuizTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Mock Questions if none provided
    const questions = [
        {
            question: "What is the primary benefit of the 'Routine Pulse'?",
            options: ["Immediate results", "Biological alignment", "Social recognition", "Higher income"],
            correctAnswer: 1,
            explanation: "Biological alignment helps your body anticipate peak performance periods."
        },
        {
            question: "How long should a new habit attempt ideally last initially?",
            options: ["1 hour", "30 minutes", "2 minutes", "10 seconds"],
            correctAnswer: 2,
            explanation: "The 2-minute rule lowers the barrier to entry for any new habit."
        }
    ];

    const handleSelectOption = (optionIndex: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setShowResults(true);
        }
    };

    const calculateScore = () => {
        const correct = answers.filter((a, i) => a === questions[i].correctAnswer).length;
        return (correct / questions.length) * 100;
    };

    const score = calculateScore();
    const passed = score >= 70;

    const handleFinish = () => {
        onComplete({ quizScore: score, quizAttempts: 1 });
    };

    if (showResults) {
        return (
            <View style={styles.resultsContainer}>
                <View style={[styles.scoreCard, { backgroundColor: passed ? colors.primary : colors.error, borderRadius: borderRadius.xl }]}>
                    <Ionicons name={passed ? "trophy" : "alert-circle"} size={64} color="#fff" />
                    <Text style={styles.scoreValue}>{score}%</Text>
                    <Text style={styles.scoreLabel}>{passed ? "QUIZ PASSED!" : "KEEP PRACTICING"}</Text>
                </View>

                <View style={styles.feedbackSection}>
                    <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                        {passed ? "Excellent work!" : "Not quite there yet."}
                    </Text>
                    <Text style={[styles.feedbackText, { color: colors.textMuted }]}>
                        {passed 
                          ? "You've mastered the core concepts of today's lesson. You're ready to proceed to the next activity."
                          : "We recommend reviewing the video lesson before trying again. Mastery is the key to lasting change."}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <StitchButton 
                        title={passed ? "Proceed to Next Task" : "Review & Retry"}
                        variant="primary"
                        onPress={passed ? handleFinish : () => setShowResults(false)}
                        rightIcon={passed ? "arrow-forward" : "refresh"}
                    />
                </View>
            </View>
        );
    }

    const question = questions[currentQuestionIndex];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.progressHeader}>
                <Text style={[styles.progressText, { color: colors.textMuted }]}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { 
                                backgroundColor: colors.primary,
                                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` 
                            }
                        ]} 
                    />
                </View>
            </View>

            <StitchCard variant="elevated" style={styles.questionCard}>
                <Text style={[styles.questionText, { color: colors.text, fontFamily: fonts.display }]}>
                    {question.question}
                </Text>

                <View style={styles.optionsList}>
                    {question.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                { 
                                    backgroundColor: answers[currentQuestionIndex] === index ? colors.secondaryContainer : colors.surface,
                                    borderColor: answers[currentQuestionIndex] === index ? colors.primary : colors.outlineVariant
                                }
                            ]}
                            onPress={() => handleSelectOption(index)}
                        >
                            <View style={[
                                styles.radio, 
                                { borderColor: answers[currentQuestionIndex] === index ? colors.primary : colors.outlineVariant }
                            ]}>
                                {answers[currentQuestionIndex] === index && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                            </View>
                            <Text style={[
                                styles.optionText, 
                                { 
                                    color: answers[currentQuestionIndex] === index ? colors.primary : colors.text,
                                    fontWeight: answers[currentQuestionIndex] === index ? '700' : '500'
                                }
                            ]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </StitchCard>

            <View style={styles.footer}>
                <StitchButton 
                    title={currentQuestionIndex === questions.length - 1 ? "Check Results" : "Next Question"}
                    variant="primary"
                    disabled={answers[currentQuestionIndex] === undefined}
                    onPress={handleNext}
                    rightIcon="chevron-forward"
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
        paddingBottom: 60,
    },
    progressHeader: {
        marginBottom: 24,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    questionCard: {
        padding: 24,
        marginBottom: 24,
    },
    questionText: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 28,
        marginBottom: 24,
    },
    optionsList: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
    },
    resultsContainer: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    scoreCard: {
        padding: 40,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        marginTop: 16,
    },
    scoreLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 2,
    },
    feedbackSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    feedbackTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 12,
    },
    feedbackText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    footer: {
        marginTop: 'auto',
    }
});
