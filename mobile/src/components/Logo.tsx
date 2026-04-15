import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LogoProps {
    size?: number;
    style?: ViewStyle;
}

/**
 * The high-fidelity logo for EASE.
 * Uses a leaf icon inside a serene gradient container, matching the editorial design.
 */
export default function Logo({ size = 64, style }: LogoProps) {
    const { colors, isDark } = useTheme();

    // Use theme colors for the gradient
    const gradientColors = isDark 
        ? [colors.primary, colors.primaryContainer] as const
        : [colors.primary, '#3d7a66'] as const; // Slightly lighter primary for gradient

    return (
        <View 
            style={[
                styles.container, 
                { 
                    width: size, 
                    height: size, 
                }, 
                style
            ]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: size * 0.35 }
                ]}
            />
            <Ionicons 
                name="leaf" 
                size={size * 0.5} 
                color="#FFFFFF" 
            />
            {/* Subtle overlay for depth if in dark mode */}
            {isDark && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: size * 0.35 }]} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
});
