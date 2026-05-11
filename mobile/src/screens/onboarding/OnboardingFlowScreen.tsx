import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';
import { useForm, Controller } from 'react-hook-form';
import AppIntroSlider from 'react-native-app-intro-slider';
import LottieView from 'lottie-react-native';
import { BarChart } from 'react-native-gifted-charts';
import * as Notifications from 'expo-notifications';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';

interface OnboardingFormData {
    nickname: string;
    growthGoal: string;
    learningStyle: string;
    minutesPerDay: number;
    durationDays: number;
}

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingFlow'>;

const TOTAL_STEPS = 7;
const { width } = Dimensions.get('window');

export default function OnboardingFlowScreen({ navigation }: Props) {
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();
    const { showModal } = useModalStore();
    const [currentStep, setCurrentStep] = useState(1);
    const { updateSettings, isSubmitting } = useAuthStore();
    const { control, handleSubmit, watch, setValue } = useForm<OnboardingFormData>({
        defaultValues: {
            nickname: '',
            growthGoal: 'mindfulness',
            learningStyle: 'mixed',
            minutesPerDay: 30,
            durationDays: 30,
        }
    });

    const formData = watch();
    const timezone = Localization.getCalendars()[0]?.timeZone || 'UTC';

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit(handleComplete)();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async (data: OnboardingFormData) => {
        const settings = {
            ...data,
            nickname: data.nickname || undefined,
            timezone,
            onboardingCompleted: true,
        };

        try {
            await updateSettings(settings);
            
            // Send welcome notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Welcome to Ease, ${data.nickname}!`,
                    body: "Your journey to a better you starts now. Check your roadmap.",
                },
                trigger: null,
            });
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Failed to save settings. Please try again.'
            });
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: // Personal Growth Intro
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.textCenter}>
                            <Text style={[styles.stepTitleLarge, { color: colors.text }]}>Your personal growth system</Text>
                            <Text style={[styles.stepSubtitleLarge, { color: colors.textMuted }]}>
                                Ease into a better you with intelligent guidance and sustainable habit-building.
                            </Text>
                        </View>
                        
                        <View style={[styles.timelineIllustration, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                            <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />
                            
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIconContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                                    <Ionicons name="sunny-outline" size={24} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.timelineText, { color: colors.text }]}>Morning Reflection</Text>
                                    <Text style={[styles.timelineSubtext, { color: colors.textMuted }]}>8:00 AM • Mindset</Text>
                                </View>
                            </View>
                            
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIconContainer, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                    <Ionicons name="book-outline" size={24} color={isDark ? colors.background : "#fff"} />
                                </View>
                                <View>
                                    <Text style={[styles.timelineText, { color: colors.text }]}>Deep Work Session</Text>
                                    <Text style={[styles.timelineSubtext, { color: colors.textMuted }]}>2:00 PM • Focus</Text>
                                </View>
                            </View>
                            
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIconContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                                    <Ionicons name="moon-outline" size={24} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.timelineText, { color: colors.text }]}>Evening Wind-down</Text>
                                    <Text style={[styles.timelineSubtext, { color: colors.textMuted }]}>9:00 PM • Recovery</Text>
                                </View>
                            </View>

                            <View style={styles.illustrationBadge}>
                                <Ionicons name="trending-up" size={80} color={colors.primary} style={{ opacity: 0.05 }} />
                            </View>
                        </View>
                    </View>
                );

            case 2: // Choose Your Growth Goal
                const goals = [
                    { id: 'mindfulness', title: 'Mindfulness', icon: 'leaf-outline', desc: 'Cultivate inner peace and presence.' },
                    { id: 'focus', title: 'Deep Focus', icon: 'target', desc: 'Master your concentration and flow.' },
                    { id: 'energy', title: 'High Energy', icon: 'flash-outline', desc: 'Fuel your body and mind for more.' },
                    { id: 'balance', title: 'Daily Balance', icon: 'infinite-outline', desc: 'Find harmony in your daily routine.' },
                ];
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>What's your primary focus?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Select a focus area to help us tailor your routine.</Text>
                        <View style={styles.grid}>
                            {goals.map(goal => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[
                                        styles.goalCard, 
                                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                                        formData.growthGoal === goal.id && { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }
                                    ]}
                                    onPress={() => setValue('growthGoal', goal.id)}
                                >
                                    <View style={[
                                        styles.goalIconContainer, 
                                        { backgroundColor: colors.surfaceContainerLow },
                                        formData.growthGoal === goal.id && { backgroundColor: colors.primary }
                                    ]}>
                                        <Ionicons 
                                            name={goal.icon as any} 
                                            size={24} 
                                            color={formData.growthGoal === goal.id ? (isDark ? colors.background : "#fff") : colors.primary} 
                                        />
                                    </View>
                                    <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                                    <Text style={[styles.goalDesc, { color: colors.textMuted }]}>{goal.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 3: // Nickname
                return (
                    <View style={styles.stepContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerLow }]}>
                            <Ionicons name="person-outline" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>What should we call you?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Choose a nickname for your journey.</Text>
                        <Controller
                            control={control}
                            name="nickname"
                            rules={{ required: true }}
                            render={({ field: { onChange, onBlur, value } }) => (
                                <StitchInput
                                    label="Nickname"
                                    placeholder="Enter nickname"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    autoFocus
                                />
                            )}
                        />
                    </View>
                );

            case 4: // Learning Style
                const stylesList = [
                    { id: 'video', title: 'Video-first', icon: 'play-outline', desc: 'Learning through visual storytelling' },
                    { id: 'practice', title: 'Practice-first', icon: 'construct-outline', desc: 'Learning through interactive doing' },
                    { id: 'mixed', title: 'Mixed', icon: 'sparkles-outline', desc: 'A balanced approach for everyone' },
                ];
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>How do you prefer to learn?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Select the method that helps you grow best.</Text>
                        <View style={styles.optionsList}>
                            {stylesList.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.optionCard, 
                                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                                        formData.learningStyle === item.id && { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }
                                    ]}
                                    onPress={() => setValue('learningStyle', item.id)}
                                >
                                    <View style={[
                                        styles.optionIconContainer, 
                                        { backgroundColor: colors.surfaceContainerLow },
                                        formData.learningStyle === item.id && { backgroundColor: colors.primary }
                                    ]}>
                                        <Ionicons 
                                            name={item.icon as any} 
                                            size={24} 
                                            color={formData.learningStyle === item.id ? (isDark ? colors.background : "#fff") : colors.primary} 
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                                    </View>
                                    <Ionicons 
                                        name={formData.learningStyle === item.id ? "checkmark-circle" : "ellipse-outline"} 
                                        size={24} 
                                        color={formData.learningStyle === item.id ? colors.primary : colors.outlineVariant} 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 5: // Daily Time Investment
                const timeOptions = [15, 30, 60, 90];
                return (
                    <View style={styles.stepContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceContainerLow }]}>
                            <Ionicons name="time-outline" size={32} color={colors.primary} />
                        </View>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>How much time can you invest daily?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Small progress every day creates powerful results.</Text>
                        <View style={styles.optionsList}>
                            {timeOptions.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.optionCard, 
                                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                                        formData.minutesPerDay === time && { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }
                                    ]}
                                    onPress={() => setValue('minutesPerDay', time)}
                                >
                                    <Text style={[styles.optionTitle, { color: colors.text }, formData.minutesPerDay === time && { color: colors.primary }]}>
                                        {time} minutes
                                    </Text>
                                    <Ionicons 
                                        name={formData.minutesPerDay === time ? "checkmark-circle" : "ellipse-outline"} 
                                        size={24} 
                                        color={formData.minutesPerDay === time ? colors.primary : colors.outlineVariant} 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 6: // Program Duration
                const durations = [
                    { id: 30, label: '30 Days', desc: 'Build the foundation' },
                    { id: 60, label: '60 Days', desc: 'Solidify your habits' },
                    { id: 90, label: '90 Days', desc: 'Complete transformation' },
                ];
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>How long should your program last?</Text>
                        <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>Choose a commitment that fits your lifestyle.</Text>
                        <View style={styles.optionsList}>
                            {durations.map((d) => (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[
                                        styles.optionCard, 
                                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                                        formData.durationDays === d.id && { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }
                                    ]}
                                    onPress={() => setValue('durationDays', d.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionTitle, { color: colors.text }]}>{d.label}</Text>
                                        <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{d.desc}</Text>
                                    </View>
                                    <View style={[styles.radioButton, { borderColor: colors.outlineVariant }, formData.durationDays === d.id && { borderColor: colors.primary }]}>
                                        {formData.durationDays === d.id && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <View style={[styles.durationPreview, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                            <View style={styles.previewHeader}>
                                <View>
                                    <Text style={[styles.previewLabel, { color: colors.primary }]}>CURRENT SELECTION</Text>
                                    <Text style={[styles.previewValue, { color: colors.text }]}>{formData.durationDays} Days</Text>
                                </View>
                                <Text style={[styles.previewStatus, { color: colors.textMuted }]}>
                                    {formData.durationDays === 30 ? 'Foundation' : formData.durationDays === 60 ? 'Consistency' : 'Transformation'}
                                </Text>
                            </View>
                            <View style={[styles.progressBarLarge, { backgroundColor: colors.outlineVariant }]}>
                                <View style={[styles.progressBarFillLarge, { width: `${(formData.durationDays / 90) * 100}%`, backgroundColor: colors.primary }]} />
                            </View>
                        </View>
                    </View>
                );

            case 7: // Plan Preview
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.textCenter}>
                            <View style={styles.lottieContainer}>
                                <LottieView
                                    source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_toum81uz.json' }}
                                    autoPlay
                                    loop
                                    style={styles.lottieCelebration}
                                />
                            </View>
                            <Text style={[styles.stepTitleLarge, { color: colors.text }]}>Ready to evolve?</Text>
                            <Text style={[styles.stepSubtitleLarge, { color: colors.textMuted }]}>
                                We've tailored a path for your growth based on your goals.
                            </Text>
                        </View>

                        <View style={[styles.roadmapCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }, shadows.ambient]}>
                            <View style={styles.roadmapHeader}>
                                <Text style={[styles.roadmapLabel, { color: colors.textMuted }]}>WEEKLY ROADMAP</Text>
                                <View style={[styles.roadmapBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                                    <Text style={[styles.roadmapBadgeText, { color: colors.primary }]}>Week 1 of {Math.ceil(formData.durationDays / 7)}</Text>
                                </View>
                            </View>
                            <View style={styles.chartWrapper}>
                                <BarChart
                                    data={[
                                        { value: 80, label: 'M' },
                                        { value: 40, label: 'T' },
                                        { value: 55, label: 'W' },
                                        { value: 45, label: 'T' },
                                        { value: 70, label: 'F' },
                                        { value: 30, label: 'S' },
                                        { value: 60, label: 'S' },
                                    ]}
                                    height={120}
                                    barWidth={22}
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
                        </View>

                        <View style={styles.scheduleSection}>
                            <Text style={[styles.scheduleTitle, { color: colors.text }]}>Day 1 Preview</Text>
                            {[
                                { title: 'Warm-up exercise', time: '5 mins', icon: 'fitness-outline' },
                                { title: 'Lesson video', time: '10 mins', icon: 'play-circle-outline' },
                                { title: 'Quick quiz', time: '3 mins', icon: 'help-circle-outline' },
                            ].map((task, i) => (
                                <View key={i} style={[styles.taskPreviewItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                                    <View style={[styles.taskIconContainer, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                                        <Ionicons name={task.icon as any} size={20} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                                        <Text style={[styles.taskTime, { color: colors.textMuted }]}>{task.time}</Text>
                                    </View>
                                    <Ionicons name="ellipse-outline" size={20} color={colors.outlineVariant} />
                                </View>
                            ))}
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} disabled={currentStep === 1}>
                    <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? 'transparent' : colors.text} />
                </TouchableOpacity>
                <View style={[styles.progressContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={[styles.progressBar, { width: `${(currentStep / TOTAL_STEPS) * 100}%`, backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.stepText, { color: colors.textMuted }]}>{currentStep}/{TOTAL_STEPS}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderStep()}
            </ScrollView>

            <View style={styles.footer}>
                <StitchButton
                    title={currentStep === TOTAL_STEPS ? "Start My Program" : "Continue"}
                    onPress={handleNext}
                    isLoading={isSubmitting}
                    showArrow={currentStep < TOTAL_STEPS}
                />
                <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
                    {currentStep === 1 ? "Takes less than 2 minutes" : 
                     currentStep === TOTAL_STEPS ? "Join 240,000+ others on this journey" : ""}
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 16,
    },
    progressContainer: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
    },
    stepText: {
        fontSize: 14,
        fontWeight: '900',
    },
    content: {
        padding: 24,
        paddingTop: 40,
    },
    stepContainer: {
        flex: 1,
    },
    textCenter: {
        alignItems: 'center',
        marginBottom: 40,
    },
    stepTitleLarge: {
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 40,
        letterSpacing: -1,
    },
    stepSubtitleLarge: {
        fontSize: 17,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 26,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    stepSubtitle: {
        fontSize: 17,
        lineHeight: 26,
        marginBottom: 32,
    },
    timelineIllustration: {
        borderRadius: 32,
        padding: 32,
        position: 'relative',
        borderWidth: 1,
    },
    timelineLine: {
        position: 'absolute',
        left: 55,
        top: 40,
        bottom: 40,
        width: 2,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
        zIndex: 10,
    },
    timelineIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    timelineText: {
        fontSize: 16,
        fontWeight: '900',
    },
    timelineSubtext: {
        fontSize: 13,
        marginTop: 2,
    },
    illustrationBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    goalCard: {
        width: (width - 48 - 12) / 2,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
    },
    goalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 6,
    },
    goalDesc: {
        fontSize: 12,
        lineHeight: 18,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    optionsList: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
    },
    optionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '900',
    },
    optionDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    durationPreview: {
        marginTop: 40,
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    previewLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    previewValue: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 4,
    },
    previewStatus: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    progressBarLarge: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFillLarge: {
        height: '100%',
        borderRadius: 6,
    },
    celebrationIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    roadmapCard: {
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        marginBottom: 24,
    },
    roadmapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    roadmapLabel: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    roadmapBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    roadmapBadgeText: {
        fontSize: 11,
        fontWeight: '900',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
    },
    chartBarContainer: {
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    chartBar: {
        width: '60%',
        borderRadius: 6,
    },
    chartDay: {
        fontSize: 10,
        fontWeight: '900',
    },
    scheduleSection: {
        marginTop: 8,
    },
    scheduleTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 16,
    },
    taskPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    taskIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginRight: 16,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '900',
    },
    taskTime: {
        fontSize: 13,
        marginTop: 2,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    footerSubtext: {
        textAlign: 'center',
        fontSize: 13,
        marginTop: 16,
        fontWeight: '700',
    },
    lottieContainer: {
        height: 120,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    lottieCelebration: {
        width: 200,
        height: 200,
    },
    chartWrapper: {
        paddingTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
