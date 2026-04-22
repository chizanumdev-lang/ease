import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { colors, spacing, borderRadius, fonts, shadows, isDark } = useTheme();
  const { showModal } = useModalStore();
  const { logout, loadUser } = useAuthStore();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pasteCode = text.slice(0, 6).split('');
      const newCode = [...code];
      pasteCode.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char;
      });
      setCode(newCode);
      if (pasteCode.length === 6) {
          inputs.current[5]?.focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const { user } = useAuthStore();
  const isVerified = user?.isVerified === true;

  useEffect(() => {
    if (isVerified) {
      // Small delay to let the success modal be seen
      const timer = setTimeout(() => {
        // RootNavigator/AuthStack will handle the switch
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isVerified]);

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      showModal({
        type: 'error',
        title: 'Invalid Code',
        description: 'Please enter the 6-digit code sent to your email.',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await authService.verifyEmail(email, fullCode);
      
      showModal({
        type: 'success',
        title: 'Success',
        description: 'Email verified successfully!',
      });
      
      // Reload user to get updated isVerified status from API
      await loadUser(true);
    } catch (err: any) {
      showModal({
        type: 'error',
        title: 'Verification Failed',
        description: err.response?.data?.message || 'Invalid or expired code',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await (authService as any).resendVerificationCode(email);
      setTimer(60);
      showModal({
        type: 'success',
        title: 'Code Sent',
        description: 'A new verification code has been sent to your email.',
      });
    } catch (err: any) {
      showModal({
        type: 'error',
        title: 'Error',
        description: 'Failed to resend code. Please try again later.',
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
            <Text style={[styles.title, { fontFamily: fonts.display, color: colors.onSurface }]}>Check your email</Text>
            <Text style={[styles.subtitle, { fontFamily: fonts.body, color: colors.onSurfaceVariant }]}>
              We've sent a 6-digit verification code to{'\n'}
              <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{email}</Text>
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: colors.surfaceContainer,
                    color: colors.onSurface,
                    borderColor: digit ? colors.primary : colors.surfaceContainerHighest,
                    fontFamily: fonts.display,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6} // For paste support
                textAlign="center"
              />
            ))}
          </View>

          <StitchButton
            title="Verify Email"
            onPress={handleVerify}
            isLoading={isVerifying}
            variant="primary"
            style={styles.verifyButton}
          />

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.onSurfaceVariant, fontFamily: fonts.body }]}>
              Didn't receive the code?
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
                  <Text style={[styles.resendLink, { color: colors.primary, fontFamily: fonts.display }]}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
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
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 8,
  },
  codeInput: {
    width: 48,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: 'bold',
  },
  verifyButton: {
    marginBottom: 24,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
