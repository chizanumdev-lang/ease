import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainStackParamList } from '../types';
import { useAudioStore } from '../store/audioStore';
import { useTheme } from '../hooks/useTheme';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function MiniAudioPlayer() {
    const navigation = useNavigation<NavigationProp>();
    const { currentTrack, isPlaying, pause, play, stop, reset } = useAudioStore();
    const { colors, spacing, borderRadius, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    // Don't show if no track is loaded
    if (!currentTrack) return null;

    const handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await pause();
            } else {
                await play();
            }
        } catch (error) {
            console.error('[MINI_PLAYER] Play/pause error:', error);
        }
    };

    const handleDismiss = async () => {
        try {
            await stop();
            reset(); // Clear currentTrack to hide UI
        } catch (error) {
            console.error('[MINI_PLAYER] Dismiss error:', error);
        }
    };

    const handleExpand = () => {
        navigation.navigate('AudioPlayer', { track: currentTrack });
    };

    return (
        <TouchableOpacity 
            style={[
                styles.container, 
                { 
                    backgroundColor: isDark ? 'rgba(34, 83, 68, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: colors.outlineVariant,
                    borderRadius: borderRadius.lg,
                    bottom: insets.bottom + 74, // Positioned precisely above the standard tab bar
                    left: spacing.lg,
                    right: spacing.lg,
                }
            ]} 
            onPress={handleExpand} 
            activeOpacity={0.9}
        >
            <View style={[styles.content, { padding: spacing.sm }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceContainerLow, marginRight: spacing.md }]}>
                    <Ionicons name="musical-notes" size={24} color={colors.primary} />
                </View>

                <View style={styles.info}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {currentTrack.title}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        {isPlaying ? 'Playing' : 'Paused'}
                    </Text>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={handlePlayPause}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={28}
                            color={colors.primary}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.closeButton, { marginLeft: spacing.sm }]}
                        onPress={handleDismiss}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={[styles.closeIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Ionicons
                                name="close"
                                size={18}
                                color={colors.textMuted}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playButton: {
        padding: 4,
    },
    closeButton: {
        padding: 4,
    },
    closeIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
