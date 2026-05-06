import React, { useEffect, useState, useRef } from 'react';
import {
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    RefreshControl, 
    Dimensions, 
    Image, 
    TouchableOpacity, 
    StatusBar,
    Animated,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAnalyticsStore } from '../../store/analyticsStore';
import LoadingState from '../../components/LoadingState';


const { width } = Dimensions.get('window');

const PulseCircle = ({ delay = 0, gradientColors }: { delay?: number, gradientColors: any }) => {
    const scale = useRef(new Animated.Value(0.6)).current;
    const opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 3.2,
                        duration: 6000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 6000,
                        useNativeDriver: true,
                    }),
                ])
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.treePulse,
                {
                    transform: [{ scale }],
                    opacity,
                },
            ]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pulseGradient}
            />
        </Animated.View>
    );
};

export default function ProgressScreen({ navigation }: any) {
    const { colors, spacing, borderRadius, isDark, shadows, fonts } = useTheme();
    const { analytics, isLoading, fetchAnalytics } = useAnalyticsStore();
    const [refreshing, setRefreshing] = useState(false);
    
    // Pulse animation logic removed in favor of LottieView
    
    useFocusEffect(
        React.useCallback(() => {
            fetchAnalytics();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
    };

    if (isLoading && !analytics) {
        return (
            <LoadingState 
                title="Sensing your spirit" 
                subtitle="Calculating the growth of your spirit tree..."
                variant="full"
            />
        );
    }

    const { progression } = analytics || {};

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            <View style={styles.topNav}>
                <View style={styles.headerButton} />
                <Text style={[styles.navTitle, { color: colors.text }]}>EVOLVE</Text>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Main Evolution Display */}
                <View style={styles.treeSection}>
                    <LottieView
                        source={{ uri: 'https://assets5.lottiefiles.com/packages/lf20_96bovdur.json' }}
                        autoPlay
                        loop
                        style={styles.glowLottie}
                    />
                    
                    <View style={styles.treePulseContainer}>
                        <PulseCircle delay={0} gradientColors={[colors.therapeutic.sage, colors.therapeutic.sky]} />
                        <PulseCircle delay={2000} gradientColors={[colors.therapeutic.peach, colors.therapeutic.apricot]} />
                        <PulseCircle delay={4000} gradientColors={[colors.therapeutic.lavender, colors.therapeutic.cream]} />
                    </View>

                    <View style={[styles.artworkContainer, { borderColor: isDark ? colors.outline : colors.outlineVariant }, shadows.ambient]}>
                        <Image
                            source={{ uri: progression?.currentPhase.imageUrl }}
                            style={styles.artwork}
                            loadingIndicatorSource={require('../../../assets/icon.png')} // Fallback
                        />
                    </View>
                    
                    <View style={styles.treeMeta}>
                        <Text style={[styles.treeName, { color: colors.text }]}>{progression?.currentPhase.title}</Text>
                        <Text style={[styles.treeSubtitle, { color: colors.textMuted }]}>{progression?.currentPhase.subtitle}</Text>
                        
                        <View style={styles.levelRow}>
                            <View style={[styles.levelBadge, { backgroundColor: '#fff' }]}>
                                <Text style={[styles.levelText, { color: colors.primary }]}>LEVEL {progression?.level}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.levelProgressContainer}>
                            <View style={[styles.levelProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                                <View style={[styles.progressFill, { width: `${progression?.progressPercentage || 0}%`, backgroundColor: colors.primary }]} />
                            </View>
                            <Text style={[styles.levelXpText, { color: colors.text, fontFamily: fonts.body }]}>
                                {progression?.currentLevelXp} <Text style={[styles.xpMax, { color: colors.textMuted }]}>/ {progression?.nextLevelXp} XP</Text>
                            </Text>
                        </View>

                        <View style={[styles.levelInsightCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                            <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.levelInsightTitle, { color: colors.primary }]}>LEVEL {progression?.level} INSIGHT</Text>
                            <Text style={[styles.levelInsightText, { color: colors.text }]}>
                                {progression?.levelEntailment}
                            </Text>
                        </View>
                    </View>
                </View>



                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                        <Ionicons name="flame" size={24} color="#FF6B6B" />
                        <View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{analytics?.currentStreak}</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Day Streak</Text>
                        </View>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                        <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                        <View>
                            <Text style={[styles.statValue, { color: colors.text }]}>{analytics?.completionRate}%</Text>
                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completion</Text>
                        </View>
                    </View>
                </View>

                {/* De-emphasized Milestone Info */}
                <View style={[styles.milestoneMiniCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: colors.outlineVariant }]}>
                    <View style={styles.milestoneHeader}>
                        <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                        <Text style={[styles.milestoneLabel, { color: colors.textMuted }]}>
                            NEXT MILESTONE: <Text style={{ color: colors.text }}>{progression?.journey.find(p => !p.unlocked)?.title || 'Max Sovereignty'}</Text>
                        </Text>
                    </View>
                    <Text style={[styles.milestoneLevelText, { color: colors.primary }]}>
                        At Level {progression?.journey.find(p => !p.unlocked)?.unlockedAtLevel || (progression?.level || 0) + 1}
                    </Text>
                </View>

                {/* Evolution Roadmap */}
                <View style={styles.journeySection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Evolution Roadmap</Text>

                    {progression?.journey.map((phase, index) => (
                        <View key={phase.id} style={styles.stageItem}>
                            <View style={styles.stageTimeline}>
                                <View style={[
                                    styles.stageIconBox, 
                                    { 
                                        backgroundColor: phase.active ? colors.primary : phase.unlocked ? colors.primaryContainer : colors.surfaceContainerHigh,
                                        borderColor: phase.active ? colors.primary : colors.outlineVariant,
                                        borderWidth: phase.active ? 0 : 1
                                    }
                                ]}>
                                    <Ionicons 
                                        name={phase.unlocked ? "checkmark" : "lock-closed"} 
                                        size={18} 
                                        color={phase.active ? (isDark ? colors.background : '#fff') : phase.unlocked ? colors.primary : colors.textMuted} 
                                    />
                                </View>
                                {index < (progression?.journey.length - 1) && (
                                    <View style={[styles.stageLine, { backgroundColor: phase.unlocked ? colors.primary : colors.outlineVariant, opacity: phase.unlocked ? 0.3 : 1 }]} />
                                )}
                            </View>
                            <View style={styles.stageContent}>
                                <View style={styles.activeLabelRow}>
                                    <Text style={[
                                        styles.stageTitle, 
                                        { color: phase.active ? colors.primary : phase.unlocked ? colors.text : colors.textMuted }
                                    ]}>
                                        {phase.title}
                                    </Text>
                                    {phase.active && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
                                </View>
                                <Text style={[styles.stageDesc, { color: colors.textMuted }]}>
                                    {phase.levelRange} {phase.unlocked ? '— Achieved' : '— Locked'}
                                </Text>
                                <Text style={[styles.stageSubtitle, { color: colors.textMuted, opacity: 0.7 }]}>
                                    {phase.subtitle}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
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
        paddingBottom: 16,
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
    treeSection: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    glowLottie: {
        position: 'absolute',
        width: 300,
        height: 300,
        top: -10,
    },
    artworkContainer: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 4,
        zIndex: 2,
        backgroundColor: '#fff',
    },
    treePulseContainer: {
        position: 'absolute',
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        top: 16, // Matches paddingVertical of treeSection
    },
    treePulse: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    pulseGradient: {
        flex: 1,
        borderRadius: 120,
    },
    artwork: {
        width: '100%',
        height: '100%',
        borderRadius: 116,
    },
    treeMeta: {
        marginTop: 20,
        alignItems: 'center',
    },
    treeName: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    treeSubtitle: {
        fontSize: 14,
        marginTop: 4,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
    },
    levelBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressCard: {
        marginHorizontal: 20,
        marginTop: 32,
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    progressLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    evolutionTarget: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 4,
    },
    xpText: {
        fontSize: 14,
        fontWeight: '900',
    },
    xpMax: {
        fontWeight: '500',
        fontSize: 12,
    },
    progressTrack: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    xpMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
    },
    xpRemaining: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        gap: 12,
    },
    statBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    journeySection: {
        paddingHorizontal: 24,
        marginTop: 32,
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
        fontSize: 17,
        fontWeight: '800',
    },
    stageDesc: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
    stageSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 4,
        lineHeight: 18,
    },
    activeLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    levelInsightCard: {
        marginTop: 24,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        width: width - 80,
        alignItems: 'center',
    },
    levelInsightTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 6,
    },
    levelInsightText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
    levelProgressContainer: {
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    levelProgressTrack: {
        width: 140,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    levelXpText: {
        fontSize: 12,
        fontWeight: '700',
    },
    milestoneMiniCard: {
        padding: 12,
        borderRadius: 24,
        borderWidth: 1,
        marginHorizontal: 24,
        marginTop: 8,
        marginBottom: 24,
        alignItems: 'center',
        gap: 4,
    },
    milestoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    milestoneLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    milestoneLevelText: {
        fontSize: 14,
        fontWeight: '700',
    },
    pulseCard: {
        marginHorizontal: 20,
        marginTop: 16,
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        alignItems: 'center',
    },
    pulseTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    pulseSubtitle: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        opacity: 0.6,
    },
    pulseMeta: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 20,
    },
    pulseStat: {
        alignItems: 'center',
    },
    pulseStatLabel: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
    },
    pulseStatValue: {
        fontSize: 14,
        fontWeight: '900',
        marginTop: 4,
    },
});
