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
    Easing
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { MainStackParamList, Task, TaskStatus, WeeklyAnalytics } from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useFocusEffect } from '@react-navigation/native';

import Logo from '../../components/Logo';
import GoalBanner from '../../components/stitch/GoalBanner';
import StatCard from '../../components/stitch/StatCard';
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
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    
    const CARD_WIDTH = SCREEN_WIDTH - 40;
    const CARD_HEIGHT = 480;
    const DENT_DEPTH = 130;
    const R_BUBBLE = 85; 

    const heroCardPath = `
        M ${R_BUBBLE},0
        Q ${CARD_WIDTH / 2},-25 ${CARD_WIDTH - R_BUBBLE},0
        A ${R_BUBBLE},${R_BUBBLE} 0 0 1 ${CARD_WIDTH},${R_BUBBLE}
        Q ${CARD_WIDTH + 30},${CARD_HEIGHT * 0.25} ${CARD_WIDTH - DENT_DEPTH},${CARD_HEIGHT * 0.5}
        Q ${CARD_WIDTH + 30},${CARD_HEIGHT * 0.75} ${CARD_WIDTH},${CARD_HEIGHT - R_BUBBLE}
        A ${R_BUBBLE},${R_BUBBLE} 0 0 1 ${CARD_WIDTH - R_BUBBLE},${CARD_HEIGHT}
        Q ${CARD_WIDTH / 2},${CARD_HEIGHT + 25} ${R_BUBBLE},${CARD_HEIGHT}
        A ${R_BUBBLE},${R_BUBBLE} 0 0 1 0,${CARD_HEIGHT - R_BUBBLE}
        Q -25,${CARD_HEIGHT / 2} 0,${R_BUBBLE}
        A ${R_BUBBLE},${R_BUBBLE} 0 0 1 ${R_BUBBLE},0
        Z
    `;

    const { showModal } = useModalStore();
    const { user, updateSettings } = useAuthStore();
    const { todayPlan, currentProgram, isLoading, updateTask } = useProgramsStore();
    
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [isTutorialVisible, setIsTutorialVisible] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
                })
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
            console.error("Failed to update tutorial setting", e);
        }
    };


    // Fetch Analytics Data on Focus
    useFocusEffect(
        React.useCallback(() => {
            fetchAnalytics();
        }, [])
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

        if (currentProgram?.status === 'generating') {
            console.log('[HomeScreen] Program is generating, starting status poll...');
            pollInterval = setInterval(async () => {
                const updatedProgram = await useProgramsStore.getState().fetchActiveProgram(true);
                if (updatedProgram && updatedProgram.status === 'ready') {
                    console.log('[HomeScreen] Program is now ready, fetching plan and stopping poll.');
                    await useProgramsStore.getState().fetchTodayPlan(updatedProgram.id);
                    if (pollInterval) clearInterval(pollInterval);
                }
            }, 10000); // Poll every 5 seconds
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [currentProgram?.status]);

    const handleTaskPress = (task: Task) => {
        // If task is completed and has a next task, navigate to the next task to maintain "Circuit Flow"
        if (task.status === TaskStatus.COMPLETED && task.next_task_id) {
            const nextTask = todayPlan?.tasks?.find(t => t.id === task.next_task_id);
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
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <View style={styles.header}>
                    <View style={styles.topNav}>
                        <View style={styles.navButton} />
                        <Logo size={32} />
                        <View style={[styles.profileButton, { backgroundColor: colors.surfaceContainerLow }]} />
                    </View>
                    <View style={[styles.skeletonText, { width: '60%', height: 32, marginBottom: 12, backgroundColor: colors.surfaceContainerHigh, borderRadius: 8 }]} />
                    <View style={[styles.skeletonText, { width: '40%', height: 20, marginBottom: 24, backgroundColor: colors.surfaceContainerLow, borderRadius: 4 }]} />
                    <View style={[styles.skeletonBanner, { height: 160, backgroundColor: colors.surfaceContainerLow, borderRadius: 24, marginBottom: 24 }]} />
                    <View style={styles.statsSection}>
                        <View style={{ flexDirection: 'row', paddingHorizontal: 20 }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={{ width: 120, height: 140, backgroundColor: colors.surfaceContainerLow, borderRadius: 20, marginRight: 12 }} />
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
                    colors={isDark ? 
                        [colors.background, colors.surface] : 
                        [colors.primary + '10', colors.secondary + '05', colors.background]}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                    <View style={styles.topNavWrapper}>
                        <View style={styles.topNav}>
                            <View style={styles.navButton} />
                            <Logo size={32} />
                            <TouchableOpacity 
                                style={[styles.profileButton, { backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }]}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Ionicons name="settings-outline" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <HomeEmptyState onStartPress={handleBeginStory} />
                </SafeAreaView>
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.header}>
            {/* Top Navigation */}
            <View style={styles.topNav}>
                <View style={styles.navButton} />
                <Logo size={32} />
                <TouchableOpacity 
                    style={[styles.profileButton, { backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }]}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Editorial Illustrative Hero Section */}
            <View style={styles.editorialHeroContainer}>
                <View style={[styles.editorialHeroCard, { backgroundColor: 'transparent', height: CARD_HEIGHT }]}>
                    {/* SVG Background with Dent */}
                    <View style={StyleSheet.absoluteFill}>
                        <Svg width={CARD_WIDTH} height={CARD_HEIGHT}>
                            <Defs>
                                <SvgGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                                    <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
                                    <Stop offset="1" stopColor={colors.primary} stopOpacity="0.8" />
                                </SvgGradient>
                            </Defs>
                            <Path d={heroCardPath} fill="url(#heroGrad)" />
                        </Svg>
                    </View>

                    {/* Background Structural Text */}
                    <Text style={styles.heroWatermarkText}>EASE</Text>

                    {/* Floating Decorative Elements */}
                    <View style={[styles.heroParticle, { top: '20%', left: '40%', width: 12, height: 12 }]} />
                    <View style={[styles.heroParticle, { bottom: '30%', left: '15%', width: 18, height: 18, opacity: 0.4 }]} />
                    <View style={[styles.heroParticle, { top: '10%', right: '10%', width: 8, height: 8 }]} />

                    <View style={styles.editorialContent}>
                        <View style={styles.editorialTextSide}>
                            <Text style={[styles.editorialGreeting, { color: colors.white, fontFamily: fonts.display }]}>
                                GOOD{"\n"}MORNING,{"\n"}{user?.name?.split(' ')[0]?.toUpperCase() || 'ALEX'}
                            </Text>
                        </View>

                        <View style={styles.editorialImageSide}>
                            <View style={[styles.heroImagePortal, { width: 300, height: 300, borderRadius: 150, right: -50, top: 40 }]}>
                                <Image 
                                    source={require('../../../assets/images/hero_person.jpg')} 
                                    style={styles.heroImageFull}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.4)']}
                                    style={StyleSheet.absoluteFill}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Subtitle at the bottom */}
                    <View style={styles.heroBottomTextContainer}>
                        <Text style={[styles.editorialSubtitle, { color: colors.white, opacity: 0.8, fontFamily: fonts.body }]}>
                            The next step is the most important.{"\n"}Ready to elevate your state?
                        </Text>
                    </View>
                </View>
            </View>
            <GoalBanner 
                title={currentProgram?.title || "Your Spirit Tree is flourishing"}
                subtitle={analytics?.progression?.currentPhase?.subtitle || "Today's progress starts with one small step. You're closer to your goal than yesterday."}
                progress={(analytics?.progression?.progressPercentage || 0) / 100}
                phase={analytics?.progression?.currentPhase?.title || "Growing"}
            />

            <AudioWidget />

            {/* Stats Scroll */}
            <View style={styles.statsSection}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.statsScroll}
                >
                    <StatCard 
                        label="Day Streak" 
                        value={analytics?.currentStreak?.toString() || "0"} 
                        unit="days"
                        icon="flame"
                        color={colors.secondary}
                        trend={analytics?.currentStreak && analytics.currentStreak > 0 ? { value: "+1 from yesterday", isPositive: true } : undefined}
                    />
                    <StatCard 
                        label="Completion" 
                        value={analytics?.todayCompletionRate?.toString() || "0"} 
                        unit="%"
                        icon="checkmark-circle"
                        color={colors.primary}
                    />
                    <StatCard 
                        label="Spirit Level" 
                        value={analytics?.progression?.level?.toString() || "1"} 
                        icon="sparkles"
                        color={colors.success}
                        trend={{ value: "Steady", isPositive: true }}
                    />
                </ScrollView>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Your Day</Text>
            </View>
        </View>
    );

    const renderEmptyOrLoading = () => {
        if (currentProgram?.status === 'generating') {
            return (
                <View style={[styles.generatingContainer, { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg || 24 }]}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Ionicons name="sparkles-outline" size={48} color={colors.primary} />
                    </Animated.View>
                    <Text style={[styles.generatingTitle, { color: colors.text, fontFamily: fonts.display }]}>
                        Whispering to the stars...
                    </Text>
                    <Text style={[styles.generatingSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        We are tailoring your personalized task chain to fit your goal.
                    </Text>
                    <View style={[styles.notificationBox, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <Ionicons name="notifications-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                        <Text style={[styles.notificationText, { color: colors.text, fontFamily: fonts.label }]}>
                            We'll send you a notification when your journey is ready.
                        </Text>
                    </View>
                </View>
            );
        }
        return null;
    };

    const sortedTasks = (todayPlan?.tasks && currentProgram?.status !== 'generating')
        ? [...todayPlan.tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [] as Task[];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? 
                    [colors.background, colors.surface] : 
                    [colors.primary + '10', colors.secondary + '05', colors.background]}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <>
                    <FlatList
                        data={sortedTasks}
                        keyExtractor={item => item.id}
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
                            label: "Keep it up",
                            onPress: () => setIsSuccessModalVisible(false)
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
    }
});
