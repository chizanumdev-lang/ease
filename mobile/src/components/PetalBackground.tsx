import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

/**
 * PetalBackground renders blurred overlapping shapes 
 * to create the "Organic Growth" background effect from the design.
 */
export default function PetalBackground() {
    const { colors, isDark } = useTheme();

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* The Blobs */}
            <View style={styles.blobsContainer}>
                {/* Petal 1 - Top Left */}
                <View 
                    style={[
                        styles.petal,
                        styles.petal1,
                        { 
                            backgroundColor: colors.primary,
                            opacity: isDark ? 0.3 : 0.15
                        }
                    ]} 
                />
                
                {/* Petal 2 - Top Right */}
                <View 
                    style={[
                        styles.petal,
                        styles.petal2,
                        { 
                            backgroundColor: colors.primaryContainer,
                            opacity: isDark ? 0.4 : 0.25
                        }
                    ]} 
                />

                {/* Petal 3 - Mid Right */}
                <View 
                    style={[
                        styles.petal,
                        styles.petal3,
                        { 
                            backgroundColor: colors.secondaryContainer,
                            opacity: isDark ? 0.5 : 0.35
                        }
                    ]} 
                />
            </View>

            {/* The Blur Effect Overlay */}
            <BlurView 
                intensity={Platform.OS === 'ios' ? 80 : 100} 
                tint={isDark ? 'dark' : 'light'} 
                style={StyleSheet.absoluteFill} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    blobsContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    petal: {
        position: 'absolute',
        borderRadius: 140, // Highly rounded for organic look
    },
    petal1: {
        width: 300,
        height: 300,
        top: -60,
        left: -60,
        transform: [{ rotate: '-15deg' }],
    },
    petal2: {
        width: 350,
        height: 350,
        top: -140,
        right: -80,
        transform: [{ rotate: '45deg' }],
    },
    petal3: {
        width: 280,
        height: 280,
        top: 40,
        right: -40,
        transform: [{ rotate: '120deg' }],
    },
});
