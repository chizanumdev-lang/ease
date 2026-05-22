import notifee, { TimestampTrigger, TriggerType, AndroidImportance, RepeatFrequency } from '@notifee/react-native';

class NotifeeService {
    async scheduleNightlySubliminals(sleepWindowStart: string) {
        // Request permissions (required for iOS)
        await notifee.requestPermission();

        const [hours, minutes] = sleepWindowStart.split(':').map(Number);
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        // If the time has already passed today, schedule for tomorrow
        if (date.getTime() <= Date.now()) {
            date.setDate(date.getDate() + 1);
        }

        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: date.getTime(),
            repeatFrequency: RepeatFrequency.DAILY,
        };

        // Create a channel for Android
        const channelId = await notifee.createChannel({
            id: 'subliminals',
            name: 'Nightly Subliminals',
            importance: AndroidImportance.HIGH,
        });

        await notifee.createTriggerNotification(
            {
                id: 'nightly_subliminals',
                title: '🌙 Time for your Nightly Subliminals',
                body: 'Your sleep window has started. Tap to play your subliminals.',
                android: {
                    channelId,
                    pressAction: {
                        id: 'default',
                    },
                    actions: [
                        {
                            title: '▶️ Play Now',
                            pressAction: { id: 'play_subliminals' },
                        }
                    ],
                },
                ios: {
                    categoryId: 'subliminals',
                }
            },
            trigger
        );

        console.log(`[NotifeeService] Scheduled nightly subliminals for ${date.toLocaleString()}`);
    }

    async cancelNightlySubliminals() {
        await notifee.cancelNotification('nightly_subliminals');
        console.log('[NotifeeService] Cancelled nightly subliminals');
    }
}

export const notifeeService = new NotifeeService();
