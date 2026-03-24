import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { TabParamList } from '../types';
import HomeScreen from '../screens/home/HomeScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import CoachScreen from '../screens/coach/CoachScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: Theme.colors.background.light }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: Theme.colors.primary,
                    tabBarInactiveTintColor: Theme.colors.text.muted,
                    tabBarStyle: styles.tabBar,
                    tabBarBackground: () => (
                        <BlurView
                            tint="light"
                            intensity={80}
                            style={StyleSheet.absoluteFill}
                        />
                    ),
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Home',
                        tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
                    }}
                />
                <Tab.Screen
                    name="Progress"
                    component={ProgressScreen}
                    options={{
                        tabBarLabel: 'Progress',
                        tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>📊</Text>,
                    }}
                />
                <Tab.Screen
                    name="Coach"
                    component={CoachScreen}
                    options={{
                        tabBarLabel: 'Coach',
                        tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>🤖</Text>,
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'Settings',
                        tabBarIcon: ({ color }: { color: string }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
                    }}
                />
            </Tab.Navigator>
            <MiniAudioPlayer />
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderTopWidth: 0,
        paddingBottom: 0, // Reset default padding
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        overflow: 'hidden', // Required for borderRadius + BlurView
    },
});
