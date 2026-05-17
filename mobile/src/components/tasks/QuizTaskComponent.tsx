import React, { useState } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    Image,
    StatusBar 
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, QuizQuestion } from '../../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProgramsStore } from '../../store/programsStore';
import VocalTestPattern from './patterns/VocalTestPattern';
import SpacedRecallPattern from './patterns/SpacedRecallPattern';
import ProblemSolvingPattern from './patterns/ProblemSolvingPattern';
import GuidedSessionPattern from './patterns/GuidedSessionPattern';
import DebatePattern from './patterns/DebatePattern';
import ActiveMeditationPattern from './patterns/ActiveMeditationPattern';
import { BlurView } from 'expo-blur';
import PetalBackground from '../PetalBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_OVERLAP = 24;

interface QuizTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

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
    const { colors, fonts, shadows, isDark, borderRadius } = useTheme();
    const { todayPlan } = useProgramsStore();

    const metadata = task.metadata as TaskMetadata;
    const pattern = metadata?.pattern || 'standard';

    if (pattern === 'vocal-test') {
        return <VocalTestPattern task={task} onComplete={onComplete} />;
    }

    if (pattern === 'spaced-recall') {
        return <SpacedRecallPattern task={task} onComplete={onComplete} />;
    }

    if (pattern === 'problem-solving') {
        return <ProblemSolvingPattern task={task} onComplete={onComplete} />;
    }

    if (pattern === 'guided-session') {
        return <GuidedSessionPattern task={task} onComplete={onComplete} />;
    }

    if (pattern === 'debate') {
        return <DebatePattern task={task} onComplete={onComplete} />;
    }

    if (pattern === 'active-meditation') {
        return <ActiveMeditationPattern task={task} onComplete={onComplete} />;
    }

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

    if (showResults) {
        const RADIUS = 90;
        const CIRC = 2 * Math.PI * RADIUS;
        const offset = CIRC * (1 - score / 100);

        return (
            <View style={[styles.root, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
                <PetalBackground />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Hero Header */}
                    <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                        <Image 
                            source={{ uri: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?q=80&w=2560&auto=format&fit=crop' }} 
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                        />
                        <View style={styles.heroOverlay} />
                        <View style={styles.heroContent}>
                            <Text style={[styles.heroTitle, { color: colors.white, fontFamily: fonts.displayBold }]}>Results</Text>
                        </View>
                    </View>

                    {/* Content Card */}
                    <View style={[
                        styles.contentArea, 
                        { 
                            backgroundColor: colors.surfaceContainerLowest,
                            borderTopLeftRadius: borderRadius.xxxl,
                            borderTopRightRadius: borderRadius.xxxl,
                            marginTop: -CARD_OVERLAP,
                        }
                    ]}>
                        <View style={styles.dragHandle} />

                        <View style={styles.ringContainer}>
                            <Svg width={200} height={200} viewBox="0 0 200 200">
                                <Defs>
                                    <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor={colors.primary} />
                                        <Stop offset="100%" stopColor={colors.primaryLight} />
                                    </SvgLinearGradient>
                                </Defs>
                                <Circle
                                    cx={100} cy={100} r={RADIUS}
                                    fill="transparent"
                                    stroke={colors.surfaceContainerHigh}
                                    strokeWidth={8}
                                />
                                <Circle
                                    cx={100} cy={100} r={RADIUS}
                                    fill="transparent"
                                    stroke="url(#ringGrad)"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    strokeDasharray={CIRC}
                                    strokeDashoffset={offset}
                                    rotation={-90}
                                    origin="100, 100"
                                />
                            </Svg>
                            <View style={styles.ringCenter}>
                                <Text style={[styles.ringPct, { color: colors.primary, fontFamily: fonts.displayBold }]}>{score}%</Text>
                                <Text style={[styles.ringLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>SCORE</Text>
                            </View>
                        </View>

                        <View style={styles.statusBlock}>
                            <Text style={[styles.statusHeadline, { color: colors.primary, fontFamily: fonts.displayBold }]}>
                                {passed ? 'Mastery Achieved' : 'Keep Practicing'}
                            </Text>
                            <Text style={[styles.statusBody, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                {passed
                                    ? "You've integrated the core concepts from today's lesson. You're ready to proceed."
                                    : 'Review the session, then try again. Each attempt makes the knowledge stick deeper.'}
                            </Text>
                        </View>

                        <View style={[styles.insightCard, { backgroundColor: colors.surfaceContainerLow }]}>
                            <View style={[styles.insightIcon, { backgroundColor: colors.primaryContainer }]}>
                                <Ionicons name="sparkles" size={20} color={colors.white} />
                            </View>
                            <View style={styles.insightText}>
                                <Text style={[styles.insightTitle, { color: colors.primary, fontFamily: fonts.labelBold }]}>
                                    {passed ? 'NEXT STEPS' : 'RECOMMENDATION'}
                                </Text>
                                <Text style={[styles.insightBody, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                    {passed 
                                        ? "Great job! You've unlocked the next phase of your program."
                                        : "We recommend re-watching the core lesson for better retention."}
                                </Text>
                            </View>
                        </View>

                        <View style={{ height: 140 }} />
                    </View>
                </ScrollView>

                <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                    <TouchableOpacity
                        style={[styles.continueBtn, { backgroundColor: colors.primary }]}
                        onPress={() => passed
                            ? onComplete({ quizScore: score, quizAttempts: 1 })
                            : (() => { setShowResults(false); setCurrentQuestionIndex(0); setAnswers([]); })()
                        }
                        activeOpacity={0.88}
                    >
                        <Text style={[styles.continueBtnText, { fontFamily: fonts.labelBold, color: colors.white }]}>
                            {passed ? 'Continue' : 'Try Again'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </TouchableOpacity>
                </BlurView>
            </View>
        );
    }

    const question = questions[currentQuestionIndex];

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            <ScrollView contentContainerStyle={styles.questionScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.questionHeader}>
                    <Text style={[styles.quizLabel, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>KNOWLEDGE CHECK</Text>
                    <View style={[styles.counterPill, { backgroundColor: colors.primaryContainer }]}>
                        <Text style={[styles.questionCounter, { color: colors.white, fontFamily: fonts.labelBold }]}>
                            {currentQuestionIndex + 1} / {questions.length}
                        </Text>
                    </View>
                </View>

                <View style={styles.pillRow}>
                    {questions.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.pill,
                                {
                                    backgroundColor: i <= currentQuestionIndex
                                        ? colors.primary
                                        : colors.surfaceContainerHigh,
                                },
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.questionSection}>
                    <Text style={[styles.questionText, { color: colors.primary, fontFamily: fonts.displayBold }]}>
                        {question.question}
                    </Text>
                </View>

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
                                            ? colors.primaryContainer
                                            : colors.surfaceContainerLow,
                                    },
                                ]}
                                onPress={() => handleSelectOption(index)}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.letterBadge,
                                    {
                                        backgroundColor: isSelected ? colors.white : colors.surfaceContainerHigh,
                                    },
                                ]}>
                                    <Text style={[
                                        styles.letterText,
                                        { color: isSelected ? colors.primary : colors.textMuted, fontFamily: fonts.labelBold },
                                    ]}>
                                        {OPTION_LABELS[index]}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.optionText,
                                    {
                                        color: isSelected ? colors.white : colors.primary,
                                        fontFamily: fonts.body,
                                    },
                                ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <TouchableOpacity
                    style={[
                        styles.continueBtn,
                        { 
                            backgroundColor: selected !== undefined ? colors.primary : colors.surfaceContainerHighest,
                        },
                    ]}
                    disabled={selected === undefined}
                    onPress={handleNext}
                    activeOpacity={0.88}
                >
                    <Text style={[
                        styles.continueBtnText, 
                        { 
                            fontFamily: fonts.labelBold, 
                            color: selected !== undefined ? colors.white : colors.textMuted 
                        }
                    ]}>
                        {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={selected !== undefined ? colors.white : colors.textMuted} />
                </TouchableOpacity>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroContent: {
        zIndex: 10,
    },
    heroTitle: {
        fontSize: 48,
        letterSpacing: -1,
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.65,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
        marginBottom: 24,
    },
    questionScroll: {
        paddingHorizontal: 24,
        paddingTop: 60,
        flexGrow: 1,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    quizLabel: {
        fontSize: 11,
        letterSpacing: 1.5,
    },
    counterPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    questionCounter: {
        fontSize: 11,
    },
    pillRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 40,
    },
    pill: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    questionSection: {
        marginBottom: 32,
    },
    questionText: {
        fontSize: 28,
        lineHeight: 36,
    },
    optionsList: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    letterBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    letterText: {
        fontSize: 14,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
    },
    ringContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    ringCenter: {
        position: 'absolute',
        alignItems: 'center',
    },
    ringPct: {
        fontSize: 48,
        letterSpacing: -1,
    },
    ringLabel: {
        fontSize: 10,
        letterSpacing: 2,
        marginTop: -4,
    },
    statusBlock: {
        alignItems: 'center',
        marginBottom: 40,
    },
    statusHeadline: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 8,
    },
    statusBody: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        borderRadius: 20,
        gap: 16,
    },
    insightIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    insightText: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 11,
        letterSpacing: 1,
        marginBottom: 4,
    },
    insightBody: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        paddingBottom: 20,
        justifyContent: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    continueBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 24,
    },
    continueBtnText: {
        fontSize: 16,
    },
});



