import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  ScrollView,
  Dimensions,
  Image,
  Easing,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MainStackParamList,
  Task,
  TaskStatus,
  WeeklyAnalytics,
} from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useFocusEffect } from '@react-navigation/native';

import Logo from '../../components/Logo';
import TaskCard from '../../components/stitch/TaskCard';
import StitchModal from '../../components/stitch/StitchModal';
import HomeEmptyState from '../../components/stitch/HomeEmptyState';
import AudioWidget from '../../components/home/AudioWidget';
import { TutorialTour } from '../../components/onboarding/TutorialTour';

type Props = NativeStackScreenProps<MainStackParamList> & {
  navigation: any;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const { colors, borderRadius, fonts, isDark } = useTheme();

  const { user, updateSettings } = useAuthStore();
  const { todayPlan, currentProgram, isLoading } = useProgramsStore();

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);

  const { analytics, fetchAnalytics } = useAnalyticsStore();

  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (currentProgram?.status === 'generating') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [currentProgram?.status]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Trigger tutorial if not completed
  React.useEffect(() => {
    if (user && !user.settings?.tutorialCompleted) {
      const timer = setTimeout(() => {
        setIsTutorialVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleTutorialComplete = async () => {
    setIsTutorialVisible(false);
    try {
      await updateSettings({ tutorialCompleted: true });
    } catch (e) {
      console.error('Failed to update tutorial setting', e);
    }
  };

  // Fetch Analytics Data on Focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAnalytics();
    }, []),
  );

  // Initial Data Fetch for Tasks
  React.useEffect(() => {
    const loadData = async () => {
      if (currentProgram) {
        await useProgramsStore.getState().fetchTodayPlan(currentProgram.id);
      } else {
        await useProgramsStore.getState().fetchActiveProgram();
      }
    };

    loadData();
  }, []);

  // Status Polling for "Generating" state
  React.useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (currentProgram?.status === 'generating' || todayPlan?.status === 'pending' || todayPlan?.status === 'generating') {
      console.log(
        '[HomeScreen] Program or Plan is generating, starting status poll...',
      );
      pollInterval = setInterval(async () => {
        const updatedProgram = await useProgramsStore
          .getState()
          .fetchActiveProgram(true);
        if (updatedProgram) {
          await useProgramsStore.getState().fetchTodayPlan(updatedProgram.id);
          const state = useProgramsStore.getState();
          if (state.currentProgram?.status !== 'generating' && state.todayPlan?.status !== 'pending' && state.todayPlan?.status !== 'generating') {
            console.log(
              '[HomeScreen] Program and Plan are now ready, stopping poll.',
            );
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentProgram?.status, todayPlan?.status]);

  const handleTaskPress = (task: Task) => {
    // If task is completed and has a next task, navigate to the next task to maintain "Circuit Flow"
    if (task.status === TaskStatus.COMPLETED && task.next_task_id) {
      const nextTask = todayPlan?.tasks?.find(
        (t) => t.id === task.next_task_id,
      );
      if (nextTask && nextTask.status !== TaskStatus.LOCKED) {
        navigation.navigate('Task', { task: nextTask });
        return;
      }
    }

    // Standard navigation
    navigation.navigate('Task', { task });
  };

  const handleBeginStory = () => {
    navigation.navigate('GoalWizard');
  };

  if (isLoading && !currentProgram && !todayPlan) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <View style={styles.topNav}>
            <View style={styles.navButton} />
            <Logo size={32} />
            <View
              style={[
                styles.profileButton,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            />
          </View>
          <View
            style={[
              styles.skeletonText,
              {
                width: '60%',
                height: 32,
                marginBottom: 12,
                backgroundColor: colors.surfaceContainerHigh,
                borderRadius: 8,
              },
            ]}
          />
          <View
            style={[
              styles.skeletonText,
              {
                width: '40%',
                height: 20,
                marginBottom: 24,
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: 4,
              },
            ]}
          />
          <View
            style={[
              styles.skeletonBanner,
              {
                height: 160,
                backgroundColor: colors.surfaceContainerLow,
                borderRadius: 24,
                marginBottom: 24,
              },
            ]}
          />
          <View style={styles.statsSection}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 120,
                    height: 140,
                    backgroundColor: colors.surfaceContainerLow,
                    borderRadius: 20,
                    marginRight: 12,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProgram && !todayPlan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
          <View style={styles.topNavWrapper}>
            <View style={styles.topNav}>
              <View style={styles.navButton} />
              <Logo size={32} />
              <TouchableOpacity
                style={[
                  styles.profileButton,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
          <HomeEmptyState onStartPress={handleBeginStory} />
        </SafeAreaView>
      </View>
    );
  }

  const sortedTasks =
    todayPlan?.tasks && currentProgram?.status !== 'generating' && todayPlan?.status !== 'pending' && todayPlan?.status !== 'generating'
      ? [...todayPlan.tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
      : ([] as Task[]);

  const pendingTasks = sortedTasks.filter(
    (t) => t.status !== TaskStatus.COMPLETED,
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.navButton} />
        <Logo size={32} />
        <TouchableOpacity
          style={[
            styles.profileButton,
            {
              backgroundColor: colors.surfaceContainerLow,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* BENTO BOX GRID LAYOUT */}
      <View style={styles.bentoContainer}>
        {/* Top Row: Today's Focus (Large) */}
        <TouchableOpacity
          style={[
            styles.bentoBox,
            styles.bentoFocus,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            pendingTasks.length > 0 && handleTaskPress(pendingTasks[0])
          }
          activeOpacity={0.8}
        >
          <Text style={[styles.bentoLabel, { color: colors.white }]}>
            TODAY'S FOCUS
          </Text>
          <Text
            style={[
              styles.bentoTitle,
              { color: colors.white, fontFamily: fonts.display },
            ]}
          >
            {pendingTasks.length > 0 ? pendingTasks[0].title : 'Rest & Recover'}
          </Text>
          <View style={styles.bentoBottomRow}>
            <Text
              style={[
                styles.bentoSubtitle,
                { color: colors.white, opacity: 0.8 },
              ]}
            >
              {pendingTasks.length > 0
                ? `${pendingTasks.length} tasks remaining`
                : 'All clear'}
            </Text>
            <Ionicons
              name="arrow-forward-circle"
              size={28}
              color={colors.white}
            />
          </View>
        </TouchableOpacity>

        {/* Middle Row: Split 50/50 */}
        <View style={styles.bentoRow}>
          {/* Current Streak */}
          <TouchableOpacity
            style={[
              styles.bentoBox,
              styles.bentoHalf,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
            onPress={() => navigation.navigate('Progress')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flame"
              size={32}
              color={colors.secondary || '#d4c5b3'}
            />
            <Text
              style={[
                styles.bentoTitle,
                { color: colors.text, marginTop: 12, fontSize: 24 },
              ]}
            >
              {analytics?.streak?.current || 0}
            </Text>
            <Text
              style={[
                styles.bentoLabel,
                { color: colors.textMuted, marginTop: 4 },
              ]}
            >
              DAY STREAK
            </Text>
          </TouchableOpacity>

          {/* Coach Quick Message */}
          <TouchableOpacity
            style={[
              styles.bentoBox,
              styles.bentoHalf,
              { backgroundColor: colors.primaryContainer || '#d3e8d5' },
            ]}
            onPress={() => navigation.navigate('Coach')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles" size={32} color={colors.primary} />
            <Text
              style={[
                styles.bentoTitle,
                {
                  color: colors.primary,
                  marginTop: 12,
                  fontSize: 16,
                  fontFamily: fonts.display,
                },
              ]}
              numberOfLines={2}
            >
              Ready to talk?
            </Text>
            <Text
              style={[
                styles.bentoLabel,
                { color: colors.primary, marginTop: 4, opacity: 0.7 },
              ]}
            >
              YOUR COACH
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <AudioWidget />

      {/* Section Header */}
      <View
        style={[styles.sectionHeader, { marginTop: 24, marginHorizontal: 20 }]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontFamily: fonts.display },
          ]}
        >
          Your Tasks
        </Text>
      </View>
    </View>
  );

  const renderEmptyOrLoading = () => {
    if (currentProgram?.status === 'generating' || todayPlan?.status === 'pending' || todayPlan?.status === 'generating') {
      return (
        <View
          style={[
            styles.generatingContainer,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderRadius: borderRadius.lg || 24,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons
              name="sparkles-outline"
              size={48}
              color={colors.primary}
            />
          </Animated.View>
          <Text
            style={[
              styles.generatingTitle,
              { color: colors.text, fontFamily: fonts.display },
            ]}
          >
            Whispering to the stars...
          </Text>
          <Text
            style={[
              styles.generatingSubtitle,
              { color: colors.textMuted, fontFamily: fonts.body },
            ]}
          >
            We are tailoring your personalized task chain to fit your goal.
          </Text>
          <View
            style={[
              styles.notificationBox,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.notificationText,
                { color: colors.text, fontFamily: fonts.label },
              ]}
            >
              We'll send you a notification when your journey is ready.
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <>
          <FlatList
            data={sortedTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TaskCard
                task={item}
                index={index}
                onPress={handleTaskPress}
                isLast={index === sortedTasks.length - 1}
              />
            )}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyOrLoading}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <StitchModal
            visible={isSuccessModalVisible}
            onClose={() => setIsSuccessModalVisible(false)}
            title="Milestone Reached!"
            description="You've completed 10 consecutive days of mindful movement. Your focus is improving."
            primaryAction={{
              label: 'Keep it up',
              onPress: () => setIsSuccessModalVisible(false),
            }}
          />

          <TutorialTour
            visible={isTutorialVisible}
            onComplete={handleTutorialComplete}
          />
        </>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 90,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  topNavWrapper: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editorialHeroContainer: {
    marginBottom: 24,
  },
  editorialHeroCard: {
    borderRadius: 32,
    minHeight: 380,
    overflow: 'visible',
  },
  heroWatermarkText: {
    position: 'absolute',
    bottom: -40,
    left: -10,
    fontSize: 160,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: -10,
  },
  heroParticle: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  editorialContent: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 2,
    paddingHorizontal: 32,
    paddingTop: 32,
    overflow: 'visible',
  },
  editorialTextSide: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 30,
    zIndex: 10,
  },
  editorialGreeting: {
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 60, // Increased to prevent clipping
    letterSpacing: -3,
    marginBottom: 8,
    textTransform: 'uppercase',
    marginRight: -120,
  },
  editorialSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  heroBottomTextContainer: {
    marginTop: 'auto',
    paddingHorizontal: 32,
    paddingBottom: 32,
    zIndex: 10,
    overflow: 'visible',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroPrimaryBtn: {
    backgroundColor: '#E2FF54',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  heroPrimaryBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  heroSecondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  heroSecondaryBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  editorialImageSide: {
    position: 'absolute',
    right: -40,
    top: '5%',
    bottom: '5%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  heroImagePortal: {
    width: 220,
    height: 220,
    borderRadius: 110, // Perfect circle
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroImageFull: {
    width: '100%',
    height: '100%',
  },
  heroPortalRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    right: -40,
    top: 40,
  },
  statsSection: {
    marginHorizontal: -20, // Negative margin to allow full-width scroll
    marginBottom: 24,
  },
  statsScroll: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skeletonText: {
    opacity: 0.6,
  },
  skeletonBanner: {
    opacity: 0.6,
  },
  generatingContainer: {
    marginHorizontal: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  notificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  notificationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  bentoContainer: {
    marginBottom: 24,
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoBox: {
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  bentoFocus: {
    height: 160,
  },
  bentoHalf: {
    flex: 1,
    height: 160,
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  bentoTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  bentoSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  bentoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
});
