/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { BarChart } from 'react-native-gifted-charts';
import DateTimePicker from '@react-native-community/datetimepicker';
import BentoCategoryGrid from '../../components/stitch/BentoCategoryGrid';
import EditorialCard from '../../components/stitch/EditorialCard';
import StitchButton from '../../components/StitchButton';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

type Step = 'CATEGORY' | 'DEFINITION' | 'COMMITMENT';

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
    bgImage: require('../../../assets/images/skill_bg.png'),
  },
  {
    id: 'habit',
    title: 'Habit',
    description: 'Build consistency through small daily actions.',
    icon: 'sync-outline',
    color: '#d7e4c7',
    onPrimaryContainer: '#5a664f',
    span: 3,
    bgImage: require('../../../assets/images/time_mindfulness_bg.png'),
  },
  {
    id: 'career',
    title: 'Career',
    description: 'Professional growth and milestones.',
    icon: 'briefcase-outline',
    color: '#6c5891',
    onPrimaryContainer: '#ffffff',
    span: 3,
    bgImage: require('../../../assets/images/career_bg.png'),
  },
  {
    id: 'mental',
    title: 'Mental',
    description: 'Mindfulness, focus, and health.',
    icon: 'leaf-outline',
    color: '#e3e3de',
    onPrimaryContainer: '#1a1c19',
    span: 3,
    bgImage: require('../../../assets/images/mental_bg.png'),
  },
  {
    id: 'fitness',
    title: 'Fitness',
    description: 'Strength and physical vitality.',
    icon: 'fitness-outline',
    color: '#f4f4ef',
    onPrimaryContainer: '#1a1c19',
    span: 3,
    bgImage: require('../../../assets/images/fitness_bg.png'),
  },
];

const DURATIONS = [
  {
    id: 30,
    title: '30 Days',
    subtitle: 'The Sprint',
    description: 'Intensive focus for rapid growth.',
  },
  {
    id: 60,
    title: '60 Days',
    subtitle: 'The Rhythm',
    description: 'Sustainable pace for lasting change.',
  },
  {
    id: 90,
    title: '90 Days',
    subtitle: 'The Transformation',
    description: 'Full architectural rebuild of spirit.',
  },
];

const COMMITMENTS = [
  { id: 15, title: '15 min', type: 'Gentle' },
  { id: 30, title: '30 min', type: 'Standard' },
  { id: 60, title: '60 min', type: 'Deep' },
];

const GOAL_INSPIRATIONS = [
  'Run a half-marathon in October',
  'Read 2 books every month',
  'Learn intermediate pottery skills',
  'Daily 10-minute meditation',
];

