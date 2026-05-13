import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import StitchCard from './StitchCard';

interface GoalBannerProps {
    title: string;
    subtitle: string;
    progress: number; // 0 to 1
    phase: string;
}

const { width } = Dimensions.get('window');

export default function GoalBanner({
    title,
    subtitle,
    progress,
    phase,
}: GoalBannerProps) {
    const { colors, fonts, isDark } = useTheme();
    
    // SVG Circle constants
    const size = 64;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - progress * circumference;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={(colors.gradients?.primary || ['#6366f1', '#a855f7']) as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBg}
            >
                <View style={styles.mainRow}>
                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: '#fff', fontFamily: fonts.display }]}>
                            {title}
                        </Text>
                        <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.8)', fontFamily: fonts.body }]}>
                            {subtitle}
                        </Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <Svg width={size} height={size} style={styles.svg}>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="rgba(255, 255, 255, 0.15)"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="#fff"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                fill="transparent"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            />
                        </Svg>
                        <View style={styles.progressTextContainer}>
                            <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 32,
        overflow: 'hidden',
        marginBottom: 24,
    },
    gradientBg: {
        padding: 24,
        minHeight: 160,
        justifyContent: 'center',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        marginRight: 16,
    },
    progressContainer: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    svg: {
        position: 'absolute',
    },
    progressTextContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentageText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
});
