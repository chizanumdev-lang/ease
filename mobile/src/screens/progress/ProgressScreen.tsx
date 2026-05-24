import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useProgramsStore } from '../../store/programsStore';
import LoadingState from '../../components/LoadingState';
import { CompletionRings } from '../../components/home/CompletionRings';
import { MasteryCard } from '../../components/home/MasteryCard';

const COMPETENCE_PHASES = [
  {
    level: 'Novice',
    min: 0,
    max: 19,
    subtitle: 'Building the foundation.',
    icon: 'seedling-outline',
  },
  {
    level: 'Apprentice',
    min: 20,
    max: 39,
    subtitle: 'Learning the rhythms.',
    icon: 'leaf-outline',
  },
  {
    level: 'Adept',
    min: 40,
    max: 59,
    subtitle: 'Executing with consistency.',
    icon: 'flame-outline',
  },
  {
    level: 'Expert',
    min: 60,
    max: 79,
    subtitle: 'Mastering the flow state.',
    icon: 'flash-outline',
  },
  {
    level: 'Master',
    min: 80,
    max: 100,
    subtitle: 'Absolute sovereignty.',
    icon: 'diamond-outline',
  },
];

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function ProgressScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  const { colors, isDark, fonts } = useTheme();
  const {
    analytics,
    isLoading: analyticsLoading,
    fetchAnalytics,
  } = useAnalyticsStore();
  const {
    currentProgram,
    todayPlan,
    isLoading: programLoading,
    fetchActiveProgram,
  } = useProgramsStore();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      void fetchAnalytics();
      void fetchActiveProgram(false);
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalytics(), fetchActiveProgram(false)]);
    setRefreshing(false);
  };

  const isLoading = analyticsLoading || programLoading;

  if (isLoading && (!analytics || !currentProgram)) {
    return (
      <LoadingState
        title="Sensing your spirit"
        subtitle="Calculating your competence levels..."
        variant="full"
      />
    );
  }

  if (!currentProgram && !isLoading) {
    return (
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          },
        ]}
      >
        <Ionicons name="compass-outline" size={64} color={colors.primary} />
        <Text
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: colors.text,
            textAlign: 'center',
            marginTop: 24,
            fontFamily: fonts.display,
          }}
        >
          No Active Program
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: 12,
            lineHeight: 24,
            fontFamily: fonts.body,
          }}
        >
          Start a new program to begin your journey to mastery.
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 40,
            padding: 16,
            backgroundColor: colors.primary,
            borderRadius: 16,
            width: '100%',
          }}
          onPress={() => void onRefresh()}
        >
          <Text
            style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}
          >
            Refresh
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const masteryScore = currentProgram?.masteryScore || 0;
  const completionRate = analytics?.completionRate || 0;

  const currentPhaseIndex = COMPETENCE_PHASES.findIndex(
    (p) => masteryScore >= p.min && masteryScore <= p.max,
  );
  const activePhaseIndex = currentPhaseIndex === -1 ? 0 : currentPhaseIndex; // Default to 0 if something goes wrong

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
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

        <View style={styles.topNav}>
          <View style={styles.headerButton} />
          <Text
            style={[
              styles.navTitle,
              { color: colors.text, fontFamily: fonts.display },
            ]}
          >
            MASTERY
          </Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section: Daily Rings */}
          <View style={styles.ringsSection}>
            <Text
              style={[
                styles.ringsTitle,
                { color: colors.text, fontFamily: fonts.display },
              ]}
            >
              Today's Execution
            </Text>
            <Text style={[styles.ringsSubtitle, { color: colors.textMuted }]}>
              Complete your daily rituals to build competence.
            </Text>

            <View style={styles.ringsContainer}>
              <CompletionRings
                morning={todayPlan?.todayRings?.morning || false}
                tasks={todayPlan?.todayRings?.tasks || false}
                night={todayPlan?.todayRings?.night || false}
                size={180}
                strokeWidth={16}
              />
            </View>
          </View>

          {/* Mastery Card Full Width */}
          <View style={styles.masteryWrapper}>
            <MasteryCard program={currentProgram!} />
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                  borderWidth: 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Ionicons
                  name="analytics-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {completionRate}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Completion Rate
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                  borderWidth: 1,
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.secondary + '20' },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {todayPlan?.dayNumber || 0}/{currentProgram?.duration || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  Days Active
                </Text>
              </View>
            </View>
          </View>

          {/* Competence Journey Roadmap */}
          <View style={styles.journeySection}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontFamily: fonts.display },
              ]}
            >
              Competence Roadmap
            </Text>

            {COMPETENCE_PHASES.map((phase, index) => {
              const isAchieved = index < activePhaseIndex;
              const isActive = index === activePhaseIndex;
              const isLocked = index > activePhaseIndex;

              const journeyColors = [
                colors.textMuted, // Novice
                colors.secondary, // Apprentice
                colors.primary, // Adept
                colors.accent, // Expert
                colors.success, // Master
              ];
              const stageColor = journeyColors[index];

              return (
                <View key={phase.level} style={styles.stageItem}>
                  <View style={styles.stageTimeline}>
                    <View
                      style={[
                        styles.stageIconBox,
                        {
                          backgroundColor: isActive
                            ? stageColor
                            : isAchieved
                              ? stageColor + '30'
                              : colors.surfaceContainerHigh,
                          borderColor: isActive
                            ? stageColor
                            : isAchieved
                              ? stageColor
                              : colors.outlineVariant,
                          borderWidth: isActive ? 0 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isAchieved
                            ? 'checkmark'
                            : isActive
                              ? (phase.icon as React.ComponentProps<
                                  typeof Ionicons
                                >['name'])
                              : 'lock-closed'
                        }
                        size={18}
                        color={
                          isActive
                            ? '#fff'
                            : isAchieved
                              ? stageColor
                              : colors.textMuted
                        }
                      />
                    </View>
                    {index < COMPETENCE_PHASES.length - 1 && (
                      <View
                        style={[
                          styles.stageLine,
                          {
                            backgroundColor:
                              isAchieved || isActive
                                ? stageColor
                                : colors.outlineVariant,
                            opacity: isAchieved ? 0.6 : isActive ? 0.3 : 1,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.stageContent}>
                    <View style={styles.activeLabelRow}>
                      <Text
                        style={[
                          styles.stageTitle,
                          {
                            color: isActive
                              ? stageColor
                              : isAchieved
                                ? colors.text
                                : colors.textMuted,
                          },
                        ]}
                      >
                        {phase.level}
                      </Text>
                      {isActive && (
                        <View
                          style={[
                            styles.activeBadge,
                            { backgroundColor: stageColor },
                          ]}
                        >
                          <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stageDesc,
                        {
                          color: isDark ? colors.onSurfaceVariant : colors.text,
                          opacity: isActive ? 0.9 : isAchieved ? 0.7 : 0.4,
                        },
                      ]}
                    >
                      {phase.min} - {phase.max} Score{' '}
                      {isAchieved ? '— Achieved' : isLocked ? '— Locked' : ''}
                    </Text>
                    <Text
                      style={[
                        styles.stageSubtitle,
                        {
                          color: isDark ? colors.onSurfaceVariant : colors.text,
                          opacity: isActive ? 0.7 : isAchieved ? 0.5 : 0.3,
                        },
                      ]}
                    >
                      {phase.subtitle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 90,
  },
  ringsSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  ringsTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  ringsSubtitle: {
    fontSize: 14,
    marginTop: 6,
    opacity: 0.8,
  },
  ringsContainer: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  journeySection: {
    paddingHorizontal: 24,
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 28,
  },
  stageItem: {
    flexDirection: 'row',
    gap: 20,
  },
  stageTimeline: {
    alignItems: 'center',
    width: 40,
  },
  stageIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stageLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  stageContent: {
    flex: 1,
    paddingBottom: 32,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  stageDesc: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  stageSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
    lineHeight: 18,
  },
  activeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
