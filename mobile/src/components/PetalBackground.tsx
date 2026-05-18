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
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
            {/* The Blobs */}
            <View style={styles.blobsContainer}>
                {/* Petal 1 - Top Left (Sage) */}
                <View 
                    style={[
                        styles.petal,
                        styles.petal1,
                        { 
                            backgroundColor: colors.primaryLight || '#4a5d4e',
                            opacity: 0.08
                        }
                    ]} 
                />
                
                {/* Petal 2 - Bottom Right (Clay) */}
                <View 
                    style={[
                        styles.petal,
                        styles.petal2,
                        { 
                            backgroundColor: '#5c3913',
                            opacity: 0.04
                        }
                    ]} 
                />

                {/* Petal 3 - Center (Mint/Sage) */}
                <View 
                    style={[
                        styles.petal,
                        styles.petal3,
                        { 
                            backgroundColor: '#b7ccb9',
                            opacity: 0.1
                        }
                    ]} 
                />
            </View>

            {/* The Blur Effect Overlay */}
            <BlurView 
                intensity={Platform.OS === 'ios' ? 40 : 60} 
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
        borderRadius: 200,
    },
    petal1: {
        width: 400,
        height: 400,
        top: -100,
        left: -100,
    },
    petal2: {
        width: 500,
        height: 500,
        bottom: -150,
        right: -100,
    },
    petal3: {
        width: 600,
        height: 600,
        top: '20%',
        left: '10%',
    },
});

