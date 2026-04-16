import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    interpolate,
    useDerivedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioStore } from '../../store/audioStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_SIZE = 56;
const EBBED_SIZE = 24;
const MARGIN = 16;
const EXCLUSION_ZONE = 64; // Safe area for gestures

export const AudioParticle = () => {
    const { 
        proximityStatus, 
        isPlaying, 
        ebbFactor,
        checkProximity,
        fetchRituals
    } = useAudioStore();

    // Position state
    const translateX = useSharedValue(SCREEN_WIDTH - PARTICLE_SIZE - MARGIN);
    const translateY = useSharedValue(SCREEN_HEIGHT / 2);

    // Breathing/Pulse animation
    const pulseValue = useSharedValue(1);

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        fetchRituals(todayStr);
        checkProximity();

        pulseValue.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        );

        // Check proximity periodically
        const interval = setInterval(checkProximity, 30000);
        return () => clearInterval(interval);
    }, []);

    const offset = useSharedValue({ x: 0, y: 0 });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            offset.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = offset.value.x + event.translationX;
            translateY.value = offset.value.y + event.translationY;
        })
        .onEnd((event) => {
            // Snap to nearest edge
            const snapToLeft = translateX.value < SCREEN_WIDTH / 2;
            const targetX = snapToLeft ? MARGIN : SCREEN_WIDTH - PARTICLE_SIZE - MARGIN;
            
            translateX.value = withSpring(targetX, { velocity: event.velocityX });

            // Respect exclusion zones
            let targetY = translateY.value;
            if (targetY < EXCLUSION_ZONE) targetY = EXCLUSION_ZONE;
            if (targetY > SCREEN_HEIGHT - EXCLUSION_ZONE - PARTICLE_SIZE) {
                targetY = SCREEN_HEIGHT - EXCLUSION_ZONE - PARTICLE_SIZE;
            }
            
            translateY.value = withSpring(targetY, { velocity: event.velocityY });
        });

    const animatedStyle = useAnimatedStyle(() => {
        const size = interpolate(
            ebbFactor,
            [0.2, 1],
            [EBBED_SIZE, PARTICLE_SIZE]
        );

        const opacity = interpolate(
            ebbFactor,
            [0.2, 1],
            [0.3, 0.9]
        );

        // State-based scale multiplier
        let stateScale = 1;
        if (proximityStatus === 'APPROACHING') stateScale = 1.1;
        if (proximityStatus === 'READY') stateScale = 1.25;
        if (isPlaying) stateScale = 1.15;

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: pulseValue.value * stateScale },
            ],
            opacity: withTiming(opacity, { duration: 500 }),
            width: size,
            height: size,
            borderRadius: size / 2,
        };
    });

    const glowStyle = useAnimatedStyle(() => {
        let glowColor = '#6366F1'; // Default Indigo
        if (proximityStatus === 'APPROACHING') glowColor = '#F59E0B'; // Amber
        if (proximityStatus === 'READY') glowColor = '#10B981'; // Emerald
        if (isPlaying) glowColor = '#8B5CF6'; // Violet

        const glowOpacity = interpolate(
            pulseValue.value,
            [1, 1.1],
            [0.2, 0.5]
        );

        return {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: withTiming(glowOpacity),
            shadowRadius: withTiming(proximityStatus === 'READY' ? 20 : 10),
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, animatedStyle, glowStyle]}>
                <BlurView intensity={30} style={styles.blur}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                        style={styles.gradient}
                    >
                        {proximityStatus === 'READY' && (
                            <Animated.View style={styles.innerPulse} />
                        )}
                    </LinearGradient>
                </BlurView>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 9999,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    blur: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerPulse: {
        width: '40%',
        height: '40%',
        borderRadius: 100,
        backgroundColor: '#10B981',
        opacity: 0.8,
    }
});
