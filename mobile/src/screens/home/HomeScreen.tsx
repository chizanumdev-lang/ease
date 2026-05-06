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
    Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { showModal } = useModalStore();
    const { user, updateSettings } = useAuthStore();
    const { todayPlan, currentProgram, isLoading, updateTask } = useProgramsStore();
    
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [isTutorialVisible, setIsTutorialVisible] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const { analytics, fetchAnalytics } = useAnalyticsStore();

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
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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

            {/* Greeting */}
            <View style={styles.greetingSection}>
                <Text style={[styles.greeting, { color: colors.text, fontFamily: fonts.display }]}>
                    Good morning, {user?.name?.split(' ')[0] || 'Alex'}
                </Text>
                <View>
                    <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>Ready for your session?</Text>
                </View>
            </View>

            {/* Goal Banner */}
            {currentProgram && (
                <GoalBanner 
                    title={currentProgram.title || "Your Spirit Tree is flourishing"}
                    subtitle={analytics?.progression?.currentPhase?.subtitle || "Today's progress starts with one small step. You're closer to your goal than yesterday."}
                    progress={(analytics?.progression?.progressPercentage || 0) / 100}
                    phase={analytics?.progression?.currentPhase?.title || "Growing"}
                />
            )}

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
                        trend={analytics?.currentStreak && analytics.currentStreak > 0 ? { value: "+1 from yesterday", isPositive: true } : undefined}
                    />
                    <StatCard 
                        label="Completion" 
                        value={analytics?.todayCompletionRate?.toString() || "0"} 
                        unit="%"
                        icon="checkmark-circle"
                        color="#006D77"
                    />
                    <StatCard 
                        label="Spirit Level" 
                        value={analytics?.progression?.level?.toString() || "1"} 
                        icon="sparkles"
                        color="#56624b"
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

    const sortedTasks = todayPlan?.tasks
        ? [...todayPlan.tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
        : [] as Task[];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            <FlatList
                data={sortedTasks}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                    <TaskCard 
                        task={item} 
                        onPress={handleTaskPress}
                        isLast={index === sortedTasks.length - 1}
                    />
                )}
                ListHeaderComponent={renderHeader}
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
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 120,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topNavWrapper: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
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
    greetingSection: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    statsSection: {
        marginHorizontal: -20, // Negative margin to allow full-width scroll
        marginBottom: 32,
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
    }
});
