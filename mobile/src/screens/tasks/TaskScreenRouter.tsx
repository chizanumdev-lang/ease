import React, { useMemo } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, TaskStatus, TaskMetadata } from '../../types';
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
    
    const { todayPlan, completeTask } = useProgramsStore();
    
    const task = useMemo(() => {
        return todayPlan?.tasks?.find(t => t.id === initialTask.id) || initialTask;
    }, [todayPlan, initialTask]);

    const handleBack = () => navigation.goBack();

    const handleTaskComplete = async (metadata: TaskMetadata) => {
        await completeTask(task.id, metadata);

        if (!todayPlan?.tasks) {
            navigation.goBack();
            return;
        }

        const currentIndex = todayPlan.tasks.findIndex(t => t.id === task.id);
        const nextTask = todayPlan.tasks[currentIndex + 1];

        if (nextTask) {
            navigation.replace('Task', { task: nextTask });
        } else {
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
                        <Text style={{ color: colors.text, fontFamily: fonts.body }}>Unknown Task Type: {task.type}</Text>
                    </View>
                );
        }
    };

    const TASK_LABELS: Record<string, string> = {
        video: 'WATCH',
        quiz: 'CHECK-IN',
        audio: 'PRACTICE',
        journal: 'WRITE',
        reflection: 'REVIEW',
        consistency: 'COMMIT',
        'micro-app': 'ACTION'
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={[styles.header, { backgroundColor: isDark ? colors.glass.dark : colors.glass.light, borderBottomWidth: 1, borderBottomColor: colors.glass.border }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={colors.text} />
                    </TouchableOpacity>
                    
                    <View style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
                            {task.title}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textMuted, fontFamily: fonts.body, letterSpacing: 1.2 }]}>
                            {TASK_LABELS[task.type] || task.type.toUpperCase()} • {task.duration || 15} MIN
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Settings')}
                        style={[styles.headerButton, { backgroundColor: colors.surfaceContainerLow }]}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Progress Strip */}
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
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
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
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 18,
        lineHeight: 24,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 1,
    },
    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressContainer: {
        height: 2,
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
