import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProgramsStore } from '../../store/programsStore';
import { useTheme } from '../../hooks/useTheme';
import RewardAnimation from '../../components/RewardAnimation';

type Props = NativeStackScreenProps<MainStackParamList, 'Task'>;

export default function TaskScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius, isDark } = useTheme();
    const { task } = route.params;
    const { updateTask } = useProgramsStore();
    const [showReward, setShowReward] = React.useState(false);

    const handleToggleComplete = async () => {
        if (!task.completed) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowReward(true);
            await updateTask(task.id, { completed: true });
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await updateTask(task.id, { completed: false });
            navigation.goBack();
        }
    };

    const handleRewardEnd = () => {
        setShowReward(false);
        navigation.goBack();
    };

    const getIconName = (type?: string) => {
        switch (type) {
            case 'exercise': return 'fitness-outline';
            case 'lesson': return 'book-outline';
            case 'mindfulness': return 'leaf-outline';
            case 'journal': return 'create-outline';
            case 'reflection': return 'analytics-outline';
            default: return 'checkbox-outline';
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Ionicons name={getIconName(task.type)} size={40} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{task.duration || 15} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{task.type || 'Task'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
                <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: isDark ? '#000' : colors.outline }]}>
                    <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>{task.description || 'No instructions provided.'}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.completeButton, 
                    { backgroundColor: colors.primary, shadowColor: colors.primary },
                    task.completed && { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.outlineVariant, shadowOpacity: 0.1 }
                ]}
                onPress={handleToggleComplete}
            >
                <Ionicons
                    name={task.completed ? "checkmark-circle" : "checkbox-outline"}
                    size={24}
                    color={task.completed ? colors.textMuted : (isDark ? colors.background : "#fff")}
                />
                <Text style={[
                    styles.completeButtonText, 
                    { color: isDark ? colors.background : "#fff" },
                    task.completed && { color: colors.textMuted }
                ]}>
                    {task.completed ? "Mark as Incomplete" : "Complete Task"}
                </Text>
            </TouchableOpacity>
            
            <RewardAnimation trigger={showReward} onAnimationEnd={handleRewardEnd} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    meta: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    card: {
        borderRadius: 20,
        padding: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    completeButton: {
        borderRadius: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