export default function GoalWizardScreen({ navigation }: Props) {
  const { colors, isDark, fonts, shadows } = useTheme();
  const [step, setStep] = useState<Step>('CATEGORY');
  const scrollViewRef = React.useRef<any>(null);

  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      category: '',
      goalDescription: '',
      targetDate: '',
      timeframe: 60,
      dailyMinutes: 30,
    },
  });

  const formData = watch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stores
  const { createGoal } = useGoalsStore();
  const { isAuthenticated } = useAuthStore();
  const { generateProgram } = useProgramsStore();
  const { showModal } = useModalStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draftIds, setDraftIds] = useState<{
    goalId: string;
    programId: string;
  } | null>(null);

  const animateStepChange = (newStep: Step) => {
    const steps: Step[] = ['CATEGORY', 'DEFINITION', 'COMMITMENT'];
    const newIndex = steps.indexOf(newStep);
    if (newIndex >= 0) {
      setStep(newStep);
      scrollViewRef.current?.scrollTo({ x: newIndex * width, animated: true });
    }
  };

  const handleNext = async () => {
    if (step === 'CATEGORY') {
      if (!formData.category) {
        showModal({
          type: 'info',
          title: 'Selection Required',
          description: 'Choose your journey foundation.',
        });
        return;
      }
      animateStepChange('DEFINITION');
    } else if (step === 'DEFINITION') {
      if (!formData.goalDescription.trim()) {
        showModal({
          type: 'info',
          title: 'Define Your Path',
          description: 'Tell us a bit about your goal.',
        });
        return;
      }

      // EARLY TRIGGER: Start AI orchestration in background
      const { initiateDraft: triggerInitiateDraft } =
        useProgramsStore.getState();
      triggerInitiateDraft(formData.goalDescription, formData.category)
        .then((ids) => {
          setDraftIds(ids);
          console.log('[WIZARD] Background orchestration initiated:', ids);
        })
        .catch((err) => {
          console.warn('[WIZARD] Early initiation failed:', err);
        });

      animateStepChange('COMMITMENT');
    } else if (step === 'COMMITMENT') {
      handleSubmit(handleFinalSubmit)();
    }
  };

  const handleBack = () => {
    if (step === 'DEFINITION') animateStepChange('CATEGORY');
    else if (step === 'COMMITMENT') animateStepChange('DEFINITION');
    else navigation.goBack();
  };

  const handleFinalSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const title =
        data.goalDescription.split('.')[0].substring(0, 50) +
        (data.goalDescription.length > 50 ? '...' : '');

      // Use the draft goal if it exists, otherwise create one now
      const goalId =
        draftIds?.goalId ||
        (
          await createGoal({
            title,
            description: data.goalDescription,
            category: data.category,
            targetDate:
              data.targetDate ||
              format(addDays(new Date(), data.timeframe), 'yyyy-MM-dd'),
          })
        ).id;

      // Optimistically set a 'generating' program in the store so the home
      // screen immediately shows the task-chain skeleton, then fire the real
      // generation call in the background — no blocking the user here.
      const { useProgramsStore: store } = await import('../../store/programsStore');
      store.setState({
        currentProgram: {
          id: draftIds?.programId || 'pending',
          status: 'generating',
          title,
          description: data.goalDescription,
          duration: data.timeframe,
          goalId,
          dayPlans: [],
          metadata: {},
          mastery_score: 0,
          competence_level: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        todayPlan: null,
      });

      // Reset the nav stack entirely so the wizard isn't in back history
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });

      // Fire and forget — the polling on HomeScreen picks up the result
      generateProgram(goalId, data.timeframe, {
        minutesPerDay: data.dailyMinutes,
        learningStyle: 'mixed',
        constraints: [],
      }).catch((err) => {
        console.error('[Wizard] Background generation failed:', err);
      });
    } catch (error) {
      console.error('Wizard Error:', error);
      showModal({
        type: 'error',
        title: 'Something went wrong',
        description:
          "We couldn't start your journey just now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHeader = (stepNum: number, title: string, subtitle: string) => (
    <View style={styles.header}>
      <View style={styles.stepIndicator}>
        <View style={styles.stepIndicatorTextRow}>
          <Text
            style={[
              styles.stepText,
              { color: colors.primary, fontFamily: fonts.label },
            ]}
          >
            PHASE {stepNum}
          </Text>
          <Text
            style={[
              styles.stepCount,
              { color: colors.textMuted, fontFamily: fonts.label },
            ]}
          >
            OF 3
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <LinearGradient
            colors={
              colors.gradients.primary as unknown as readonly [
                string,
                string,
                ...string[],
              ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(stepNum / 3) * 100}%` }]}
          />
        </View>
      </View>
      <Text
        style={[
          styles.title,
          { color: colors.text, fontFamily: fonts.display },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: colors.textMuted, fontFamily: fonts.body },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );

  const renderFooterActions = () => {
    if (step === 'CATEGORY') return null;

    return (
      <View style={styles.footerButtons}>
        <StitchButton
          title={
            step === 'DEFINITION'
              ? 'Continue to Details'
              : step === 'COMMITMENT'
                ? 'Manifest My Path'
                : 'Continue'
          }
          onPress={handleNext}
          isLoading={step === 'COMMITMENT' ? isSubmitting : false}
          showArrow={step !== 'COMMITMENT'}
          style={styles.primaryFooterButton}
        />
        <TouchableOpacity
          style={styles.secondaryFooterButton}
          onPress={() => {
            showModal({
              type: 'info',
              title: 'Draft Saved',
              description:
                'Your progress has been preserved in the local weave.',
            });
          }}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: colors.primary, fontFamily: fonts.display },
            ]}
          >
            Save as Draft
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={
        formData.category
          ? CATEGORIES.find((c) => c.id === formData.category)?.bgImage
          : require('../../../assets/images/wizard_bg.png')
      }
      style={[styles.bgContainer, { backgroundColor: colors.background }]}
      imageStyle={{ opacity: 0.3 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topNav}>
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.navIconButton,
                { backgroundColor: colors.background },
              ]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text
                style={[
                  styles.logoText,
                  { color: colors.primary, fontFamily: fonts.display },
                ]}
              >
                MIND/SET
              </Text>
              <View
                style={[
                  styles.logoUnderline,
                  { backgroundColor: colors.primary + '30' },
                ]}
              />
            </View>
            <TouchableOpacity style={[styles.navIconButton, { opacity: 0 }]}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={styles.scrollView}
          >
            <ScrollView
              style={{ width }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderHeader(
                1,
                'Select Category',
                'What do you want to work on? Each path offers specialized coaching insights.',
              )}
              <BentoCategoryGrid
                categories={CATEGORIES}
                selectedId={formData.category}
                onSelect={(id) => {
                  setValue('category', id);
                  // Auto-advance with a slight delay for visual feedback
                  setTimeout(() => animateStepChange('DEFINITION'), 300);
                }}
              />

              <EditorialCard style={styles.tipCard}>
                <View style={styles.tipIconBox}>
                  <Ionicons name="sparkles" size={24} color={colors.primary} />
                </View>
                <View style={styles.tipTextContent}>
                  <Text
                    style={[
                      styles.tipTitle,
                      { color: colors.text, fontFamily: fonts.display },
                    ]}
                  >
                    Expert Tip
                  </Text>
                  <Text
                    style={[
                      styles.tipDesc,
                      { color: colors.textMuted, fontFamily: fonts.body },
                    ]}
                  >
                    Research suggests starting with a{' '}
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>
                      Habit
                    </Text>{' '}
                    goal if you're looking to build long-term sustainable
                    change.
                  </Text>
                </View>
              </EditorialCard>
              {renderFooterActions()}
            </ScrollView>

            <ScrollView
              style={{ width }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.stepContainer}>
                {renderHeader(
                  2,
                  'Bring it to Life',
                  'In your own words, describe the destination you are aiming for.',
                )}

                <View style={styles.inputSection}>
                  <View
                    style={[
                      styles.contrastGuide,
                      {
                        backgroundColor: colors.surfaceContainerLow + '80',
                        marginBottom: 12,
                      },
                    ]}
                  >
                    <View style={styles.contrastHeader}>
                      <Ionicons
                        name="compass-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.contrastTitle,
                          { color: colors.text, fontFamily: fonts.display },
                        ]}
                      >
                        Manifestation Guide
                      </Text>
                    </View>

                    <View style={styles.contrastPairs}>
                      <View style={styles.contrastItem}>
                        <View
                          style={[
                            styles.contrastBadge,
                            { backgroundColor: colors.error + '10' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.contrastBadgeText,
                              { color: colors.error, fontFamily: fonts.label },
                            ]}
                          >
                            VAGUE
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.contrastText,
                            {
                              color: colors.textMuted,
                              fontFamily: fonts.body,
                              fontStyle: 'italic',
                            },
                          ]}
                        >
                          "Consistency"
                        </Text>
                      </View>

                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={colors.outlineVariant}
                        style={{ marginTop: 24 }}
                      />

                      <View style={styles.contrastItem}>
                        <View
                          style={[
                            styles.contrastBadge,
                            { backgroundColor: colors.success + '10' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.contrastBadgeText,
                              {
                                color: colors.success,
                                fontFamily: fonts.label,
                              },
                            ]}
                          >
                            POWERFUL
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.contrastText,
                            {
                              color: colors.text,
                              fontFamily: fonts.bodyMedium,
                            },
                          ]}
                        >
                          "I want to build a daily habit of consistency in my
                          work life."
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.sacredNotepad,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.notepadAccent,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    />
                    <Controller
                      control={control}
                      name="goalDescription"
                      rules={{ required: true }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                          <TextInput
                            style={[
                              styles.sacredInput,
                              {
                                color: colors.text,
                                fontFamily: fonts.body,
                                fontSize: 18,
                              },
                            ]}
                            placeholder="What does mastery look like to you?"
                            placeholderTextColor={colors.textMuted + '80'}
                            multiline
                            numberOfLines={8}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            textAlignVertical="top"
                            selectionColor={colors.primary}
                          />
                          <View style={styles.notepadFooter}>
                            <View style={styles.clarityIndicator}>
                              {(() => {
                                const words = value
                                  .trim()
                                  .toLowerCase()
                                  .split(/\s+/)
                                  .filter((w) => w.length > 0);
                                const charCount = value.length;
                                const wordCount = words.length;

                                // Core Intent & Action Patterns
                                const subjects = [
                                  'i',
                                  'my',
                                  'goal',
                                  'want',
                                  'need',
                                  'desire',
                                ];
                                const actions = [
                                  'learn',
                                  'build',
                                  'master',
                                  'achieve',
                                  'grow',
                                  'become',
                                  'practice',
                                  'improve',
                                  'create',
                                  'run',
                                  'read',
                                  'cook',
                                  'code',
                                  'develop',
                                  'start',
                                  'finish',
                                ];

                                const hasSubject = words.some((w) =>
                                  subjects.includes(w),
                                );
                                const hasAction = words.some((w) =>
                                  actions.includes(w),
                                );

                                let label = '';
                                let color = colors.primary;

                                if (charCount === 0) {
                                  label = '';
                                } else if (
                                  charCount < 20 ||
                                  wordCount < 4 ||
                                  (!hasSubject && !hasAction)
                                ) {
                                  // High-bar for entry: requires a subject or a clear action verb
                                  label = 'BLURRY';
                                  color = colors.error;
                                } else if (!hasSubject || !hasAction) {
                                  // Incomplete but getting there: has one but lacks full context
                                  label = 'GETTING CLEARER';
                                  color = colors.primary;
                                } else if (charCount < 50 || wordCount < 10) {
                                  label = 'GETTING CLEARER';
                                  color = colors.primary;
                                } else {
                                  label = 'VIVID VISION';
                                  color = colors.secondary;
                                }

                                return (
                                  <>
                                    <View
                                      style={[
                                        styles.clarityDot,
                                        {
                                          backgroundColor: label
                                            ? color
                                            : 'transparent',
                                        },
                                      ]}
                                    />
                                    <Text
                                      style={[
                                        styles.clarityText,
                                        {
                                          color: label
                                            ? color
                                            : colors.textMuted,
                                          fontFamily: fonts.label,
                                        },
                                      ]}
                                    >
                                      {label}
                                    </Text>
                                  </>
                                );
                              })()}
                            </View>
                            <Text
                              style={[
                                styles.charCount,
                                {
                                  color: colors.textMuted + '60',
                                  fontFamily: fonts.mono,
                                },
                              ]}
                            >
                              {value.length} chars
                            </Text>
                          </View>
                        </View>
                      )}
                    />
                  </View>

                  <View style={styles.inspirationSection}>
                    <View style={styles.inspirationHeader}>
                      <Ionicons
                        name="flash-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.inspirationLabel,
                          { color: colors.primary, fontFamily: fonts.label },
                        ]}
                      >
                        SPARKS OF INTENT
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.chipScroll}
                    >
                      {GOAL_INSPIRATIONS.map((text, idx) => (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          style={[
                            styles.floatingChip,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.outlineVariant,
                            },
                          ]}
                          onPress={() => setValue('goalDescription', text)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: colors.text,
                                fontFamily: fonts.bodyMedium,
                              },
                            ]}
                          >
                            {text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      borderRadius: 40,
                    },
                  ]}
                >
                  <View style={styles.dateCardBgIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={120}
                      color={colors.primary}
                      style={{ opacity: 0.05 }}
                    />
                  </View>
                  <View style={styles.dateCardContent}>
                    <Text
                      style={[
                        styles.dateCardTitle,
                        { color: colors.text, fontFamily: fonts.display },
                      ]}
                    >
                      Target Date
                    </Text>
                    <Text
                      style={[
                        styles.dateCardSubtitle,
                        { color: colors.textMuted, fontFamily: fonts.body },
                      ]}
                    >
                      When do you want to cross the finish line? This is
                      optional but helps with focus.
                    </Text>

                    <View style={styles.dateInputWrapper}>
                      <Controller
                        control={control}
                        name="targetDate"
                        render={({ field: { onChange, value } }) => (
                          <>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              style={[
                                styles.dateInput,
                                {
                                  backgroundColor: colors.surface,
                                  justifyContent: 'center',
                                  borderWidth: 2,
                                  borderColor: value
                                    ? colors.secondary + '40'
                                    : colors.primary + '60',
                                  elevation: 4,
                                  shadowColor: colors.primary,
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.1,
                                  shadowRadius: 8,
                                },
                              ]}
                              onPress={() => setShowDatePicker(true)}
                            >
                              <Text
                                style={{
                                  color: value ? colors.text : colors.primary,
                                  fontFamily: fonts.display,
                                  fontSize: 16,
                                  fontWeight: '700',
                                }}
                              >
                                {value
                                  ? format(new Date(value), 'PPP')
                                  : 'Pick a target date'}
                              </Text>
                              <View style={styles.dateIconWrapper}>
                                <Ionicons
                                  name="calendar"
                                  size={20}
                                  color={colors.primary}
                                />
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
                                    onChange(
                                      selectedDate.toISOString().split('T')[0],
                                    );
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
            </ScrollView>

            <ScrollView
              style={{ width }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.stepContainer}>
                {renderHeader(
                  3,
                  'The Commitment',
                  'Sustainable change happens at the intersection of ambition and reality.',
                )}

                <View style={styles.inputSection}>
                  <View style={styles.groupHeader}>
                    <View
                      style={[
                        styles.groupLine,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.text, fontFamily: fonts.label },
                      ]}
                    >
                      JOURNEY LENGTH
                    </Text>
                  </View>
                  <View style={styles.selectionGrid}>
                    {DURATIONS.map((dur) => (
                      <TouchableOpacity
                        key={dur.id}
                        activeOpacity={0.9}
                        style={[
                          styles.selectionItem,
                          {
                            backgroundColor:
                              formData.timeframe === dur.id
                                ? 'transparent'
                                : colors.surfaceContainerLow,
                            borderColor:
                              formData.timeframe === dur.id
                                ? 'transparent'
                                : colors.outlineVariant,
                          },
                        ]}
                        onPress={() => setValue('timeframe', dur.id)}
                      >
                        {formData.timeframe === dur.id && (
                          <LinearGradient
                            colors={
                              colors.gradients.primary as unknown as readonly [
                                string,
                                string,
                                ...string[],
                              ]
                            }
                            style={[
                              StyleSheet.absoluteFill,
                              { borderRadius: 24 },
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          />
                        )}
                        <Text
                          style={[
                            styles.selectionTitle,
                            {
                              color:
                                formData.timeframe === dur.id
                                  ? '#fff'
                                  : colors.text,
                              fontFamily: fonts.display,
                            },
                          ]}
                        >
                          {dur.title}
                        </Text>
                        <Text
                          style={[
                            styles.selectionSub,
                            {
                              color:
                                formData.timeframe === dur.id
                                  ? 'rgba(255,255,255,0.8)'
                                  : colors.textMuted,
                              fontFamily: fonts.body,
                            },
                          ]}
                        >
                          {dur.subtitle}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.groupHeader, { marginTop: 24 }]}>
                    <View
                      style={[
                        styles.groupLine,
                        { backgroundColor: colors.secondary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.text, fontFamily: fonts.label },
                      ]}
                    >
                      DAILY TIME INVESTMENT
                    </Text>
                  </View>
                  <View style={styles.selectionGrid}>
                    {COMMITMENTS.map((comm) => (
                      <TouchableOpacity
                        key={comm.id}
                        activeOpacity={0.9}
                        style={[
                          styles.selectionItem,
                          {
                            backgroundColor:
                              formData.dailyMinutes === comm.id
                                ? colors.secondary
                                : colors.surfaceContainerLow,
                            borderColor:
                              formData.dailyMinutes === comm.id
                                ? colors.secondary
                                : colors.outlineVariant,
                          },
                        ]}
                        onPress={() => setValue('dailyMinutes', comm.id)}
                      >
                        <Text
                          style={[
                            styles.selectionTitle,
                            {
                              color:
                                formData.dailyMinutes === comm.id
                                  ? '#fff'
                                  : colors.text,
                              fontFamily: fonts.display,
                            },
                          ]}
                        >
                          {comm.title}
                        </Text>
                        <Text
                          style={[
                            styles.selectionSub,
                            {
                              color:
                                formData.dailyMinutes === comm.id
                                  ? 'rgba(255,255,255,0.8)'
                                  : colors.textMuted,
                              fontFamily: fonts.body,
                            },
                          ]}
                        >
                          {comm.type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.coachQuoteBox}>
                  <View
                    style={[
                      styles.quoteLine,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.quoteText,
                      { color: colors.text, fontFamily: fonts.display },
                    ]}
                  >
                    "Commitment is the bridge between intention and
                    accomplishment."
                  </Text>
                </View>
                {renderFooterActions()}
              </View>
            </ScrollView>

          </ScrollView>

          {step !== 'CATEGORY' && <View style={{ height: 20 }} />}
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
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  logoUnderline: {
    width: 24,
    height: 2,
    borderRadius: 1,
    marginTop: 4,
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
  selectionSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepIndicatorTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCount: {
    fontSize: 10,
    letterSpacing: 1,
  },
  sacredNotepad: {
    borderRadius: 32,
    borderWidth: 1.5,
    padding: 24,
    paddingTop: 40,
    overflow: 'hidden',
    minHeight: 280,
  },
  notepadAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
  },
  sacredInput: {
    lineHeight: 28,
    minHeight: 180,
  },
  notepadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  clarityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clarityText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '900',
  },
  charCount: {
    fontSize: 10,
  },
  inspirationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  floatingChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chipText: {
    fontSize: 14,
  },
  chipScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  inspirationSection: {
    marginTop: 24,
  },
  inspirationLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 24,
  },
  stepContainer: {
    gap: 40,
  },
  inputSection: {
    gap: 32,
  },
  contrastGuide: {
    marginTop: 12,
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  contrastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  contrastTitle: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  contrastPairs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  contrastItem: {
    flex: 1,
    gap: 12,
  },
  contrastBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  contrastBadgeText: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '900',
  },
  contrastText: {
    fontSize: 13,
    lineHeight: 18,
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
  selectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
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
  reviewContent: {
    gap: 24,
  },
  reviewSummaryCard: {
    height: 240,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 24,
  },
  reviewSummaryBg: {
    flex: 1,
  },
  reviewSummaryOverlay: {
    flex: 1,
    padding: 32,
    justifyContent: 'flex-end',
  },
  reviewSummaryTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  intensityCard: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 20,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  insightPanel: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 32,
    marginBottom: 24,
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  insightIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightHeaderLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
  },
  reviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewGridItem: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  footerButtons: {
    marginTop: 32,
    gap: 16,
  },
  primaryFooterButton: {
    width: '100%',
  },
  secondaryFooterButton: {
    alignItems: 'center',
    padding: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: '700',
  },
});
