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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load fonts, make any API calls you need to do here
                await Font.loadAsync({
                    Manrope_400Regular,
                    Manrope_500Medium,
                    Manrope_700Bold,
                    Inter_400Regular,
                    Inter_500Medium,
                    Inter_600SemiBold,
                });
            } catch (e) {
                console.warn(e);
            } finally {
                // Tell the application to render
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

