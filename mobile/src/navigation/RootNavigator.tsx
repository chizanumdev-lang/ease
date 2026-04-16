import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { View, StyleSheet } from 'react-native';
import { notificationService } from '../services/notification.service';
import { createNavigationContainerRef } from '@react-navigation/native';
import GlobalModal from '../components/stitch/GlobalModal';
import LoadingState from '../components/LoadingState';
import { AudioParticle } from '../components/audio/AudioParticle';
import { useAudioStore } from '../store/audioStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
    const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
    const setEbbFactor = useAudioStore(state => state.setEbbFactor);

    const onNavigationStateChange = () => {
        const routeName = navigationRef.getCurrentRoute()?.name;
        // Check nested routes as well
        const currentParams = navigationRef.getCurrentRoute()?.params as any;
        const nestedRouteName = currentParams?.screen;

        const isEbbScreen = [
            'VideoLesson', 
            'Quiz',
            'ProgramPreview'
        ].includes(routeName || '') || [
            'VideoLesson', 
            'Quiz'
        ].includes(nestedRouteName || '');

        setEbbFactor(isEbbScreen ? 0.2 : 1.0);
    };

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
            <LoadingState 
                title="Ease" 
                subtitle="Initializing your personalized focus engine."
                variant="full"
            />
        );
    }

    const hasCompletedOnboarding = user?.settings?.onboardingCompleted === true;

    return (
        <NavigationContainer ref={navigationRef} onStateChange={onNavigationStateChange}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated && hasCompletedOnboarding ? (
                    <Stack.Screen name="Main" component={MainStack} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthStack} />
                )}
            </Stack.Navigator>
            <GlobalModal />
            {isAuthenticated && hasCompletedOnboarding && <AudioParticle />}
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
