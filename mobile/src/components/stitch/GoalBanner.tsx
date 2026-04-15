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
                colors={isDark ? ['#163a2f', '#225344'] : ['#225344', '#3b6b5b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBg}
            >
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <View style={styles.badge}>
                            <Text style={[styles.badgeText, { color: '#fff' }]}>
                                {phase.toUpperCase()}
                            </Text>
                        </View>
                        
                        <View style={styles.progressContainer}>
                            <Svg width={size} height={size} style={styles.svg}>
                                <Circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    stroke="rgba(255, 255, 255, 0.2)"
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

                    <Text style={[styles.title, { color: '#fff', fontFamily: fonts.display }]}>
                        {title}
                    </Text>

                    {/* Glassmorphism card for subtitle */}
                    <StitchCard 
                        variant="glass" 
                        padding="md" 
                        borderRadius={20}
                        style={styles.subtitleCard}
                    >
                        <Text style={[styles.subtitle, { color: isDark ? '#fff' : colors.onSurface, fontFamily: fonts.body }]}>
                            {subtitle}
                        </Text>
                    </StitchCard>
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
        minHeight: 220,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
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
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
        marginVertical: 16,
        maxWidth: '80%',
    },
    subtitleCard: {
        marginTop: 8,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
});
