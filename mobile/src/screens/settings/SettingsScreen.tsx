import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Image, Dimensions, Platform, TextInput } from 'react-native';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, NotificationSettings } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { programsService } from '../../services/programs.service';
import { useAudioStore } from '../../store/audioStore';
import { STATIC_BINAURAL_BEATS } from '../../constants/config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import { useProgramsStore } from '../../store/programsStore';
import { useModalStore } from '../../store/modalStore';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

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
    const { currentProgram, deleteProgram } = useProgramsStore();
    const { loadTrack, play, stop, isPlaying, currentTrack } = useAudioStore();
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();
    const { showModal } = useModalStore();
    
    // Test Audio State
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingBinaural, setIsGeneratingBinaural] = useState(false);
    const [testTheme, setTestTheme] = useState('Forest');
    const [testFrequency, setTestFrequency] = useState(10); // Default Alpha
    const [testGoal, setTestGoal] = useState('');
    const [isGeneratingImmersive, setIsGeneratingImmersive] = useState(false);
    const [immersiveResults, setImmersiveResults] = useState<{ morningUrl?: string; nightUrl?: string; taskUrl?: string } | null>(null);

    const handleTestAudio = async () => {
        setIsGenerating(true);
        try {
            const { url } = await programsService.generateAudioPreview(testTheme, 'calm');
            await loadTrack({
                id: 'test-audio',
                url,
                title: `Test: ${testTheme}`,
                duration: 300, // 5 mins
                type: 'meditation'
            });
            await play();
            showModal({
                type: 'success',
                title: 'Success',
                description: 'Audio generated and playing!'
            });
        } catch (error) {
            console.error('Test audio failed:', error);
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Failed to generate test audio'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTestBinaural = async () => {
        setIsGeneratingBinaural(true);
        try {
            const url = (STATIC_BINAURAL_BEATS as any)[testFrequency];
            if (!url) throw new Error('Static URL not found');
            
            await loadTrack({
                id: 'test-binaural',
                url,
                title: `Binaural: ${testFrequency}Hz`,
                duration: 60, // Static files are 1 min
                type: 'meditation'
            });
            await play();
        } catch (error) {
            console.error('Binaural test failed:', error);
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Failed to play binaural beat'
            });
        } finally {
            setIsGeneratingBinaural(false);
        }
    };

    const handleImmersiveTest = async () => {
        if (!testGoal.trim()) {
            showModal({
                type: 'error',
                title: 'Required',
                description: 'Please enter a goal to test'
            });
            return;
        }

        setIsGeneratingImmersive(true);
        setImmersiveResults(null);
        try {
            const results = await programsService.generateImmersiveTest(testGoal);
            setImmersiveResults(results);
            showModal({
                type: 'success',
                title: 'Generation Complete',
                description: '3 test tracks created. You can play them below.'
            });
        } catch (error) {
            console.error('Immersive test failed:', error);
            showModal({
                type: 'error',
                title: 'Error',
                description: 'Failed to generate immersive suite'
            });
        } finally {
            setIsGeneratingImmersive(false);
        }
    };

    const playTestTrack = async (id: string, url: string, title: string) => {
        if (!url) return;
        try {
            await loadTrack({
                id,
                url,
                title,
                duration: 60,
                type: 'meditation'
            });
            await play();
        } catch (error) {
            console.error('Play test track failed:', error);
        }
    };

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
        showModal({
            type: 'confirmation',
            title: 'Logout',
            description: 'Are you sure you want to logout? Your progress is safely stored in the cloud.',
            primaryAction: {
                label: 'Logout',
                autoClose: false,
                onPress: async () => {
                    showModal({
                        type: 'loading',
                        title: 'Logging out...',
                        description: 'Securing your session and cleaning up. See you soon.'
                    });
                    
                    try {
                        const logoutPromise = logout();
                        // Minimal delay for visual feedback if logout is too fast
                        await Promise.all([
                            logoutPromise,
                            new Promise(resolve => setTimeout(resolve, 800))
                        ]);
                    } catch (error) {
                        console.error('Logout error:', error);
                        // Fallback: simple hide if error, though logout usually clears state and reloads app
                        useModalStore.getState().hideModal();
                    }
                }
            },
            secondaryAction: {
                label: 'Cancel',
                onPress: () => {}
            }
        });
    };

    const handleDeletePlan = () => {
        if (!currentProgram) return;

        showModal({
            type: 'confirmation',
            title: 'Delete Plan?',
            description: 'This will permanently remove your progress and schedule for this goal. This action cannot be undone.',
            primaryAction: {
                label: 'Delete Plan',
                autoClose: false, // Stay open to transition to loading
                onPress: async () => {
                    try {
                        // Transition to loading state
                        showModal({
                            type: 'loading',
                            title: 'Deleting plan...',
                            description: 'We are removing your schedule and cleaning up your dashboard.'
                        });

                        await deleteProgram(currentProgram.id);
                        
                        // Wait a tiny bit for the UI to feel natural
                        await new Promise(resolve => setTimeout(resolve, 800));

                        showModal({
                            type: 'success',
                            title: 'Success',
                            description: 'Program deleted successfully'
                        });
                    } catch (error) {
                        showModal({
                            type: 'error',
                            title: 'Error',
                            description: 'Failed to delete the program. Please try again.'
                        });
                    }
                }
            },
            secondaryAction: {
                label: 'Cancel',
                onPress: () => {}
            }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.topNav}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: colors.text }]}>Settings</Text>
                </View>

                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={[styles.profileImageContainer, { borderColor: colors.outlineVariant }]}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPcqwvnGRJTBHRYhDLfV176zDemjNo1XxrHgT3M_PUgxnNgWUN-B11LyZ0dpjLVmIyb4pFXOJkuT6q6SQWvPTh0wPx0ceJTXCxr25DeFgekAx4_qt9x2VByrpay91DcEQONMH_L1w3QABzaFA91-GI_sWttDoH3fveglhhoR_-IPmMSOzXV9-v6XVkUppxd2Nz4f6WGzmUFtFJkULUmVSOf-Uu8KjLdg9AdQIn5bbbs3aOf6lNwj0OMwOoJl53QGBF4R6gcjy0FQuM' }}
                            style={styles.profileImage}
                        />
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                            <Ionicons name="camera" size={16} color={isDark ? colors.background : colors.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>
                    <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: colors.surfaceContainerLow }]}>
                        <Text style={[styles.editProfileText, { color: colors.text }]}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Tracking Cards */}
                <View style={styles.progressRow}>
                    <View style={[styles.progressCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="leaf" size={16} color={colors.primary} />
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>SPIRIT TREE</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: colors.text }]}>Level 3</Text>
                        <Text style={[styles.cardSubValue, { color: colors.textMuted }]}>Flourishing</Text>
                    </View>
                    <View style={[styles.progressCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="flame" size={16} color={colors.error} />
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>STREAK</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: colors.text }]}>12 Days</Text>
                        <Text style={[styles.cardSubValue, { color: colors.textMuted }]}>Mindfulness</Text>
                    </View>
                </View>

                {/* Coaching Tone Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Coaching Tone</Text>
                    <View style={styles.toneGrid}>
                        {COACHING_TONES.map((tone) => (
                            <TouchableOpacity 
                                key={tone.id}
                                style={[
                                    styles.toneCard,
                                    { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
                                    user?.settings?.coachingTone === tone.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => handleUpdatePreference('coachingTone', tone.id)}
                            >
                                <Ionicons 
                                    name={tone.icon as any} 
                                    size={24} 
                                    color={user?.settings?.coachingTone === tone.id ? (isDark ? colors.background : colors.white) : colors.textMuted} 
                                />
                                <Text style={[
                                    styles.toneLabel,
                                    { color: colors.text },
                                    user?.settings?.coachingTone === tone.id && { color: isDark ? colors.background : colors.white }
                                ]}>{tone.label}</Text>
                                <Text style={[
                                    styles.toneDesc,
                                    { color: colors.textMuted },
                                    user?.settings?.coachingTone === tone.id && { color: isDark ? colors.background : "rgba(255, 255, 255, 0.7)" }
                                ]}>{tone.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Focus Areas Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus Areas</Text>
                    <View style={styles.chipCloud}>
                        {FOCUS_AREAS.map((area) => {
                            const isSelected = user?.settings?.focusAreas?.includes(area.id);
                            return (
                                <TouchableOpacity 
                                    key={area.id}
                                    style={[
                                        styles.chip, 
                                        { backgroundColor: colors.surfaceContainerLow },
                                        isSelected && { backgroundColor: colors.primary }
                                    ]}
                                    onPress={() => {
                                        const current = user?.settings?.focusAreas || [];
                                        const next = isSelected 
                                            ? current.filter((id: string) => id !== area.id)
                                            : [...current, area.id];
                                        handleUpdatePreference('focusAreas', next);
                                    }}
                                >
                                    <Text style={[
                                        styles.chipText, 
                                        { color: colors.textMuted },
                                        isSelected && { color: isDark ? colors.background : colors.white }
                                    ]}>
                                        {area.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Ritual Audio Source Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Ritual Audio Source</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                        Choose how your morning affirmations and nightly subliminals are created.
                    </Text>
                    <View style={styles.sourceRow}>
                        {[
                            { id: 'auto', label: 'Smart Select', icon: 'flash-outline', desc: 'Best of both. Pro YouTube audio with AI fallback.' },
                            { id: 'ai', label: 'AI Only', icon: 'sparkles-outline', desc: 'Always use custom generated AI affirmations.' },
                        ].map((source) => {
                            const isSelected = (user?.settings?.ritualSource || 'auto') === source.id;
                            return (
                                <TouchableOpacity 
                                    key={source.id}
                                    style={[
                                        styles.sourceCard,
                                        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => handleUpdatePreference('ritualSource', source.id)}
                                >
                                    <Ionicons 
                                        name={source.icon as any} 
                                        size={24} 
                                        color={isSelected ? (isDark ? colors.background : colors.white) : colors.primary} 
                                    />
                                    <Text style={[
                                        styles.sourceLabel,
                                        { color: colors.text },
                                        isSelected && { color: isDark ? colors.background : colors.white }
                                    ]}>{source.label}</Text>
                                    <Text style={[
                                        styles.sourceDesc,
                                        { color: colors.textMuted },
                                        isSelected && { color: isDark ? colors.background : "rgba(255, 255, 255, 0.7)" }
                                    ]}>{source.desc}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
                    <View style={[styles.settingsGroup, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        {[
                            { id: 'taskReminders', label: 'Morning Reminders' },
                            { id: 'nightAudio', label: 'Nightly Audio' },
                            { id: 'weeklySummary', label: 'Progress Weekly' },
                        ].map((notif, idx) => (
                            <View key={notif.id}>
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text style={[styles.settingLabel, { color: colors.text }]}>{notif.label}</Text>
                                    </View>
                                    <Switch
                                        value={user?.settings?.notifications?.[notif.id as keyof NotificationSettings] ?? true}
                                        onValueChange={(val) => handleToggle(notif.id as keyof NotificationSettings, val)}
                                        trackColor={{ false: isDark ? colors.outline : colors.surfaceContainerHighest, true: colors.primary }}
                                    />
                                </View>
                                {idx < 2 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Debug & Testing */}
                <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: 24 }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Ionicons name="construct-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0, marginLeft: 8 }]}>Debug & Testing</Text>
                    </View>
                    <Text style={[styles.debugSubtitle, { color: colors.textMuted }]}>Verify backend audio generation fix</Text>
                    
                    <View style={[styles.debugCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        <Text style={[styles.debugLabel, { color: colors.text }]}>Select Theme</Text>
                        <View style={styles.debugThemes}>
                            {['Forest', 'Ocean', 'Deep Space', 'Cozy Cafe'].map(t => (
                                <TouchableOpacity 
                                    key={t}
                                    style={[
                                        styles.debugThemeChip, 
                                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                                        testTheme === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setTestTheme(t)}
                                >
                                    <Text style={[
                                        styles.debugThemeText, 
                                        { color: colors.textMuted },
                                        testTheme === t && { color: isDark ? colors.background : colors.white }
                                    ]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.debugButton, { backgroundColor: colors.primary }, isGenerating && styles.debugButtonDisabled]}
                            onPress={handleTestAudio}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Text style={[styles.debugButtonText, { color: isDark ? colors.background : colors.white }]}>Generating...</Text>
                            ) : (
                                <View style={styles.row}>
                                    <Ionicons name="musical-notes-outline" size={20} color={isDark ? colors.background : colors.white} style={{ marginRight: 8 }} />
                                    <Text style={[styles.debugButtonText, { color: isDark ? colors.background : colors.white }]}>Generate & Play Test Audio</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {isPlaying && currentTrack?.id === 'test-audio' && (
                            <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.outline }]} onPress={() => stop()}>
                                <Ionicons name="stop" size={20} color={colors.white} />
                                <Text style={[styles.stopText, { color: colors.white }]}>Stop Playback</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.debugCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, marginTop: 16 }]}>
                        <Text style={[styles.debugLabel, { color: colors.text }]}>Raw Binaural Test (No Voice)</Text>
                        <View style={styles.debugThemes}>
                            {[
                                { name: 'Theta (6Hz)', val: 6 },
                                { name: 'Alpha (10Hz)', val: 10 },
                                { name: 'Beta (20Hz)', val: 20 }
                            ].map(f => (
                                <TouchableOpacity 
                                    key={f.val}
                                    style={[
                                        styles.debugThemeChip, 
                                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                                        testFrequency === f.val && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setTestFrequency(f.val)}
                                >
                                    <Text style={[
                                        styles.debugThemeText, 
                                        { color: colors.textMuted },
                                        testFrequency === f.val && { color: isDark ? colors.background : colors.white }
                                    ]}>{f.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.debugButton, { backgroundColor: colors.outline }, isGeneratingBinaural && styles.debugButtonDisabled]}
                            onPress={handleTestBinaural}
                            disabled={isGeneratingBinaural}
                        >
                            {isGeneratingBinaural ? (
                                <Text style={[styles.debugButtonText, { color: colors.white }]}>Generating...</Text>
                            ) : (
                                <View style={styles.row}>
                                    <Ionicons name="pulse-outline" size={20} color={colors.white} style={{ marginRight: 8 }} />
                                    <Text style={[styles.debugButtonText, { color: colors.white }]}>Test Raw Binaural Beat</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {isPlaying && currentTrack?.id === 'test-binaural' && (
                            <TouchableOpacity style={[styles.stopButton, { backgroundColor: colors.outline }]} onPress={() => stop()}>
                                <Ionicons name="stop" size={20} color={colors.white} />
                                <Text style={[styles.stopText, { color: colors.white }]}>Stop Playback</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.debugCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, marginTop: 16 }]}>
                        <Text style={[styles.debugLabel, { color: colors.text }]}>Full Immersive Set (Goal Based)</Text>
                        <TextInput
                            style={[
                                styles.debugInput, 
                                { 
                                    backgroundColor: colors.surface, 
                                    color: colors.text, 
                                    borderColor: colors.outlineVariant 
                                }
                            ]}
                            placeholder="Enter test goal (e.g. Master Guitar)"
                            placeholderTextColor={colors.textMuted}
                            value={testGoal}
                            onChangeText={setTestGoal}
                        />

                        <TouchableOpacity 
                            style={[styles.debugButton, { backgroundColor: colors.primary, marginTop: 12 }, isGeneratingImmersive && styles.debugButtonDisabled]}
                            onPress={handleImmersiveTest}
                            disabled={isGeneratingImmersive}
                        >
                            {isGeneratingImmersive ? (
                                <Text style={[styles.debugButtonText, { color: isDark ? colors.background : colors.white }]}>Generating 3 Tracks...</Text>
                            ) : (
                                <View style={styles.row}>
                                    <Ionicons name="rocket-outline" size={20} color={isDark ? colors.background : colors.white} style={{ marginRight: 8 }} />
                                    <Text style={[styles.debugButtonText, { color: isDark ? colors.background : colors.white }]}>Generate Immersive Suite</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {immersiveResults && (
                            <View style={styles.immersiveResults}>
                                {[
                                    { id: 'morning', label: 'Morning Affirmation', url: immersiveResults.morningUrl },
                                    { id: 'night', label: 'Night Subliminal', url: immersiveResults.nightUrl },
                                    { id: 'task', label: 'Audio Task (Lesson)', url: immersiveResults.taskUrl },
                                ].map(res => (
                                    <View key={res.id} style={styles.resultRow}>
                                        <Text style={[styles.resultLabel, { color: colors.text }]}>{res.label}</Text>
                                        {res.url ? (
                                            <TouchableOpacity 
                                                onPress={() => isPlaying && currentTrack?.id === `test-${res.id}` ? stop() : playTestTrack(`test-${res.id}`, res.url!, res.label)}
                                            >
                                                <Ionicons 
                                                    name={isPlaying && currentTrack?.id === `test-${res.id}` ? "stop-circle" : "play-circle"} 
                                                    size={32} 
                                                    color={colors.primary} 
                                                />
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={{ color: colors.error, fontSize: 12 }}>Failed</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Plan Management */}
                {currentProgram && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Management</Text>
                        <View style={[styles.planCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                            <View style={styles.planInfo}>
                                <Text style={[styles.planLabel, { color: colors.textMuted }]}>ACTIVE PLAN</Text>
                                <Text style={[styles.planTitle, { color: colors.text }]}>{currentProgram.title}</Text>
                            </View>
                            <TouchableOpacity 
                                style={[styles.deletePlanButton, { backgroundColor: isDark ? 'rgba(186, 26, 26, 0.1)' : '#fef2f2' }]} 
                                onPress={handleDeletePlan}
                            >
                                <Ionicons name="trash-outline" size={18} color={colors.error} />
                                <Text style={[styles.deletePlanText, { color: colors.error }]}>Delete Plan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Account Actions */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <TouchableOpacity 
                        style={[
                            styles.logoutButton, 
                            { 
                                backgroundColor: isDark ? 'rgba(186, 26, 26, 0.1)' : '#fef2f2', 
                                borderColor: colors.error + '40' // Add some transparency if needed, or use outlineVariant
                            }
                        ]} 
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.error} />
                        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    navLogo: {
        // small branding in settings
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
        paddingBottom: 120,
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
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    userEmail: {
        fontSize: 14,
        marginTop: 4,
        marginBottom: 16,
    },
    editProfileButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    editProfileText: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 32,
    },
    progressCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
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
        letterSpacing: 1,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    cardSubValue: {
        fontSize: 12,
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    toneGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    toneCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    toneLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 8,
    },
    toneDesc: {
        fontSize: 10,
        marginTop: 2,
        textAlign: 'center',
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
    },
    chartLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    sectionSubtitle: {
        fontSize: 13,
        marginBottom: 16,
        marginTop: -12,
        lineHeight: 18,
    },
    sourceRow: {
        flexDirection: 'row',
        gap: 12,
    },
    sourceCard: {
        flex: 1,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceLabel: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 10,
    },
    sourceDesc: {
        fontSize: 11,
        marginTop: 4,
        textAlign: 'center',
        lineHeight: 15,
    },
    settingsGroup: {
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
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
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    debugSubtitle: {
        fontSize: 13,
        marginBottom: 20,
        marginTop: -12,
    },
    debugCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    debugLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    debugThemes: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    debugThemeChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    debugThemeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    debugButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    debugButtonDisabled: {
        opacity: 0.6,
    },
    debugButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    stopButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    stopText: {
        fontSize: 14,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    planInfo: {
        flex: 1,
    },
    planLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    planTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    deletePlanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    deletePlanText: {
        fontSize: 14,
        fontWeight: '700',
    },
    debugInput: {
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        fontSize: 14,
        marginBottom: 8,
    },
    immersiveResults: {
        marginTop: 16,
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: 10,
        borderRadius: 10,
    },
    resultLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
});
