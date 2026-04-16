import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, QuizQuestion } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useProgramsStore } from '../../store/programsStore';

interface QuizTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

// ─────────────────────────────────────────────────────────
// Contextual fallback questions — used only when the backend
// hasn't provided a quiz yet (e.g. the program was created
// before the AI quiz-generation was in place).
// ─────────────────────────────────────────────────────────
function generateFallbackQuestions(task: Task, theme: string): QuizQuestion[] {
    const t = task.title.toLowerCase();
    const th = (theme || '').toLowerCase();

    if (t.includes('focus') || t.includes('deep work') || th.includes('focus')) {
        return [
            {
                question: `What is the core technique introduced in "${task.title}"?`,
                options: ['Multitasking in short bursts', 'Single-tasking with deliberate attention', 'Passive consumption', 'Social accountability'],
                correctAnswer: 1,
                explanation: 'Deliberate single-tasking is the foundation of deep focus practice.',
            },
            {
                question: 'Which environment change most directly improves focus?',
                options: ['Adding ambient music', 'Removing digital distractions', 'Working in groups', 'Changing your chair'],
                correctAnswer: 1,
                explanation: 'Reducing environmental friction is the fastest lever for sustained attention.',
            },
            {
                question: 'How does consistency compound over time?',
                options: ['It doesn\'t — only intensity matters', 'Small daily efforts build neurological pathways', 'Only weekly effort counts', 'Consistency leads to burnout'],
                correctAnswer: 1,
                explanation: 'Repeated small actions physically reshape neural connections over time.',
            },
        ];
    }

    if (t.includes('habit') || t.includes('routine') || th.includes('habit')) {
        return [
            {
                question: `What is the key insight from "${task.title}"?`,
                options: ['Motivation drives habit', 'Environment shapes behaviour more than willpower', 'Habits form in exactly 21 days', 'Only morning routines work'],
                correctAnswer: 1,
                explanation: 'Designing your environment removes the need for willpower.',
            },
            {
                question: 'What makes a habit "atomic"?',
                options: ['Explosive effort', 'It\'s tiny but compounds into major change', 'It\'s done at sunrise', 'It requires a partner'],
                correctAnswer: 1,
                explanation: 'Atomic habits are small, manageable actions that stack into lasting systems.',
            },
            {
                question: 'Which is more important: the goal or the system?',
                options: ['The goal — it gives direction', 'The system — it drives consistent results', 'They are equally important', 'Neither matters'],
                correctAnswer: 1,
                explanation: 'Goals set direction but systems produce the results you see every day.',
            },
        ];
    }

    if (t.includes('mindset') || t.includes('growth') || th.includes('mindset')) {
        return [
            {
                question: `What belief underpins the lesson in "${task.title}"?`,
                options: ['Talent is fixed at birth', 'Abilities can be grown through effort', 'Environment is everything', 'Genetics determine success'],
                correctAnswer: 1,
                explanation: 'A growth mindset holds that skills develop through dedication and hard work.',
            },
            {
                question: 'How should you frame failure according to a growth mindset?',
                options: ['As proof of limited ability', 'As feedback and a step forward', 'As something to avoid', 'As others\' fault'],
                correctAnswer: 1,
                explanation: 'Failure is information — it reveals exactly where to focus next.',
            },
            {
                question: 'What is the role of effort in developing mastery?',
                options: ['Effort is overrated — talent wins', 'Effort is the path through which talent becomes ability', 'Effort only helps at advanced levels', 'Effort causes diminishing returns'],
                correctAnswer: 1,
                explanation: 'Deliberate effort is the primary driver of skill acquisition.',
            },
        ];
    }

    // Generic high-quality fallback for any topic
    return [
        {
            question: `What is the central idea behind "${task.title}"?`,
            options: [
                'Passive exposure is enough to create change',
                'Deliberate practice paired with reflection drives growth',
                'Only expert instruction produces results',
                'Change happens randomly over time',
            ],
            correctAnswer: 1,
            explanation: 'Intentional action combined with reflection accelerates meaningful change.',
        },
        {
            question: 'How does today\'s lesson connect to your overall goal?',
            options: [
                'It\'s a standalone exercise with no lasting impact',
                'It builds a foundational skill that compounds with each session',
                'It\'s a warm-up before the real work begins',
                'It tests knowledge you already have',
            ],
            correctAnswer: 1,
            explanation: 'Each session adds a layer to your capability — progress is cumulative.',
        },
        {
            question: 'What is the best way to reinforce what you learned today?',
            options: [
                'Re-watch the content immediately',
                'Apply one insight to a real situation within 24 hours',
                'Take notes and never revisit them',
                'Wait until you feel fully ready',
            ],
            correctAnswer: 1,
            explanation: 'Application within 24 hours dramatically increases retention and integration.',
        },
    ];
}

