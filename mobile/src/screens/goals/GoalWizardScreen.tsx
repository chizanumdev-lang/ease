import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ImageBackground,
    StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useGoalsStore } from '../../store/goalsStore';
import { useProgramsStore } from '../../store/programsStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useModalStore } from '../../store/modalStore';
import { useForm, Controller } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import LottieView from 'lottie-react-native';
import { BarChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import LoadingState from '../../components/LoadingState';
import BentoCategoryGrid from '../../components/stitch/BentoCategoryGrid';
import EditorialCard from '../../components/stitch/EditorialCard';
import StitchButton from '../../components/StitchButton';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

type Step = 'CATEGORY' | 'DEFINITION' | 'COMMITMENT' | 'REVIEW' | 'GENERATING';

type Props = NativeStackScreenProps<MainStackParamList, 'GoalWizard'>;

const CATEGORIES = [
    { 
        id: 'skill', 
        title: 'Skill', 
        description: 'Master new abilities and technical expertise.', 
        icon: 'bulb-outline', 
        color: '#225344', 
        onPrimaryContainer: '#ffffff',
        span: 3,
        bgImage: require('../../../assets/images/skill_bg.png')
    },
    { 
        id: 'habit', 
        title: 'Habit', 
        description: 'Build consistency through small daily actions.', 
        icon: 'sync-outline', 
        color: '#d7e4c7', 
        onPrimaryContainer: '#5a664f',
        span: 3,
        bgImage: require('../../../assets/images/time_mindfulness_bg.png')
    },
    { 
        id: 'career', 
        title: 'Career', 
        description: 'Professional growth and milestones.', 
        icon: 'briefcase-outline', 
        color: '#6c5891', 
        onPrimaryContainer: '#ffffff',
        span: 3,
        bgImage: require('../../../assets/images/career_bg.png')
    },
    { 
        id: 'mental', 
        title: 'Mental', 
        description: 'Mindfulness, focus, and health.', 
        icon: 'leaf-outline', 
        color: '#e3e3de', 
        onPrimaryContainer: '#1a1c19',
        span: 3,
        bgImage: require('../../../assets/images/mental_bg.png')
    },
    { 
        id: 'fitness', 
        title: 'Fitness', 
        description: 'Strength and physical vitality.', 
        icon: 'fitness-outline', 
        color: '#f4f4ef', 
        onPrimaryContainer: '#1a1c19',
        span: 3,
        bgImage: require('../../../assets/images/fitness_bg.png')
    },
];

const DURATIONS = [
    { id: 30, title: '30 Days', subtitle: 'The Sprint', description: 'Intensive focus for rapid growth.' },
    { id: 60, title: '60 Days', subtitle: 'The Rhythm', description: 'Sustainable pace for lasting change.' },
    { id: 90, title: '90 Days', subtitle: 'The Transformation', description: 'Full architectural rebuild of spirit.' },
];

const COMMITMENTS = [
    { id: 15, title: '15 min', type: 'Gentle' },
    { id: 30, title: '30 min', type: 'Standard' },
    { id: 60, title: '60 min', type: 'Deep' },
];

const GOAL_INSPIRATIONS = [
    "Run a half-marathon in October",
    "Read 2 books every month",
    "Learn intermediate pottery skills",
    "Daily 10-minute meditation"
];

export default function GoalWizardScreen({ navigation }: Props) {
    const { colors, spacing, borderRadius, isDark, fonts, shadows } = useTheme();
    const [step, setStep] = useState<Step>('CATEGORY');

    const { control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            category: '',
            goalDescription: '',
            targetDate: '',
            timeframe: 60,
            dailyMinutes: 30,
        }
    });

    const formData = watch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // Stores
    const { createGoal } = useGoalsStore();
    const { isAuthenticated } = useAuthStore();
    const { generateProgram, fetchPreviewMetadata } = useProgramsStore();
    const { showModal } = useModalStore();
    const [previewData, setPreviewData] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleNext = async () => {
        if (step === 'CATEGORY') {
            if (!formData.category) {
                showModal({ type: 'info', title: 'Selection Required', description: 'Choose your journey foundation.' });
                return;
            }
            setStep('DEFINITION');
        } else if (step === 'DEFINITION') {
            if (!formData.goalDescription.trim()) {
                showModal({ type: 'info', title: 'Define Your Path', description: 'Tell us a bit about your goal.' });
                return;
            }
            setStep('COMMITMENT');
        } else if (step === 'COMMITMENT') {
            setIsLoadingPreview(true);
            showModal({
                type: 'loading',
                title: 'Building Your Journey',
                description: 'We\'re figuring out the best path and pace just for you...'
            });
            try {
                // Ensure we are authenticated before proceeding
                if (!isAuthenticated) {
                    console.error('[WIZARD] Not authenticated. Cannot fetch preview.');
                    showModal({
                        type: 'error',
                        title: 'Session Expired',
                        description: 'Your session has expired. Please log in again to continue manifesting your journey.'
                    });
                    return;
                }

                // Fetch preview metadata for the Review screen
                // We omit the goalId as it hasn't been created yet
                const data = await fetchPreviewMetadata(undefined, formData.timeframe, {
                    minutesPerDay: formData.dailyMinutes,
                    category: formData.category,
                    goalDescription: formData.goalDescription.trim()
                });
                setPreviewData(data);
                useModalStore.getState().hideModal();
                setStep('REVIEW');
            } catch (error: any) {
                console.error('Preview error:', error);
                
                if (error.response?.status === 401) {
                    showModal({
                        type: 'error',
                        title: 'Session Inactive',
                        description: 'We couldn\'t verify your identity. Please try logging out and back in.'
                    });
                    return;
                }

                // Fallback: Proceed to review anyway but without AI projections for generic errors
                useModalStore.getState().hideModal();
                setStep('REVIEW');
            } finally {
                setIsLoadingPreview(false);
            }
        } else if (step === 'REVIEW') {
            handleSubmit(handleFinalSubmit)();
        }
    };

    const handleBack = () => {
        if (step === 'DEFINITION') setStep('CATEGORY');
        else if (step === 'COMMITMENT') setStep('DEFINITION');
        else if (step === 'REVIEW') setStep('COMMITMENT');
        else navigation.goBack();
    };

    const handleFinalSubmit = async (data: any) => {
        setIsSubmitting(true);
        
        showModal({
            type: 'loading',
            title: 'Starting Your Journey',
            description: 'We\'re putting your plan together and getting everything ready...'
        });

        try {
            const title = data.goalDescription.split('.')[0].substring(0, 50) + (data.goalDescription.length > 50 ? '...' : '');

            const goal = await createGoal({
                title,
                description: data.goalDescription,
                category: data.category,
                targetDate: data.targetDate || format(addDays(new Date(), data.timeframe), 'yyyy-MM-dd'),
            });

            const program = await generateProgram(
                goal.id,
                data.timeframe,
                { 
                    minutesPerDay: data.dailyMinutes, 
                    learningStyle: 'mixed', 
                    constraints: [],
                    metadata: previewData // Pass the AI-generated preview to be saved
                }
            );

            // Close modal before navigation
            useModalStore.getState().hideModal();
            navigation.replace('ProgramPreview', { programId: program.id });
        } catch (error) {
            console.error('Wizard Error:', error);
            showModal({
                type: 'error',
                title: 'Something went wrong',
                description: 'We couldn\'t put your plan together just now. Please try again.'
            });
            // Stay on REVIEW step if error occurred
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderHeader = (stepNum: number, title: string, subtitle: string) => (
        <View style={styles.header}>
            <View style={styles.stepIndicator}>
                <Text style={[styles.stepText, { color: colors.primary, fontFamily: fonts.label }]}>Step {stepNum} of 5</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={[styles.progressFill, { width: `${stepNum * 20}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>{subtitle}</Text>
        </View>
    );

    if (step === 'GENERATING') {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <LottieView
                    source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_toum81uz.json' }}
                    autoPlay
                    loop
                    style={{ width: 300, height: 300 }}
                />
                <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 24, marginTop: 20 }}>Creating your journey</Text>
                <Text style={{ color: colors.textMuted, fontFamily: fonts.body, marginTop: 10 }}>Understanding your goal • Building your journey • Setting your schedule</Text>
            </View>
        );
    }

    const renderFooterActions = () => {
        if (step === 'CATEGORY') return null;

        return (
            <View style={styles.footerButtons}>
                <StitchButton 
                    title={step === 'REVIEW' ? "Manifest My Path" : (step === 'DEFINITION' ? "Continue to Details" : "Continue")} 
                    onPress={handleNext}
                    isLoading={step === 'REVIEW' ? isSubmitting : (step === 'COMMITMENT' ? isLoadingPreview : false)}
                    showArrow={step !== 'REVIEW'}
                    style={styles.primaryFooterButton}
                />
                <TouchableOpacity 
                    style={styles.secondaryFooterButton}
                    onPress={() => {
                        showModal({
                            type: 'info',
                            title: 'Draft Saved',
                            description: 'Your progress has been preserved in the local weave.'
                        });
                    }}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.primary, fontFamily: fonts.display }]}>Save as Draft</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ImageBackground 
            source={require('../../../assets/images/paper_texture.png')}
            style={[styles.bgContainer, { backgroundColor: colors.background }]}
            imageStyle={{ opacity: 0.3 }}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.topNav}>
                        <TouchableOpacity onPress={handleBack} style={[styles.navIconButton, { backgroundColor: colors.background }]}>
                            <Ionicons name="arrow-back" size={24} color={colors.primary} />
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <Text style={[styles.logoText, { color: colors.primary, fontFamily: fonts.display }]}>MIND/SET</Text>
                        </View>
                        <TouchableOpacity style={[styles.navIconButton, { opacity: 0 }]}>
                            <Ionicons name="settings-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {step === 'CATEGORY' && (
                            <>
                                {renderHeader(1, "Select Category", "What do you want to work on? Each path offers specialized coaching insights.")}
                                <BentoCategoryGrid 
                                    categories={CATEGORIES}
                                    selectedId={formData.category}
                                    onSelect={(id) => {
                                        setValue('category', id);
                                        // Auto-advance with a slight delay for visual feedback
                                        setTimeout(() => setStep('DEFINITION'), 300);
                                    }}
                                />
                                
                                <EditorialCard style={styles.tipCard}>
                                    <View style={styles.tipIconBox}>
                                        <Ionicons name="sparkles" size={24} color={colors.primary} />
                                    </View>
                                    <View style={styles.tipTextContent}>
                                        <Text style={[styles.tipTitle, { color: colors.text, fontFamily: fonts.display }]}>Expert Tip</Text>
                                        <Text style={[styles.tipDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                            Research suggests starting with a <Text style={{ color: colors.primary, fontWeight: '700' }}>Habit</Text> goal if you're looking to build long-term sustainable change.
                                        </Text>
                                    </View>
                                </EditorialCard>
                                {renderFooterActions()}
                            </>
                        )}

                        {step === 'DEFINITION' && (
                            <View style={styles.stepContainer}>
                                {renderHeader(2, "Describe Goal", "Bring your vision to life by detailing what you want to achieve.")}
                                
                                <View style={styles.inputSection}>
                                    <View style={[styles.editorialTextAreaContainer, { backgroundColor: colors.surfaceContainerHighest }]}>
                                        <Controller
                                            control={control}
                                            name="goalDescription"
                                            rules={{ required: true }}
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <TextInput
                                                    style={[styles.editorialTextArea, { color: colors.text, fontFamily: fonts.body }]}
                                                    placeholder="Describe your goal..."
                                                    placeholderTextColor={colors.outlineVariant}
                                                    multiline
                                                    numberOfLines={6}
                                                    value={value}
                                                    onChangeText={onChange}
                                                    onBlur={onBlur}
                                                    textAlignVertical="top"
                                                />
                                            )}
                                        />
                                        <View style={styles.textAreaIcon}>
                                            <Ionicons name="pencil-outline" size={16} color={colors.outlineVariant} />
                                        </View>
                                    </View>

                                    <View style={styles.inspirationSection}>
                                        <Text style={[styles.inspirationLabel, { color: colors.primary, fontFamily: fonts.label }]}>INSPIRATION</Text>
                                        <View style={styles.chipContainer}>
                                            {GOAL_INSPIRATIONS.map((text, idx) => (
                                                <TouchableOpacity 
                                                    key={idx} 
                                                    style={[styles.chip, { backgroundColor: colors.secondaryContainer, borderColor: 'rgba(34, 83, 68, 0.1)' }]}
                                                    onPress={() => setValue('goalDescription', text)}
                                                >
                                                    <Text style={[styles.chipText, { color: colors.primary, fontFamily: fonts.bodyMedium }]}>"{text}"</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.dateCard, { backgroundColor: colors.surfaceContainerLow, borderRadius: 40 }]}>
                                    <View style={styles.dateCardBgIcon}>
                                        <Ionicons name="calendar-outline" size={120} color={colors.primary} style={{ opacity: 0.05 }} />
                                    </View>
                                    <View style={styles.dateCardContent}>
                                        <Text style={[styles.dateCardTitle, { color: colors.text, fontFamily: fonts.display }]}>Target Date</Text>
                                        <Text style={[styles.dateCardSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                            When do you want to cross the finish line? This is optional but helps with focus.
                                        </Text>
                                        
                                        <View style={styles.dateInputWrapper}>
                                            <Controller
                                                control={control}
                                                name="targetDate"
                                                render={({ field: { onChange, value } }) => (
                                                    <>
                                                        <TouchableOpacity 
                                                            style={[styles.dateInput, { backgroundColor: colors.surface, justifyContent: 'center' }]}
                                                            onPress={() => setShowDatePicker(true)}
                                                        >
                                                            <Text style={{ 
                                                                color: value ? colors.text : colors.outlineVariant, 
                                                                fontFamily: fonts.body,
                                                                fontSize: 16 
                                                            }}>
                                                                {value ? format(new Date(value), 'PPP') : 'Pick a target date'}
                                                            </Text>
                                                            <View style={styles.dateIconWrapper}>
                                                                <Ionicons name="calendar" size={20} color={colors.primary} />
                                                            </View>
                                                        </TouchableOpacity>

                                                        {showDatePicker && (
                                                            <DateTimePicker
                                                                value={value ? new Date(value) : new Date()}
                                                                mode="date"
                                                                display="default"
                                                                onChange={(event, selectedDate) => {
                                                                    if (Platform.OS === 'android') {
                                                                        setShowDatePicker(false);
                                                                    }
                                                                    
                                                                    if (event.type === 'set' && selectedDate) {
                                                                        onChange(selectedDate.toISOString().split('T')[0]);
                                                                    } else if (event.type === 'dismissed') {
                                                                        setShowDatePicker(false);
                                                                    }
                                                                }}
                                                                minimumDate={new Date()}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </View>
                                    </View>
                                </View>
                                {renderFooterActions()}
                            </View>
                        )}

                        {step === 'COMMITMENT' && (
                            <View style={styles.stepContainer}>
                                {renderHeader(3, "The Commitment", "Sustainable change happens at the intersection of ambition and reality.")}
                                
                                <View style={styles.inputSection}>
                                    <View style={styles.groupHeader}>
                                        <View style={[styles.groupLine, { backgroundColor: colors.primary }]} />
                                        <Text style={[styles.sectionLabel, { color: colors.text, fontFamily: fonts.label }]}>JOURNEY LENGTH</Text>
                                    </View>
                                    <View style={styles.selectionGrid}>
                                        {DURATIONS.map(dur => (
                                            <TouchableOpacity 
                                                key={dur.id}
                                                style={[
                                                    styles.selectionItem, 
                                                    { 
                                                        backgroundColor: formData.timeframe === dur.id ? colors.primary : colors.surfaceContainerLow,
                                                        borderColor: formData.timeframe === dur.id ? colors.primary : 'rgba(0,0,0,0.05)',
                                                    },
                                                    formData.timeframe === dur.id && shadows.ambient
                                                ]}
                                                onPress={() => setValue('timeframe', dur.id)}
                                            >
                                                <Text style={[styles.selectionTitle, { color: formData.timeframe === dur.id ? colors.background : colors.text, fontFamily: fonts.display }]}>{dur.title}</Text>
                                                <Text style={[styles.selectionSub, { color: formData.timeframe === dur.id ? 'rgba(255,255,255,0.7)' : colors.textMuted, fontFamily: fonts.body }]}>{dur.subtitle}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={[styles.groupHeader, { marginTop: 16 }]}>
                                        <View style={[styles.groupLine, { backgroundColor: colors.secondary }]} />
                                        <Text style={[styles.sectionLabel, { color: colors.text, fontFamily: fonts.label }]}>DAILY TIME INVESTMENT</Text>
                                    </View>
                                    <View style={styles.selectionGrid}>
                                        {COMMITMENTS.map(comm => (
                                            <TouchableOpacity 
                                                key={comm.id}
                                                style={[
                                                    styles.selectionItem, 
                                                    { 
                                                        backgroundColor: formData.dailyMinutes === comm.id ? colors.secondary : colors.surfaceContainerLow,
                                                        borderColor: formData.dailyMinutes === comm.id ? colors.secondary : 'rgba(0,0,0,0.05)',
                                                    },
                                                    formData.dailyMinutes === comm.id && shadows.ambient
                                                ]}
                                                onPress={() => setValue('dailyMinutes', comm.id)}
                                            >
                                                <Text style={[styles.selectionTitle, { color: formData.dailyMinutes === comm.id ? colors.background : colors.text, fontFamily: fonts.display }]}>{comm.title}</Text>
                                                <Text style={[styles.selectionSub, { color: formData.dailyMinutes === comm.id ? 'rgba(255,255,255,0.7)' : colors.textMuted, fontFamily: fonts.body }]}>{comm.type}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                
                                <View style={styles.coachQuoteBox}>
                                    <View style={[styles.quoteLine, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.quoteText, { color: colors.text, fontFamily: fonts.display }]}>
                                        "Commitment is the bridge between intention and accomplishment."
                                    </Text>
                                </View>
                                {renderFooterActions()}
                            </View>
                        )}

                        {step === 'REVIEW' && (
                            <View style={styles.stepContainer}>
                                {renderHeader(4, "Check Your Plan", "Take a quick look at your journey before we get started.")}
                                
                                <View style={styles.reviewContent}>
                                        {/* Summary Card */}
                                        <View style={[styles.reviewSummaryCard, shadows.ambient]}>
                                            {/* TODO: Replace with specialized category-specific high-fidelity images in the future */}
                                            <ImageBackground
                                                source={CATEGORIES.find(c => c.id === formData.category)?.bgImage}
                                                style={styles.reviewSummaryBg}
                                                imageStyle={{ borderRadius: 32 }}
                                            >
                                                <View style={styles.reviewSummaryOverlay}>
                                                    <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                                        <Text style={[styles.categoryBadgeText, { color: '#fff', fontFamily: fonts.label }]}>
                                                            {previewData?.category?.toUpperCase() || formData.category.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.reviewSummaryTitle, { color: '#fff', fontFamily: fonts.display }]}>
                                                        {previewData?.title || formData.goalDescription.substring(0, 40) + '...'}
                                                    </Text>
                                                </View>
                                            </ImageBackground>
                                        </View>
                                        
                                        {previewData?.weeklyIntensity && (
                                            <View style={[styles.intensityCard, { backgroundColor: colors.surfaceContainerLow, borderRadius: 24, padding: 20, marginBottom: 20 }]}>
                                                <Text style={[styles.gridLabel, { color: colors.textMuted, fontFamily: fonts.label, marginBottom: 12 }]}>YOUR PACE</Text>
                                                <BarChart
                                                    data={previewData.weeklyIntensity.map((val: number, i: number) => ({
                                                        value: val,
                                                        label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]
                                                    }))}
                                                    height={80}
                                                    barWidth={30}
                                                    noOfSections={3}
                                                    barBorderRadius={4}
                                                    frontColor={colors.primary}
                                                    yAxisThickness={0}
                                                    xAxisThickness={0}
                                                    hideRules
                                                    hideYAxisText
                                                    xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '900' }}
                                                />
                                            </View>
                                        )}

                                        {/* Coach Insight - Glassmorphism style */}
                                        <View style={[styles.insightPanel, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(34, 83, 68, 0.05)', borderColor: colors.primary + '20' }]}>
                                            <View style={[styles.insightIconBox, { backgroundColor: colors.primary }]}>
                                                <Ionicons name="sparkles" size={20} color="#fff" />
                                            </View>
                                            <Text style={[styles.insightText, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
                                                {previewData?.coachInsight || "This journey is balanced for steady growth. We've optimized the intensity to match your 30-day rhythm."}
                                            </Text>
                                        </View>

                                        {/* Details Grid */}
                                        <View style={styles.reviewGrid}>
                                            <View style={[styles.reviewGridItem, { backgroundColor: colors.surfaceContainerLow }]}>
                                                <Text style={[styles.gridLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>DURATION</Text>
                                                <Text style={[styles.gridValue, { color: colors.text, fontFamily: fonts.display }]}>{formData.timeframe} Days</Text>
                                            </View>
                                            <View style={[styles.reviewGridItem, { backgroundColor: colors.surfaceContainerLow }]}>
                                                <Text style={[styles.gridLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>INVESTMENT</Text>
                                                <Text style={[styles.gridValue, { color: colors.text, fontFamily: fonts.display }]}>{formData.dailyMinutes} Min</Text>
                                            </View>
                                            <View style={[styles.reviewGridItem, { backgroundColor: colors.surfaceContainerLow }]}>
                                                <Text style={[styles.gridLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>HIGHEST EFFORT</Text>
                                                <Text style={[styles.gridValue, { color: colors.text, fontFamily: fonts.display }]}>
                                                    {previewData ? Math.max(...previewData.weeklyIntensity) + '%' : 'Balanced'}
                                                </Text>
                                            </View>
                                            <View style={[styles.reviewGridItem, { backgroundColor: colors.surfaceContainerLow }]}>
                                                <Text style={[styles.gridLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>PRIMARY FOCUS</Text>
                                                <Text style={[styles.gridValue, { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14 }]} numberOfLines={2}>
                                                    {previewData?.primaryGoal || 'Growth & Mastery'}
                                                </Text>
                                            </View>
                                    </View>
                                </View>
                                
                                {renderFooterActions()}
                            </View>
                        )}
                    </ScrollView>

                    {step !== 'CATEGORY' && (
                        <View style={{ height: 20 }} />
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bgContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16,
    },
    navIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    logoText: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    stepText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    stepPercent: {
        fontSize: 24,
        fontWeight: '900',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        marginBottom: 32,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        lineHeight: 28,
    },
    tipCard: {
        flexDirection: 'row',
        marginTop: 32,
        padding: 24,
        borderRadius: 32,
        backgroundColor: '#f4f4ef',
    },
    tipIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    tipTextContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    tipDesc: {
        fontSize: 14,
        lineHeight: 22,
    },
    definitionCard: {
        paddingVertical: 40,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    textArea: {
        fontSize: 18,
        lineHeight: 28,
        height: 120,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 24,
    },
    fieldInput: {
        fontSize: 18,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    groupLine: {
        width: 4,
        height: 18,
        borderRadius: 2,
    },
    selectionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    selectionItem: {
        width: '48%',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    selectionSub: {
        fontSize: 13,
    },
    reviewCard: {
        padding: 32,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    reviewRow: {
        gap: 8,
    },
    reviewLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    reviewValue: {
        fontSize: 18,
        lineHeight: 26,
    },
    coachQuoteBox: {
        flexDirection: 'row',
        marginTop: 24,
        paddingHorizontal: 8,
    },
    quoteLine: {
        width: 4,
        borderRadius: 2,
        marginRight: 20,
    },
    quoteText: {
        flex: 1,
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 32,
        fontStyle: 'italic',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    footerButtons: {
        gap: 16,
        alignItems: 'center',
        paddingVertical: 32,
    },
    primaryFooterButton: {
        width: '100%',
    },
    secondaryFooterButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    stepContainer: {
        gap: 40,
    },
    inputSection: {
        gap: 32,
    },
    editorialTextAreaContainer: {
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
    },
    editorialTextArea: {
        fontSize: 20,
        lineHeight: 28,
        flex: 1,
    },
    textAreaIcon: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    inspirationSection: {
        gap: 12,
    },
    inspirationLabel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
        paddingHorizontal: 4,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    chipText: {
        fontSize: 14,
    },
    dateCard: {
        padding: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    dateCardBgIcon: {
        position: 'absolute',
        top: -20,
        right: -20,
    },
    dateCardContent: {
        gap: 16,
    },
    dateCardTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    dateCardSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        maxWidth: '90%',
    },
    dateInputWrapper: {
        marginTop: 8,
        maxWidth: 240,
    },
    dateInput: {
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 16,
    },
    dateIconWrapper: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    // New Review Styles
    loadingPreviewContainer: {
        height: 400,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    reviewContent: {
        gap: 24,
    },
    reviewSummaryCard: {
        height: 240,
        borderRadius: 32,
        overflow: 'hidden',
    },
    reviewSummaryBg: {
        flex: 1,
    },
    reviewSummaryOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 32,
        justifyContent: 'flex-end',
        gap: 12,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    categoryBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    reviewSummaryTitle: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '900',
    },
    insightPanel: {
        flexDirection: 'row',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        alignItems: 'center',
        gap: 20,
    },
    insightIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    reviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    reviewGridItem: {
        width: '48%',
        padding: 20,
        borderRadius: 24,
        gap: 8,
    },
    gridLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    gridValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    intensityCard: {
        padding: 24,
        borderRadius: 24,
    }
});
