import React, { useState, useEffect } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    Dimensions, 
    TouchableOpacity,
    StatusBar
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Task, TaskMetadata } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withRepeat, 
    withTiming, 
    Easing,
    interpolate,
    withSequence
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActiveMeditationProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function ActiveMeditationPattern({ task, onComplete }: ActiveMeditationProps) {
    const { colors, fonts } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Pause');
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default

    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.3);

    const startBreathing = () => {
        setIsActive(true);
        // Box breathing: 4s In, 4s Hold, 4s Out, 4s Pause
        scale.value = withRepeat(
            withSequence(
                withTiming(1.5, { duration: 4000, easing: Easing.out(Easing.quad) }), // Inhale
                withTiming(1.5, { duration: 4000 }), // Hold
                withTiming(1, { duration: 4000, easing: Easing.in(Easing.quad) }), // Exhale
                withTiming(1, { duration: 4000 }) // Pause
            ),
            -1,
            false
        );
        
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.8, { duration: 4000 }),
                withTiming(0.8, { duration: 4000 }),
                withTiming(0.3, { duration: 4000 }),
                withTiming(0.3, { duration: 4000 })
            ),
            -1,
            false
        );
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
                
                // Track phases for text display
                const cycleTime = (300 - timeLeft) % 16;
                if (cycleTime < 4) setPhase('Inhale');
                else if (cycleTime < 8) setPhase('Hold');
                else if (cycleTime < 12) setPhase('Exhale');
                else setPhase('Pause');

            }, 1000);
        } else if (timeLeft === 0) {
            onComplete({ durationSeconds: 300 });
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const animatedCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" />
            <LinearGradient 
                colors={[colors.primaryContainer, colors.background]} 
                style={StyleSheet.absoluteFill} 
            />

            <View style={styles.header}>
                <Text style={[styles.kicker, { color: colors.primary, fontFamily: fonts.labelBold }]}>MINDFULNESS</Text>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>{task.title}</Text>
            </View>

            <View style={styles.center}>
                <Animated.View style={[
                    styles.breathingCircle, 
                    { backgroundColor: colors.primary }, 
                    animatedCircleStyle
                ]} />
                <View style={[styles.staticCircle, { borderColor: colors.primary }]}>
                    <Text style={[styles.phaseText, { color: colors.primary, fontFamily: fonts.displayBold }]}>
                        {isActive ? phase : 'Ready?'}
                    </Text>
                    <Text style={[styles.timer, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>
                        {formatTime(timeLeft)}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                {!isActive ? (
                    <TouchableOpacity 
                        style={[styles.startBtn, { backgroundColor: colors.primary }]}
                        onPress={startBreathing}
                    >
                        <Text style={[styles.startBtnText, { color: colors.white, fontFamily: fonts.labelBold }]}>
                            BEGIN PRACTICE
                        </Text>
                        <Ionicons name="play" size={20} color={colors.white} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.completeBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                        onPress={() => onComplete({ durationSeconds: 300 - timeLeft })}
                    >
                        <Text style={[styles.completeBtnText, { color: colors.primary, fontFamily: fonts.labelBold }]}>
                            FINISH EARLY
                        </Text>
                    </TouchableOpacity>
                )}
                <Text style={[styles.hint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    Find a comfortable position and follow the circle's rhythm.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        paddingTop: 80,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    kicker: {
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        textAlign: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    breathingCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        position: 'absolute',
    },
    staticCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    phaseText: {
        fontSize: 24,
        marginBottom: 4,
    },
    timer: {
        fontSize: 16,
    },
    footer: {
        padding: 40,
        paddingBottom: 60,
        alignItems: 'center',
    },
    startBtn: {
        height: 60,
        paddingHorizontal: 32,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    startBtnText: {
        fontSize: 16,
        letterSpacing: 1,
    },
    completeBtn: {
        height: 50,
        paddingHorizontal: 24,
        borderRadius: 25,
        justifyContent: 'center',
        marginBottom: 20,
    },
    completeBtnText: {
        fontSize: 14,
    },
    hint: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.7,
    }
});
