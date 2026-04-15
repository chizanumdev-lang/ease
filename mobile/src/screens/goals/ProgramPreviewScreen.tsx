import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../../components/StitchButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainStackParamList, 'ProgramPreview'>;

export default function ProgramPreviewScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius } = useTheme();
    const { programId } = route.params;
    const { currentProgram, fetchProgram, isLoading } = useProgramsStore();

    React.useEffect(() => {
        if (programId) {
            fetchProgram(programId);
        }
    }, [programId]);

    if (isLoading || !currentProgram || currentProgram.status === 'generating') {
        return (
            <View style={[styles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Finalizing your journey...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.topNav, { borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.navTitle, { color: colors.text }]}>Plan Preview</Text>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: colors.surfaceContainerLow }]}>
                        <Ionicons name="sparkles" size={16} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>Personalized for you</Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{currentProgram.title}</Text>
                    <Text style={[styles.description, { color: colors.textMuted }]}>{currentProgram.description}</Text>
                </View>

                <View style={[styles.statsRow, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{currentProgram.duration} Days</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Duration</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>30 min</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Daily</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                    <View style={styles.statItem}>
                        <Ionicons name="layers-outline" size={20} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.text }]}>{currentProgram.dayPlans?.length || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Steps</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Learning Path</Text>
                    {currentProgram.dayPlans?.slice(0, 7).map((dayPlan, index) => (
                        <View key={dayPlan.id} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <View style={[
                                    styles.timelineDot,
                                    dayPlan.status === 'ready' && { backgroundColor: colors.primary },
                                    dayPlan.status === 'pending' && { backgroundColor: colors.outlineVariant }
                                ]} />
                                {index < 6 && <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />}
                            </View>
                            <View style={styles.timelineRight}>
                                <View style={styles.dayHeader}>
                                    <Text style={[styles.dayLabel, { color: colors.primary }]}>Day {dayPlan.dayNumber}</Text>
                                    {dayPlan.status === 'pending' && (
                                        <View style={[styles.statusBadge, { backgroundColor: colors.surfaceContainerLow }]}>
                                            <ActivityIndicator size="small" color={colors.textMuted} style={{ marginRight: 4 }} />
                                            <Text style={[styles.statusBadgeText, { color: colors.textMuted }]}>Preparing</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.themeTitle, { color: colors.text }]}>{dayPlan.theme}</Text>
                                {dayPlan.focusAreas && dayPlan.focusAreas.length > 0 && (
                                    <Text style={[styles.focusAreasText, { color: colors.textMuted }]}>
                                        Focus: {dayPlan.focusAreas.join(', ')}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                    {(currentProgram.dayPlans?.length || 0) > 7 && (
                        <View style={styles.moreIndicator}>
                            <Text style={[styles.moreText, { color: colors.textMuted }]}>+ {(currentProgram.dayPlans?.length || 0) - 7} more segments in your journey</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
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
    },
    topNav: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
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
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
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
        marginTop: 6,
        zIndex: 1,
    },
    timelineLine: {
        width: 2,
        flex: 1,
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
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    themeTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    focusAreasText: {
        fontSize: 14,
        lineHeight: 20,
    },
    moreIndicator: {
        paddingLeft: 42,
        marginTop: -8,
    },
    moreText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
    },
});
