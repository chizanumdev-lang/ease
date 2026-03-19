import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Image, ScrollView, Dimensions, StatusBar, Animated, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, Task } from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../constants/theme';
import TimelineTaskCard from '../../components/TimelineTaskCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<MainStackParamList> & {
    navigation: any; // Simplified for hybrid nav
};

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
    const { user } = useAuthStore();
    const { todayPlan, currentProgram, updateTask } = useProgramsStore();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Initial Data Fetch
    React.useEffect(() => {
        const loadData = async () => {
            if (currentProgram) {
                await useProgramsStore.getState().fetchTodayPlan(currentProgram.id);
            } else {
                const program = await useProgramsStore.getState().fetchActiveProgram();
                if (program) {
                    await useProgramsStore.getState().fetchTodayPlan(program.id);
                }
            }
        };

        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreateGoal = () => {
        navigation.navigate('GoalWizard');
    };

    const handleTaskAction = (taskId: string) => {
        Alert.alert(
            'Task Options',
            'Choose an action',
            [
                { text: 'Snooze 10m', onPress: () => snoozeTask(taskId, 10) },
                { text: 'Reschedule', onPress: () => openReschedule(taskId) },
                {
                    text: 'Skip',
                    style: 'destructive',
                    onPress: () => updateTask(taskId, { completed: true })
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const snoozeTask = async (taskId: string, minutes: number) => {
        const task = todayPlan?.tasks?.find(t => t.id === taskId);
        if (!task) return;

        const currentScheduled = task.scheduledAt ? new Date(task.scheduledAt) : new Date();
        const newTime = new Date(currentScheduled.getTime() + minutes * 60000);
        await updateTask(taskId, { scheduledAt: newTime });
    };

    const openReschedule = (taskId: string) => {
        setSelectedTaskId(taskId);
        setShowDatePicker(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate && selectedTaskId) {
            updateTask(selectedTaskId, { scheduledAt: selectedDate });
            setSelectedTaskId(null);
        }
    };

    const handleDeleteProgram = () => {
        Alert.alert(
            'Delete Program',
            'Are you sure you want to delete your current program?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (currentProgram) {
                            try {
                                await useProgramsStore.getState().deleteProgram(currentProgram.id);
                            } catch (error) {
                                Alert.alert('Error', 'Failed to delete program');
                            }
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View style={styles.userInfo}>
                    <View style={styles.profileBadge}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPcqwvnGRJTBHRYhDLfV176zDemjNo1XxrHgT3M_PUgxnNgWUN-B11LyZ0dpjLVmIyb4pFXOJkuT6q6SQWvPTh0wPx0ceJTXCxr25DeFgekAx4_qt9x2VByrpay91DcEQONMH_L1w3QABzaFA91-GI_sWttDoH3fveglhhoR_-IPmMSOzXV9-v6XVkUppxd2Nz4f6WGzmUFtFJkULUmVSOf-Uu8KjLdg9AdQIn5bbbs3aOf6lNwj0OMwOoJl53QGBF4R6gcjy0FQuM' }}
                            style={styles.profileImage}
                        />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Today's Plan</Text>
                        <Text style={styles.headerSubtitle}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={22} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.streakCard}>
                    <View style={styles.statLabelRow}>
                        <Ionicons name="flame" size={14} color={Theme.colors.primary} />
                        <Text style={styles.statLabel}>STREAK</Text>
                    </View>
                    <Text style={styles.streakValue}>12 Days</Text>
                    <Text style={styles.streakChange}>+2% from yesterday</Text>
                </View>
                <View style={styles.progressCard}>
                    <View style={styles.statLabelRow}>
                        <Ionicons name="flash" size={14} color="#94a3b8" />
                        <Text style={styles.statLabel}>PROGRESS</Text>
                    </View>
                    <Text style={styles.progressValue}>65%</Text>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '65%' }]} />
                    </View>
                </View>
            </View>

            {/* Spirit Tree Card */}
            <TouchableOpacity
                style={styles.spiritTreeCard}
                onPress={() => navigation.navigate('GrowthProgress')}
            >
                {/* Background Pattern / Icon */}
                <View style={styles.spiritIconBg}>
                    <Ionicons name="leaf" size={120} color="rgba(255,255,255,0.15)" />
                </View>

                <View style={styles.spiritTreeContent}>
                    <View style={styles.phaseBadge}>
                        <Text style={styles.phaseText}>GROWTH PHASE 3</Text>
                    </View>
                    <Text style={styles.spiritTitle}>Your Spirit Tree is flourishing</Text>
                    <Text style={styles.spiritSubtitle}>Today’s progress starts with one small step.</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Routine</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAllLabel}>View All</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const sortedTasks = todayPlan?.tasks
        ? [...todayPlan.tasks].sort((a, b) => {
            if (!a.scheduledAt) return 1;
            if (!b.scheduledAt) return -1;
            return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        })
        : [];

    const handleTaskPress = (task: Task) => {
        if (task.type === 'video' && task.videoUrl) {
            navigation.navigate('VideoLesson', { task });
            return;
        }
        if (task.type === 'quiz' && task.quizId) {
            navigation.navigate('Quiz', { quizId: task.quizId, taskId: task.id });
            return;
        }
        if (task.type === 'audio') {
            const audioTrack = todayPlan?.audioTracks?.find(
                track => track.dayPlanId === task.dayPlanId
            );
            if (audioTrack) {
                navigation.navigate('AudioPlayer', { track: audioTrack });
            } else {
                Alert.alert('Error', 'Audio track not found');
            }
            return;
        }
        navigation.navigate('Task', { task });
    };

    const handleTaskToggle = (taskId: string, completed: boolean) => {
        updateTask(taskId, { completed });
    };

    if (todayPlan?.status === 'pending') {
        return (
            <View style={styles.generatingContainer}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.generatingContent}>
                    <View style={styles.generatingIconContainer}>
                        <Animated.View style={[styles.generatingPulse, {
                            transform: [{ scale: 1.2 }],
                            opacity: 0.2
                        }]} />
                        <Ionicons name="sparkles" size={48} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.generatingTitle}>Crafting your journey...</Text>
                    <Text style={styles.generatingSubtitle}>
                        We're curating your lessons and preparing your personalized audio session for today.
                    </Text>
                    <View style={styles.generatingBadge}>
                        <ActivityIndicator color={Theme.colors.primary} size="small" />
                        <Text style={styles.generatingBadgeText}>GENERATING ASSETS</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={sortedTasks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TimelineTaskCard
                        task={item}
                        onPress={handleTaskPress}
                        onAction={handleTaskAction}
                    />
                )}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    currentProgram ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading today's tasks...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No active program.</Text>
                            <TouchableOpacity style={styles.createButton} onPress={handleCreateGoal}>
                                <Text style={styles.createButtonText}>+ New Goal</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />

            {showDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f8',
    },
    listContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'rgba(66, 17, 212, 0.2)',
        padding: 2,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    streakCard: {
        flex: 1,
        backgroundColor: 'rgba(66, 17, 212, 0.08)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.15)',
    },
    streakValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#4211d4',
        marginVertical: 4,
    },
    streakChange: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16a34a',
    },
    progressCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    progressValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        marginVertical: 4,
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4211d4',
        borderRadius: 3,
    },
    spiritTreeCard: {
        borderRadius: 24,
        padding: 24,
        minHeight: 200,
        overflow: 'hidden',
        marginBottom: 32,
        backgroundColor: '#4211d4',
        shadowColor: '#4211d4',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    spiritTreeContent: {
        zIndex: 10,
        justifyContent: 'space-between',
        flex: 1,
    },
    phaseBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    phaseText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    spiritTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 30,
        marginBottom: 8,
    },
    spiritSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        lineHeight: 20,
    },
    spiritIconBg: {
        position: 'absolute',
        right: -20,
        top: -20,
        opacity: 0.2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
    },
    viewAllLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4211d4',
    },
    emptyState: {
        marginTop: 20,
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 16,
    },
    createButton: {
        backgroundColor: '#4211d4',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: '#64748b',
        fontSize: 14,
    },
    generatingContainer: {
        flex: 1,
        backgroundColor: '#f6f6f8',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    generatingContent: {
        alignItems: 'center',
        maxWidth: 300,
    },
    generatingIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    generatingPulse: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.colors.primary,
    },
    generatingTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    generatingSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    generatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    generatingBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: Theme.colors.primary,
        letterSpacing: 1,
    },
});
