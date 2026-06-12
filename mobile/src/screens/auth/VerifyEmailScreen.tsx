import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../../components/StitchButton';
import { useModalStore } from '../../store/modalStore';
import { authService } from '../../services/auth.service';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { colors, spacing, fonts, isDark } = useTheme();
  const { showModal } = useModalStore();
  const { logout, loadUser } = useAuthStore();

  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(30);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [timer]);

  // Listen for Supabase SIGNED_IN event — fires when user clicks the confirmation link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        showModal({
          type: 'success',
          title: 'Email Confirmed!',
          description: 'Your account is now active.',
        });
        // Load the full user profile from NestJS
        await loadUser(true);
        // AuthStore will set isAuthenticated = true → navigation switches to Main/Onboarding
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendVerificationCode(email);
      setTimer(60);
      showModal({
        type: 'success',
        title: 'Email Sent',
        description: 'A new confirmation email has been sent.',
      });
    } catch (err: any) {
      showModal({
        type: 'error',
        title: 'Error',
        description: 'Failed to resend email. Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.content, { paddingHorizontal: spacing.xl }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="mail-open" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { fontFamily: fonts.display, color: colors.onSurface }]}>
              Check your email
            </Text>
            <Text style={[styles.subtitle, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
              We've sent a confirmation link to{'\n'}
              <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{email}</Text>
            </Text>
            <Text style={[styles.instruction, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
              Click the link in the email to activate your account. This screen will update automatically.
            </Text>
          </View>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.onSurfaceVariant, fontFamily: fonts.body }]}>
              Didn't receive the email?
            </Text>
            {timer > 0 ? (
              <Text style={[styles.timerText, { color: colors.primary, fontFamily: fonts.label }]}>
                Resend in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.resendLink, { color: colors.primary, fontFamily: fonts.display }]}>
                    Resend Email
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <StitchButton
            title="Back to Sign In"
            onPress={handleLogout}
            variant="secondary"
            style={styles.backBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 20 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  instruction: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  resendText: { fontSize: 14 },
  resendLink: { fontSize: 14, fontWeight: '700' },
  timerText: { fontSize: 14, fontWeight: '600' },
  backBtn: { marginTop: 8 },
});
