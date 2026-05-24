import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Localization from 'expo-localization';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';
import { useForm, Controller } from 'react-hook-form';
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

const TOTAL_STEPS = 4;
const { width } = Dimensions.get('window');

export default function OnboardingFlowScreen() {
  const { colors, isDark, fonts } = useTheme();
  const { showModal } = useModalStore();
  const [currentStep, setCurrentStep] = useState(1);

  // Animation for breathing exercise
  const [breathAnim] = useState(new Animated.Value(1));

  const { updateSettings, isSubmitting } = useAuthStore();
  const { control, handleSubmit, watch, setValue } =
    useForm<OnboardingFormData>({
      defaultValues: {
        nickname: '',
        growthGoal: 'mindfulness',
        learningStyle: 'mixed',
        minutesPerDay: 30,
        durationDays: 30,
      },
    });

  const formData = watch();
  const timezone = Localization.getCalendars()[0]?.timeZone || 'UTC';

  const handleNext = () => {
    if (currentStep === 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.5,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      void handleSubmit(handleComplete)();
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

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Welcome to Ease, ${data.nickname}!`,
          body: 'Your journey to a better you starts now. Check your roadmap.',
        },
        trigger: null,
      });
    } catch {
      showModal({
        type: 'error',
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Personal Growth Intro
        return (
          <View style={styles.stepContainer}>
            <View style={styles.textCenter}>
              <Text
                style={[
                  styles.stepTitleLarge,
                  { color: colors.text, fontFamily: fonts.display },
                ]}
              >
                Your personal growth system
              </Text>
              <Text
                style={[
                  styles.stepSubtitleLarge,
                  { color: colors.textMuted, fontFamily: fonts.body },
                ]}
              >
                Ease into a better you with intelligent guidance and sustainable
                habit-building.
              </Text>
            </View>

            <View style={styles.illustrationContainer}>
              <View
                style={[
                  styles.glowCircle,
                  { backgroundColor: colors.primary + '15' },
                ]}
              />
              {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */}
              <Image
                source={require('../../../assets/images/3d/onboarding_3d_illustration_1778517402291.png')}
                style={styles.onboardingImage}
                resizeMode="contain"
              />
            </View>

            <View
              style={[
                styles.glassCard,
                {
                  backgroundColor: isDark
                    ? colors.glass.dark
                    : colors.glass.light,
                  borderColor: colors.glass.border,
                },
              ]}
            >
              <Ionicons name="sparkles" size={24} color={colors.primary} />
              <Text
                style={[
                  styles.glassText,
                  { color: colors.text, fontFamily: fonts.bodyMedium },
                ]}
              >
                Join over 240k users building lasting habits with AI-powered
                rituals.
              </Text>
            </View>
          </View>
        );

      case 2: {
        // Choose Your Growth Goal
        const goals = [
          {
            id: 'mindfulness',
            title: 'Mindfulness',
            icon: 'leaf-outline',
            desc: 'Cultivate inner peace and presence.',
          },
          {
            id: 'focus',
            title: 'Deep Focus',
            icon: 'target',
            desc: 'Master your concentration and flow.',
          },
          {
            id: 'energy',
            title: 'High Energy',
            icon: 'flash-outline',
            desc: 'Fuel your body and mind for more.',
          },
          {
            id: 'balance',
            title: 'Daily Balance',
            icon: 'infinite-outline',
            desc: 'Find harmony in your daily routine.',
          },
        ];
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What's your primary focus?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
              Select a focus area to help us tailor your routine.
            </Text>
            <View style={styles.grid}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.outlineVariant,
                    },
                    formData.growthGoal === goal.id && {
                      borderColor: colors.primary,
                      backgroundColor: colors.surfaceContainerLow,
                    },
                  ]}
                  onPress={() => setValue('growthGoal', goal.id)}
                >
                  <LinearGradient
                    colors={
                      isDark
                        ? [colors.background, colors.surface]
                        : [
                            colors.primary + '10',
                            colors.secondary + '05',
                            colors.background,
                          ]
                    }
                    style={StyleSheet.absoluteFill}
                  />
                  <View
                    style={[
                      styles.goalIconContainer,
                      { backgroundColor: colors.surfaceContainerLow },
                      formData.growthGoal === goal.id && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                    <Ionicons
                      name={goal.icon as any}
                      size={24}
                      color={
                        formData.growthGoal === goal.id
                          ? isDark
                            ? colors.background
                            : '#fff'
                          : colors.primary
                      }
                    />
                  </View>
                  <Text style={[styles.goalTitle, { color: colors.text }]}>
                    {goal.title}
                  </Text>
                  <Text style={[styles.goalDesc, { color: colors.textMuted }]}>
                    {goal.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      case 3: // Nickname
        return (
          <View style={styles.stepContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What should we call you?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
              Choose a nickname for your journey.
            </Text>
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

      case 4: // First Win: Breathing Exercise
        return (
          <View style={styles.stepContainer}>
            <View style={styles.textCenter}>
              <Text style={[styles.stepTitleLarge, { color: colors.text }]}>
                Let's begin, {formData.nickname || 'friend'}
              </Text>
              <Text
                style={[styles.stepSubtitleLarge, { color: colors.textMuted }]}
              >
                Before we start your journey, take one deep breath.
              </Text>
            </View>

            <View style={[styles.illustrationContainer, { height: 400 }]}>
              <Animated.View
                style={[
                  styles.glowCircle,
                  {
                    backgroundColor: colors.primary + '30',
                    transform: [{ scale: breathAnim }],
                  },
                ]}
              />
              <View
                style={[
                  styles.innerCircle,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.breatheText, { color: colors.background }]}>
                Breathe
              </Text>
            </View>

            <View
              style={[
                styles.glassCard,
                {
                  backgroundColor: isDark
                    ? colors.glass.dark
                    : colors.glass.light,
                  borderColor: colors.glass.border,
                },
              ]}
            >
              <Ionicons name="leaf" size={24} color={colors.primary} />
              <Text
                style={[
                  styles.glassText,
                  { color: colors.text, fontFamily: fonts.bodyMedium },
                ]}
              >
                This is your first win. You're already making progress.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} disabled={currentStep === 1}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={currentStep === 1 ? 'transparent' : colors.text}
          />
        </TouchableOpacity>
        <View
          style={[
            styles.progressContainer,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${(currentStep / TOTAL_STEPS) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
        <Text style={[styles.stepText, { color: colors.textMuted }]}>
          {currentStep}/{TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <StitchButton
          title={currentStep === TOTAL_STEPS ? 'Start My Program' : 'Continue'}
          onPress={handleNext}
          isLoading={isSubmitting}
          showArrow={currentStep < TOTAL_STEPS}
        />
        <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
          {currentStep === 1
            ? 'Takes less than 2 minutes'
            : currentStep === TOTAL_STEPS
              ? 'Join 240,000+ others on this journey'
              : ''}
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
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    height: 300,
  },
  onboardingImage: {
    width: 340,
    height: 340,
    zIndex: 10,
  },
  glowCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    zIndex: 1,
  },
  glassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    gap: 16,
  },
  glassText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  innerCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    zIndex: 2,
  },
  breatheText: {
    position: 'absolute',
    zIndex: 3,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
