import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { useProgramsStore } from '../../store/programsStore';

type Props = NativeStackScreenProps<MainStackParamList, 'Task'>;

export default function TaskScreen({ route, navigation }: Props) {
    const { task } = route.params;
    const { updateTask } = useProgramsStore();

    const handleToggleComplete = async () => {
        await updateTask(task.id, { completed: !task.completed });
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name={getIconName(task.type)} size={40} color="#007AFF" />
                </View>
                <Text style={styles.title}>{task.title}</Text>
                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{task.duration || 15} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="pricetag-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{task.type || 'Task'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <View style={styles.card}>
                    <Text style={styles.description}>{task.description || 'No instructions provided.'}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.completeButton, task.completed && styles.completedButton]}
                onPress={handleToggleComplete}
            >
                <Ionicons
                    name={task.completed ? "checkmark-circle" : "checkbox-outline"}
                    size={24}
                    color="#fff"
                />
                <Text style={styles.completeButtonText}>
                    {task.completed ? "Mark as Incomplete" : "Complete Task"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        padding: 20,
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
        backgroundColor: '#edf7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 12,
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
        color: '#666',
        textTransform: 'capitalize',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: '#444',
    },
    completeButton: {
        backgroundColor: '#007AFF',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    completedButton: {
        backgroundColor: '#28a745',
        shadowColor: '#28a745',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
