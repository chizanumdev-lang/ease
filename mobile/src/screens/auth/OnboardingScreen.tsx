import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../../components/StitchButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: Props) {
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={[styles.logoIcon, { backgroundColor: colors.surfaceContainerLow }]}>
                        <Text style={styles.logoEmoji}>✨</Text>
                    </View>
                    <Text style={[styles.logoText, { color: colors.text }]}>EASE</Text>
                </View>
                <StitchButton
                    title="Help"
                    onPress={() => { }}
                    variant="ghost"
                    size="sm"
                    textStyle={[styles.helpText, { color: colors.textMuted }]}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.illustrationArea}>
                    <View style={[styles.blob, { backgroundColor: colors.primary, opacity: isDark ? 0.15 : 0.05 }]} />
                    <View style={[styles.illustrationCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }, shadows.ambient]}>
                        <Text style={styles.illustrationEmoji}>📍</Text>
                    </View>
                </View>

                <View style={styles.textContent}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Build the habits{"\n"}
                        that <Text style={[styles.highlight, { color: colors.primary }]}>build you.</Text>
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        Design personalized routines and experience intelligent guidance for a calmer, more productive life.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <StitchButton
                        title="Get Started"
                        onPress={() => navigation.navigate('Signup')}
                        style={styles.mainButton}
                    />
                    <StitchButton
                        title="Log In"
                        onPress={() => navigation.navigate('Login')}
                        variant="outline"
                        style={[styles.loginButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
                    />

                    <View style={styles.pagination}>
                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                        <View style={[styles.dot, { backgroundColor: colors.outlineVariant }]} />
                        <View style={[styles.dot, { backgroundColor: colors.outlineVariant }]} />
                    </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        padding: 8,
        borderRadius: 12,
        marginRight: 8,
    },
    logoEmoji: {
        fontSize: 18,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    },
    helpText: {
        fontSize: 14,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    illustrationArea: {
        width: width * 0.7,
        aspectRatio: 1,
        marginBottom: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blob: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 200,
        transform: [{ scale: 1.2 }],
    },
    illustrationCard: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustrationEmoji: {
        fontSize: 80,
    },
    textContent: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 44,
        marginBottom: 16,
        letterSpacing: -1,
    },
    highlight: {},
    subtitle: {
        fontSize: 17,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 10,
        fontWeight: '500',
    },
    footer: {
        width: '100%',
        paddingBottom: 32,
    },
    mainButton: {
        marginBottom: 12,
    },
    loginButton: {
        borderWidth: 1,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginHorizontal: 4,
    },
});
