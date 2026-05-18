import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../store/audioStore';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** True if the current time is in the "morning" window (before noon). */
const isCurrentlyMorning = () => new Date().getHours() < 12;

const AudioWidget = () => {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { 
        morningRitualTime, 
        nightRitualTime, 
        proximityStatus, 
        ritualTracks, 
        loadTrack, 
        play, 
        checkProximity, 
        fetchRituals,
        isPlaying,
        autoPlayEnabled
    } = useAudioStore();
    const [timeLeft, setTimeLeft] = useState<string>('');
    const lastAutoplayedRef = useRef<{ date: string, type: 'morning' | 'night' } | null>(null);

    // Fetch rituals and start proximity checks on mount
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        fetchRituals(today);
        checkProximity();
        const interval = setInterval(checkProximity, 60000);
        return () => clearInterval(interval);
    }, []);

    // Unified label — single source of truth used by both title and button
    const morning = isCurrentlyMorning();
    const nextRitualLabel = morning ? 'Morning Affirmations' : 'Nightly Subliminals';
    const activeTrack = morning ? ritualTracks.morning : ritualTracks.night;
    const trackReady = !!activeTrack;
    const canPlay = proximityStatus === 'READY' && trackReady;

    // Autoplay when proximity becomes READY and autoplay is enabled
    useEffect(() => {
        if (canPlay && autoPlayEnabled && !isPlaying) {
            const todayStr = new Date().toISOString().split('T')[0];
            const currentType = morning ? 'morning' : 'night';
            
            if (!lastAutoplayedRef.current || 
                lastAutoplayedRef.current.date !== todayStr || 
                lastAutoplayedRef.current.type !== currentType) {
                
                console.log(`[AudioWidget] Autoplay triggered for ${currentType} ritual`);
                lastAutoplayedRef.current = { date: todayStr, type: currentType };
                
                const startAutoplay = async () => {
                    try {
                        await loadTrack(activeTrack!);
                        await play();
                    } catch (e) {
                        console.error('[AudioWidget] Autoplay failed:', e);
                    }
                };
                startAutoplay();
            }
        }
    }, [canPlay, autoPlayEnabled, isPlaying, activeTrack, morning]);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const parseTime = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number);
                return h * 60 + m;
            };

            const morningMins = parseTime(morningRitualTime);
            const nightMins = parseTime(nightRitualTime);

            let nextRitualMins = morningMins;

            if (currentMinutes >= morningMins && currentMinutes < nightMins) {
                nextRitualMins = nightMins;
            } else if (currentMinutes >= nightMins) {
                nextRitualMins = morningMins + 1440; // Next day
            }

            const diff = nextRitualMins - currentMinutes;
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            setTimeLeft(diff <= 0 ? 'Ready' : `${h}h ${m}m`);
        };

        const interval = setInterval(updateTimer, 60000);
        updateTimer();
        return () => clearInterval(interval);
    }, [morningRitualTime, nightRitualTime]);

    const handleStartRitual = async () => {
        // Use the same morning/night determination everywhere
        const morning = isCurrentlyMorning();
        const track = morning ? ritualTracks.morning : ritualTracks.night;

        if (!track) {
            console.warn('[AudioWidget] Ritual track not generated yet for', morning ? 'morning' : 'night');
            return;
        }

        try {
            await loadTrack(track);
            await play();
        } catch (e) {
            console.error('[AudioWidget] Failed to start ritual:', e);
        }
    };



    const getStatusColor = () => {
        if (proximityStatus === 'READY' && trackReady) return '#10B981';
        if (proximityStatus === 'APPROACHING') return '#F59E0B';
        return colors.textMuted;
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={isDark ? 40 : 60} style={[styles.blur, { borderRadius: borderRadius.xl }]}>
                <LinearGradient
                    colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
                    style={styles.gradient}
                >
                    <View style={styles.header}>
                        <View style={styles.titleGroup}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                            <Text style={[styles.title, { color: colors.text }]}>{nextRitualLabel}</Text>
                        </View>
                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{timeLeft}</Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.ritualInfo}>
                            <Ionicons 
                                name={morning ? 'sunny-outline' : 'moon-outline'} 
                                size={16} 
                                color={colors.primary} 
                            />
                            <Text style={[styles.ritualTime, { color: colors.text }]}>
                                {morning ? morningRitualTime : nightRitualTime}
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.startButton, { 
                                backgroundColor: canPlay ? colors.primary : colors.surfaceContainerHigh,
                                opacity: canPlay ? 1 : 0.8,
                                borderBottomWidth: canPlay ? 4 : 0,
                                borderBottomColor: canPlay ? 'rgba(0,0,0,0.2)' : 'transparent'
                            }]}
                            disabled={!canPlay}
                            onPress={handleStartRitual}
                        >
                            <Text style={[styles.buttonText, { 
                                color: canPlay ? '#fff' : colors.textMuted,
                                fontFamily: fonts.label
                            }]}>
                                {!trackReady ? 'GENERATING' : proximityStatus === 'READY' ? 'BEGIN' : 'LOCKED'}
                            </Text>
                            <Ionicons 
                                name={canPlay ? 'play-circle' : trackReady ? 'lock-closed' : 'hourglass'} 
                                size={16} 
                                color={canPlay ? '#fff' : colors.textMuted} 
                            />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    blur: {
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    gradient: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    timeLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ritualInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ritualTime: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: '800',
        marginRight: 6,
        letterSpacing: 0.5,
    }
});

export default AudioWidget;
