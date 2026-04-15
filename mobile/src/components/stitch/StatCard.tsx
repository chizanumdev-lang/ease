import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import StitchCard from './StitchCard';

interface StatCardProps {
    label: string;
    value: string;
    unit?: string;
    icon: keyof typeof Ionicons.glyphMap;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    color?: string;
}

export default function StatCard({
    label,
    value,
    unit,
    icon,
    trend,
    color,
}: StatCardProps) {
    const { colors, fonts, spacing } = useTheme();
    const activeColor = color || colors.primary;

    return (
        <StitchCard 
            variant="tonal" 
            padding="lg" 
            style={styles.card}
            borderRadius={28}
        >
            <View style={styles.header}>
                <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.label }]}>
                    {label.toUpperCase()}
                </Text>
                <Ionicons name={icon} size={16} color={activeColor} />
            </View>
            
            <View style={styles.content}>
                <Text style={[styles.value, { color: activeColor, fontFamily: fonts.display }]}>
                    {value}
                    {unit && <Text style={styles.unit}> {unit}</Text>}
                </Text>
            </View>

            {trend && (
                <View style={styles.trendRow}>
                    <Ionicons 
                        name={trend.isPositive ? "trending-up" : "trending-down"} 
                        size={14} 
                        color={trend.isPositive ? (activeColor === colors.primary ? colors.primary : '#10b981') : colors.error} 
                    />
                    <Text 
                        style={[
                            styles.trendText, 
                            { 
                                color: trend.isPositive ? (activeColor === colors.primary ? colors.primary : '#10b981') : colors.error,
                                fontFamily: fonts.bodyMedium 
                            }
                        ]}
                    >
                        {trend.value}
                    </Text>
                </View>
            )}
        </StitchCard>
    );
}

const styles = StyleSheet.create({
    card: {
        width: 160,
        marginRight: 12,
        justifyContent: 'space-between',
        minHeight: 140,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    value: {
        fontSize: 28,
        fontWeight: '800',
    },
    unit: {
        fontSize: 14,
        fontWeight: '700',
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
