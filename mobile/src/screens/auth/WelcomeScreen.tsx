import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const bgColor = isDark ? Theme.colors.background.dark : Theme.colors.background.light;
    const textColor = isDark ? Theme.colors.text.dark : Theme.colors.text.light;
    const mutedTextColor = isDark ? Theme.colors.text.mutedDark : Theme.colors.text.muted;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={styles.iconBg}>
                        <Ionicons name="sparkles" size={20} color={Theme.colors.primary} />
                    </View>
                    <Text style={[styles.logoText, { color: textColor }]}>EASE</Text>
                </View>
                <TouchableOpacity>
                    <Text style={[styles.helpText, { color: mutedTextColor }]}>Help</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                {/* Hero Illustration */}
                <View style={styles.heroContainer}>
                    <View style={[styles.glow, styles.glowLarge]} />
                    <View style={[styles.illustrationBox, { backgroundColor: isDark ? 'rgba(66, 17, 212, 0.1)' : 'rgba(66, 17, 212, 0.05)' }]}>
                        <Ionicons name="trail-sign-outline" size={100} color={Theme.colors.primary} style={{ opacity: 0.8 }} />
                        <View style={[styles.glow, styles.glowSmall, { top: -10, right: -10 }]} />
                        <View style={[styles.glow, styles.glowMedium, { bottom: -20, left: -20 }]} />
                    </View>
                </View>

                {/* Text Content */}
                <View style={styles.textContent}>
                    <Text style={[styles.title, { color: textColor }]}>
                        Build the habits{'\n'}that <Text style={{ color: Theme.colors.primary }}>build you.</Text>
                    </Text>
                    <Text style={[styles.subtitle, { color: mutedTextColor }]}>
                        Design personalized routines and experience intelligent guidance for a calmer, more productive life.
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Signup')}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.secondaryButton, { backgroundColor: isDark ? 'rgba(66, 17, 212, 0.1)' : '#e2e8f0' }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={[styles.secondaryButtonText, { color: textColor }]}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.dots}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={[styles.dot, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
                    <View style={[styles.dot, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBg: {
        backgroundColor: 'rgba(66, 17, 212, 0.15)',
        padding: 8,
        borderRadius: 10,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    helpText: {
        fontSize: 14,
        fontWeight: '600',
    },
    main: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    heroContainer: {
        width: width * 0.8,
        aspectRatio: 1,
        marginBottom: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    illustrationBox: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.2)',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        backgroundColor: Theme.colors.primary,
        borderRadius: 100,
        opacity: 0.2,
    },
    glowLarge: {
        width: 300,
        height: 300,
        filter: 'blur(60px)',
    },
    glowSmall: {
        width: 60,
        height: 60,
        filter: 'blur(20px)',
        opacity: 0.4,
    },
    glowMedium: {
        width: 100,
        height: 100,
        filter: 'blur(40px)',
        opacity: 0.2,
    },
    textContent: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 42,
        letterSpacing: -1,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: 10,
    },
    actions: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        height: 56,
        backgroundColor: Theme.colors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    dots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 24,
        backgroundColor: Theme.colors.primary,
    },
});
