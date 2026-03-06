import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useGoalsStore } from '../../store/goalsStore';
import { useProgramsStore } from '../../store/programsStore';
import SelectionCard from '../../components/SelectionCard';
import StitchButton from '../../components/StitchButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Step = 'CATEGORY' | 'SETTINGS' | 'DURATION' | 'TIME' | 'GENERATING';

type Props = NativeStackScreenProps<MainStackParamList, 'GoalWizard'>;

const CATEGORIES = [
    { id: 'skill', title: 'Skill Acquisition', description: 'Learn a new skill like a language or instrument', icon: 'musical-notes-outline' },
    { id: 'habit_build', title: 'Habit Building', description: 'Establish a new daily routine', icon: 'calendar-outline' },
    { id: 'career', title: 'Career Growth', description: 'Develop professional skills and leadership', icon: 'briefcase-outline' },
    { id: 'mental', title: 'Mental Well-being', description: 'Focus on mindfulness and emotional health', icon: 'heart-outline' },
    { id: 'fitness', title: 'Fitness & Health', description: 'Improve physical health and energy', icon: 'fitness-outline' },
];

const DURATIONS = [
    { id: 30, title: '30 Days', description: 'Short-term intensive sprint' },
    { id: 60, title: '60 Days', description: 'Medium-term steady progress' },
    { id: 90, title: '90 Days', description: 'Long-term transformation journey' },
];

const COMMITMENTS = [
    { id: 15, title: '15 min', description: 'Micro-learning' },
    { id: 30, title: '30 min', description: 'Balanced study' },
    { id: 45, title: '45 min', description: 'Deep focus' },
    { id: 60, title: '60+ min', description: 'Mastery pursuit' },
];

