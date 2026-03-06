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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analytics.service';
import { WeeklyAnalytics } from '../../types';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4211d4" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4211d4" />
            }
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tree Evolution</Text>
                <TouchableOpacity style={styles.headerIcon}>
                    <Ionicons name="information-circle-outline" size={24} color="#f1f5f9" />
                </TouchableOpacity>
            </View>

            {/* Main Tree Display */}
            <View style={styles.treeSection}>
                <View style={styles.glowEffect} />
                <View style={styles.artworkContainer}>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1CRy9jYWzHhlYo9T613RCDCh6OP5AfuzesfC5EYBaXcKeyKFMByUhHaMmbb0Q1UdXVGfsCuUtgIppvFbTgd1sMPggqO4mPobxvAo1A9bfJeVAzgiH-NsOszvPDzZYe5lnMCHwJ-z38RI3e89q2pPEP3cTPk42eXmcE6I7HOuvVEOqHZzevoJn-HF5o4LOpnht6zgbzIpGKzea6ub-pl1623f_NiTvxsPyFA5iBbqgdqVIGFZ9ZlkplkQANAlU0XB3b1Ci8O4k-uWD' }}
                        style={styles.artwork}
                    />
                </View>
                <View style={styles.treeMeta}>
                    <Text style={styles.treeName}>Ancient Guardian</Text>
                    <View style={styles.levelRow}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>LEVEL {Math.floor((analytics?.pointsEarned || 0) / 100) || 42}</Text>
                        </View>
                        <Text style={styles.rankText}>Master of Growth</Text>
                    </View>
                    <Text style={styles.streakInfo}>{analytics?.currentStreak || 0} days of consistent mindfulness</Text>
                </View>
            </View>

            {/* Progress Card */}
            <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                    <View>
                        <Text style={styles.progressLabel}>NEXT EVOLUTION</Text>
                        <Text style={styles.evolutionTarget}>Eternal Bloom</Text>
                    </View>
                    <Text style={styles.xpText}>
                        {(analytics?.pointsEarned || 0) % 1000} <Text style={styles.xpMax}>/ 1000 XP</Text>
                    </Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${((analytics?.pointsEarned || 0) % 1000) / 10}%` }]} />
                </View>
                <View style={styles.xpMeta}>
                    <Ionicons name="sparkles" size={14} color="#4211d4" />
                    <Text style={styles.xpRemaining}>{1000 - ((analytics?.pointsEarned || 0) % 1000)} XP remaining to reach transcendence</Text>
                </View>
            </View>

            {/* Evolution Journey */}
            <View style={styles.journeySection}>
                <Text style={styles.sectionTitle}>Evolution Journey</Text>

                {/* Stage 1 */}
                <View style={styles.stageItem}>
                    <View style={styles.stageTimeline}>
                        <View style={styles.stageIconBox}>
                            <Ionicons name="leaf-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.stageLine} />
                    </View>
                    <View style={styles.stageContent}>
                        <Text style={styles.stageTitle}>The Seedling</Text>
                        <Text style={styles.stageDesc}>Day 1: Where intention begins</Text>
                    </View>
                </View>

                {/* Stage 2 */}
                <View style={styles.stageItem}>
                    <View style={styles.stageTimeline}>
                        <View style={styles.stageIconBox}>
                            <Ionicons name="analytics-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.stageLine} />
                    </View>
                    <View style={styles.stageContent}>
                        <Text style={styles.stageTitle}>Sprouting Spirit</Text>
                        <Text style={styles.stageDesc}>Day 15: Habit foundation locked</Text>
                    </View>
                </View>

                {/* Stage 3 */}
                <View style={styles.stageItem}>
                    <View style={styles.stageTimeline}>
                        <View style={styles.stageIconBox}>
                            <Ionicons name="bonfire-outline" size={20} color="#64748b" />
                        </View>
                        <View style={styles.stageLine} />
                    </View>
                    <View style={styles.stageContent}>
                        <Text style={styles.stageTitle}>Branching Wisdom</Text>
                        <Text style={styles.stageDesc}>Day 60: Deep-rooted resilience</Text>
                    </View>
                </View>

                {/* Stage 4 (Active) */}
                <View style={styles.stageItem}>
                    <View style={styles.stageTimeline}>
                        <View style={[styles.stageIconBox, styles.stageIconBoxActive]}>
                            <Ionicons name="sunny-outline" size={20} color="#fff" />
                        </View>
                    </View>
                    <View style={styles.stageContent}>
                        <View style={styles.activeLabelRow}>
                            <Text style={styles.stageTitleActive}>Ancient Guardian</Text>
                            <View style={styles.activeDot} />
                        </View>
                        <Text style={styles.stageDesc}>Day 100: Peak mental vitality</Text>
                    </View>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#151022',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#151022',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f1f5f9',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    treeSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    glowEffect: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(66, 17, 212, 0.2)',
        // No blur in basic StyleSheet
        top: 40,
    },
    artworkContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 4,
        borderColor: 'rgba(66, 17, 212, 0.3)',
        overflow: 'hidden',
        shadowColor: '#4211d4',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    treeMeta: {
        marginTop: 24,
        alignItems: 'center',
    },
    treeName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f1f5f9',
        letterSpacing: -0.5,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    levelBadge: {
        backgroundColor: 'rgba(66, 17, 212, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    levelText: {
        color: '#4211d4',
        fontSize: 12,
        fontWeight: '800',
    },
    rankText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
    streakInfo: {
        color: '#64748b',
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 12,
    },
    progressCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        marginHorizontal: 20,
        marginTop: 24,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    progressLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    evolutionTarget: {
        color: '#f1f5f9',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    xpText: {
        color: '#4211d4',
        fontSize: 14,
        fontWeight: '800',
    },
    xpMax: {
        color: '#64748b',
    },
    progressTrack: {
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4211d4',
        borderRadius: 6,
        shadowColor: '#4211d4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    xpMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    xpRemaining: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    journeySection: {
        paddingHorizontal: 20,
        marginTop: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f1f5f9',
        marginBottom: 24,
    },
    stageItem: {
        flexDirection: 'row',
        gap: 16,
    },
    stageTimeline: {
        alignItems: 'center',
        width: 40,
    },
    stageIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    stageIconBoxActive: {
        backgroundColor: '#4211d4',
        borderColor: 'rgba(66, 17, 212, 0.3)',
        borderWidth: 4,
    },
    stageLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 4,
    },
    stageContent: {
        flex: 1,
        paddingBottom: 32,
        paddingTop: 4,
    },
    stageTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f1f5f9',
    },
    stageTitleActive: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4211d4',
    },
    stageDesc: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
    activeLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4211d4',
    }
});
