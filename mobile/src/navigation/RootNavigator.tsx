import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { notificationService } from '../services/notification.service';
import { createNavigationContainerRef } from '@react-navigation/native';
import GlobalModal from '../components/stitch/GlobalModal';
import LoadingState from '../components/LoadingState';
import { useAudioStore } from '../store/audioStore';
import AudioParticle from '../components/audio/AudioParticle';
import { notifeeService } from '../services/notifee.service';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
  const setEbbFactor = useAudioStore((state) => state.setEbbFactor);

  const onNavigationStateChange = () => {
    const routeName = navigationRef.getCurrentRoute()?.name;
    // Check nested routes as well
    const currentParams = navigationRef.getCurrentRoute()?.params as
      | Record<string, unknown>
      | undefined;
    const nestedRouteName =
      currentParams &&
      typeof currentParams === 'object' &&
      'screen' in currentParams
        ? (currentParams.screen as string)
        : undefined;

    const isEbbScreen =
      ['VideoLesson', 'Quiz', 'ProgramPreview'].includes(routeName || '') ||
      ['VideoLesson', 'Quiz'].includes(nestedRouteName || '');

    setEbbFactor(isEbbScreen ? 0.2 : 1.0);
  };

  React.useEffect(() => {
    console.log('[NAV] RootNavigator mounted, calling loadUser');
    void loadUser();

    // Safety timeout: if we're still loading after 5 seconds, force it to false
    const timer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn('[NAV] Loading took too long, forcing isLoading to false');
        useAuthStore.setState({ isLoading: false });
      }
    }, 5000);

    // Register and sync push notifications
    void notificationService.syncPushToken();

    // Handle notification responses
    notificationService.addResponseListener((response) => {
      const data = response.notification.request.content.data;
      const actionIdentifier = response.actionIdentifier;

      console.log(
        '[NAV] Notification received:',
        data,
        'Action:',
        actionIdentifier,
      );

      if (data.type === 'task' && data.taskId) {
        // Navigate to Task screen
        if (navigationRef.isReady()) {
          // @ts-expect-error Types are not fully statically analyzable here
          navigationRef.navigate('Main', {
            screen: 'Task',
            params: { taskId: data.taskId },
          });
        }
      } else if (data.type === 'ritual' && data.ritualType) {
        // Get ritual tracks from store
        const ritualTracks = useAudioStore.getState().ritualTracks;
        const track =
          data.ritualType === 'morning'
            ? ritualTracks.morning
            : ritualTracks.night;

        if (track && navigationRef.isReady()) {
          // Load and play immediately if 'play' action was pressed
          if (
            actionIdentifier === 'play' ||
            actionIdentifier === 'expo.modules.notifications.actions.DEFAULT'
          ) {
            void useAudioStore
              .getState()
              .loadTrack(track)
              .then(() => {
                void useAudioStore.getState().play();
              });

            // @ts-expect-error Types are not fully statically analyzable here
            navigationRef.navigate('Main', {
              screen: 'AudioPlayer',
              params: { track },
            });
          }
        }
      } else if (data.type === 'audio' && data.trackId) {
        // Navigate to AudioPlayer
        if (navigationRef.isReady()) {
          // @ts-expect-error Types are not fully statically analyzable here
          navigationRef.navigate('Main', {
            screen: 'AudioPlayer',
            params: {
              track: {
                id: data.trackId,
                title: 'Evening Reflection',
                url: '',
                dayPlanId: '',
              },
            },
          });
        }
      }
    });

    return () => {
      clearTimeout(timer);
      notificationService.removeListeners();
    };
  }, []);

  React.useEffect(() => {
    console.log(
      '[NAV] State changed - isAuth:',
      isAuthenticated,
      'isLoading:',
      isLoading,
      'user:',
      !!user,
      'onboardingCompleted:',
      user?.settings?.onboardingCompleted,
    );
  }, [isAuthenticated, isLoading, user]);

  const settings = user?.settings as
    | {
        sleepWindow?: { start?: string };
        notifications?: { nightAudio?: boolean };
      }
    | undefined;
  const sleepWindowStart = settings?.sleepWindow?.start;
  const nightAudio = settings?.notifications?.nightAudio;

  React.useEffect(() => {
    if (sleepWindowStart && nightAudio !== false) {
      void notifeeService.scheduleNightlySubliminals(sleepWindowStart);
    } else {
      void notifeeService.cancelNightlySubliminals();
    }
  }, [sleepWindowStart, nightAudio]);

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
    <NavigationContainer
      ref={navigationRef}
      onStateChange={onNavigationStateChange}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && hasCompletedOnboarding ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
      <GlobalModal />
      {isAuthenticated &&
        hasCompletedOnboarding &&
        user?.settings?.showFloatingBubble !== false && <AudioParticle />}
    </NavigationContainer>
  );
}
