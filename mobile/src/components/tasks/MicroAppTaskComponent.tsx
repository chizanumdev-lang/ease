import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity, Easing } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';

interface MicroAppTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function MicroAppTaskComponent({ task, onComplete }: MicroAppTaskProps) {
    const { colors, fonts, shadows, isDark } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Ready'>('Ready');
    
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.4)).current;

    const startExercise = () => {
        setIsActive(true);
        runCycle();
    };

    const runCycle = () => {
        setPhase('Inhale');
        
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 2, duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.8, duration: 4000, useNativeDriver: true })
        ]).start(({ finished }) => {
            if (finished) {
                setPhase('Hold');
                setTimeout(() => {
                    setPhase('Exhale');
                    Animated.parallel([
                        Animated.timing(scaleAnim, { toValue: 1, duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
                        Animated.timing(opacityAnim, { toValue: 0.4, duration: 4000, useNativeDriver: true })
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
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={styles.introSection}>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Box Breathing</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    Regulate your nervous system with 3 deep cycles.
                </Text>
            </View>

            <View style={styles.animationContainer}>
                <Animated.View 
                    style={[
                        styles.circle, 
                        { 
                            backgroundColor: colors.primaryContainer,
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
                        <Text style={[styles.counter, { color: colors.textMuted, fontFamily: fonts.label }]}>
                            CYCLE {cycleCount + 1} OF 3
                        </Text>
                    )}
                </View>
            </View>

            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                {!isActive && (
                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            { 
                                backgroundColor: cycleCount === 3 ? colors.primary : colors.surfaceContainerHighest,
                                ...(cycleCount === 3 ? shadows.ambient : {})
                            }
                        ]}
                        onPress={cycleCount === 3 ? handleComplete : startExercise}
                        activeOpacity={0.88}
                    >
                        <Text style={[
                            styles.actionBtnText, 
                            { 
                                fontFamily: fonts.display,
                                color: cycleCount === 3 ? colors.white : colors.textMuted
                            }
                        ]}>
                            {cycleCount === 3 ? "Complete Reflection" : "Start Exercise"}
                        </Text>
                        <Ionicons 
                            name={cycleCount === 3 ? "checkmark-circle" : "play"} 
                            size={20} 
                            color={cycleCount === 3 ? colors.white : colors.textMuted} 
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    introSection: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 32,
        lineHeight: 40,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    animationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        position: 'absolute',
    },
    phaseLabelContainer: {
        alignItems: 'center',
    },
    phaseLabel: {
        fontSize: 36,
        letterSpacing: 3,
        textAlign: 'center',
    },
    counter: {
        fontSize: 12,
        marginTop: 12,
        letterSpacing: 1.5,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
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
});
