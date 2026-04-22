import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions, 
    Animated, 
    Modal 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
    title: string;
    description: string;
    icon: string;
}

const STEPS: TutorialStep[] = [
    {
        title: "Welcome to Ease",
        description: "Your journey to peace and focus starts here. Let's take a quick tour of your new routine.",
        icon: "sparkles"
    },
    {
        title: "Your Daily Circuit",
        description: "Every day we curate a 'Circuit' of tasks designed for you. Complete them in order for the best results.",
        icon: "repeat"
    },
    {
        title: "Seamless Learning",
        description: "Our video tasks are designed to be distraction-free. No recommendations, just you and your growth.",
        icon: "videocam"
    },
    {
        title: "Track Your Progress",
        description: "Earn streaks and badges as you maintain your consistency. We'll celebrate every win with you.",
        icon: "trophy"
    }
];

interface Props {
    visible: boolean;
    onComplete: () => void;
}

export const TutorialTour: React.FC<Props> = ({ visible, onComplete }) => {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(20))[0];

    useEffect(() => {
        if (visible) {
            animateIn();
        }
    }, [visible, currentStep]);

    const animateIn = () => {
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    if (!visible) return null;

    const step = STEPS[currentStep];

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
                
                <Animated.View 
                    style={[
                        styles.card, 
                        { 
                            backgroundColor: colors.surface,
                            padding: spacing.xl,
                            borderRadius: borderRadius.xxl,
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name={step.icon as any} size={40} color={colors.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
                        {step.title}
                    </Text>
                    
                    <Text style={[styles.description, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        {step.description}
                    </Text>

                    <View style={styles.footer}>
                        <View style={styles.pagination}>
                            {STEPS.map((_, i) => (
                                <View 
                                    key={i} 
                                    style={[
                                        styles.dot, 
                                        { 
                                            backgroundColor: i === currentStep ? colors.primary : colors.outlineVariant,
                                            width: i === currentStep ? 20 : 8
                                        }
                                    ]} 
                                />
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.nextButton, { backgroundColor: colors.primary }]}
                            onPress={handleNext}
                        >
                            <Text style={styles.nextButtonText}>
                                {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    card: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32
    },
    footer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginRight: 6
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 100,
        gap: 8
    },
    nextButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16
    }
});
