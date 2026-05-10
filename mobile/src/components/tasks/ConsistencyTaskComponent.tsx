import React, { useState } from 'react';
import { View, StyleSheet, Text, Animated, Image, TouchableOpacity } from 'react-native';
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
    const { colors, fonts, shadows, isDark } = useTheme();
    const [confirmed, setConfirmed] = useState(false);

    const handleComplete = () => {
        onComplete({ consistencyConfirmed: true });
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={styles.mainContent}>
                <View style={[styles.halo, { backgroundColor: colors.primaryContainer }]}>
                    <View style={[
                        styles.innerHalo, 
                        { 
                            backgroundColor: colors.primary,
                            ...(isDark ? {} : shadows.ambient)
                        }
                    ]}>
                        <Ionicons name="flame" size={64} color={colors.white} />
                    </View>
                </View>

                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Commit to Growth</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    Consistency is the bridge between goals and achievement. Your journey continues tomorrow.
                </Text>

                <View style={[
                    styles.commitmentCard, 
                    { 
                        backgroundColor: colors.surfaceContainerLow,
                        ...(isDark ? {} : shadows.ambient)
                    }
                ]}>
                    <Text style={[styles.commitmentTitle, { color: colors.primary, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 1.5 }]}>Daily Commitment</Text>
                    
                    <View style={styles.commitmentItem}>
                        <View style={[styles.iconDot, { backgroundColor: colors.primaryContainer }]}>
                            <Ionicons name="time" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.commitmentText, { color: colors.text, fontFamily: fonts.body }]}>
                            I will honor my scheduled routine tomorrow.
                        </Text>
                    </View>
                    
                    <View style={styles.commitmentItem}>
                        <View style={[styles.iconDot, { backgroundColor: colors.primaryContainer }]}>
                            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.commitmentText, { color: colors.text, fontFamily: fonts.body }]}>
                            I will prioritize my focus over distractions.
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                {!confirmed ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary, ...shadows.ambient }]}
                        onPress={() => setConfirmed(true)}
                        activeOpacity={0.88}
                    >
                        <Text style={[styles.actionBtnText, { color: colors.white, fontFamily: fonts.display }]}>Register Commitment</Text>
                        <Ionicons name="hand-left" size={20} color={colors.white} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.successSection}>
                        <View style={[styles.successBadge, { backgroundColor: colors.primaryContainer }]}>
                            <Ionicons name="sparkles" size={22} color={colors.primary} />
                            <Text style={[styles.successText, { color: colors.primary, fontFamily: fonts.display }]}>COMMITMENT ACTIVE</Text>
                        </View>
                        
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: colors.primary, ...shadows.ambient }]}
                            onPress={handleComplete}
                            activeOpacity={0.88}
                        >
                            <Text style={[styles.actionBtnText, { color: colors.white, fontFamily: fonts.display }]}>Finish Session</Text>
                            <Ionicons name="trophy" size={20} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 28,
    },
    halo: {
        width: 180,
        height: 180,
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    innerHalo: {
        width: 130,
        height: 130,
        borderRadius: 65,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        lineHeight: 40,
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 12,
        marginBottom: 48,
        opacity: 0.8,
    },
    commitmentCard: {
        padding: 28,
        width: '100%',
        borderRadius: 32,
    },
    commitmentTitle: {
        fontSize: 13,
        marginBottom: 24,
    },
    commitmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    iconDot: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commitmentText: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
    },
    actionBtn: {
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    actionBtnText: {
        fontSize: 18,
    },
    successSection: {
        gap: 20,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 20,
    },
    successText: {
        fontSize: 14,
        letterSpacing: 1,
    }
});
