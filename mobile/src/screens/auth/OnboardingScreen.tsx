import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Theme } from '../../constants/theme';
import StitchButton from '../../components/StitchButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: Props) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoEmoji}>✨</Text>
                    </View>
                    <Text style={styles.logoText}>EASE</Text>
                </View>
                <StitchButton
                    title="Help"
                    onPress={() => { }}
                    variant="ghost"
                    size="sm"
                    textStyle={styles.helpText}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.illustrationArea}>
                    <View style={styles.blob} />
                    <View style={styles.illustrationCard}>
                        <Text style={styles.illustrationEmoji}>📍</Text>
                    </View>
                </View>

                <View style={styles.textContent}>
                    <Text style={styles.title}>
                        Build the habits{"\n"}
                        that <Text style={styles.highlight}>build you.</Text>
                    </Text>
                    <Text style={styles.subtitle}>
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
                        style={styles.loginButton}
                    />

                    <View style={styles.pagination}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background.light,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.md,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        padding: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.md,
        marginRight: Theme.spacing.sm,
    },
    logoEmoji: {
        fontSize: 18,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.colors.text.light,
        letterSpacing: -0.5,
    },
    helpText: {
        color: Theme.colors.slate[400],
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Theme.spacing.xl,
    },
    illustrationArea: {
        width: width * 0.7,
        aspectRatio: 1,
        marginBottom: Theme.spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    blob: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(66, 17, 212, 0.15)',
        borderRadius: Theme.borderRadius.full,
        transform: [{ scale: 1.2 }],
    },
    illustrationCard: {
        width: '100%',
        height: '100%',
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    illustrationEmoji: {
        fontSize: 80,
    },
    textContent: {
        alignItems: 'center',
        marginBottom: Theme.spacing.xxl,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: Theme.colors.text.light,
        textAlign: 'center',
        lineHeight: 44,
        marginBottom: Theme.spacing.md,
    },
    highlight: {
        color: Theme.colors.primary,
    },
    subtitle: {
        fontSize: 17,
        color: Theme.colors.text.muted,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: Theme.spacing.md,
    },
    footer: {
        width: '100%',
        paddingBottom: Theme.spacing.xl,
    },
    mainButton: {
        marginBottom: Theme.spacing.md,
    },
    loginButton: {
        backgroundColor: Theme.colors.slate[200],
        borderWidth: 0,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Theme.spacing.xl,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Theme.colors.slate[300],
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: Theme.colors.primary,
    },
});
