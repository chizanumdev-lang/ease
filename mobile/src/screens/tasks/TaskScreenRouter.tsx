import React, { useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, Task, TaskStatus, TaskMetadata } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useProgramsStore } from '../../store/programsStore';

// Task Components
import VideoTaskComponent from '../../components/tasks/VideoTaskComponent';
import QuizTaskComponent from '../../components/tasks/QuizTaskComponent';
import AudioTaskComponent from '../../components/tasks/AudioTaskComponent';
import MicroAppTaskComponent from '../../components/tasks/MicroAppTaskComponent';
import ReflectionTaskComponent from '../../components/tasks/ReflectionTaskComponent';
import JournalTaskComponent from '../../components/tasks/JournalTaskComponent';
import ConsistencyTaskComponent from '../../components/tasks/ConsistencyTaskComponent';

type Props = NativeStackScreenProps<MainStackParamList, 'Task'>;

export default function TaskScreenRouter({ route, navigation }: Props) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { task: initialTask } = route.params;
    
    // We use the store task to get real-time status updates
    const { todayPlan, completeTask } = useProgramsStore();
    
    const task = useMemo(() => {
        return todayPlan?.tasks?.find(t => t.id === initialTask.id) || initialTask;
    }, [todayPlan, initialTask]);

    const handleBack = () => navigation.goBack();

    const handleTaskComplete = async (metadata: TaskMetadata) => {
        // 1. Mark in store (this also marks next as IN_PROGRESS)
        await completeTask(task.id, metadata);

        // 2. Find next task for "Circuit Flow"
        if (!todayPlan?.tasks) {
            navigation.goBack();
            return;
        }

        const currentIndex = todayPlan.tasks.findIndex(t => t.id === task.id);
        const nextTask = todayPlan.tasks[currentIndex + 1];

        if (nextTask) {
            // Seemless transition to next task
            navigation.replace('Task', { task: nextTask });
        } else {
            // End of circuit
            navigation.goBack();
        }
    };

    const renderTaskContent = () => {
        const props = { task, onComplete: handleTaskComplete };
        
        switch (task.type) {
            case 'video':
                return <VideoTaskComponent {...props} />;
            case 'quiz':
                return <QuizTaskComponent {...props} />;
            case 'audio':
                return <AudioTaskComponent {...props} />;
            case 'micro-app':
                return <MicroAppTaskComponent {...props} />;
            case 'reflection':
                return <ReflectionTaskComponent {...props} />;
            case 'journal':
                return <JournalTaskComponent {...props} />;
            case 'consistency':
                return <ConsistencyTaskComponent {...props} />;
            default:
                return (
                    <View style={styles.emptyState}>
                        <Text style={{ color: colors.text }}>Unknown Task Type: {task.type}</Text>
                    </View>
                );
        }
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Custom Header */}
            <SafeAreaView style={[styles.header, { borderBottomColor: colors.surfaceContainerHighest }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
                            {task.title}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {task.type.toUpperCase()} • {task.duration || 15} MIN
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Settings')}
                            style={[styles.headerButton, { backgroundColor: colors.surfaceContainerLow, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0 }]}
                        >
                            <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Task-wide Progress Bar */}
                <View style={[styles.progressContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { 
                                backgroundColor: colors.primary,
                                width: task.status === TaskStatus.COMPLETED ? '100%' : '5%' 
                            }
                        ]} 
                    />
                </View>
            </SafeAreaView>

            <View style={styles.content}>
                {renderTaskContent()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        height: 64,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginTop: 2,
    },
    headerButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    progressContainer: {
        height: 4,
        width: '100%',
    },
    progressFill: {
        height: '100%',
    },
    content: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
