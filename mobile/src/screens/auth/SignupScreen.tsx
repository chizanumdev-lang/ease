import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../constants/theme';
import StitchButton from '../../components/StitchButton';
import StitchInput from '../../components/StitchInput';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const { signup, isLoading, error } = useAuthStore();

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
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
            } else if (err.message) {
                errorMessage = err.message;
            }
            Alert.alert('Signup Failed', errorMessage);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.stepIndicator}>Step 2 of 9</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.textContent}>
                    <Text style={styles.title}>Join EASE</Text>
                    <Text style={styles.subtitle}>Begin your path to calm and consistent growth.</Text>
                </View>

                <View style={styles.formCard}>
                    <StitchInput
                        label="Full Name"
                        placeholder="Your name"
                        value={name}
                        onChangeText={setName}
                    />
                    <StitchInput
                        label="Email Address"
                        placeholder="name@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <StitchInput
                        label="Create Password"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <StitchButton
                        title="Start My Journey"
                        onPress={handleSignup}
                        isLoading={isLoading}
                        variant="secondary"
                        style={styles.signupButton}
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.footerText}>
                            Already have an account? <Text style={styles.footerLink}>Log In</Text>
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.legalText}>
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </Text>
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
    stepIndicator: {
        fontSize: 12,
        fontWeight: '700',
        color: Theme.colors.slate[400],
        textTransform: 'uppercase',
        letterSpacing: 1,
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
    signupButton: {
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
        color: Theme.colors.accent,
        fontWeight: '700',
    },
    legalText: {
        fontSize: 10,
        color: Theme.colors.slate[400],
        textAlign: 'center',
        marginTop: Theme.spacing.xl,
        paddingHorizontal: Theme.spacing.lg,
    },
});
