import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OnboardingFlowScreen from '../screens/onboarding/OnboardingFlowScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
    const { isAuthenticated, user, requiresConfirmation } = useAuthStore();
    const hasCompletedOnboarding = user?.settings?.onboardingCompleted === true;

    console.log('[AUTH_STACK] isAuth:', isAuthenticated, 'requiresConfirmation:', requiresConfirmation, 'hasCompletedOnboarding:', hasCompletedOnboarding);

    // If signup was completed but email confirmation is pending, show verify screen
    if (requiresConfirmation && user?.email) {
        console.log('[AUTH_STACK] Showing VerifyEmail (awaiting Supabase confirmation)');
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="VerifyEmail"
                    component={VerifyEmailScreen}
                    initialParams={{ email: user.email }}
                />
            </Stack.Navigator>
        );
    }

    // If user is authenticated but hasn't completed onboarding, show onboarding flow
    if (isAuthenticated && !hasCompletedOnboarding) {
        console.log('[AUTH_STACK] Showing OnboardingFlow');
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="OnboardingFlow"
                    component={OnboardingFlowScreen}
                    options={{ headerShown: true, title: 'Setup Your Profile' }}
                />
            </Stack.Navigator>
        );
    }

    // Otherwise show normal auth screens
    console.log('[AUTH_STACK] Showing normal auth screens');
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </Stack.Navigator>
    );
}