export default function GoalWizardScreen({ navigation }: Props) {
    const [step, setStep] = React.useState<Step>('CATEGORY');

    // Form State
    const [category, setCategory] = React.useState('');
    const [goalDescription, setGoalDescription] = React.useState('');
    const [targetDate, setTargetDate] = React.useState('');
    const [timeframe, setTimeframe] = React.useState<number>(30);
    const [dailyMinutes, setDailyMinutes] = React.useState<number>(30);

    const { createGoal } = useGoalsStore();
    const { generateProgram, isLoading: isProgramLoading } = useProgramsStore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleNext = () => {
        if (step === 'CATEGORY') {
            if (!category) {
                Alert.alert('Selection Required', 'Please choose a growth goal category to continue.');
                return;
            }
            setStep('SETTINGS');
        } else if (step === 'SETTINGS') {
            if (!goalDescription.trim()) {
                Alert.alert('Input Required', 'Please describe your goal in detail.');
                return;
            }
            setStep('DURATION');
        } else if (step === 'DURATION') {
            setStep('TIME');
        } else if (step === 'TIME') {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step === 'SETTINGS') setStep('CATEGORY');
        else if (step === 'DURATION') setStep('SETTINGS');
        else if (step === 'TIME') setStep('DURATION');
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setStep('GENERATING');

        try {
            const title = goalDescription.split('.')[0].substring(0, 50) + (goalDescription.length > 50 ? '...' : '');

            const goal = await createGoal({
                title,
                description: goalDescription,
                category,
                targetDate: targetDate || new Date(Date.now() + timeframe * 24 * 60 * 60 * 1000).toISOString(),
            });

            const program = await generateProgram(
                goal.id,
                timeframe,
                { minutesPerDay: dailyMinutes, learningStyle: 'mixed', constraints: [] }
            );

            navigation.replace('ProgramPreview', { programId: program.id });
        } catch (error) {
            console.error('Wizard Error:', error);
            Alert.alert('Error', 'Failed to create your personalized program. Please try again.');
            setStep('TIME');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderProgress = () => {
        const steps = ['CATEGORY', 'SETTINGS', 'DURATION', 'TIME'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex === -1) return null;

        return (
            <View style={styles.progressContainer}>
                {steps.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.progressBar,
                            index <= currentIndex ? styles.progressBarActive : styles.progressBarInactive,
                            { width: (width - 64) / steps.length }
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderHeader = (title: string, subtitle: string) => (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );

    if (step === 'GENERATING') {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Designing your program...</Text>
                <Text style={styles.loadingSubtext}>Analyzing goal • Structuring curriculum • Scheduling tasks</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.topNav}>
                    {step !== 'CATEGORY' ? (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={Theme.colors.text.light} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="close" size={24} color={Theme.colors.text.light} />
                        </TouchableOpacity>
                    )}
                    {renderProgress()}
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {step === 'CATEGORY' && (
                        <>
                            {renderHeader("Choose Your Growth Goal", "What area of your life would you like to focus on today?")}
                            {CATEGORIES.map((cat) => (
                                <SelectionCard
                                    key={cat.id}
                                    title={cat.title}
                                    description={cat.description}
                                    selected={category === cat.id}
                                    onPress={() => setCategory(cat.id)}
                                    icon={<Ionicons name={cat.icon as any} size={24} color={category === cat.id ? Theme.colors.primary : Theme.colors.slate[400]} />}
                                />
                            ))}
                        </>
                    )}

                    {step === 'SETTINGS' && (
                        <>
                            {renderHeader("Goal Settings & Timeframe", "Describe what you want to achieve and when.")}
                            <Text style={styles.label}>Detailed Description</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="I want to learn confirmational guitar playing, focusing on fingerstyle techniques..."
                                value={goalDescription}
                                onChangeText={setGoalDescription}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                placeholderTextColor={Theme.colors.slate[400]}
                            />

                            <Text style={[styles.label, { marginTop: 24 }]}>Target Achievement Date (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD (e.g. 2026-06-01)"
                                value={targetDate}
                                onChangeText={setTargetDate}
                                placeholderTextColor={Theme.colors.slate[400]}
                            />
                            <Text style={styles.hint}>Leaving this blank will use the timeframe from the next step.</Text>
                        </>
                    )}

                    {step === 'DURATION' && (
                        <>
                            {renderHeader("Select Program Duration", "How long would you like this transformation journey to take?")}
                            {DURATIONS.map((dur) => (
                                <SelectionCard
                                    key={dur.id}
                                    title={dur.title}
                                    description={dur.description}
                                    selected={timeframe === dur.id}
                                    onPress={() => setTimeframe(dur.id)}
                                    icon={<Ionicons name="time-outline" size={24} color={timeframe === dur.id ? Theme.colors.primary : Theme.colors.slate[400]} />}
                                />
                            ))}
                        </>
                    )}

                    {step === 'TIME' && (
                        <>
                            {renderHeader("Daily Time Investment", "How many minutes can you realistically commit each day?")}
                            {COMMITMENTS.map((comm) => (
                                <SelectionCard
                                    key={comm.id}
                                    title={comm.title}
                                    description={comm.description}
                                    selected={dailyMinutes === comm.id}
                                    onPress={() => setDailyMinutes(comm.id)}
                                    icon={<Ionicons name="flash-outline" size={24} color={dailyMinutes === comm.id ? Theme.colors.primary : Theme.colors.slate[400]} />}
                                />
                            ))}
                        </>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <StitchButton
                        title={step === 'TIME' ? "Generate My Plan" : "Continue"}
                        onPress={handleNext}
                        showArrow={step !== 'TIME'}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.white,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.md,
        paddingVertical: Theme.spacing.sm,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.slate[200],
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
    },
    progressBarActive: {
        backgroundColor: Theme.colors.primary,
    },
    progressBarInactive: {
        backgroundColor: Theme.colors.slate[200],
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: Theme.spacing.lg,
    },
    header: {
        marginBottom: Theme.spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Theme.colors.text.light,
        marginBottom: Theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.text.muted,
        lineHeight: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.colors.text.light,
        marginBottom: Theme.spacing.sm,
    },
    textArea: {
        backgroundColor: Theme.colors.background.light,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        height: 160,
        fontSize: 16,
        color: Theme.colors.text.light,
        borderWidth: 1,
        borderColor: Theme.colors.slate[200],
    },
    input: {
        backgroundColor: Theme.colors.background.light,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        fontSize: 16,
        color: Theme.colors.text.light,
        borderWidth: 1,
        borderColor: Theme.colors.slate[200],
    },
    hint: {
        marginTop: 8,
        fontSize: 13,
        color: Theme.colors.text.muted,
        fontStyle: 'italic',
    },
    footer: {
        padding: Theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.slate[200],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
        padding: Theme.spacing.xl,
    },
    loadingText: {
        marginTop: Theme.spacing.lg,
        fontSize: 20,
        fontWeight: '700',
        color: Theme.colors.text.light,
    },
    loadingSubtext: {
        marginTop: Theme.spacing.sm,
        fontSize: 15,
        color: Theme.colors.text.muted,
        textAlign: 'center',
    },
});
