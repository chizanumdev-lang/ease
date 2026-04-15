import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';

interface MicroAppTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function MicroAppTaskComponent({ task, onComplete }: MicroAppTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Ready'>('Ready');
    
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.5)).current;

    const startExercise = () => {
        setIsActive(true);
        runCycle();
    };

    const runCycle = () => {
        setPhase('Inhale');
        
        // Inhale: 4s
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1.8, duration: 4000, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
        ]).start(({ finished }) => {
            if (finished) {
                setPhase('Hold');
                // Hold: 4s
                setTimeout(() => {
                    setPhase('Exhale');
                    // Exhale: 4s
                    Animated.parallel([
                        Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
                        Animated.timing(opacityAnim, { toValue: 0.5, duration: 4000, useNativeDriver: true })
                    ]).start(({ finished }) => {
                        if (finished) {
                            setCycleCount(prev => {
                                const next = prev + 1;
                                if (next >= 3) {
                                    setIsActive(false);
                                    setPhase('Ready');
                                } else {
                                    runCycle();
                                }
                                return next;
                            });
                        }
                    });
                }, 4000);
            }
        });
    };

    const handleComplete = () => {
        onComplete({ microAppResult: "Success" });
    };

    return (
        <View style={styles.container}>
            <View style={styles.introSection}>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Box Breathing</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    Regulate your nervous system with 3 deep cycles.
                </Text>
            </View>

            <View style={styles.animationContainer}>
                <Animated.View 
                    style={[
                        styles.circle, 
                        { 
                            backgroundColor: colors.primaryContainer,
                            borderColor: colors.primary,
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim
                        }
                    ]} 
                />
                
                <View style={styles.phaseLabelContainer}>
                    <Text style={[styles.phaseLabel, { color: colors.primary, fontFamily: fonts.display }]}>
                        {phase}
                    </Text>
                    {isActive && (
                        <Text style={[styles.counter, { color: colors.textMuted }]}>
                            Cycle {cycleCount + 1} of 3
                        </Text>
                    )}
                </View>
            </View>

            {!isActive && (
                <View style={styles.footer}>
                    <StitchButton 
                        title={cycleCount === 3 ? "Complete Task" : "Start Exercise"}
                        variant={cycleCount === 3 ? "primary" : "secondary"}
                        onPress={cycleCount === 3 ? handleComplete : startExercise}
                        rightIcon={cycleCount === 3 ? "checkmark-circle" : "play"}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    introSection: {
        alignItems: 'center',
        marginBottom: 80,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 300,
    },
    circle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        position: 'absolute',
    },
    phaseLabelContainer: {
        alignItems: 'center',
    },
    phaseLabel: {
        fontSize: 32,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    counter: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 8,
    },
    footer: {
        marginTop: 80,
    }
});
