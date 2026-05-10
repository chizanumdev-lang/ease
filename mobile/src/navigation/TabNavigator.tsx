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
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarStyle: styles.tabBar,
                    tabBarBackground: () => (
                        <BlurView
                            tint={isDark ? "dark" : "light"}
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
                        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="home-outline" size={20} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Progress"
                    component={ProgressScreen}
                    options={{
                        tabBarLabel: 'Evolve',
                        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="sparkles-outline" size={20} color={color} />,
                    }}
                />
                <Tab.Screen
                    name="Coach"
                    component={CoachScreen}
                    options={{
                        tabBarLabel: 'Coach',
                        tabBarIcon: ({ color }: { color: string }) => <Ionicons name="chatbubbles-outline" size={20} color={color} />,
                    }}
                />
            </Tab.Navigator>
            <MiniAudioPlayer />
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: 64,
        borderTopWidth: 0,
        elevation: 0,
    },
});
