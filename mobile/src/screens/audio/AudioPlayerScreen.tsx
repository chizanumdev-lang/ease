import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../../types';
import { useAudioStore } from '../../store/audioStore';
import { useAuthStore } from '../../store/authStore';
import { canAutoPlayAudio } from '../../utils/sleepWindow.util';

type Props = NativeStackScreenProps<MainStackParamList, 'AudioPlayer'>;

const { width, height } = Dimensions.get('window');

export default function AudioPlayerScreen({ route, navigation }: Props) {
    const { track } = route.params;
    const { user } = useAuthStore();
    const {
        currentTrack,
        isPlaying,
        isLoading,
        position,
        duration,
        volume,
        stopTimer,
        autoPlayEnabled,
        loadTrack,
        play,
        pause,
        setVolume,
        setStopTimer,
    } = useAudioStore();

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
                Alert.alert('Error', 'Failed to load audio track');
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Nebula Gradient Replacement (Layered Circles) */}
            <View style={styles.nebulaOverlay}>
                <View style={styles.nebulaCore} />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-down" size={28} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerLabel}>NIGHTLY RITUAL</Text>
                    <Text style={styles.headerTitle}>Deep Sleep Ambient</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {/* Central Pulse Content */}
            <View style={styles.pulseContainer}>
                {/* Animated Pulse Rings */}
                {isPlaying && (
                    <>
                        <Animated.View style={[styles.pulseRing, {
                            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] })
                        }]} />
                        <Animated.View style={[styles.pulseRing, {
                            transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.05] })
                        }]} />
                    </>
                )}

                <View style={styles.artworkContainer}>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8q5xCzW2_MDxAkJvBp61VaReD2i7ECUKbRcx2xPz3thxQdyJFMbKXUq8GQwaI-FUmU4GvtSLDGmwQ-qPT6xgJr8Urwr3SAFem9ZH40kPHdIJgGNCan7VRpK7nMjScXn52xHxfYI09HBEKPbI4kAsI3wzuB56e-wXfW9rNIFOwVzuNQFK4Zj6wcWEaXodO3F6gGsbNJ-kiQhkwiCGoqIWKCVP477WhEsUZpkwV-fcxbwlVqTSKiPle6exeE2C3t-OqhhUTkm6vR5uK' }}
                        style={styles.artwork}
                    />
                </View>

                <View style={styles.trackDetails}>
                    <Text style={styles.trackTitle}>{track.title}</Text>
                    <Text style={styles.trackSubtitle}>Ease Audio • 432Hz Healing Frequency</Text>
                </View>
            </View>

            {/* Controls Section */}
            <View style={styles.controlsSection}>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]} />
                    </View>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>{formatTime(position)}</Text>
                        <Text style={styles.timeLabel}>-{formatTime(duration - position)}</Text>
                    </View>
                </View>

                {/* Player Buttons */}
                <View style={styles.playerButtonsRow}>
                    <TouchableOpacity>
                        <Ionicons name="shuffle" size={24} color="#94a3b8" />
                    </TouchableOpacity>

                    <View style={styles.mainControls}>
                        <TouchableOpacity>
                            <Ionicons name="play-skip-back" size={32} color="#f1f5f9" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity>
                            <Ionicons name="play-skip-forward" size={32} color="#f1f5f9" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity>
                        <Ionicons name="repeat" size={24} color="#4211d4" />
                    </TouchableOpacity>
                </View>

                {/* Volume & Timer Row */}
                <View style={styles.actionRow}>
                    <View style={styles.volumeBox}>
                        <Ionicons name="volume-low" size={18} color="#64748b" />
                        <Slider
                            style={styles.volumeSlider}
                            minimumValue={0}
                            maximumValue={1}
                            value={volume}
                            onValueChange={setVolume}
                            minimumTrackTintColor="#94a3b8"
                            maximumTrackTintColor="#1e1b4b"
                            thumbTintColor="#f1f5f9"
                        />
                    </View>

                    <TouchableOpacity style={styles.timerBadge}>
                        <Ionicons name="timer-outline" size={18} color="#4211d4" />
                        <Text style={styles.timerBadgeText}>{stopTimer ? `${stopTimer}M` : 'OFF'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Timer Presets */}
                <View style={styles.timerPresets}>
                    {timerOptions.map(opt => (
                        <TouchableOpacity
                            key={opt.label}
                            onPress={() => setStopTimer(opt.value)}
                            style={[styles.presetButton, stopTimer === opt.value && styles.presetButtonActive]}
                        >
                            <Text style={[styles.presetText, stopTimer === opt.value && styles.presetTextActive]}>
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
        backgroundColor: '#0a0812',
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
        backgroundColor: 'rgba(66, 17, 212, 0.15)',
        // No blur in basic StyleSheet, but opacity helps
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 2,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f1f5f9',
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
        borderColor: 'rgba(66, 17, 212, 0.5)',
    },
    artworkContainer: {
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 4,
        borderColor: 'rgba(66, 17, 212, 0.2)',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4211d4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 50,
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
        color: '#f1f5f9',
        letterSpacing: -0.5,
    },
    trackSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
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
        backgroundColor: '#1e1b4b',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4211d4',
        shadowColor: '#4211d4',
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
        color: '#64748b',
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
        backgroundColor: '#4211d4',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4211d4',
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
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    volumeSlider: {
        flex: 1,
        height: 20,
        marginLeft: 8,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(66, 17, 212, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.2)',
        gap: 8,
    },
    timerBadgeText: {
        color: '#4211d4',
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
    presetButtonActive: {
        borderBottomColor: '#4211d4',
    },
    presetText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: 1,
    },
    presetTextActive: {
        color: '#4211d4',
    },
});
