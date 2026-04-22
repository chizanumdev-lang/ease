import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { DayPlan, Task, AudioTrack, TaskStatus } from '../types';
import { authService } from './auth.service';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    private responseListener?: Notifications.Subscription;

    async registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        // Always check/request permissions, even on simulators
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        if (Device.isDevice) {
            try {
                const token = (await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas?.projectId,
                })).data;
                return token;
            } catch (error) {
                console.log('Error getting push token:', error);
            }
        } else {
            console.log('Note: Physical device needed for Expo Push Token (remote), but local notifications may work.');
        }
    }

    async syncPushToken() {
        try {
            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                console.log('[NotificationService] Syncing push token:', token);
                await authService.updateSettings({ pushToken: token });
            }
        } catch (error) {
            console.error('[NotificationService] Failed to sync push token:', error);
        }
    }

    async scheduleForDay(dayPlan: DayPlan) {
        // Cancel existing to avoid duplicates/overflow
        await this.cancelAll();

        const notifications: Array<{ title: string; body: string; date: Date; type: string; data: any }> = [];

        // 1. Schedule Task Reminders
        if (dayPlan.tasks) {
            dayPlan.tasks.forEach(task => {
                if (task.scheduledAt && !task.completed) {
                    const scheduledDate = new Date(task.scheduledAt);
                    if (scheduledDate > new Date()) {
                        notifications.push({
                            title: 'Task Reminder',
                            body: `Time for: ${task.title}`,
                            date: scheduledDate,
                            type: 'task',
                            data: { taskId: task.id, type: 'task' }
                        });
                    }
                }
            });
        }

        // 2. Schedule Night Audio (e.g., 9 PM)
        const nightAudioTime = new Date();
        nightAudioTime.setHours(21, 0, 0, 0); // 9:00 PM
        if (nightAudioTime < new Date()) {
            nightAudioTime.setDate(nightAudioTime.getDate() + 1);
        }

        // Find an audio track (preferably night/sleep related)
        const audioTrack = dayPlan.audioTracks?.[0]; // Simplified selection
        if (audioTrack) {
            notifications.push({
                title: 'Evening Reflection',
                body: 'Time to wind down with your audio session.',
                date: nightAudioTime,
                type: 'audio',
                data: { trackId: audioTrack.id, type: 'audio' }
            });
        }

        // 3. Schedule Morning Kickoff (8:00 AM)
        const morningKickoffTime = new Date();
        morningKickoffTime.setHours(8, 0, 0, 0);
        if (morningKickoffTime < new Date()) {
            morningKickoffTime.setDate(morningKickoffTime.getDate() + 1);
        }
        notifications.push({
            title: 'Good Morning!',
            body: 'Your plan for today is ready. Let\'s make it count!',
            date: morningKickoffTime,
            type: 'system',
            data: { type: 'kickoff' }
        });

        // Sort by time
        notifications.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Enforce Max 4 per day rule
        const limitedNotifications = notifications.slice(0, 4);

        for (const notif of limitedNotifications) {
            const secondsUntil = Math.max(1, Math.floor((notif.date.getTime() - Date.now()) / 1000));
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notif.title,
                    body: notif.body,
                    data: notif.data,
                },
                trigger: {
                    seconds: secondsUntil,
                    repeats: false,
                    channelId: 'default',
                } as any,
            });
        }
    }

    async cancelAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    addResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
        this.responseListener = Notifications.addNotificationResponseReceivedListener(callback);
    }

    removeListeners() {
        if (this.responseListener) {
            this.responseListener.remove();
        }
    }

    async testNotification() {
        await this.scheduleForDay({
            id: 'test-day',
            dayNumber: 1,
            programId: 'test-prog',
            status: 'active',
            tasks: [{
                id: 'test-task',
                title: 'Test Notification',
                status: TaskStatus.PENDING,
                type: 'audio',
                order: 0,
                completed: false,
                scheduledAt: new Date(Date.now() + 5000).toISOString(), // 5 seconds from now
                dayPlanId: 'test-day',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
}

export const notificationService = new NotificationService();
