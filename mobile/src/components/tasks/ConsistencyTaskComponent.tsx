import React, { useState } from 'react';
import { View, StyleSheet, Text, Animated, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';
import StitchCard from '../stitch/StitchCard';

interface ConsistencyTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function ConsistencyTaskComponent({ task, onComplete }: ConsistencyTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [confirmed, setConfirmed] = useState(false);

    const handleComplete = () => {
        onComplete({ consistencyConfirmed: true });
    };

    return (
        <View style={styles.container}>
            <View style={styles.mainContent}>
                <View style={[styles.halo, { backgroundColor: colors.primaryContainer }]}>
                    <View style={[styles.innerHalo, { backgroundColor: colors.primary }]}>
                        <Ionicons name="flame" size={64} color="#fff" />
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Keep the Streak Alive</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Today is Day 7 of your consistent growth journey. Commit to your routine for tomorrow.
                </Text>

                <StitchCard variant="elevated" style={styles.commitmentCard}>
                    <Text style={[styles.commitmentTitle, { color: colors.text, fontFamily: fonts.display }]}>Daily Commitment</Text>
                    <View style={styles.commitmentItem}>
                        <Ionicons name="time" size={20} color={colors.primary} />
                        <Text style={[styles.commitmentText, { color: colors.text }]}>I will complete my routine tomorrow at 8:00 AM.</Text>
                    </View>
                    <View style={styles.commitmentItem}>
                        <Ionicons name="checkmark-done-circle" size={20} color={colors.primary} />
                        <Text style={[styles.commitmentText, { color: colors.text }]}>I will log my reflections regardless of the outcome.</Text>
                    </View>
                </StitchCard>
            </View>

            <View style={styles.footer}>
                {!confirmed ? (
                    <StitchButton 
                        title="I Commit to Consistency"
                        variant="primary"
                        onPress={() => setConfirmed(true)}
                        rightIcon="hand-left"
                    />
                ) : (
                    <View style={styles.successSection}>
                        <View style={styles.successMessage}>
                            <Ionicons name="sparkles" size={24} color={colors.primary} />
                            <Text style={[styles.successText, { color: colors.primary, fontWeight: '800' }]}>Commitment Registered!</Text>
                        </View>
                        <StitchButton 
                            title="Finish All Today's Tasks"
                            variant="primary"
                            onPress={handleComplete}
                            rightIcon="trophy"
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    halo: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    innerHalo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    commitmentCard: {
        padding: 24,
        width: '100%',
    },
    commitmentTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    commitmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    commitmentText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    footer: {
        marginTop: 'auto',
    },
    successSection: {
        gap: 20,
    },
    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 12,
    },
    successText: {
        fontSize: 16,
    }
});
