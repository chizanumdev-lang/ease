import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../constants/theme';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await login(email, password);
        } catch (err) {
            Alert.alert('Login Failed', error || 'Something went wrong');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Welcome Back</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.textContent}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Login to continue your journey</Text>
                </View>

                <View style={styles.formCard}>
                    <StitchInput
                        label="Email Address"
                        placeholder="name@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <StitchInput
                        label="Password"
                        placeholder="Your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <StitchButton
                        title="Login"
                        onPress={handleLogin}
                        isLoading={isLoading}
                        style={styles.loginButton}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.footerText}>
                            Don't have an account? <Text style={styles.footerLink}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 20,
        color: Theme.colors.slate[900],
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.colors.slate[900],
    },
    scrollContent: {
        paddingHorizontal: Theme.spacing.xl,
        paddingTop: Theme.spacing.xxl,
        paddingBottom: Theme.spacing.xl,
    },
    textContent: {
        alignItems: 'center',
        marginBottom: Theme.spacing.xxl,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Theme.colors.text.light,
        marginBottom: Theme.spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.text.muted,
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.xl,
        padding: Theme.spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: Theme.colors.slate[200],
    },
    loginButton: {
        marginTop: Theme.spacing.md,
        height: 60,
    },
    footer: {
        marginTop: Theme.spacing.xxl,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: Theme.colors.text.muted,
    },
    footerLink: {
        color: Theme.colors.primary,
        fontWeight: '700',
    },
});
