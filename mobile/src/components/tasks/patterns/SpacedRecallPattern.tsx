import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withSpring, 
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { Task, TaskMetadata } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SpacedRecallProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function SpacedRecallPattern({ task, onComplete }: SpacedRecallProps) {
    const { colors, fonts, shadows, borderRadius } = useTheme();
    const metadata = task.metadata as any;
    const cards = metadata?.cards || [
        { front: 'Example Front', back: 'Example Back' }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const flipRotation = useSharedValue(0);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(
            flipRotation.value,
            [0, 180],
            [0, 180]
        );
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            backfaceVisibility: 'hidden',
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(
            flipRotation.value,
            [0, 180],
            [180, 360]
        );
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            backfaceVisibility: 'hidden',
        };
    });

    const handleFlip = () => {
        const newValue = isFlipped ? 0 : 180;
        flipRotation.value = withSpring(newValue, { damping: 15 });
        setIsFlipped(!isFlipped);
    };

    const handleRate = (rating: string) => {
        if (currentIndex < cards.length - 1) {
            // Reset for next card
            setIsFlipped(false);
            flipRotation.value = 0;
            setCurrentIndex(currentIndex + 1);
        } else {
            onComplete({ consistencyConfirmed: true });
        }
    };

    const card = cards[currentIndex];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.progress, { color: colors.textMuted, fontFamily: fonts.label }]}>
                    CARD {currentIndex + 1} OF {cards.length}
                </Text>
            </View>

            <TouchableOpacity 
                activeOpacity={1} 
                onPress={handleFlip} 
                style={styles.cardContainer}
            >
                <Animated.View style={[
                    styles.card, 
                    frontAnimatedStyle, 
                    { backgroundColor: colors.surface, ...shadows.ambient, borderRadius: borderRadius.lg }
                ]}>
                    <Text style={[styles.cardText, { color: colors.text, fontFamily: fonts.displayBold }]}>
                        {card.front}
                    </Text>
                    <Text style={[styles.hint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        Tap to flip
                    </Text>
                </Animated.View>

                <Animated.View style={[
                    styles.card, 
                    styles.cardBack, 
                    backAnimatedStyle, 
                    { backgroundColor: colors.primaryContainer, ...shadows.ambient, borderRadius: borderRadius.lg }
                ]}>
                    <Text style={[styles.cardText, { color: colors.white, fontFamily: fonts.displayBold }]}>
                        {card.back}
                    </Text>
                </Animated.View>
            </TouchableOpacity>

            <View style={[styles.controls, { opacity: isFlipped ? 1 : 0 }]}>
                <Text style={[styles.rateLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>HOW WAS THIS?</Text>
                <View style={styles.buttonRow}>
                    <RateButton 
                        label="HARD" 
                        icon="sad-outline" 
                        color="#EF4444" 
                        onPress={() => handleRate('hard')} 
                        disabled={!isFlipped}
                    />
                    <RateButton 
                        label="GOOD" 
                        icon="happy-outline" 
                        color={colors.primary} 
                        onPress={() => handleRate('good')} 
                        disabled={!isFlipped}
                    />
                    <RateButton 
                        label="EASY" 
                        icon="star-outline" 
                        color="#10B981" 
                        onPress={() => handleRate('easy')} 
                        disabled={!isFlipped}
                    />
                </View>
            </View>
        </View>
    );
}

function RateButton({ label, icon, color, onPress, disabled }: any) {
    const { colors, fonts, borderRadius } = useTheme();
    return (
        <TouchableOpacity 
            onPress={onPress}
            disabled={disabled}
            style={[styles.rateBtn, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
        >
            <Ionicons name={icon} size={24} color={color} />
            <Text style={[styles.rateBtnText, { color: colors.text, fontFamily: fonts.labelBold }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    header: {
        marginBottom: 40,
    },
    progress: {
        fontSize: 12,
        letterSpacing: 2,
    },
    cardContainer: {
        width: SCREEN_WIDTH - 48,
        height: 380,
        marginBottom: 40,
    },
    card: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    cardBack: {
        backgroundColor: '#4A90E2',
    },
    cardText: {
        fontSize: 32,
        textAlign: 'center',
        lineHeight: 40,
    },
    hint: {
        position: 'absolute',
        bottom: 30,
        fontSize: 12,
        letterSpacing: 1,
        opacity: 0.5,
    },
    controls: {
        width: '100%',
        alignItems: 'center',
    },
    rateLabel: {
        fontSize: 10,
        letterSpacing: 2,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    rateBtn: {
        flex: 1,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    rateBtnText: {
        fontSize: 10,
        letterSpacing: 1,
    }
});
