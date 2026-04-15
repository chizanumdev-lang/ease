import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';
import Slider from '@react-native-community/slider';

interface AudioTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function AudioTaskComponent({ task, onComplete }: AudioTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    // Mock Audio URL for demo
    const audioUrl = task.metadata?.externalLink || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    async function playPause() {
        if (!sound) {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );
            setSound(newSound);
            setIsPlaying(true);
        } else {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        }
    }

    const onPlaybackStatusUpdate = (status: any) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
                setIsPlaying(false);
            }
        }
    };

    useEffect(() => {
        return sound
            ? () => {
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const formatTime = (millis: number) => {
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    const handleComplete = () => {
        onComplete({ audioPosition: position });
    };

    return (
        <View style={styles.container}>
            <View style={styles.artworkSection}>
                <View style={[styles.artworkContainer, { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.xxl }]}>
                    <Ionicons name="musical-notes" size={80} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{task.title}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>Relaxing Guidance • {task.duration || 10} MIN</Text>
            </View>

            <View style={styles.controlsSection}>
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration}
                    value={position}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.surfaceContainerHighest}
                    thumbTintColor={colors.primary}
                    onSlidingComplete={async (value) => {
                        if (sound) {
                            await sound.setPositionAsync(value);
                        }
                    }}
                />
                <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(position)}</Text>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
                </View>

                <View style={styles.playbackButtons}>
                    <TouchableOpacity style={styles.secondaryControl}>
                        <Ionicons name="refresh-outline" size={32} color={colors.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.playButton, { backgroundColor: colors.primary }]}
                        onPress={playPause}
                    >
                        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryControl}>
                        <Ionicons name="stopwatch-outline" size={32} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <StitchButton 
                    title="Finish Listening"
                    variant="primary"
                    onPress={handleComplete}
                    rightIcon="checkmark-circle"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    artworkSection: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 48,
    },
    artworkContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    controlsSection: {
        marginBottom: 48,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    playbackButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
        marginTop: 24,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    secondaryControl: {
        opacity: 0.6,
    },
    footer: {
        marginTop: 'auto',
    }
});
