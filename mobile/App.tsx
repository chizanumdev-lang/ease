import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { 
    Manrope_400Regular, 
    Manrope_500Medium, 
    Manrope_700Bold 
} from '@expo-google-fonts/manrope';
import { 
    Inter_400Regular, 
    Inter_500Medium, 
    Inter_600SemiBold 
} from '@expo-google-fonts/inter';

import RootNavigator from './src/navigation/RootNavigator';
import { Theme } from './src/constants/theme';
import { secureStorage } from './src/services/storage.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// NUCLEAR RESET: Implementation complete, clearing temporary code
// secureStorage.clearTokens().then(() => AsyncStorage.clear());

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Handle notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import * as Sentry from '@sentry/react-native';

// Initialize Sentry
Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    tracesSampleRate: 1.0,
});

function App() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            console.log('[APP] prepare start');
            try {
                console.log('[APP] Loading fonts...');
                await Font.loadAsync({
                    Manrope_400Regular,
                    Manrope_500Medium,
                    Manrope_700Bold,
                    Inter_400Regular,
                    Inter_500Medium,
                    Inter_600SemiBold,
                });
                console.log('[APP] Fonts loaded');
            } catch (e) {
                console.warn('[APP] prepare error:', e);
            } finally {
                console.log('[APP] setting appIsReady: true');
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            // This tells the splash screen to hide immediately! If we need this after
            // some extra initial loading we can postpone it.
            await SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    if (!appIsReady) {
        return null;
    }

    return (
        <View 
            style={[styles.container, { backgroundColor: Theme.colors.background.light }]} 
            onLayout={onLayoutRootView}
        >
            <RootNavigator />
            <StatusBar style="dark" />
        </View>
    );
}

export default Sentry.wrap(App);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

