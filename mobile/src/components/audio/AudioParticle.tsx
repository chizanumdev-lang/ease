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
import { useTheme } from '../../hooks/useTheme';

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
    const { colors, fonts, shadows, isDark } = useTheme();

    // ── Position — NOT native driver (layout computation required)
    const posX = useRef(new Animated.Value(INITIAL_X)).current;
    const posY = useRef(new Animated.Value(INITIAL_Y)).current;
    const panOffset = useRef({ x: INITIAL_X, y: INITIAL_Y });

    // ── Scale + Opacity — CAN use native driver (transform/opacity only)
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        fetchRituals();
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

                const snapX = releaseX + PARTICLE_SIZE / 2 < SCREEN_WIDTH / 2
                    ? MARGIN
                    : SCREEN_WIDTH - PARTICLE_SIZE - MARGIN;

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

    // State-driven visuals - Using theme tones where possible
    const gradientColors: [string, string] = isPlaying
        ? [colors.primary, colors.primaryContainer] 
        : proximityStatus === 'READY'
        ? ['rgba(16,185,129,0.92)', 'rgba(52,211,153,0.78)']
        : proximityStatus === 'APPROACHING'
        ? ['rgba(245,158,11,0.92)', 'rgba(251,191,36,0.78)']
        : [colors.secondary, colors.secondaryContainer];

    const iconName: any = isPlaying
        ? 'pause'
        : proximityStatus === 'READY'
        ? 'musical-notes'
        : 'headset';

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.outerContainer,
                {
                    ...shadows.ambient,
                    transform: [
                        { translateX: posX },
                        { translateY: posY },
                    ],
                },
            ]}
        >
            <Animated.View
                style={{
                    transform: [{ scale: pulseAnim }],
                    opacity: opacityAnim,
                    borderRadius: PARTICLE_SIZE / 2,
                    overflow: 'hidden',
                }}
            >
                <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <Ionicons name={iconName} size={24} color={isDark ? colors.background : colors.white} />

                        {isPlaying && <View style={[styles.playingDot, { backgroundColor: isDark ? colors.background : colors.white }]} />}

                        {proximityStatus === 'READY' && !isPlaying && (
                            <Text style={[styles.readyLabel, { fontFamily: fonts.display, color: isDark ? colors.background : colors.white }]}>NOW</Text>
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
    },
    blurContainer: {
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        borderRadius: PARTICLE_SIZE / 2,
        overflow: 'hidden',
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
        opacity: 0.9,
    },
    readyLabel: {
        position: 'absolute',
        bottom: 8,
        fontSize: 7,
        letterSpacing: 0.8,
    },
});

