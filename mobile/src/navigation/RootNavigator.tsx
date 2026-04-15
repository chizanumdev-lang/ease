import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { notificationService } from '../services/notification.service';
import { createNavigationContainerRef } from '@react-navigation/native';
import GlobalModal from '../components/stitch/GlobalModal';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
    const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();

    React.useEffect(() => {
        console.log('[NAV] RootNavigator mounted, calling loadUser');
        loadUser();

        // Register for push notifications
        notificationService.registerForPushNotificationsAsync();

        // Handle notification responses
        const subscription = notificationService.addResponseListener(response => {
            const data = response.notification.request.content.data;
            console.log('[NAV] Notification received:', data);

            if (data.type === 'task' && data.taskId) {
                // Navigate to Task screen
                if (navigationRef.isReady()) {
                    // @ts-ignore - navigation types are tricky with nested stacks
                    navigationRef.navigate('Main', {
                        screen: 'Task',
                        params: { taskId: data.taskId }
                    });
                }
            } else if (data.type === 'audio' && data.trackId) {
                // Navigate to AudioPlayer
                if (navigationRef.isReady()) {
                    // @ts-ignore
                    navigationRef.navigate('Main', {
                        screen: 'AudioPlayer',
                        params: { track: { id: data.trackId, title: 'Evening Reflection', url: '', dayPlanId: '' } } 
                    });
                }
            }
        });

        return () => {
            notificationService.removeListeners();
        };
    }, []);

    React.useEffect(() => {
        console.log('[NAV] State changed - isAuth:', isAuthenticated, 'isLoading:', isLoading, 'user:', !!user, 'onboardingCompleted:', user?.settings?.onboardingCompleted);
    }, [isAuthenticated, isLoading, user]);

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const hasCompletedOnboarding = user?.settings?.onboardingCompleted === true;

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated && hasCompletedOnboarding ? (
                    <Stack.Screen name="Main" component={MainStack} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthStack} />
                )}
            </Stack.Navigator>
            <GlobalModal />
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
