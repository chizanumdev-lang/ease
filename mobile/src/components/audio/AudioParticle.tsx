import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Dimensions,
    View,
    Animated,
    PanResponder,
    Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioStore } from '../../store/audioStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_SIZE = 64;
const MARGIN = 20;
const EXCLUSION_ZONE = 64;

/**
 * AudioParticle — floating audio companion bubble.
 * Uses React Native's built-in Animated API (NOT Reanimated) to avoid HostFunction crashes.
 * The pulse scale is applied on a separate inner Animated.View so we can safely
 * use useNativeDriver: true for the scale while keeping position on useNativeDriver: false.
 */
const AudioParticle = () => {
    const {
        proximityStatus,
        isPlaying,
        ebbFactor,
        checkProximity,
        fetchRituals,
    } = useAudioStore();

    // ── Position (cannot use nativeDriver — layout props)
    const posX = useRef(new Animated.Value(SCREEN_WIDTH - PARTICLE_SIZE - MARGIN)).current;
    const posY = useRef(new Animated.Value(SCREEN_HEIGHT * 0.4)).current;
    const panOffset = useRef({ x: SCREEN_WIDTH - PARTICLE_SIZE - MARGIN, y: SCREEN_HEIGHT * 0.4 });

    // ── Pulse scale (safe to use nativeDriver — transform only)
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // ── Opacity (nativeDriver: true — transform only)
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        fetchRituals(todayStr);
        checkProximity();

        // Breathing pulse on the inner view
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1800,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const interval = setInterval(checkProximity, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const targetOpacity = ebbFactor < 0.5 ? 0.35 : 1;
        Animated.timing(opacityAnim, {
            toValue: targetOpacity,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [ebbFactor]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                posX.stopAnimation(x => { panOffset.current.x = x; });
                posY.stopAnimation(y => { panOffset.current.y = y; });
            },
            onPanResponderMove: (_, gestureState) => {
                posX.setValue(panOffset.current.x + gestureState.dx);
                posY.setValue(panOffset.current.y + gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                const currentX = panOffset.current.x + gestureState.dx;
                const currentY = panOffset.current.y + gestureState.dy;

                const snapX = currentX < SCREEN_WIDTH / 2
                    ? MARGIN
                    : SCREEN_WIDTH - PARTICLE_SIZE - MARGIN;

                let snapY = currentY;
                if (snapY < EXCLUSION_ZONE) snapY = EXCLUSION_ZONE;
                if (snapY > SCREEN_HEIGHT - EXCLUSION_ZONE - PARTICLE_SIZE) {
                    snapY = SCREEN_HEIGHT - EXCLUSION_ZONE - PARTICLE_SIZE;
                }

                panOffset.current = { x: snapX, y: snapY };

                Animated.spring(posX, {
                    toValue: snapX,
                    useNativeDriver: false,
                    velocity: gestureState.vx,
                    tension: 50,
                    friction: 9,
                }).start();
                Animated.spring(posY, {
                    toValue: snapY,
                    useNativeDriver: false,
                    velocity: gestureState.vy,
                    tension: 50,
                    friction: 9,
                }).start();
            },
        })
    ).current;

    // Colours based on state
    const stateColors: Record<string, [string, string]> = {
        IDLE:       ['rgba(99,102,241,0.85)', 'rgba(139,92,246,0.7)'],
        APPROACHING:['rgba(245,158,11,0.9)',  'rgba(251,191,36,0.75)'],
        READY:      ['rgba(16,185,129,0.9)',  'rgba(52,211,153,0.75)'],
    };
    const gradientColors = isPlaying
        ? ['rgba(139,92,246,0.95)', 'rgba(167,139,250,0.8)'] as [string, string]
        : (stateColors[proximityStatus] ?? stateColors.IDLE);

    const shadowColor = isPlaying
        ? '#8B5CF6'
        : proximityStatus === 'READY'   ? '#10B981'
        : proximityStatus === 'APPROACHING' ? '#F59E0B'
        : '#6366F1';

    const iconName: any = isPlaying ? 'pause' : proximityStatus === 'READY' ? 'musical-notes' : 'headset';

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.outerContainer,
                {
                    left: posX,
                    top: posY,
                    shadowColor,
                    opacity: opacityAnim,
                },
            ]}
        >
            {/* Inner view handles pulse scale with nativeDriver: true */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        {/* Main icon */}
                        <Ionicons name={iconName} size={22} color="#FFFFFF" />

                        {/* Playing indicator dot */}
                        {isPlaying && (
                            <View style={styles.playingDot} />
                        )}

                        {/* Proximity label */}
                        {proximityStatus === 'READY' && !isPlaying && (
                            <Text style={styles.readyLabel}>Now</Text>
                        )}
                    </LinearGradient>
                </BlurView>
            </Animated.View>
        </Animated.View>
    );
};

export default AudioParticle;

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        borderRadius: PARTICLE_SIZE / 2,
        zIndex: 9999,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 12,
    },
    blurContainer: {
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        borderRadius: PARTICLE_SIZE / 2,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: PARTICLE_SIZE / 2,
    },
    playingDot: {
        position: 'absolute',
        bottom: 10,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    },
    readyLabel: {
        position: 'absolute',
        bottom: 7,
        fontSize: 8,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
