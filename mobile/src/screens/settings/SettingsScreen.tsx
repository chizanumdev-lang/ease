import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch, Image, Dimensions } from 'react-native';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabParamList, NotificationSettings } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<TabParamList, 'Settings'>;

const { width } = Dimensions.get('window');

const COACHING_TONES = [
    { id: 'supportive', label: 'Supportive', icon: 'heart-outline', desc: 'Encouraging & Kind' },
    { id: 'analytical', label: 'Analytical', icon: 'stats-chart-outline', desc: 'Data-driven & Precise' },
    { id: 'direct', label: 'Direct', icon: 'flash-outline', desc: 'Action-oriented' },
];

const FOCUS_AREAS = [
    { id: 'stress', label: 'Stress Management' },
    { id: 'sleep', label: 'Better Sleep' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'mindfulness', label: 'Mindfulness' },
];

export default function SettingsScreen({ navigation }: Props) {
    const { user, logout, updateSettings } = useAuthStore();
    
    const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
        if (!user) return;
        const currentNotifications = user.settings?.notifications || {
            taskReminders: true,
            nightAudio: true,
            weeklySummary: true,
        };
        const newSettings = {
            ...user.settings,
            notifications: { ...currentNotifications, [key]: value },
        };
        await updateSettings(newSettings);
    };

    const handleUpdatePreference = async (key: string, value: any) => {
        if (!user) return;
        const newSettings = {
            ...user.settings,
            [key]: value,
        };
        await updateSettings(newSettings);
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPcqwvnGRJTBHRYhDLfV176zDemjNo1XxrHgT3M_PUgxnNgWUN-B11LyZ0dpjLVmIyb4pFXOJkuT6q6SQWvPTh0wPx0ceJTXCxr25DeFgekAx4_qt9x2VByrpay91DcEQONMH_L1w3QABzaFA91-GI_sWttDoH3fveglhhoR_-IPmMSOzXV9-v6XVkUppxd2Nz4f6WGzmUFtFJkULUmVSOf-Uu8KjLdg9AdQIn5bbbs3aOf6lNwj0OMwOoJl53QGBF4R6gcjy0FQuM' }}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <TouchableOpacity style={styles.editProfileButton}>
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Tracking Cards */}
                <View style={styles.progressRow}>
                    <View style={styles.progressCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="leaf" size={16} color={Theme.colors.primary} />
                            <Text style={styles.cardLabel}>SPIRIT TREE</Text>
                        </View>
                        <Text style={styles.cardValue}>Level 3</Text>
                        <Text style={styles.cardSubValue}>Flourishing</Text>
                    </View>
                    <View style={styles.progressCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="flame" size={16} color="#f97316" />
                            <Text style={styles.cardLabel}>STREAK</Text>
                        </View>
                        <Text style={styles.cardValue}>12 Days</Text>
                        <Text style={styles.cardSubValue}>Mindfulness</Text>
                    </View>
                </View>

                {/* Coaching Tone Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Coaching Tone</Text>
                    <View style={styles.toneGrid}>
                        {COACHING_TONES.map((tone) => (
                            <TouchableOpacity 
                                key={tone.id}
                                style={[
                                    styles.toneCard,
                                    user?.settings?.coachingTone === tone.id && styles.toneCardSelected
                                ]}
                                onPress={() => handleUpdatePreference('coachingTone', tone.id)}
                            >
                                <Ionicons 
                                    name={tone.icon as any} 
                                    size={24} 
                                    color={user?.settings?.coachingTone === tone.id ? '#fff' : '#64748b'} 
                                />
                                <Text style={[
                                    styles.toneLabel,
                                    user?.settings?.coachingTone === tone.id && styles.textWhite
                                ]}>{tone.label}</Text>
                                <Text style={[
                                    styles.toneDesc,
                                    user?.settings?.coachingTone === tone.id && styles.textWhiteMuted
                                ]}>{tone.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Focus Areas Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Focus Areas</Text>
                    <View style={styles.chipCloud}>
                        {FOCUS_AREAS.map((area) => {
                            const isSelected = user?.settings?.focusAreas?.includes(area.id);
                            return (
                                <TouchableOpacity 
                                    key={area.id}
                                    style={[styles.chip, isSelected && styles.chipSelected]}
                                    onPress={() => {
                                        const current = user?.settings?.focusAreas || [];
                                        const next = isSelected 
                                            ? current.filter((id: string) => id !== area.id)
                                            : [...current, area.id];
                                        handleUpdatePreference('focusAreas', next);
                                    }}
                                >
                                    <Text style={[styles.chipText, isSelected && styles.textWhite]}>
                                        {area.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingsGroup}>
                        {[
                            { id: 'taskReminders', label: 'Morning Reminders' },
                            { id: 'nightAudio', label: 'Nightly Audio' },
                            { id: 'weeklySummary', label: 'Progress Weekly' },
                        ].map((notif, idx) => (
                            <View key={notif.id}>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingLabel}>{notif.label}</Text>
                                    </View>
                                    <Switch
                                        value={user?.settings?.notifications?.[notif.id as keyof NotificationSettings] ?? true}
                                        onValueChange={(val) => handleToggle(notif.id as keyof NotificationSettings, val)}
                                        trackColor={{ false: '#e2e8f0', true: Theme.colors.primary }}
                                    />
                                </View>
                                {idx < 2 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Account Actions */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 180,
    },
    profileHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    profileImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        padding: 4,
        borderWidth: 2,
        borderColor: 'rgba(66, 17, 212, 0.1)',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 16,
    },
    editProfileButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    editProfileText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    progressRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 32,
    },
    progressCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 1,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f172a',
    },
    cardSubValue: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 16,
    },
    toneGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    toneCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
    },
    toneCardSelected: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    toneLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: 8,
    },
    toneDesc: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 2,
        textAlign: 'center',
    },
    textWhite: {
        color: '#fff',
    },
    textWhiteMuted: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    chipCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    chipSelected: {
        backgroundColor: Theme.colors.primary,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    settingsGroup: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0f172a',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 20,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '700',
    },
});
