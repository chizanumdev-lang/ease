import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import TabNavigator from './TabNavigator';
import GoalWizardScreen from '../screens/goals/GoalWizardScreen';
import ProgramPreviewScreen from '../screens/goals/ProgramPreviewScreen';
import TaskScreenRouter from '../screens/tasks/TaskScreenRouter';
import VideoLessonScreen from '../screens/tasks/VideoLessonScreen';
import QuizScreen from '../screens/tasks/QuizScreen';
import AudioPlayerScreen from '../screens/audio/AudioPlayerScreen';
import AudioPreviewScreen from '../screens/audio/AudioPreviewScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="Tabs"
                component={TabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="GoalWizard"
                component={GoalWizardScreen}
                options={{
                    presentation: 'modal',
                    title: 'New Goal',
                }}
            />
            <Stack.Screen
                name="ProgramPreview"
                component={ProgramPreviewScreen}
                options={{
                    title: 'Program Preview',
                }}
            />
            <Stack.Screen
                name="Task"
                component={TaskScreenRouter}
                options={{
                    title: 'Task',
                }}
            />
            <Stack.Screen
                name="VideoLesson"
                component={VideoLessonScreen}
                options={{
                    title: 'Video Lesson',
                }}
            />
            <Stack.Screen
                name="Quiz"
                component={QuizScreen}
                options={{
                    title: 'Quiz',
                }}
            />
            <Stack.Screen
                name="AudioPlayer"
                component={AudioPlayerScreen}
                options={{
                    title: 'Audio Player',
                }}
            />
            <Stack.Screen
                name="AudioPreview"
                component={AudioPreviewScreen}
                options={{
                    title: 'Audio Preview',
                }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Settings',
                }}
            />
        </Stack.Navigator>
    );
}
