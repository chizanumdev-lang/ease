import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import LoadingState from '../../components/LoadingState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, Quiz, QuizQuestion } from '../../types';
import { quizzesService } from '../../services/quizzes.service';
import { tasksService } from '../../services/tasks.service';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useModalStore } from '../../store/modalStore';

type Props = NativeStackScreenProps<MainStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius, isDark } = useTheme();
    const { showModal } = useModalStore();
    const { quizId, taskId } = route.params;
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        loadQuiz();
    }, [quizId]);

    const loadQuiz = async () => {
        try {
            const data = await quizzesService.getQuiz(quizId);
            setQuiz(data);
            setAnswers(new Array(data.questions.length).fill(null));
        } catch (error) {
            console.error('Failed to load quiz:', error);
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Failed to load quiz. Please try again.'
            });
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const selectAnswer = (questionIndex: number, optionIndex: number) => {
        if (submitted) return;
        const newAnswers = [...answers];
        newAnswers[questionIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const calculateScore = (): number => {
        if (!quiz) return 0;
        let correct = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                correct++;
            }
        });
        return Math.round((correct / quiz.questions.length) * 100);
    };

    const submitQuiz = async () => {
        if (!quiz) return;

        // Check all questions answered
        if (answers.some(a => a === null)) {
            showModal({
                type: 'info',
                title: 'Incomplete',
                description: 'Please answer all questions before submitting.'
            });
            return;
        }

        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        
        showModal({
            type: 'loading',
            title: 'Submitting Quiz',
            description: 'Analyzing your responses and calculating milestones...'
        });

        try {
            // Submit to backend
            const submitPromise = quizzesService.submitAttempt(
                quizId,
                answers as number[]
            );

            // Mark task as completed
            const updatePromise = tasksService.update(taskId, { completed: true });

            await Promise.all([
                submitPromise,
                updatePromise,
                new Promise(resolve => setTimeout(resolve, 1000)) // Ensure premium feel
            ]);

            useModalStore.getState().hideModal();
            setSubmitted(true);
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            showModal({
                type: 'error',
                title: 'Sync Warning',
                description: 'Your quiz results are ready, but we failed to sync with the server. Your progress will be saved locally.'
            });
            setSubmitted(true);
        }
    };

    const handleFinish = () => {
        navigation.navigate('Tabs', { screen: 'Home' } as any);
    };

    if (loading) {
        return (
            <LoadingState 
                title="Sharpening your focus" 
                subtitle="We're preparing your validation questions and optimizing your feedback loop."
                variant="full"
            />
        );
    }

    if (!quiz) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>Quiz not found</Text>
            </View>
        );
    }

    if (submitted) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsTitle, { color: colors.text }]}>Quiz Complete!</Text>
                    <View style={[styles.scoreCircle, { backgroundColor: colors.primary }]}>
                        <Text style={styles.scoreText}>{score}%</Text>
                    </View>

                    {score < 60 && (
                        <View style={[styles.recommendationBox, { backgroundColor: `${colors.secondary}15`, borderColor: colors.secondary }]}>
                            <Ionicons name="bulb-outline" size={32} color={colors.secondary} style={styles.recommendationIcon} />
                            <Text style={[styles.recommendationTitle, { color: colors.secondary }]}>Recommendation</Text>
                            <Text style={[styles.recommendationText, { color: colors.onSurfaceVariant }]}>
                                Consider reviewing the video lesson again to strengthen your understanding.
                                A score of 60% or higher is recommended before moving forward.
                            </Text>
                        </View>
                    )}

                    <View style={styles.explanationsContainer}>
                        <Text style={[styles.explanationsTitle, { color: colors.text }]}>Review</Text>
                        {quiz.questions.map((question, qIndex) => {
                            const userAnswer = answers[qIndex];
                            const isCorrect = userAnswer === question.correctAnswer;

                            return (
                                <View key={qIndex} style={[styles.explanationCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                                    <View style={styles.questionHeader}>
                                        <Text style={[styles.questionNumber, { color: colors.primary }]}>Question {qIndex + 1}</Text>
                                        <View style={[
                                            styles.resultBadge,
                                            { backgroundColor: isCorrect ? `${colors.primary}15` : `${colors.error}15` }
                                        ]}>
                                            <Text style={[styles.resultBadgeText, { color: isCorrect ? colors.primary : colors.error }]}>
                                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>

                                    <View style={styles.answersReview}>
                                        <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Your answer:</Text>
                                        <Text style={[
                                            styles.reviewAnswer,
                                            { backgroundColor: colors.surfaceContainerLow, color: isCorrect ? colors.primary : colors.error, borderColor: isCorrect ? colors.primary : colors.error }
                                        ]}>
                                            {question.options[userAnswer!]}
                                        </Text>

                                        {!isCorrect && (
                                            <>
                                                <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>Correct answer:</Text>
                                                <Text style={[styles.reviewAnswer, { backgroundColor: colors.surfaceContainerLow, color: colors.primary, borderColor: colors.primary }]}>
                                                    {question.options[question.correctAnswer]}
                                                </Text>
                                            </>
                                        )}
                                    </View>

                                    {question.explanation && (
                                        <View style={[styles.explanationBox, { backgroundColor: `${colors.primary}10` }]}>
                                            <Text style={[styles.explanationLabel, { color: colors.primary }]}>Explanation:</Text>
                                            <Text style={[styles.explanationText, { color: colors.onSurfaceVariant }]}>{question.explanation}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <TouchableOpacity style={[styles.finishButton, { backgroundColor: colors.primary }]} onPress={handleFinish}>
                        <Text style={[styles.finishButtonText, { color: isDark ? colors.background : "#fff" }]}>Return to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    const allAnswered = answers.every(a => a !== null);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.title, { color: colors.text }]}>{quiz.title}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {quiz.questions.length} {quiz.questions.length === 1 ? 'Question' : 'Questions'}
                </Text>
            </View>

            <View style={styles.questionsContainer}>
                {quiz.questions.map((question, qIndex) => (
                    <View key={qIndex} style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                        <Text style={[styles.questionNumber, { color: colors.primary }]}>Question {qIndex + 1}</Text>
                        <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>

                        <View style={styles.optionsContainer}>
                            {question.options.map((option, oIndex) => {
                                const isSelected = answers[qIndex] === oIndex;
                                return (
                                    <TouchableOpacity
                                        key={oIndex}
                                        style={[
                                            styles.optionButton,
                                            { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
                                            isSelected && { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }
                                        ]}
                                        onPress={() => selectAnswer(qIndex, oIndex)}
                                    >
                                        <View style={[
                                            styles.optionRadio,
                                            { borderColor: colors.outlineVariant },
                                            isSelected && { borderColor: colors.primary }
                                        ]}>
                                            {isSelected && <View style={[styles.optionRadioDot, { backgroundColor: colors.primary }]} />}
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            { color: colors.text },
                                            isSelected && { color: colors.primary, fontWeight: '700' }
                                        ]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[
                    styles.submitButton, 
                    { backgroundColor: colors.primary },
                    !allAnswered && { backgroundColor: colors.outlineVariant }
                ]}
                onPress={submitQuiz}
                disabled={!allAnswered}
            >
                <Text style={[styles.submitButtonText, { color: isDark ? colors.background : "#fff" }]}>
                    {allAnswered ? 'Submit Quiz' : `Answer all questions (${answers.filter(a => a !== null).length}/${quiz.questions.length})`}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '700',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    questionsContainer: {
        padding: 20,
    },
    questionCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    questionNumber: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
    },
    optionRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionRadioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    submitButton: {
        margin: 20,
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
        marginBottom: 60,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    resultsContainer: {
        padding: 24,
        paddingTop: 60,
    },
    resultsTitle: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: -1,
    },
    scoreCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 32,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
    },
    recommendationBox: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        alignItems: 'center',
    },
    recommendationIcon: {
        marginBottom: 8,
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    recommendationText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        fontWeight: '500',
    },
    explanationsContainer: {
        marginBottom: 32,
    },
    explanationsTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    explanationCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    resultBadgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    answersReview: {
        marginTop: 16,
        gap: 12,
    },
    reviewLabel: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reviewAnswer: {
        fontSize: 16,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        fontWeight: '600',
    },
    explanationBox: {
        marginTop: 20,
        padding: 16,
        borderRadius: 14,
    },
    explanationLabel: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    finishButton: {
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
        marginBottom: 40,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    finishButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
