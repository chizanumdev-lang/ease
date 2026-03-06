import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabParamList, NotificationSettings } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notification.service';
import { audioService } from '../../services/audio.service';
import { API_BASE_URL } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<TabParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
    const { user, logout, updateSettings } = useAuthStore();
    const [previewingMood, setPreviewingMood] = useState<string | null>(null);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    useEffect(() => {
        return () => {
            audioService.stop();
        };
    }, []);

    const handlePreviewMood = async (mood: string) => {
        if (previewingMood === mood) {
            await audioService.stop();
            setPreviewingMood(null);
            return;
        }

        setIsLoadingAudio(true);
        try {
            await audioService.stop();
            const baseUrl = API_BASE_URL.replace(/\/api$/, '');
            const url = `${baseUrl}/audio/backgrounds/${mood}.mp3`;

            await audioService.loadAudio({
                id: `preview_${mood}`,
                title: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Preview`,
                url,
                type: mood,
            });

            await audioService.play(0);
            setPreviewingMood(mood);
        } catch (error) {
            Alert.alert('Error', 'Failed to play background music preview.');
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const handleTestNotification = async () => {
        try {
            await notificationService.testNotification();
            Alert.alert('Success', 'Test notification scheduled for 5 seconds from now.');
        } catch (error) {
            Alert.alert('Error', 'Failed to schedule test notification. Check permissions.');
        }
    };

    const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
        if (!user) return;

        const currentSettings = user.settings || {};
        const currentNotifications = currentSettings.notifications || {
            taskReminders: true,
            nightAudio: true,
            weeklySummary: true,
        };

        const newSettings = {
            ...currentSettings,
            notifications: {
                ...currentNotifications,
                [key]: value,
            },
        };

        await updateSettings(newSettings);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>


            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Labs</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>AI Audio Pipeline</Text>
                    <Text style={styles.infoText}>Test our new 5-minute AI narration engine. This is an experimental feature.</Text>
                    <TouchableOpacity
                        style={styles.previewButton}
                        onPress={() => (navigation as any).navigate('AudioPreview')}
                    >
                        <Text style={styles.previewButtonText}>Preview 5-Min Audio</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Background Music</Text>
                <View style={styles.card}>
                    <Text style={styles.infoText}>Choose the perfect background atmosphere for your coaching sessions and meditations.</Text>
                    {['meditation', 'focus', 'ambient'].map((mood) => (
                        <View key={mood}>
                            <View style={styles.audioRow}>
                                <View>
                                    <Text style={styles.audioName}>{mood.charAt(0).toUpperCase() + mood.slice(1)}</Text>
                                    <Text style={styles.audioDesc}>
                                        {mood === 'meditation' ? 'Calm and steady' : mood === 'focus' ? 'Deep concentration' : 'Gentle atmosphere'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.playButton,
                                        previewingMood === mood && styles.playingButton
                                    ]}
                                    onPress={() => handlePreviewMood(mood)}
                                    disabled={isLoadingAudio}
                                >
                                    {isLoadingAudio && previewingMood === mood ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons
                                            name={previewingMood === mood ? "stop" : "play"}
                                            size={20}
                                            color="#fff"
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {mood !== 'ambient' && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.settingLabel}>Task Reminders</Text>
                        <Switch
                            value={user?.settings?.notifications?.taskReminders ?? true}
                            onValueChange={(val) => handleToggle('taskReminders', val)}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.settingLabel}>Nightly Audio</Text>
                        <Switch
                            value={user?.settings?.notifications?.nightAudio ?? true}
                            onValueChange={(val) => handleToggle('nightAudio', val)}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.settingLabel}>Weekly Summary</Text>
                        <Switch
                            value={user?.settings?.notifications?.weeklySummary ?? true}
                            onValueChange={(val) => handleToggle('weeklySummary', val)}
                        />
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
                        <Text style={styles.testButtonText}>Send Test Notification (5s)</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{user?.name}</Text>

                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#1a1a1a',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginTop: 12,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#1a1a1a',
    },
    logoutButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff3b30',
    },
    logoutText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingLabel: {
        fontSize: 16,
        color: '#1a1a1a',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    testButton: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        alignItems: 'center',
    },
    testButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    previewButton: {
        backgroundColor: '#1a1a1a',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    previewButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    audioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    audioName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    audioDesc: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    playButton: {
        backgroundColor: '#007AFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playingButton: {
        backgroundColor: '#ff3b30',
    },
});
