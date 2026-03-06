import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { useAudioStore } from '../store/audioStore';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function MiniAudioPlayer() {
    const navigation = useNavigation<NavigationProp>();
    const { currentTrack, isPlaying, pause, play } = useAudioStore();

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

    const handleExpand = () => {
        navigation.navigate('AudioPlayer', { track: currentTrack });
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handleExpand} activeOpacity={0.9}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="musical-notes" size={24} color="#007AFF" />
                </View>

                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {currentTrack.title}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isPlaying ? 'Playing' : 'Paused'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayPause}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={28}
                        color="#007AFF"
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 16, // Extra padding for tab bar
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#edf7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
    },
    playButton: {
        padding: 8,
    },
});
