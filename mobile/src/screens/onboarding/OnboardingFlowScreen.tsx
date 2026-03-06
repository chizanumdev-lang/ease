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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Localization from 'expo-localization';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../constants/theme';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingFlow'>;

const TOTAL_STEPS = 8;
const { width } = Dimensions.get('window');

export default function OnboardingFlowScreen({ navigation }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const { updateSettings, isLoading } = useAuthStore();

    // Step Data
    const [nickname, setNickname] = useState('');
    const [growthGoal, setGrowthGoal] = useState('');
    const [timezone] = useState(Localization.getCalendars()[0]?.timeZone || 'UTC');
    const [sleepTime, setSleepTime] = useState(new Date(2024, 0, 1, 23, 0));
    const [wakeTime, setWakeTime] = useState(new Date(2024, 0, 1, 7, 0));
    const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
    const [notificationStyle, setNotificationStyle] = useState<'gentle' | 'standard' | 'strict'>('standard');

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
            sleepWindow: {
                start: `${sleepTime.getHours()}:${sleepTime.getMinutes()}`,
                end: `${wakeTime.getHours()}:${wakeTime.getMinutes()}`,
            },
            experienceLevel,
            notificationStyle,
            onboardingCompleted: true,
        };

        try {
            await updateSettings(settings);
        } catch (error) {
            Alert.alert('Error', 'Failed to save settings. Please try again.');
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: // Personal Growth Intro
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>🌱</Text>
                        </View>
                        <Text style={styles.stepTitle}>Your Journey Starts Here</Text>
                        <Text style={styles.stepSubtitle}>
                            We'll help you build the habits that matter most to you, with intelligent guidance every step of the way.
                        </Text>
                    </View>
                );
            case 2: // Choose Your Growth Goal
                const goals = [
                    { id: 'habit', title: 'Build a habit', emoji: '🔄', desc: 'Consistency is key' },
                    { id: 'skill', title: 'Learn a skill', emoji: '🎓', desc: 'Master something new' },
                    { id: 'stress', title: 'Reduce stress', emoji: '🧘', desc: 'Find your inner peace' },
                    { id: 'focus', title: 'Improve focus', emoji: '🎯', desc: 'Deep work efficiency' },
                ];
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>What would you like to work on?</Text>
                        <Text style={styles.stepSubtitle}>Select a focus area to help us tailor your routine.</Text>
                        <View style={styles.grid}>
                            {goals.map(goal => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[styles.goalCard, growthGoal === goal.id && styles.activeGoalCard]}
                                    onPress={() => setGrowthGoal(goal.id)}
                                >
                                    <Text style={styles.goalEmoji}>{goal.emoji}</Text>
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
                        <Text style={styles.stepTitle}>What should we call you?</Text>
                        <Text style={styles.stepSubtitle}>Choose a nickname for your journey.</Text>
                        <StitchInput
                            placeholder="Enter nickname"
                            value={nickname}
                            onChangeText={setNickname}
                        />
                    </View>
                );
            case 4: // Experience Level
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Experience Level</Text>
                        <Text style={styles.stepSubtitle}>How experienced are you with goal setting?</Text>
                        {['beginner', 'intermediate', 'advanced'].map(level => (
                            <TouchableOpacity
                                key={level}
                                style={[styles.optionItem, experienceLevel === level && styles.activeOptionItem]}
                                onPress={() => setExperienceLevel(level as any)}
                            >
                                <Text style={styles.optionText}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            default:
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Step {currentStep}</Text>
                        <Text style={styles.stepSubtitle}>Design coming soon...</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} disabled={currentStep === 1}>
                    <Text style={[styles.backIcon, currentStep === 1 && { opacity: 0 }]}>←</Text>
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
                </View>
                <Text style={styles.stepText}>{currentStep}/{TOTAL_STEPS}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderStep()}
            </ScrollView>

            <View style={styles.footer}>
                <StitchButton
                    title={currentStep === TOTAL_STEPS ? "Complete" : "Continue"}
                    onPress={handleNext}
                    isLoading={isLoading}
                    showArrow={currentStep < TOTAL_STEPS}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.md,
        gap: Theme.spacing.md,
    },
    backIcon: {
        fontSize: 24,
        color: Theme.colors.slate[900],
    },
    progressContainer: {
        flex: 1,
        height: 6,
        backgroundColor: Theme.colors.slate[200],
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
        color: Theme.colors.slate[400],
    },
    content: {
        padding: Theme.spacing.xl,
        paddingTop: Theme.spacing.xxl,
    },
    stepContainer: {
        flex: 1,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Theme.spacing.xl,
    },
    iconEmoji: {
        fontSize: 40,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Theme.colors.text.light,
        marginBottom: Theme.spacing.sm,
    },
    stepSubtitle: {
        fontSize: 16,
        color: Theme.colors.text.muted,
        lineHeight: 24,
        marginBottom: Theme.spacing.xxl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Theme.spacing.md,
    },
    goalCard: {
        width: (width - Theme.spacing.xl * 2 - Theme.spacing.md) / 2,
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        borderWidth: 2,
        borderColor: Theme.colors.transparent,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    activeGoalCard: {
        borderColor: Theme.colors.primary,
        backgroundColor: 'rgba(66, 17, 212, 0.02)',
    },
    goalEmoji: {
        fontSize: 24,
        marginBottom: Theme.spacing.sm,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.colors.text.light,
        marginBottom: 4,
    },
    goalDesc: {
        fontSize: 12,
        color: Theme.colors.text.muted,
    },
    optionItem: {
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        borderWidth: 2,
        borderColor: Theme.colors.transparent,
    },
    activeOptionItem: {
        borderColor: Theme.colors.primary,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: Theme.colors.text.light,
    },
    footer: {
        padding: Theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.slate[200],
    },
});
