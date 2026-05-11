import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';
import Logo from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';
import { useModalStore } from '../../store/modalStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
    const { colors, spacing, borderRadius, fonts, shadows, isDark } = useTheme();
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [acceptTerms, setAcceptTerms] = React.useState(false);
    const { signup, isSubmitting, error } = useAuthStore();
    const { showModal } = useModalStore();

    const handleSignup = async () => {
        if (!name || !email || !password) {
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Please fill in all fields'
            });
            return;
        }

        if (!acceptTerms) {
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Please accept the Terms and Conditions'
            });
            return;
        }

        if (password.length < 8) {
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Password must be at least 8 characters'
            });
            return;
        }

        try {
            await signup(email, password, name);
        } catch (err: any) {
            let errorMessage = 'Something went wrong';
            if (err.response) {
                errorMessage = err.response.data?.message || 'Server error';
            } else if (err.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = err.message || 'Signup failed';
            }
            showModal({
                type: 'error',
                title: 'Signup Failed',
                description: errorMessage
            });
        }
    };

    const getPasswordStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 8) strength += 0.25;
        if (/[A-Z]/.test(password)) strength += 0.25;
        if (/[0-9]/.test(password)) strength += 0.25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 0.25;
        return strength;
    };

    const strength = getPasswordStrength();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Logo size={60} style={styles.logo} />
                        <Text style={[styles.title, { fontFamily: fonts.display, color: colors.onSurface }]}>Join Ease</Text>
                        <Text style={[styles.subtitle, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
                            Start your journey today.
                        </Text>
                    </View>

                    <View style={[styles.formContainer, { paddingHorizontal: spacing.xl }]}>
                        <StitchInput
                            label="Full Name"
                            placeholder="Evelyn Rivers"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                        <StitchInput
                            label="Email"
                            placeholder="evelyn@serenity.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View style={styles.passwordContainer}>
                            <StitchInput
                                label="Password"
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            {password.length > 0 && (
                                <View style={styles.strengthIndicator}>
                                    <View style={styles.strengthTracks}>
                                        <View style={[styles.strengthTrack, { backgroundColor: strength >= 0.25 ? colors.primary : colors.surfaceContainerHighest }]} />
                                        <View style={[styles.strengthTrack, { backgroundColor: strength >= 0.5 ? colors.primary : colors.surfaceContainerHighest }]} />
                                        <View style={[styles.strengthTrack, { backgroundColor: strength >= 0.75 ? colors.primary : colors.surfaceContainerHighest }]} />
                                        <View style={[styles.strengthTrack, { backgroundColor: strength >= 1 ? colors.primary : colors.surfaceContainerHighest }]} />
                                    </View>
                                    <Text style={[styles.strengthText, { color: colors.primary, fontFamily: fonts.label }]}>
                                        {strength <= 0.25 ? 'Weak' : strength <= 0.5 ? 'Fair' : strength <= 0.75 ? 'Strong' : 'Perfect'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.termsRow}>
                            <Switch
                                value={acceptTerms}
                                onValueChange={setAcceptTerms}
                                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                            <Text style={[styles.termsText, { color: colors.onSurfaceVariant, fontFamily: fonts.body }]}>
                                I agree to the <Text style={{ color: colors.primary, fontWeight: '700' }}>Terms</Text> and <Text style={{ color: colors.primary, fontWeight: '700' }}>Privacy Policy</Text>.
                            </Text>
                        </View>

                        <StitchButton
                            title="Join Now"
                            onPress={handleSignup}
                            isLoading={isSubmitting}
                            variant="primary"
                            style={styles.signupButton}
                        />
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.footerText, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
                                Already have an account? <Text style={[styles.footerLink, { color: colors.primary, fontFamily: fonts.display }]}>Log In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    logo: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    formContainer: {
        width: '100%',
    },
    passwordContainer: {
        marginBottom: 8,
    },
    strengthIndicator: {
        marginTop: 8,
    },
    strengthTracks: {
        flexDirection: 'row',
        gap: 4,
        height: 4,
        marginBottom: 4,
    },
    strengthTrack: {
        flex: 1,
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 20,
    },
    termsText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    signupButton: {
        marginTop: 8,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontWeight: '700',
    },
});



