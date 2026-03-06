import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, Image, ScrollView, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, Task } from '../../types';
import { useProgramsStore } from '../../store/programsStore';
import { useAuthStore } from '../../store/authStore';
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
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.statCardPrimary]}>
                    <View style={styles.statLabelRow}>
                        <Ionicons name="flame" size={14} color="#4211d4" />
                        <Text style={styles.statLabel}>STREAK</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#4211d4' }]}>12 Days</Text>
                    <Text style={styles.statSubValue}>+2% from yesterday</Text>
                </View>
                <View style={styles.statCard}>
                    <View style={styles.statLabelRow}>
                        <Ionicons name="flash" size={14} color="#94a3b8" />
                        <Text style={styles.statLabel}>PROGRESS</Text>
                    </View>
                    <Text style={styles.statValue}>65%</Text>
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
                <View style={styles.spiritTreeHeader}>
                    <View style={styles.phaseBadge}>
                        <Text style={styles.phaseText}>GROWTH PHASE 3</Text>
                    </View>
                    <Text style={styles.spiritTitle}>Your Spirit Tree is flourishing</Text>
                </View>
                <Text style={styles.spiritSubtitle}>Today’s progress starts with one small step.</Text>
                <View style={styles.spiritIconBg}>
                    <Ionicons name="leaf" size={100} color="rgba(255,255,255,0.15)" />
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
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(66, 17, 212, 0.2)',
        padding: 2,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: -2,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statCardPrimary: {
        backgroundColor: 'rgba(66, 17, 212, 0.05)',
        borderColor: 'rgba(66, 17, 212, 0.1)',
    },
    statLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
    },
    statSubValue: {
        fontSize: 10,
        color: '#16a34a',
        fontWeight: '600',
        marginTop: 4,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4211d4',
        borderRadius: 2,
    },
    spiritTreeCard: {
        backgroundColor: '#4211d4',
        borderRadius: 20,
        padding: 24,
        minHeight: 180,
        justifyContent: 'space-between',
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#4211d4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    spiritTreeHeader: {
        zIndex: 10,
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
        lineHeight: 28,
    },
    spiritSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        zIndex: 10,
    },
    spiritIconBg: {
        position: 'absolute',
        right: -10,
        top: -10,
        opacity: 0.8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
        marginHorizontal: 20,
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
    }
});