export default function QuizTaskComponent({ task, onComplete }: QuizTaskProps) {
    const { colors } = useTheme();
    const { todayPlan } = useProgramsStore();

    // ── Resolve questions: backend quiz first, contextual fallback second ──
    const backendQuiz = todayPlan?.quizzes?.find(q => q.id === task.quizId);
    const questions: QuizQuestion[] = (backendQuiz?.questions?.length ?? 0) > 0
        ? backendQuiz!.questions
        : generateFallbackQuestions(task, todayPlan?.theme ?? '');

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [showResults, setShowResults] = useState(false);

    const OPTION_LABELS = ['A', 'B', 'C', 'D'];

    const selected = answers[currentQuestionIndex];

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

    const score = Math.round(
        (answers.filter((a, i) => a === questions[i].correctAnswer).length / questions.length) * 100
    );
    const passed = score >= 70;

    // ─────────────────────────────────────────────────────────
    // RESULTS SCREEN
    // ─────────────────────────────────────────────────────────
    if (showResults) {
        // SVG ring: radius=110, circumference=2π*110≈691
        const RADIUS = 110;
        const CIRC = 2 * Math.PI * RADIUS;
        const offset = CIRC * (1 - score / 100);

        const insightTitle = passed ? 'Mastery Achieved' : 'Keep Going';
        const insightBody = passed
            ? "You've demonstrated solid understanding of today's concepts. Your consistency is building real capability."
            : "Review the video lesson and revisit these questions. Mastery is built through repetition, not perfection.";

        return (
            <View style={[styles.root, { backgroundColor: colors.background }]}>
                {/* Decorative blobs */}
                <View style={[styles.blob, styles.blobTR, { backgroundColor: colors.secondaryContainer }]} />
                <View style={[styles.blob, styles.blobBL, { backgroundColor: colors.primaryContainer }]} />

                <ScrollView contentContainerStyle={styles.resultsScroll}>
                    {/* Header */}
                    <View style={styles.resultsHeader}>
                        <Text style={[styles.resultsTitle, { color: colors.primary }]}>Wellness Quiz</Text>
                    </View>

                    {/* SVG Ring */}
                    <View style={styles.ringContainer}>
                        <Svg width={288} height={288} viewBox="0 0 288 288">
                            <Defs>
                                <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={colors.primary} />
                                    <Stop offset="100%" stopColor={colors.secondary ?? '#56624b'} />
                                </SvgLinearGradient>
                            </Defs>
                            {/* Track */}
                            <Circle
                                cx={144} cy={144} r={RADIUS}
                                fill="transparent"
                                stroke={colors.surfaceContainerHigh ?? '#e8e8e3'}
                                strokeWidth={14}
                            />
                            {/* Progress */}
                            <Circle
                                cx={144} cy={144} r={RADIUS}
                                fill="transparent"
                                stroke="url(#ringGrad)"
                                strokeWidth={14}
                                strokeLinecap="round"
                                strokeDasharray={CIRC}
                                strokeDashoffset={offset}
                                rotation={-90}
                                origin="144, 144"
                            />
                        </Svg>
                        <View style={styles.ringCenter}>
                            <Text style={[styles.ringPct, { color: colors.text }]}>{score}%</Text>
                            <Text style={[styles.ringLabel, { color: colors.textMuted }]}>SCORE</Text>
                        </View>
                    </View>

                    {/* Status message */}
                    <View style={styles.statusBlock}>
                        <Text style={[styles.statusHeadline, { color: colors.text }]}>
                            {passed ? 'Mastery Achieved! Your focus is sharpening.' : 'Keep Practicing — You\'re Making Progress.'}
                        </Text>
                        <Text style={[styles.statusBody, { color: colors.textMuted }]}>
                            {passed
                                ? "You've integrated the core concepts from today's lesson. You're ready to proceed."
                                : 'Review the session, then try again. Each attempt makes the knowledge stick deeper.'}
                        </Text>
                    </View>

                    {/* Insight card */}
                    <View style={[styles.insightCard, { backgroundColor: colors.surfaceContainerLow ?? '#f4f4ef' }]}>
                        <View style={[styles.insightIcon, { backgroundColor: colors.primary + '1A' }]}>
                            <Ionicons name="sparkles" size={22} color={colors.primary} />
                        </View>
                        <View style={styles.insightText}>
                            <Text style={[styles.insightTitle, { color: colors.text }]}>{insightTitle}</Text>
                            <Text style={[styles.insightBody, { color: colors.textMuted }]}>{insightBody}</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Fixed footer */}
                <View style={[styles.fixedFooter, { backgroundColor: colors.background }]}>
                    <LinearGradient
                        colors={[colors.background + '00', colors.background]}
                        style={StyleSheet.absoluteFill}
                    />
                    <TouchableOpacity
                        style={[styles.continueBtn, { backgroundColor: colors.primary }]}
                        onPress={() => passed
                            ? onComplete({ quizScore: score, quizAttempts: 1 })
                            : (() => { setShowResults(false); setCurrentQuestionIndex(0); setAnswers([]); })()
                        }
                        activeOpacity={0.88}
                    >
                        <Text style={styles.continueBtnText}>{passed ? 'Continue' : 'Try Again'}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─────────────────────────────────────────────────────────
    // QUESTION SCREEN
    // ─────────────────────────────────────────────────────────
    const question = questions[currentQuestionIndex];

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.questionScroll}>

                {/* Header */}
                <View style={styles.questionHeader}>
                    <Text style={[styles.quizLabel, { color: colors.primary }]}>Wellness Quiz</Text>
                    <Text style={[styles.questionCounter, { color: colors.textMuted }]}>
                        {currentQuestionIndex + 1} of {questions.length}
                    </Text>
                </View>

                {/* Segmented pill progress */}
                <View style={styles.pillRow}>
                    {questions.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: i <= currentQuestionIndex
                                        ? colors.primary
                                        : (colors.outlineVariant ?? '#bec8ca') + '50',
                                    shadowColor: i <= currentQuestionIndex ? colors.primary : 'transparent',
                                    shadowOpacity: i <= currentQuestionIndex ? 0.4 : 0,
                                    shadowRadius: i <= currentQuestionIndex ? 6 : 0,
                                    elevation: i <= currentQuestionIndex ? 3 : 0,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Question card */}
                <View style={[styles.questionCard, { backgroundColor: colors.surfaceContainerHigh + '60' }]}>
                    <View style={styles.questionGlow} />
                    <Text style={[styles.questionText, { color: colors.text }]}>
                        {question.question}
                    </Text>
                </View>

                {/* Options */}
                <View style={styles.optionsList}>
                    {question.options.map((option, index) => {
                        const isSelected = selected === index;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    {
                                        backgroundColor: isSelected
                                            ? colors.primary + '0D'
                                            : (colors.surfaceContainerLow ?? '#f4f4ef'),
                                        borderLeftWidth: 6,
                                        borderLeftColor: isSelected ? colors.primary : 'transparent',
                                    },
                                ]}
                                onPress={() => handleSelectOption(index)}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.letterBadge,
                                    {
                                        backgroundColor: isSelected ? colors.primary : (colors.surfaceContainerHighest ?? '#e3e3de'),
                                    },
                                ]}>
                                    <Text style={[
                                        styles.letterText,
                                        { color: isSelected ? '#fff' : colors.textMuted },
                                    ]}>
                                        {OPTION_LABELS[index]}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.optionText,
                                    {
                                        color: isSelected ? colors.primary : colors.text,
                                        fontWeight: isSelected ? '700' : '500',
                                    },
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Expert insight */}
                {question.explanation && (
                    <View style={[styles.expertCard, { backgroundColor: colors.secondaryContainer + '50' }]}>
                        <View style={[styles.expertIcon, { backgroundColor: colors.primaryContainer + '40' }]}>
                            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.expertText}>
                            <Text style={[styles.expertLabel, { color: colors.textMuted }]}>EXPERT INSIGHT</Text>
                            <Text style={[styles.expertBody, { color: colors.text }]}>{question.explanation}</Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed footer */}
            <View style={styles.fixedFooter}>
                <LinearGradient
                    colors={[colors.background + '00', colors.background]}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                    style={[
                        styles.continueBtn,
                        { backgroundColor: selected !== undefined ? colors.primary : (colors.outlineVariant ?? '#bec8ca') },
                    ]}
                    disabled={selected === undefined}
                    onPress={handleNext}
                    activeOpacity={0.88}
                >
                    <Text style={styles.continueBtnText}>
                        {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    // ── Decorative blobs (results only)
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.18,
    },
    blobTR: {
        width: 256,
        height: 256,
        top: -60,
        right: -60,
    },
    blobBL: {
        width: 320,
        height: 320,
        bottom: -80,
        left: -80,
    },

    // ── Question screen
    questionScroll: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    quizLabel: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    questionCounter: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Segmented pills
    pillRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 28,
    },
    pill: {
        flex: 1,
        height: 6,
        borderRadius: 3,
    },

    // Question card
    questionCard: {
        borderRadius: 20,
        padding: 28,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    questionGlow: {
        position: 'absolute',
        top: -48,
        right: -48,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: 'rgba(34,83,68,0.05)',
    },
    questionText: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 30,
    },

    // Options
    optionsList: {
        gap: 12,
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    letterBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    letterText: {
        fontSize: 16,
        fontWeight: '800',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
    },

    // Expert insight
    expertCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        borderRadius: 16,
        gap: 14,
        marginTop: 4,
    },
    expertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    expertText: {
        flex: 1,
    },
    expertLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    expertBody: {
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },

    // ── Results screen
    resultsScroll: {
        paddingHorizontal: 24,
        paddingTop: 24,
        alignItems: 'center',
    },
    resultsHeader: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 32,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    ringContainer: {
        width: 288,
        height: 288,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    ringCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    ringPct: {
        fontSize: 56,
        fontWeight: '900',
        letterSpacing: -2,
    },
    ringLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    statusBlock: {
        alignItems: 'center',
        marginBottom: 28,
        paddingHorizontal: 8,
    },
    statusHeadline: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 12,
    },
    statusBody: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 23,
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        borderRadius: 16,
        gap: 14,
        width: '100%',
    },
    insightIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    insightText: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    insightBody: {
        fontSize: 14,
        lineHeight: 21,
    },

    // ── Shared footer
    fixedFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    continueBtn: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#225344',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
    },
    continueBtnText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
    },
});

