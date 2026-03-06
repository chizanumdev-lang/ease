import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, Quiz, QuizQuestion } from '../../types';
import { quizzesService } from '../../services/quizzes.service';
import { tasksService } from '../../services/tasks.service';

type Props = NativeStackScreenProps<MainStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
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
            Alert.alert('Error', 'Failed to load quiz. Please try again.');
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
            Alert.alert('Incomplete', 'Please answer all questions before submitting.');
            return;
        }

        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        setSubmitted(true);

        try {
            // Submit to backend
            await quizzesService.submitAttempt(
                quizId,
                answers as number[]
            );

            // Mark task as completed
            await tasksService.update(taskId, { completed: true });
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            Alert.alert('Warning', 'Quiz completed but failed to sync with server.');
        }
    };

    const handleFinish = () => {
        navigation.navigate('Tabs', { screen: 'Home' } as any);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading quiz...</Text>
            </View>
        );
    }

    if (!quiz) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Quiz not found</Text>
            </View>
        );
    }

    if (submitted) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>Quiz Complete!</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreText}>{score}%</Text>
                    </View>

                    {score < 60 && (
                        <View style={styles.recommendationBox}>
                            <Text style={styles.recommendationIcon}>💡</Text>
                            <Text style={styles.recommendationTitle}>Recommendation</Text>
                            <Text style={styles.recommendationText}>
                                Consider reviewing the video lesson again to strengthen your understanding.
                                A score of 60% or higher is recommended before moving forward.
                            </Text>
                        </View>
                    )}

                    <View style={styles.explanationsContainer}>
                        <Text style={styles.explanationsTitle}>Review</Text>
                        {quiz.questions.map((question, qIndex) => {
                            const userAnswer = answers[qIndex];
                            const isCorrect = userAnswer === question.correctAnswer;

                            return (
                                <View key={qIndex} style={styles.explanationCard}>
                                    <View style={styles.questionHeader}>
                                        <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                                        <View style={[
                                            styles.resultBadge,
                                            isCorrect ? styles.correctBadge : styles.incorrectBadge
                                        ]}>
                                            <Text style={styles.resultBadgeText}>
                                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.questionText}>{question.question}</Text>

                                    <View style={styles.answersReview}>
                                        <Text style={styles.reviewLabel}>Your answer:</Text>
                                        <Text style={[
                                            styles.reviewAnswer,
                                            isCorrect ? styles.correctAnswer : styles.incorrectAnswer
                                        ]}>
                                            {question.options[userAnswer!]}
                                        </Text>

                                        {!isCorrect && (
                                            <>
                                                <Text style={styles.reviewLabel}>Correct answer:</Text>
                                                <Text style={[styles.reviewAnswer, styles.correctAnswer]}>
                                                    {question.options[question.correctAnswer]}
                                                </Text>
                                            </>
                                        )}
                                    </View>

                                    {question.explanation && (
                                        <View style={styles.explanationBox}>
                                            <Text style={styles.explanationLabel}>Explanation:</Text>
                                            <Text style={styles.explanationText}>{question.explanation}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                        <Text style={styles.finishButtonText}>Return to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    const allAnswered = answers.every(a => a !== null);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{quiz.title}</Text>
                <Text style={styles.subtitle}>
                    {quiz.questions.length} {quiz.questions.length === 1 ? 'Question' : 'Questions'}
                </Text>
            </View>

            <View style={styles.questionsContainer}>
                {quiz.questions.map((question, qIndex) => (
                    <View key={qIndex} style={styles.questionCard}>
                        <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                        <Text style={styles.questionText}>{question.question}</Text>

                        <View style={styles.optionsContainer}>
                            {question.options.map((option, oIndex) => {
                                const isSelected = answers[qIndex] === oIndex;
                                return (
                                    <TouchableOpacity
                                        key={oIndex}
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.optionButtonSelected
                                        ]}
                                        onPress={() => selectAnswer(qIndex, oIndex)}
                                    >
                                        <View style={[
                                            styles.optionRadio,
                                            isSelected && styles.optionRadioSelected
                                        ]}>
                                            {isSelected && <View style={styles.optionRadioDot} />}
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isSelected && styles.optionTextSelected
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
                style={[styles.submitButton, !allAnswered && styles.submitButtonDisabled]}
                onPress={submitQuiz}
                disabled={!allAnswered}
            >
                <Text style={styles.submitButtonText}>
                    {allAnswered ? 'Submit Quiz' : `Answer all questions (${answers.filter(a => a !== null).length}/${quiz.questions.length})`}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#e74c3c',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
    },
    questionsContainer: {
        padding: 20,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee',
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 8,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    optionButtonSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#007AFF',
    },
    optionRadio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ccc',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionRadioSelected: {
        borderColor: '#007AFF',
    },
    optionRadioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    optionTextSelected: {
        color: '#007AFF',
        fontWeight: '500',
    },
    submitButton: {
        margin: 20,
        padding: 18,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    resultsContainer: {
        padding: 20,
    },
    resultsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 20,
    },
    scoreCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 30,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    recommendationBox: {
        backgroundColor: '#fff3cd',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    recommendationIcon: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: 8,
    },
    recommendationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 8,
        textAlign: 'center',
    },
    recommendationText: {
        fontSize: 15,
        color: '#856404',
        lineHeight: 22,
        textAlign: 'center',
    },
    explanationsContainer: {
        marginBottom: 20,
    },
    explanationsTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    explanationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    correctBadge: {
        backgroundColor: '#d4edda',
    },
    incorrectBadge: {
        backgroundColor: '#f8d7da',
    },
    resultBadgeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    answersReview: {
        marginTop: 12,
        gap: 8,
    },
    reviewLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginTop: 8,
    },
    reviewAnswer: {
        fontSize: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    correctAnswer: {
        color: '#28a745',
        borderWidth: 1,
        borderColor: '#28a745',
    },
    incorrectAnswer: {
        color: '#dc3545',
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    explanationBox: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#e3f2fd',
        borderRadius: 8,
    },
    explanationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976d2',
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 15,
        color: '#1565c0',
        lineHeight: 22,
    },
    finishButton: {
        padding: 18,
        backgroundColor: '#28a745',
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    finishButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});
