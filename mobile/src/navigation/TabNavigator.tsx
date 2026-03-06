import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import HomeScreen from '../screens/home/HomeScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import CoachScreen from '../screens/coach/CoachScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import MiniAudioPlayer from '../components/MiniAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, paddingTop: insets.top }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#007AFF',
                    tabBarInactiveTintColor: '#999',
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Home',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
                    }}
                />
                <Tab.Screen
                    name="Progress"
                    component={ProgressScreen}
                    options={{
                        tabBarLabel: 'Progress',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
                    }}
                />
                <Tab.Screen
                    name="Coach"
                    component={CoachScreen}
                    options={{
                        tabBarLabel: 'Coach',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🤖</Text>,
                    }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                        tabBarLabel: 'Settings',
                        tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
                    }}
                />
            </Tab.Navigator>
            <MiniAudioPlayer />
        </View>
    );
}
