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

    async scheduleForDay(dayPlan: DayPlan, ritualSettings?: { morning: string; night: string }) {
        // Cancel existing to avoid duplicates/overflow
        await this.cancelAll();

        const rawNotifications: Array<{ title: string; body: string; date: Date; type: string; data: any; category?: string; priority: number }> = [];
        const now = new Date();

        // 1. Task Reminders (Priority 1)
        if (dayPlan.tasks) {
            dayPlan.tasks.forEach(task => {
                if (task.scheduledAt && !task.completed) {
                    const scheduledDate = new Date(task.scheduledAt);
                    if (scheduledDate > now) {
                        rawNotifications.push({
                            title: 'New Quest Available ⚔️',
                            body: `Your spirit tree awaits: ${task.title}.`,
                            date: scheduledDate,
                            type: 'task',
                            data: { taskId: task.id, type: 'task' },
                            priority: 1
                        });
                    }
                }
            });
        }

        // 2. Rituals (Priority 2 - Higher)
        const morningTime = ritualSettings?.morning || '07:00';
        const nightTime = ritualSettings?.night || '22:00';

        const scheduleRitual = (timeStr: string, type: 'morning' | 'night', title: string, body: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);
            
            if (date < now) {
                date.setDate(date.getDate() + 1);
            }

            rawNotifications.push({
                title,
                body,
                date,
                type: 'ritual',
                category: 'ritual',
                data: { ritualType: type, type: 'ritual' },
                priority: 2
            });
        };

        scheduleRitual(morningTime, 'morning', 'Spirit Awakening 🌅', 'Tend to your roots with your morning ritual.');
        scheduleRitual(nightTime, 'night', 'Night Wisdom 🌙', 'The stars are aligned. Secure today\'s growth.');

        // 3. Collision Detection & "Single Notification" focus
        // Sort by time
        rawNotifications.sort((a, b) => a.date.getTime() - b.date.getTime());

        const filteredNotifications: typeof rawNotifications = [];
        const MIN_GAP_MS = 60 * 60 * 1000; // 60 minute buffer to prevent "more than 1 at a time"

        for (const notif of rawNotifications) {
            const conflictIdx = filteredNotifications.findIndex(existing => 
                Math.abs(existing.date.getTime() - notif.date.getTime()) < MIN_GAP_MS
            );

            if (conflictIdx === -1) {
                filteredNotifications.push(notif);
            } else {
                // If there's a conflict (within 60 mins), keep the Ritual over the Task
                if (notif.priority > filteredNotifications[conflictIdx].priority) {
                    filteredNotifications[conflictIdx] = notif;
                }
            }
        }

        // 4. Define Notification Categories (Actions)
        if (Platform.OS !== 'web') {
            await Notifications.setNotificationCategoryAsync('ritual', [
                {
                    identifier: 'play',
                    buttonTitle: 'Enter Ritual ▶️',
                    options: { opensAppToForeground: true }
                },
                {
                    identifier: 'dismiss',
                    buttonTitle: 'Later',
                    options: { opensAppToForeground: false }
                }
            ]);
        }

        // Final Sort and Limit to top 3 to respect "hommy/serene" vibe
        const finalNotifications = filteredNotifications.slice(0, 3);

        for (const notif of finalNotifications) {
            const secondsUntil = Math.max(1, Math.floor((notif.date.getTime() - now.getTime()) / 1000));
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notif.title,
                    body: notif.body,
                    data: notif.data,
                    categoryIdentifier: notif.category,
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: {
                    seconds: secondsUntil,
                    repeats: false,
                    channelId: 'default',
                } as any,
            });
        }
        console.log(`[NotificationService] Scheduled ${finalNotifications.length} collision-free notifications`);
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
