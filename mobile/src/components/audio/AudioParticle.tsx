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

const INITIAL_X = SCREEN_WIDTH - PARTICLE_SIZE - MARGIN;
const INITIAL_Y = SCREEN_HEIGHT * 0.4;

/**
 * AudioParticle — floating audio companion bubble.
 *
 * Architecture (avoids nativeDriver conflicts):
 *   - Outer Animated.View: position only via translateX/translateY
 *     → PanResponder sets values; useNativeDriver: false
 *   - Inner Animated.View: scale + opacity
 *     → pulse loop + ebbFactor fade; useNativeDriver: true
 */
const AudioParticle = () => {
    const { proximityStatus, isPlaying, ebbFactor, checkProximity, fetchRituals } = useAudioStore();

    // ── Position — NOT native driver (layout computation required)
    const posX = useRef(new Animated.Value(INITIAL_X)).current;
    const posY = useRef(new Animated.Value(INITIAL_Y)).current;
    const panOffset = useRef({ x: INITIAL_X, y: INITIAL_Y });

    // ── Scale + Opacity — CAN use native driver (transform/opacity only)
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        fetchRituals(todayStr);
        checkProximity();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1800, useNativeDriver: true }),
            ])
        ).start();

        const interval = setInterval(checkProximity, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        Animated.timing(opacityAnim, {
            toValue: ebbFactor < 0.5 ? 0.35 : 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [ebbFactor]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Capture current translate values before dragging
                posX.stopAnimation(x => { panOffset.current.x = x; });
                posY.stopAnimation(y => { panOffset.current.y = y; });
            },
            onPanResponderMove: (_, gs) => {
                posX.setValue(panOffset.current.x + gs.dx);
                posY.setValue(panOffset.current.y + gs.dy);
            },
            onPanResponderRelease: (_, gs) => {
                const releaseX = panOffset.current.x + gs.dx;
                const releaseY = panOffset.current.y + gs.dy;

                // Snap to nearest horizontal edge
                const snapX = releaseX + PARTICLE_SIZE / 2 < SCREEN_WIDTH / 2
                    ? MARGIN
                    : SCREEN_WIDTH - PARTICLE_SIZE - MARGIN;

                // Clamp vertically within safe zone
                const snapY = Math.min(
                    Math.max(releaseY, EXCLUSION_ZONE),
                    SCREEN_HEIGHT - EXCLUSION_ZONE - PARTICLE_SIZE
                );

                panOffset.current = { x: snapX, y: snapY };

                Animated.parallel([
                    Animated.spring(posX, { toValue: snapX, useNativeDriver: false, velocity: gs.vx, tension: 50, friction: 9 }),
                    Animated.spring(posY, { toValue: snapY, useNativeDriver: false, velocity: gs.vy, tension: 50, friction: 9 }),
                ]).start();
            },
        })
    ).current;

    // State-driven visuals
    const gradientColors: [string, string] = isPlaying
        ? ['rgba(139,92,246,0.95)', 'rgba(167,139,250,0.8)']
        : proximityStatus === 'READY'
        ? ['rgba(16,185,129,0.92)', 'rgba(52,211,153,0.78)']
        : proximityStatus === 'APPROACHING'
        ? ['rgba(245,158,11,0.92)', 'rgba(251,191,36,0.78)']
        : ['rgba(79,70,229,0.88)',  'rgba(99,102,241,0.72)'];

    const shadowColor = isPlaying
        ? '#8B5CF6'
        : proximityStatus === 'READY'      ? '#10B981'
        : proximityStatus === 'APPROACHING' ? '#F59E0B'
        : '#6366F1';

    const iconName: any = isPlaying
        ? 'pause'
        : proximityStatus === 'READY'
        ? 'musical-notes'
        : 'headset';

    return (
        // ── Outer: position only — useNativeDriver: false
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.outerContainer,
                {
                    shadowColor,
                    transform: [
                        { translateX: posX },
                        { translateY: posY },
                    ],
                },
            ]}
        >
            {/* ── Inner: scale + opacity — useNativeDriver: true */}
            <Animated.View
                style={{
                    transform: [{ scale: pulseAnim }],
                    opacity: opacityAnim,
                    borderRadius: PARTICLE_SIZE / 2,
                    overflow: 'hidden',
                }}
            >
                <BlurView intensity={20} tint="light" style={styles.blurContainer}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <Ionicons name={iconName} size={24} color="#FFFFFF" />

                        {isPlaying && <View style={styles.playingDot} />}

                        {proximityStatus === 'READY' && !isPlaying && (
                            <Text style={styles.readyLabel}>NOW</Text>
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
        top: 0,
        left: 0,
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
        borderColor: 'rgba(255,255,255,0.45)',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playingDot: {
        position: 'absolute',
        bottom: 11,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        opacity: 0.9,
    },
    readyLabel: {
        position: 'absolute',
        bottom: 8,
        fontSize: 7,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.8,
    },
});
