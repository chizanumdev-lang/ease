import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { Theme } from '../../constants/theme';
import StitchButton from '../../components/StitchButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainStackParamList, 'ProgramPreview'>;

export default function ProgramPreviewScreen({ route, navigation }: Props) {
    const { programId } = route.params;
    const { currentProgram, fetchProgram, isLoading } = useProgramsStore();

    React.useEffect(() => {
        if (programId) {
            fetchProgram(programId);
        }
    }, [programId]);

    // If it's pure "generating", we wait for Day 1 to be ready.
    if (isLoading || !currentProgram || currentProgram.status === 'generating') {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Finalizing your journey...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.topNav}>
                <Text style={styles.navTitle}>Plan Preview</Text>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.badge}>
                        <Ionicons name="sparkles" size={16} color={Theme.colors.accent} />
                        <Text style={styles.badgeText}>Personalized for you</Text>
                    </View>
                    <Text style={styles.title}>{currentProgram.title}</Text>
                    <Text style={styles.description}>{currentProgram.description}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={20} color={Theme.colors.primary} />
                        <Text style={styles.statValue}>{currentProgram.duration} Days</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={20} color={Theme.colors.primary} />
                        <Text style={styles.statValue}>30 min</Text>
                        <Text style={styles.statLabel}>Daily</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="layers-outline" size={20} color={Theme.colors.primary} />
                        <Text style={styles.statValue}>{currentProgram.dayPlans?.length || 0}</Text>
                        <Text style={styles.statLabel}>Steps</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Learning Path</Text>
                    {currentProgram.dayPlans?.slice(0, 7).map((dayPlan, index) => (
                        <View key={dayPlan.id} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <View style={[
                                    styles.timelineDot,
                                    dayPlan.status === 'ready' && styles.timelineDotActive,
                                    dayPlan.status === 'pending' && styles.timelineDotPending
                                ]} />
                                {index < 6 && <View style={styles.timelineLine} />}
                            </View>
                            <View style={styles.timelineRight}>
                                <View style={styles.dayHeader}>
                                    <Text style={styles.dayLabel}>Day {dayPlan.dayNumber}</Text>
                                    {dayPlan.status === 'pending' && (
                                        <View style={styles.statusBadge}>
                                            <ActivityIndicator size="small" color={Theme.colors.slate[400]} style={{ marginRight: 4 }} />
                                            <Text style={styles.statusBadgeText}>Preparing</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.themeTitle}>{dayPlan.theme}</Text>
                                {dayPlan.focusAreas && dayPlan.focusAreas.length > 0 && (
                                    <Text style={styles.focusAreasText}>
                                        Focus: {dayPlan.focusAreas.join(', ')}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                    {(currentProgram.dayPlans?.length || 0) > 7 && (
                        <View style={styles.moreIndicator}>
                            <Text style={styles.moreText}>+ {(currentProgram.dayPlans?.length || 0) - 7} more segments in your journey</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <StitchButton
                    title="Start My Journey"
                    onPress={() => navigation.navigate('Tabs')}
                    variant="primary"
                    size="lg"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.colors.white,
    },
    topNav: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.slate[200],
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.colors.text.light,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: Theme.spacing.lg,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
    },
    loadingText: {
        marginTop: Theme.spacing.md,
        fontSize: 16,
        color: Theme.colors.text.muted,
    },
    header: {
        marginBottom: Theme.spacing.xl,
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background.light,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.colors.text.muted,
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        color: Theme.colors.text.light,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: Theme.colors.text.muted,
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.background.light,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: Theme.colors.slate[200],
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Theme.colors.text.light,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: Theme.colors.text.muted,
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Theme.colors.text.light,
        marginBottom: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timelineLeft: {
        width: 30,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.slate[300],
        marginTop: 6,
        zIndex: 1,
    },
    timelineDotActive: {
        backgroundColor: Theme.colors.primary,
        transform: [{ scale: 1.2 }],
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: Theme.colors.slate[200],
        marginVertical: -2,
    },
    timelineRight: {
        flex: 1,
        paddingBottom: 24,
        paddingLeft: 12,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.slate[200],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: Theme.colors.slate[400],
        textTransform: 'uppercase',
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.colors.primary,
        textTransform: 'uppercase',
    },
    themeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.colors.text.light,
        marginBottom: 4,
    },
    focusAreasText: {
        fontSize: 14,
        color: Theme.colors.text.muted,
        lineHeight: 20,
    },
    timelineDotPending: {
        backgroundColor: Theme.colors.slate[200],
        borderWidth: 2,
        borderColor: Theme.colors.slate[300],
    },
    moreIndicator: {
        paddingLeft: 42,
        marginTop: -8,
    },
    moreText: {
        fontSize: 14,
        color: Theme.colors.text.muted,
        fontStyle: 'italic',
    },
    footer: {
        padding: Theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.slate[200],
    },
});
