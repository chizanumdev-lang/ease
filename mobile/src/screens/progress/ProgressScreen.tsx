import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Image,
    TouchableOpacity,
    StatusBar,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analytics.service';
import { WeeklyAnalytics } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProgressScreen({ navigation }: any) {
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();
    const [analytics, setAnalytics] = useState<WeeklyAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const data = await analyticsService.getWeeklyAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('[PROGRESS] Failed to load analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAnalytics();
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            <View style={styles.topNav}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation?.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.text }]}>Tree Evolution</Text>
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
                {/* Main Tree Display */}
                <View style={styles.treeSection}>
                    <View style={[styles.glowEffect, { backgroundColor: colors.primary, opacity: isDark ? 0.15 : 0.05 }]} />
                    <View style={[styles.artworkContainer, { borderColor: colors.outlineVariant }, shadows.ambient]}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1CRy9jYWzHhlYo9T613RCDCh6OP5AfuzesfC5EYBaXcKeyKFMByUhHaMmbb0Q1UdXVGfsCuUtgIppvFbTgd1sMPggqO4mPobxvAo1A9bfJeVAzgiH-NsOszvPDzZYe5lnMCHwJ-z38RI3e89q2pPEP3cTPk42eXmcE6I7HOuvVEOqHZzevoJn-HF5o4LOpnht6zgbzIpGKzea6ub-pl1623f_NiTvxsPyFA5iBbqgdqVIGFZ9ZlkplkQANAlU0XB3b1Ci8O4k-uWD' }}
                            style={styles.artwork}
                        />
                    </View>
                    <View style={styles.treeMeta}>
                        <Text style={[styles.treeName, { color: colors.text }]}>Ancient Guardian</Text>
                        <View style={styles.levelRow}>
                            <View style={[styles.levelBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                                <Text style={[styles.levelText, { color: colors.primary }]}>LEVEL {Math.floor((analytics?.pointsEarned || 0) / 100) || 42}</Text>
                            </View>
                            <Text style={[styles.rankText, { color: colors.textMuted }]}>Master of Growth</Text>
                        </View>
                        <Text style={[styles.streakInfo, { color: colors.textMuted }]}>{analytics?.currentStreak || 0} days of consistent mindfulness</Text>
                    </View>
                </View>

                {/* Progress Card */}
                <View style={[styles.progressCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={[styles.progressLabel, { color: colors.primary }]}>NEXT EVOLUTION</Text>
                            <Text style={[styles.evolutionTarget, { color: colors.text }]}>Eternal Bloom</Text>
                        </View>
                        <Text style={[styles.xpText, { color: colors.primary }]}>
                            {(analytics?.pointsEarned || 0) % 1000} <Text style={[styles.xpMax, { color: colors.textMuted }]}>/ 1000 XP</Text>
                        </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.outlineVariant }]}>
                        <View style={[styles.progressFill, { width: `${((analytics?.pointsEarned || 0) % 1000) / 10}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <View style={styles.xpMeta}>
                        <Ionicons name="sparkles" size={14} color={colors.primary} />
                        <Text style={[styles.xpRemaining, { color: colors.textMuted }]}>{1000 - ((analytics?.pointsEarned || 0) % 1000)} XP remaining to reach transcendence</Text>
                    </View>
                </View>

                {/* Evolution Journey */}
                <View style={styles.journeySection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Evolution Journey</Text>

                    {/* Stage 1 */}
                    <View style={styles.stageItem}>
                        <View style={styles.stageTimeline}>
                            <View style={[styles.stageIconBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                                <Ionicons name="leaf-outline" size={20} color={colors.textMuted} />
                            </View>
                            <View style={[styles.stageLine, { backgroundColor: colors.outlineVariant }]} />
                        </View>
                        <View style={styles.stageContent}>
                            <Text style={[styles.stageTitle, { color: colors.text }]}>The Seedling</Text>
                            <Text style={[styles.stageDesc, { color: colors.textMuted }]}>Day 1: Where intention begins</Text>
                        </View>
                    </View>

                    {/* Stage 2 */}
                    <View style={styles.stageItem}>
                        <View style={styles.stageTimeline}>
                            <View style={[styles.stageIconBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                                <Ionicons name="analytics-outline" size={20} color={colors.textMuted} />
                            </View>
                            <View style={[styles.stageLine, { backgroundColor: colors.outlineVariant }]} />
                        </View>
                        <View style={styles.stageContent}>
                            <Text style={[styles.stageTitle, { color: colors.text }]}>Sprouting Spirit</Text>
                            <Text style={[styles.stageDesc, { color: colors.textMuted }]}>Day 15: Habit foundation locked</Text>
                        </View>
                    </View>

                    {/* Stage 3 */}
                    <View style={styles.stageItem}>
                        <View style={styles.stageTimeline}>
                            <View style={[styles.stageIconBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                                <Ionicons name="bonfire-outline" size={20} color={colors.textMuted} />
                            </View>
                            <View style={[styles.stageLine, { backgroundColor: colors.outlineVariant }]} />
                        </View>
                        <View style={styles.stageContent}>
                            <Text style={[styles.stageTitle, { color: colors.text }]}>Branching Wisdom</Text>
                            <Text style={[styles.stageDesc, { color: colors.textMuted }]}>Day 60: Deep-rooted resilience</Text>
                        </View>
                    </View>

                    {/* Stage 4 (Active) */}
                    <View style={styles.stageItem}>
                        <View style={styles.stageTimeline}>
                            <View style={[styles.stageIconBox, { backgroundColor: colors.primary, borderColor: colors.outlineVariant, borderWidth: 4 }]}>
                                <Ionicons name="sunny-outline" size={20} color={isDark ? colors.background : "#fff"} />
                            </View>
                        </View>
                        <View style={styles.stageContent}>
                            <View style={styles.activeLabelRow}>
                                <Text style={[styles.stageTitleActive, { color: colors.primary }]}>Ancient Guardian</Text>
                                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                            </View>
                            <Text style={[styles.stageDesc, { color: colors.textMuted }]}>Day 100: Peak mental vitality</Text>
                        </View>
                    </View>
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
        paddingTop: 20,
        paddingBottom: 120,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    treeSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    glowEffect: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        top: 20,
    },
    artworkContainer: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 4,
        overflow: 'hidden',
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    treeMeta: {
        marginTop: 32,
        alignItems: 'center',
    },
    treeName: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
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
        fontWeight: '600',
    },
    streakInfo: {
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 16,
    },
    progressCard: {
        marginHorizontal: 20,
        marginTop: 40,
        padding: 24,
        borderRadius: 24,
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
        fontSize: 18,
        fontWeight: '800',
        marginTop: 4,
    },
    xpText: {
        fontSize: 14,
        fontWeight: '900',
    },
    xpMax: {
        fontWeight: '500',
    },
    progressTrack: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
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
    journeySection: {
        paddingHorizontal: 20,
        marginTop: 48,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 24,
    },
    stageItem: {
        flexDirection: 'row',
        gap: 20,
    },
    stageTimeline: {
        alignItems: 'center',
        width: 44,
    },
    stageIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
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
        paddingBottom: 40,
        paddingTop: 6,
    },
    stageTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    stageTitleActive: {
        fontSize: 17,
        fontWeight: '900',
    },
    stageDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 6,
    },
    activeLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
