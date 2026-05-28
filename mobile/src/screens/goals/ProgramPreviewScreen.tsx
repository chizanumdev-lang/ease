import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../../components/StitchButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingState from '../../components/LoadingState';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StatusBar, Platform } from 'react-native';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<MainStackParamList, 'ProgramPreview'>;

const GeneratingSkeleton = () => {
    const { colors } = useTheme();
    const pulseAnim = React.useRef(new Animated.Value(0.4)).current;

    React.useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    const SkeletonBox = ({ width, height, borderRadius = 8, style }: any) => (
        <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.surfaceContainerHigh, opacity: pulseAnim }, style]} />
    );

    return (
        <ImageBackground 
            source={require('../../../assets/images/wizard_bg.png')}
            style={styles.safeArea}
            imageStyle={{ opacity: 0.3 }}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <View style={[styles.topNav, { borderBottomColor: colors.outlineVariant, flexDirection: 'row', justifyContent: 'center' }]}>
                    <Text style={[styles.navTitle, { color: colors.text }]}>Building Journey...</Text>
                </View>

                <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <SkeletonBox width={160} height={28} borderRadius={14} style={{ marginBottom: 16 }} />
                        <SkeletonBox width={260} height={36} style={{ marginBottom: 12, alignSelf: 'center' }} />
                        <SkeletonBox width={220} height={20} style={{ marginBottom: 8, alignSelf: 'center' }} />
                    </View>

                    <View style={styles.section}>
                        <SkeletonBox width={100} height={24} style={{ marginBottom: 20 }} />
                        <SkeletonBox width="100%" height={140} borderRadius={32} style={{ marginBottom: 24 }} />
                    </View>

                    <View style={styles.section}>
                        <SkeletonBox width={140} height={24} style={{ marginBottom: 20 }} />
                        <SkeletonBox width="100%" height={120} borderRadius={32} style={{ marginBottom: 24 }} />

                        {[1, 2, 3].map((i) => (
                            <View key={i} style={[styles.timelineItem, { opacity: 1 - (i * 0.2) }]}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.timelineDot, { backgroundColor: colors.surfaceContainerHigh }]} />
                                    <View style={[styles.timelineLine, { backgroundColor: colors.surfaceContainerHigh }]} />
                                </View>
                                <View style={styles.timelineRight}>
                                    <SkeletonBox width={50} height={12} style={{ marginBottom: 8 }} />
                                    <SkeletonBox width={160} height={20} style={{ marginBottom: 8 }} />
                                    <SkeletonBox width={220} height={14} />
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};


export default function ProgramPreviewScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius, fonts } = useTheme();
    const { programId } = route.params;
    const { currentProgram, fetchProgram, isLoading } = useProgramsStore();

    React.useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        if (programId) {
            fetchProgram(programId);

            // Poll every 3 seconds if generating
            pollInterval = setInterval(() => {
                const { currentProgram: latestProgram } = useProgramsStore.getState();
                if (latestProgram?.status === 'generating') {
                    console.log('[PREVIEW] Polling for program status...');
                    fetchProgram(programId);
                } else if (latestProgram?.status === 'ready') {
                    console.log('[PREVIEW] Program ready, stopping polling.');
                    clearInterval(pollInterval);
                }
            }, 3000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [programId]);

    if (isLoading || !currentProgram || currentProgram.status === 'generating') {
        return <GeneratingSkeleton />;
    }

    const metadata = currentProgram.metadata || {};
    const intensityData = metadata.weeklyIntensity || [20, 40, 60, 80, 70, 90, 100];
    const dayPlans = currentProgram.dayPlans || [];

    const renderIntensityChart = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>The Pace</Text>
                <View style={[styles.intensityIndicator, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.intensityIndicatorText, { color: colors.primary }]}>{currentProgram.duration} Day Journey</Text>
                </View>
            </View>
            
            <View style={[styles.chartContainer, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                <View style={styles.chartBars}>
                    {intensityData.map((val: number, i: number) => (
                        <View key={i} style={styles.barWrapper}>
                            <View 
                                style={[
                                    styles.bar, 
                                    { 
                                        height: `${val}%`, 
                                        backgroundColor: i === 0 ? colors.primary : colors.secondaryContainer 
                                    }
                                ]} 
                            />
                            <Text style={[styles.barLabel, { color: colors.textMuted }]}>W{i+1}</Text>
                        </View>
                    ))}
                </View>
                <View style={[styles.chartOverlay, { borderColor: colors.outlineVariant }]}>
                    <Text style={[styles.chartHint, { color: colors.textMuted }]}>Intensity increases to ensure progress</Text>
                </View>
            </View>
        </View>
    );

    return (
        <ImageBackground 
            source={require('../../../assets/images/wizard_bg.png')}
            style={styles.safeArea}
            imageStyle={{ opacity: 0.3 }}
        >
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" />
            <View style={[styles.topNav, { borderBottomColor: colors.outlineVariant, flexDirection: 'row', justifyContent: 'space-between' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: colors.text }]}>Your Plan</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: colors.primaryContainer }]}>
                        <Ionicons name="sparkles" size={14} color={colors.primary} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>AI CRAFTED JOURNEY</Text>
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>{currentProgram.title}</Text>
                    <Text style={[styles.description, { color: colors.textMuted }]}>{currentProgram.description}</Text>
                </View>

                {renderIntensityChart()}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>The First Step</Text>
                    <View style={[styles.mainDayCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <View style={styles.dayBadge}>
                            <Text style={styles.dayBadgeText}>DAY 1</Text>
                        </View>
                        <Text style={[styles.mainDayTitle, { color: colors.text }]}>
                            {dayPlans[0]?.theme || "Foundation Core"}
                        </Text>
                        <View style={styles.focusList}>
                            {dayPlans[0]?.focusAreas?.map((area: string, i: number) => (
                                <View key={i} style={[styles.focusTag, { backgroundColor: colors.surfaceContainerLow }]}>
                                    <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.focusTagText, { color: colors.text }]}>{area}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Coming Up</Text>
                    {dayPlans.slice(1, 4).map((plan: any, index: number, arr: any[]) => (
                        <View key={index} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                                <View style={[styles.timelineDot, { backgroundColor: colors.outlineVariant }]} />
                                {index < arr.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant }]} />}
                            </View>
                            <View style={styles.timelineRight}>
                                <Text style={[styles.dayLabelSmall, { color: colors.textMuted }]}>DAY {plan.dayNumber}</Text>
                                <Text style={[styles.themeTitle, { color: colors.text }]}>{plan.theme}</Text>
                                {plan.focusAreas?.[0] && <Text style={[styles.sampleDesc, { color: colors.textMuted }]}>{plan.focusAreas[0]}</Text>}
                            </View>
                        </View>
                    ))}
                    
                    <View style={styles.lockedSection}>
                        <View style={[styles.lockIconBox, { backgroundColor: colors.surfaceContainerLow }]}>
                            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                            Days 4–{currentProgram.duration} are created just for you as you move forward
                        </Text>
                    </View>
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
        </ImageBackground>
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
    // New Modernized Styles
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    intensityIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    intensityIndicatorText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    chartContainer: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
    },
    chartBars: {
        flexDirection: 'row',
        height: 140,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    barWrapper: {
        alignItems: 'center',
        width: '12%',
        gap: 8,
    },
    bar: {
        width: '100%',
        borderRadius: 6,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '700',
    },
    chartOverlay: {
        borderTopWidth: 1,
        paddingTop: 16,
        alignItems: 'center',
    },
    chartHint: {
        fontSize: 12,
        fontWeight: '600',
    },
    mainDayCard: {
        padding: 24,
        borderRadius: 32,
        gap: 16,
    },
    dayBadge: {
        backgroundColor: '#000',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dayBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    mainDayTitle: {
        fontSize: 22,
        fontWeight: '900',
    },
    focusList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    focusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    focusTagText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dayLabelSmall: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    sampleDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    lockedSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
        marginTop: 8,
    },
    lockIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockedText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    }
});
