import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';
import Logo from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const { colors, spacing, borderRadius, fonts, shadows, isDark } = useTheme();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        try {
            await login(email, password);
            // Navigation is handled by RootNavigator observing auth state
        } catch (err: any) {
            let errorMessage = 'Something went wrong';
            if (err.response) {
                errorMessage = err.response.data?.message || 'Invalid credentials';
            } else if (err.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = err.message || 'Login failed';
            }
            Alert.alert('Login Failed', errorMessage);
        }
    };

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
                        <Logo size={80} style={styles.logo} />
                        <Text style={[styles.brandName, { fontFamily: fonts.display, color: colors.onSurface }]}>EASE</Text>
                        <Text style={[styles.welcomeText, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
                            Welcome back. Let's continue your journey.
                        </Text>
                    </View>

                    <View style={[styles.formContainer, { paddingHorizontal: spacing.xl }]}>
                        <StitchInput
                            label="Email or Phone"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <StitchInput
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={[styles.forgotPasswordText, { fontFamily: fonts.label, color: colors.primary }]}>
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        <StitchButton
                            title="Log In"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            variant="primary"
                            style={styles.loginButton}
                        />

                        <View style={styles.dividerContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
                            <Text style={[styles.dividerText, { fontFamily: fonts.label, color: colors.onSurfaceVariant }]}>
                                or continue with
                            </Text>
                            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                                <Ionicons name="logo-google" size={24} color={colors.onSurface} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                                <Ionicons name="logo-apple" size={24} color={colors.onSurface} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={[styles.footerText, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
                                Don't have an account? <Text style={[styles.footerLink, { color: colors.primary, fontFamily: fonts.display }]}>Create Account</Text>
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
        marginTop: 60,
        marginBottom: 40,
    },
    logo: {
        marginBottom: 16,
    },
    brandName: {
        fontSize: 32,
        letterSpacing: 2,
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    formContainer: {
        width: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginVertical: 12,
    },
    forgotPasswordText: {
        fontSize: 14,
    },
    loginButton: {
        marginTop: 20,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    divider: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    socialButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
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
