import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Localization from 'expo-localization';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../constants/theme';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingFlow'>;

const TOTAL_STEPS = 7;
const { width } = Dimensions.get('window');

export default function OnboardingFlowScreen({ navigation }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const { updateSettings, isLoading } = useAuthStore();

    // Step Data
    const [nickname, setNickname] = useState('');
    const [growthGoal, setGrowthGoal] = useState('mindfulness');
    const [learningStyle, setLearningStyle] = useState('mixed');
    const [minutesPerDay, setMinutesPerDay] = useState(30);
    const [durationDays, setDurationDays] = useState(30);
    const [timezone] = useState(Localization.getCalendars()[0]?.timeZone || 'UTC');

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        const settings = {
            nickname: nickname || undefined,
            timezone,
            growthGoal,
            learningStyle,
            minutesPerDay,
            durationDays,
            onboardingCompleted: true,
        };

        try {
            await updateSettings(settings);
            // AuthStack will automatically redirect to MainStack when onboardingCompleted is true
        } catch (error) {
            Alert.alert('Error', 'Failed to save settings. Please try again.');
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: // Personal Growth Intro
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.textCenter}>
                            <Text style={styles.stepTitleLarge}>Your personal growth system</Text>
                            <Text style={styles.stepSubtitleLarge}>
                                Ease into a better you with intelligent guidance and sustainable habit-building.
                            </Text>
                        </View>
                        
                        <View style={styles.timelineIllustration}>
                            <View style={styles.timelineLine} />
                            
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineIconContainer}>
                                    <Ionicons name="sunny-outline" size={24} color={Theme.colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.timelineText}>Morning Reflection</Text>
                                    <Text style={styles.timelineSubtext}>8:00 AM • Mindset</Text>
                                </View>
                            </View>
                            
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIconContainer, styles.timelineIconActive]}>
                                    <Ionicons name="book-outline" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.timelineText}>Deep Work Session</Text>
                                    <Text style={styles.timelineSubtext}>2:00 PM • Focus</Text>
                                </View>
                            </View>
                            
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineIconContainer}>
                                    <Ionicons name="moon-outline" size={24} color={Theme.colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.timelineText}>Evening Wind-down</Text>
                                    <Text style={styles.timelineSubtext}>9:00 PM • Recovery</Text>
                                </View>
                            </View>

                            <View style={styles.illustrationBadge}>
                                <Ionicons name="trending-up" size={80} color="rgba(66, 17, 212, 0.05)" />
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
                        <Text style={styles.stepTitle}>What's your primary focus?</Text>
                        <Text style={styles.stepSubtitle}>Select a focus area to help us tailor your routine.</Text>
                        <View style={styles.grid}>
                            {goals.map(goal => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[styles.goalCard, growthGoal === goal.id && styles.activeGoalCard]}
                                    onPress={() => setGrowthGoal(goal.id)}
                                >
                                    <View style={[styles.goalIconContainer, growthGoal === goal.id && styles.activeGoalIconContainer]}>
                                        <Ionicons 
                                            name={goal.icon as any} 
                                            size={24} 
                                            color={growthGoal === goal.id ? '#fff' : Theme.colors.primary} 
                                        />
                                    </View>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalDesc}>{goal.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 3: // Nickname
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person-outline" size={32} color={Theme.colors.primary} />
                        </View>
                        <Text style={styles.stepTitle}>What should we call you?</Text>
                        <Text style={styles.stepSubtitle}>Choose a nickname for your journey.</Text>
                        <StitchInput
                            placeholder="Enter nickname"
                            value={nickname}
                            onChangeText={setNickname}
                            autoFocus
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
                        <Text style={styles.stepTitle}>How do you prefer to learn?</Text>
                        <Text style={styles.stepSubtitle}>Select the method that helps you grow best.</Text>
                        <View style={styles.optionsList}>
                            {stylesList.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.optionCard, learningStyle === item.id && styles.activeOptionCard]}
                                    onPress={() => setLearningStyle(item.id)}
                                >
                                    <View style={[styles.optionIconContainer, learningStyle === item.id && styles.activeOptionIconContainer]}>
                                        <Ionicons 
                                            name={item.icon as any} 
                                            size={24} 
                                            color={learningStyle === item.id ? '#fff' : Theme.colors.primary} 
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.optionTitle}>{item.title}</Text>
                                        <Text style={styles.optionDesc}>{item.desc}</Text>
                                    </View>
                                    <Ionicons 
                                        name={learningStyle === item.id ? "checkmark-circle" : "ellipse-outline"} 
                                        size={24} 
                                        color={learningStyle === item.id ? Theme.colors.primary : '#e2e8f0'} 
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
                        <View style={styles.iconCircle}>
                            <Ionicons name="time-outline" size={32} color={Theme.colors.primary} />
                        </View>
                        <Text style={styles.stepTitle}>How much time can you invest daily?</Text>
                        <Text style={styles.stepSubtitle}>Small progress every day creates powerful results.</Text>
                        <View style={styles.optionsList}>
                            {timeOptions.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[styles.optionCard, minutesPerDay === time && styles.activeOptionCard]}
                                    onPress={() => setMinutesPerDay(time)}
                                >
                                    <Text style={[styles.optionTitle, minutesPerDay === time && { color: Theme.colors.primary }]}>
                                        {time} minutes
                                    </Text>
                                    <Ionicons 
                                        name={minutesPerDay === time ? "checkmark-circle" : "ellipse-outline"} 
                                        size={24} 
                                        color={minutesPerDay === time ? Theme.colors.primary : '#e2e8f0'} 
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
                        <Text style={styles.stepTitle}>How long should your program last?</Text>
                        <Text style={styles.stepSubtitle}>Choose a commitment that fits your lifestyle.</Text>
                        <View style={styles.optionsList}>
                            {durations.map((d) => (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[styles.optionCard, durationDays === d.id && styles.activeOptionCard]}
                                    onPress={() => setDurationDays(d.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.optionTitle}>{d.label}</Text>
                                        <Text style={styles.optionDesc}>{d.desc}</Text>
                                    </View>
                                    <View style={[styles.radioButton, durationDays === d.id && styles.radioButtonActive]}>
                                        {durationDays === d.id && <View style={styles.radioButtonInner} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <View style={styles.durationPreview}>
                            <View style={styles.previewHeader}>
                                <View>
                                    <Text style={styles.previewLabel}>CURRENT SELECTION</Text>
                                    <Text style={styles.previewValue}>{durationDays} Days</Text>
                                </View>
                                <Text style={styles.previewStatus}>
                                    {durationDays === 30 ? 'Foundation' : durationDays === 60 ? 'Consistency' : 'Transformation'}
                                </Text>
                            </View>
                            <View style={styles.progressBarLarge}>
                                <View style={[styles.progressBarFillLarge, { width: `${(durationDays / 90) * 100}%` }]} />
                            </View>
                        </View>
                    </View>
                );

            case 7: // Plan Preview
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.textCenter}>
                            <View style={styles.celebrationIcon}>
                                <Ionicons name="sparkles" size={32} color={Theme.colors.primary} />
                            </View>
                            <Text style={styles.stepTitleLarge}>Ready to evolve?</Text>
                            <Text style={styles.stepSubtitleLarge}>
                                We've tailored a path for your growth based on your goals.
                            </Text>
                        </View>

                        <View style={styles.roadmapCard}>
                            <View style={styles.roadmapHeader}>
                                <Text style={styles.roadmapLabel}>WEEKLY ROADMAP</Text>
                                <Text style={styles.roadmapBadge}>Week 1 of {Math.ceil(durationDays / 7)}</Text>
                            </View>
                            <View style={styles.chartContainer}>
                                {[80, 40, 55, 45, 70, 30, 60].map((h, i) => (
                                    <View key={i} style={styles.chartBarContainer}>
                                        <View style={[styles.chartBar, { height: `${h}%`, opacity: i === 0 ? 1 : 0.4 }]} />
                                        <Text style={styles.chartDay}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.scheduleSection}>
                            <Text style={styles.scheduleTitle}>Day 1 Preview</Text>
                            {[
                                { title: 'Warm-up exercise', time: '5 mins', icon: 'fitness-outline' },
                                { title: 'Lesson video', time: '10 mins', icon: 'play-circle-outline' },
                                { title: 'Quick quiz', time: '3 mins', icon: 'help-circle-outline' },
                            ].map((task, i) => (
                                <View key={i} style={styles.taskPreviewItem}>
                                    <View style={styles.taskIconContainer}>
                                        <Ionicons name={task.icon as any} size={20} color={Theme.colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <Text style={styles.taskTime}>{task.time}</Text>
                                    </View>
                                    <Ionicons name="ellipse-outline" size={20} color="#e2e8f0" />
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} disabled={currentStep === 1}>
                    <Ionicons name="arrow-back" size={24} color={currentStep === 1 ? 'transparent' : Theme.colors.slate[900]} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
                </View>
                <Text style={styles.stepText}>{currentStep}/{TOTAL_STEPS}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderStep()}
            </ScrollView>

            <View style={styles.footer}>
                <StitchButton
                    title={currentStep === TOTAL_STEPS ? "Start My Program" : "Continue"}
                    onPress={handleNext}
                    isLoading={isLoading}
                    showArrow={currentStep < TOTAL_STEPS}
                />
                <Text style={styles.footerSubtext}>
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
        backgroundColor: '#fff',
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
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Theme.colors.primary,
    },
    stepText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
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
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
        lineHeight: 40,
        letterSpacing: -1,
    },
    stepSubtitleLarge: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#64748b',
        lineHeight: 24,
        marginBottom: 32,
    },
    timelineIllustration: {
        backgroundColor: 'rgba(66, 17, 212, 0.05)',
        borderRadius: 24,
        padding: 32,
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.1)',
    },
    timelineLine: {
        position: 'absolute',
        left: 55,
        top: 40,
        bottom: 40,
        width: 2,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
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
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    timelineIconActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
        shadowColor: Theme.colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    timelineText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    timelineSubtext: {
        fontSize: 13,
        color: '#64748b',
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
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 2,
        borderColor: '#f1f5f9',
    },
    activeGoalCard: {
        borderColor: Theme.colors.primary,
        backgroundColor: 'rgba(66, 17, 212, 0.02)',
    },
    goalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(66, 17, 212, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    activeGoalIconContainer: {
        backgroundColor: Theme.colors.primary,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    goalDesc: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 18,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
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
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f1f5f9',
    },
    activeOptionCard: {
        borderColor: Theme.colors.primary,
        backgroundColor: 'rgba(66, 17, 212, 0.02)',
    },
    optionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    activeOptionIconContainer: {
        backgroundColor: Theme.colors.primary,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a',
    },
    optionDesc: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonActive: {
        borderColor: Theme.colors.primary,
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.primary,
    },
    durationPreview: {
        marginTop: 40,
        backgroundColor: 'rgba(66, 17, 212, 0.05)',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.1)',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    previewLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Theme.colors.primary,
        letterSpacing: 1.5,
    },
    previewValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 4,
    },
    previewStatus: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 4,
    },
    progressBarLarge: {
        height: 12,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFillLarge: {
        height: '100%',
        backgroundColor: Theme.colors.primary,
        borderRadius: 6,
    },
    celebrationIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    roadmapCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    roadmapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    roadmapLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    roadmapBadge: {
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        color: Theme.colors.primary,
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
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
        backgroundColor: Theme.colors.primary,
        borderRadius: 4,
    },
    chartDay: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
    },
    scheduleSection: {
        marginTop: 8,
    },
    scheduleTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 16,
    },
    taskPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    taskIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0f172a',
    },
    taskTime: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    footerSubtext: {
        textAlign: 'center',
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 16,
        fontWeight: '500',
    },
});
