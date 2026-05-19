import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useProgress } from 'react-native-track-player';
import { MainStackParamList, AudioTrack } from '../../types';
import { useAudioStore } from '../../store/audioStore';
import { useProgramsStore } from '../../store/programsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';
import { canAutoPlayAudio } from '../../utils/sleepWindow.util';
import LoadingState from '../../components/LoadingState';

type Props = NativeStackScreenProps<MainStackParamList, 'AudioPlayer'>;

const { width, height } = Dimensions.get('window');

export default function AudioPlayerScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();
    const { showModal } = useModalStore();
    const { track } = route.params;
    const { user } = useAuthStore();
    const { regenerateTaskAsset } = useProgramsStore();
    const {
        currentTrack,
        isPlaying,
        isLoading,
        volume,
        stopTimer,
        autoPlayEnabled,
        loadTrack,
        play,
        pause,
        setVolume,
        setStopTimer,
        regenerateRitualAsset,
    } = useAudioStore();

    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const isRitual = track.type === 'morning' || track.type === 'night';
            let updatedTrack: AudioTrack;
            if (isRitual) {
                updatedTrack = await regenerateRitualAsset(track.id);
            } else {
                const refreshedTask = await regenerateTaskAsset(track.id);
                const taskAudioUrl = refreshedTask.metadata?.audioUrl;
                if (taskAudioUrl) {
                    updatedTrack = {
                        id: refreshedTask.id,
                        url: taskAudioUrl,
                        title: refreshedTask.title,
                        type: refreshedTask.metadata?.subtype || 'guided',
                        dayPlanId: refreshedTask.dayPlanId,
                        artwork: track.artwork,
                    };
                } else {
                    updatedTrack = {
                        ...track,
                        id: refreshedTask.id,
                        title: refreshedTask.title,
                    };
                }
            }
            
            navigation.setParams({ track: updatedTrack });
            await loadTrack(updatedTrack);
            await play();
        } catch (error) {
            console.error('[AUDIO_PLAYER] Failed to regenerate track:', error);
            showModal({
                type: 'error',
                title: 'Regeneration Failed',
                description: 'Failed to regenerate audio. Please try again.'
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    const { position, duration } = useProgress(500); // 500ms intervals for smooth UI


    // Pulse Animation
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isPlaying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(0);
        }
    }, [isPlaying]);

    // Load track on mount
    useEffect(() => {
        const initializeTrack = async () => {
            try {
                await loadTrack(track);
                if (canAutoPlayAudio(user, autoPlayEnabled)) {
                    await play();
                }
            } catch (error) {
                console.error('[AUDIO_PLAYER] Failed to load track:', error);
                showModal({
                    type: 'error',
                    title: 'Error',
                    description: 'Failed to load audio track'
                });
            }
        };

        initializeTrack();
    }, [track.id]);

    const handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await pause();
            } else {
                await play();
            }
        } catch (error) {
            console.error('[AUDIO_PLAYER] Play/pause error:', error);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const timerOptions = [
        { label: '15m', value: 15 },
        { label: '30m', value: 30 },
        { label: '45m', value: 45 },
        { label: '1h', value: 60 },
        { label: 'Off', value: null },
    ];

    if (!track || !track.url) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#0a0812' : colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 }}>Audio track is missing</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginBottom: 24 }}>The audio generation is not completed or the URL is invalid.</Text>
                
                <TouchableOpacity 
                    onPress={handleRegenerate} 
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginBottom: 12, minWidth: 180, alignItems: 'center', justifyContent: 'center' }}
                    disabled={isRegenerating}
                >
                    {isRegenerating ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Regenerate Audio</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minWidth: 180, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0a0812' : colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Nebula Gradient Replacement (Layered Circles) */}
            <View style={styles.nebulaOverlay}>
                <View style={[styles.nebulaCore, { backgroundColor: `${colors.primary}25` }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="chevron-down" size={28} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleRegenerate} 
                        style={[styles.headerBtn, { marginLeft: 16 }]}
                        disabled={isRegenerating}
                    >
                        {isRegenerating ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Ionicons name="refresh" size={24} color={colors.textMuted} />
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerLabel, { color: colors.textMuted }]}>
                        {track.type?.toUpperCase() || 'AUDIO'}
                    </Text>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{track.title}</Text>
                </View>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Central Pulse Content */}
            <View style={styles.pulseContainer}>
                {/* Animated Pulse Rings */}
                {isPlaying && (
                    <>
                        <Animated.View style={[styles.pulseRing, {
                            borderColor: colors.primary,
                            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] })
                        }]} />
                        <Animated.View style={[styles.pulseRing, {
                            borderColor: colors.primary,
                            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.05] })
                        }]} />
                    </>
                )}

                <View style={[styles.artworkContainer, { borderColor: `${colors.primary}33`, shadowColor: colors.primary }]}>
                    <Image
                        source={{ uri: track.artwork || 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=300&auto=format&fit=crop' }}
                        style={styles.artwork}
                    />
                </View>

                <View style={styles.trackDetails}>
                    <Text style={[styles.trackTitle, { color: colors.text }]}>{track.title}</Text>
                    <Text style={[styles.trackSubtitle, { color: colors.textMuted }]}>Ease Audio • 432Hz Healing Frequency</Text>
                </View>
            </View>

            {/* Controls Section */}
            <View style={styles.controlsSection}>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.outlineVariant }]}>
                        <View style={[styles.progressBarFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%`, backgroundColor: colors.primary, shadowColor: colors.primary }]} />
                    </View>
                    <View style={styles.timeRow}>
                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{formatTime(position)}</Text>
                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>-{formatTime(duration - position)}</Text>
                    </View>
                </View>

                {/* Player Buttons */}
                <View style={styles.playerButtonsRow}>
                    <TouchableOpacity>
                        <Ionicons name="shuffle" size={24} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.mainControls}>
                        <TouchableOpacity>
                            <Ionicons name="play-skip-back" size={32} color={colors.text} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.playPauseButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handlePlayPause}>
                            {isLoading ? (
                                <LoadingState variant="compact" title="" />
                            ) : (
                                <Ionicons name={isPlaying ? "pause" : "play"} size={40} color={isDark ? colors.background : "#fff"} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity>
                            <Ionicons name="play-skip-forward" size={32} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity>
                        <Ionicons name="repeat" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Volume & Timer Row */}
                <View style={styles.actionRow}>
                    <View style={[styles.volumeBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        <Ionicons name="volume-low" size={18} color={colors.textMuted} />
                        <Slider
                            style={styles.volumeSlider}
                            minimumValue={0}
                            maximumValue={1}
                            value={volume}
                            onValueChange={setVolume}
                            minimumTrackTintColor={colors.textMuted}
                            maximumTrackTintColor={colors.outlineVariant}
                            thumbTintColor={colors.text}
                        />
                    </View>

                    <TouchableOpacity style={[styles.timerBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}33` }]}>
                        <Ionicons name="timer-outline" size={18} color={colors.primary} />
                        <Text style={[styles.timerBadgeText, { color: colors.primary }]}>{stopTimer ? `${stopTimer}M` : 'OFF'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Timer Presets */}
                <View style={styles.timerPresets}>
                    {timerOptions.map(opt => (
                        <TouchableOpacity
                            key={opt.label}
                            onPress={() => setStopTimer(opt.value)}
                            style={[styles.presetButton, stopTimer === opt.value && { borderBottomColor: colors.primary }]}
                        >
                            <Text style={[styles.presetText, { color: colors.textMuted }, stopTimer === opt.value && { color: colors.primary }]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    nebulaOverlay: {
        position: 'absolute',
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nebulaCore: {
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    pulseContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    pulseRing: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        borderWidth: 2,
    },
    artworkContainer: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 10,
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    trackDetails: {
        marginTop: 40,
        alignItems: 'center',
    },
    trackTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    trackSubtitle: {
        fontSize: 14,
        marginTop: 6,
    },
    controlsSection: {
        paddingHorizontal: 32,
        paddingBottom: 60,
    },
    progressContainer: {
        marginBottom: 32,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    playerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    mainControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    playPauseButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    volumeBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
    },
    volumeSlider: {
        flex: 1,
        height: 20,
        marginLeft: 8,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    timerBadgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    timerPresets: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    presetButton: {
        paddingBottom: 4,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    presetText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
