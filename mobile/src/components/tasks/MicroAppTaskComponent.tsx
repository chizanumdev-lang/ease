import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    Animated, 
    TouchableOpacity, 
    Easing, 
    Dimensions, 
    Image, 
    StatusBar,
    ScrollView 
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata } from '../../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import PetalBackground from '../PetalBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_OVERLAP = 24;

interface MicroAppTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function MicroAppTaskComponent({ task, onComplete }: MicroAppTaskProps) {
    const { colors, fonts, shadows, isDark, borderRadius } = useTheme();
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
            Animated.timing(scaleAnim, { toValue: 1.8, duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.9, duration: 4000, useNativeDriver: true })
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
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Header */}
                <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471?q=80&w=2560&auto=format&fit=crop' }} 
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <MaterialCommunityIcons 
                            name="lungs" 
                            size={48} 
                            color={colors.white} 
                        />
                    </View>
                </View>

                {/* Content Card */}
                <View style={[
                    styles.contentArea, 
                    { 
                        backgroundColor: colors.surfaceContainerLowest,
                        borderTopLeftRadius: borderRadius.xxxl,
                        borderTopRightRadius: borderRadius.xxxl,
                        marginTop: -CARD_OVERLAP,
                    }
                ]}>
                    <View style={styles.dragHandle} />

                    <View style={styles.headerSection}>
                        <Text style={[styles.appType, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>MICRO APP</Text>
                        <Text style={[styles.title, { color: colors.primary, fontFamily: fonts.displayBold }]}>Box Breathing</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            Regulate your nervous system with 3 deep cycles.
                        </Text>
                    </View>

                    <View style={styles.animationContainer}>
                        <View style={[styles.circleBack, { borderColor: colors.primaryLight }]} />
                        <Animated.View 
                            style={[
                                styles.circle, 
                                { 
                                    backgroundColor: colors.primary,
                                    transform: [{ scale: scaleAnim }],
                                    opacity: opacityAnim
                                }
                            ]} 
                        />
                        
                        <View style={styles.phaseLabelContainer}>
                            <Text style={[styles.phaseLabel, { color: colors.primary, fontFamily: fonts.displayBold }]}>
                                {phase}
                            </Text>
                            {isActive && (
                                <Text style={[styles.counter, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>
                                    CYCLE {cycleCount + 1} OF 3
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <TouchableOpacity
                    style={[
                        styles.actionBtn,
                        { 
                            backgroundColor: (cycleCount === 3 && !isActive) ? colors.primary : colors.surfaceContainerHighest,
                        }
                    ]}
                    onPress={cycleCount === 3 && !isActive ? handleComplete : (isActive ? undefined : startExercise)}
                    disabled={isActive}
                    activeOpacity={0.88}
                >
                    <Text style={[
                        styles.actionBtnText, 
                        { 
                            fontFamily: fonts.labelBold,
                            color: (cycleCount === 3 && !isActive) ? colors.white : colors.textMuted
                        }
                    ]}>
                        {isActive ? "Ritual in Progress" : (cycleCount === 3 ? "Complete Reflection" : "Start Exercise")}
                    </Text>
                    <Ionicons 
                        name={cycleCount === 3 ? "checkmark-circle" : (isActive ? "hourglass" : "play")} 
                        size={20} 
                        color={(cycleCount === 3 && !isActive) ? colors.white : colors.textMuted} 
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
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroContent: {
        zIndex: 10,
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.65,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
        marginBottom: 32,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 60,
    },
    appType: {
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 12,
    },
    title: {
        fontSize: 32,
        lineHeight: 40,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.8,
    },
    animationContainer: {
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleBack: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderStyle: 'dashed',
        position: 'absolute',
        opacity: 0.2,
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
        letterSpacing: 2,
        textAlign: 'center',
    },
    counter: {
        fontSize: 11,
        marginTop: 12,
        letterSpacing: 1.5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        paddingBottom: 20,
        justifyContent: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    actionBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 24,
    },
    actionBtnText: {
        fontSize: 16,
    },
});

