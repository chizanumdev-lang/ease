import React, { useState, useEffect } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions, 
    Image,
    StatusBar 
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Task, TaskMetadata } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    FadeIn, 
    FadeInDown, 
    Layout, 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GuidedSessionProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

interface Step {
    id: string;
    title: string;
    description: string;
    tip?: string;
}

export default function GuidedSessionPattern({ task, onComplete }: GuidedSessionProps) {
    const { colors, fonts, shadows, borderRadius, spacing } = useTheme();
    const metadata = task.metadata as any;

    const steps: Step[] = metadata?.steps || [
        { 
            id: '1', 
            title: 'Initial Assessment', 
            description: 'Reflect on your current state and identify one core priority for this session.',
            tip: 'Focus on what feels most urgent right now.'
        },
        { 
            id: '2', 
            title: 'Deep Focus Preparation', 
            description: 'Clear your physical environment and silence all non-essential notifications.',
            tip: 'Physical clutter equals mental clutter.'
        },
        { 
            id: '3', 
            title: 'Execution Phase', 
            description: 'Engage with your task for a dedicated block of time without interruptions.',
            tip: 'Stay with the resistance when it arises.'
        },
        { 
            id: '4', 
            title: 'Cool Down & Log', 
            description: 'Summarize your progress and note any blockers encountered.',
            tip: 'Honesty is the key to pattern recognition.'
        }
    ];

    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);

    const progress = completedSteps.length / steps.length;
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        progressWidth.value = withSpring(progress * 100);
    }, [completedSteps]);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const toggleStep = (id: string, index: number) => {
        if (completedSteps.includes(id)) {
            setCompletedSteps(completedSteps.filter(sid => sid !== id));
        } else {
            setCompletedSteps([...completedSteps, id]);
            if (index === activeStepIndex && index < steps.length - 1) {
                setActiveStepIndex(index + 1);
            }
        }
    };

    const isAllComplete = completedSteps.length === steps.length;

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" translucent />
            
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2560&auto=format&fit=crop' }} 
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient 
                        colors={['rgba(0,0,0,0.7)', 'transparent']} 
                        style={StyleSheet.absoluteFill} 
                    />
                    <View style={styles.headerContent}>
                        <Text style={[styles.kicker, { color: colors.white, fontFamily: fonts.labelBold }]}>GUIDED SESSION</Text>
                        <Text style={[styles.title, { color: colors.white, fontFamily: fonts.displayBold }]}>{task.title}</Text>
                        <Text style={[styles.description, { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.body }]}>
                            {task.description || 'Follow these steps to integrate today\'s core concepts into your practice.'}
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBarBase, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <Animated.View style={[styles.progressBarFill, { backgroundColor: colors.primary }, animatedProgressStyle]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>
                        {Math.round(progress * 100)}% COMPLETE
                    </Text>
                </View>

                {/* Steps List */}
                <View style={styles.stepsGrid}>
                    {steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isActive = index === activeStepIndex;
                        
                        return (
                            <Animated.View 
                                key={step.id} 
                                entering={FadeInDown.delay(index * 100)}
                                layout={Layout.springify()}
                                style={[
                                    styles.stepCard, 
                                    shadows.soft,
                                    { 
                                        backgroundColor: isCompleted ? colors.surfaceContainerLow : colors.surface,
                                        borderColor: isActive ? colors.primary : 'transparent',
                                        borderWidth: isActive ? 1 : 0,
                                        opacity: (!isActive && !isCompleted) ? 0.7 : 1
                                    }
                                ]}
                            >
                                <TouchableOpacity 
                                    onPress={() => toggleStep(step.id, index)}
                                    style={styles.stepHeader}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.checkbox, 
                                        { 
                                            borderColor: isCompleted ? colors.primary : colors.outline,
                                            backgroundColor: isCompleted ? colors.primary : 'transparent'
                                        }
                                    ]}>
                                        {isCompleted && <Ionicons name="checkmark" size={16} color={colors.white} />}
                                    </View>
                                    <Text style={[
                                        styles.stepTitle, 
                                        { 
                                            color: isCompleted ? colors.textMuted : colors.text, 
                                            fontFamily: fonts.labelBold,
                                            textDecorationLine: isCompleted ? 'line-through' : 'none'
                                        }
                                    ]}>
                                        STEP {index + 1}: {step.title}
                                    </Text>
                                </TouchableOpacity>

                                {(isActive || isCompleted) && (
                                    <Animated.View entering={FadeIn} style={styles.stepBody}>
                                        <Text style={[styles.stepDescription, { color: colors.text, fontFamily: fonts.body }]}>
                                            {step.description}
                                        </Text>
                                        {step.tip && (
                                            <View style={[styles.tipContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
                                                <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                                                <Text style={[styles.tipText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                                                    {step.tip}
                                                </Text>
                                            </View>
                                        )}
                                    </Animated.View>
                                )}
                            </Animated.View>
                        );
                    })}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <BlurView intensity={80} tint="light" style={styles.footer}>
                <TouchableOpacity
                    disabled={!isAllComplete}
                    style={[
                        styles.completeBtn, 
                        { backgroundColor: isAllComplete ? colors.primary : colors.surfaceContainerHighest }
                    ]}
                    onPress={() => onComplete({ stepsCompleted: completedSteps.length })}
                >
                    <Text style={[
                        styles.completeBtnText, 
                        { color: isAllComplete ? colors.white : colors.textMuted, fontFamily: fonts.labelBold }
                    ]}>
                        COMPLETE SESSION
                    </Text>
                    <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={isAllComplete ? colors.white : colors.textMuted} 
                    />
                </TouchableOpacity>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: 280,
        justifyContent: 'flex-end',
        padding: 24,
        paddingBottom: 40,
    },
    headerContent: {
        zIndex: 10,
    },
    kicker: {
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 8,
        opacity: 0.8,
    },
    title: {
        fontSize: 32,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    progressContainer: {
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 32,
    },
    progressBarBase: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        letterSpacing: 1,
    },
    stepsGrid: {
        paddingHorizontal: 24,
        gap: 16,
    },
    stepCard: {
        padding: 20,
        borderRadius: 20,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepTitle: {
        fontSize: 13,
        letterSpacing: 0.5,
        flex: 1,
    },
    stepBody: {
        marginTop: 16,
        paddingLeft: 36,
    },
    stepDescription: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
        opacity: 0.9,
    },
    tipContainer: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        alignItems: 'center',
    },
    tipText: {
        fontSize: 12,
        flex: 1,
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    completeBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    completeBtnText: {
        fontSize: 16,
        letterSpacing: 1,
    }
});
