import React from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, ImageBackground } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
    title?: string;
    subtitle?: string;
    variant?: 'full' | 'compact' | 'component';
}

const CIRCUMFERENCE = 2 * Math.PI * 70;

export default function LoadingState({ 
    title = "Preparing your space", 
    subtitle = "Take a deep breath while we curate your morning insights.",
    variant = 'full'
}: Props) {
    const { colors, spacing, fonts, isDark } = useTheme();
    const rotateAnim = React.useRef(new Animated.Value(0)).current;
    const dashOffsetAnim = React.useRef(new Animated.Value(CIRCUMFERENCE)).current;

    React.useEffect(() => {
        // Dash Offset Animation (mimicking the 0% -> 50% -> 100% flow)
        Animated.loop(
            Animated.sequence([
                Animated.timing(dashOffsetAnim, {
                    toValue: CIRCUMFERENCE * 0.25, // 50% step in CSS (110 / 440 is ~0.25)
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(dashOffsetAnim, {
                    toValue: CIRCUMFERENCE,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (variant === 'component') {
        return (
            <View style={styles.componentContainer}>
                <View style={styles.animationContainer}>
                    <Animated.View style={[styles.svgWrapper, { transform: [{ rotate: rotation }] }]}>
                        <Svg width="120" height="120" viewBox="0 0 160 160">
                            <Circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={colors.primary}
                                strokeWidth="2"
                                fill="transparent"
                                opacity={0.1}
                            />
                            <AnimatedCircle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={colors.primary}
                                strokeWidth="2"
                                fill="transparent"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={dashOffsetAnim}
                                strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                    <View style={[styles.logoCircleSmall, { backgroundColor: isDark ? colors.surfaceContainerLow : colors.surface }]}>
                        <Text style={[styles.logoTextSmall, { color: colors.primary, fontFamily: fonts.display }]}>E</Text>
                    </View>
                </View>
                <View style={styles.textContainerSmall}>
                    <Text style={[styles.titleSmall, { color: colors.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.subtitleSmall, { color: colors.textMuted }]}>{subtitle}</Text>}
                </View>
            </View>
        );
    }

    if (variant === 'compact') {
        return (
            <View style={styles.compactContainer}>
                <Animated.View style={[styles.svgWrapperSmall, { transform: [{ rotate: rotation }] }]}>
                    <Svg width="40" height="40" viewBox="0 0 160 160">
                        <Circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={colors.primary}
                            strokeWidth="4"
                            fill="transparent"
                            opacity={0.1}
                        />
                        <AnimatedCircle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={colors.primary}
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={dashOffsetAnim}
                            strokeLinecap="round"
                        />
                    </Svg>
                </Animated.View>
                {title && <Text style={[styles.compactText, { color: colors.text }]}>{title}</Text>}
            </View>
        );
    }

    return (
        <View style={[styles.fullContainer, { backgroundColor: colors.background }]}>
            {/* Background Texture Overlay (Placeholder or Generated) */}
            <View style={[styles.absolute, { opacity: 0.03, backgroundColor: colors.primary }]} />
            
            <View style={styles.content}>
                <View style={styles.animationContainer}>
                    <Animated.View style={[styles.svgWrapper, { transform: [{ rotate: rotation }] }]}>
                        <Svg width="160" height="160" viewBox="0 0 160 160">
                            <Circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={colors.primary}
                                strokeWidth="1.5"
                                fill="transparent"
                                opacity={0.1}
                            />
                            <AnimatedCircle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke={colors.primary}
                                strokeWidth="1.5"
                                fill="transparent"
                                strokeDasharray={CIRCUMFERENCE}
                                strokeDashoffset={dashOffsetAnim}
                                strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                    <View style={[styles.logoCircle, { backgroundColor: isDark ? colors.surfaceContainerLow : colors.surface }]}>
                        <Text style={[styles.logoText, { color: colors.primary, fontFamily: fonts.display }]}>EASE</Text>
                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>{subtitle}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    absolute: {
       ...StyleSheet.absoluteFillObject,
    },
    content: {
        alignItems: 'center',
    },
    animationContainer: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    svgWrapper: {
        width: 160,
        height: 160,
    },
    logoCircle: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -2,
    },
    textContainer: {
        marginTop: 64,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    svgWrapperSmall: {
        width: 40,
        height: 40,
    },
    compactText: {
        fontSize: 14,
        fontWeight: '500',
    },
    componentContainer: {
        alignItems: 'center',
        padding: 24,
    },
    logoCircleSmall: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    logoTextSmall: {
        fontSize: 24,
        fontWeight: '900',
    },
    textContainerSmall: {
        marginTop: 24,
        alignItems: 'center',
    },
    titleSmall: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitleSmall: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.7,
    }
});
