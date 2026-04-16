import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../store/audioStore';
import { useTheme } from '../../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AudioWidget = () => {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { morningRitualTime, nightRitualTime, proximityStatus, ritualTracks, loadTrack, play } = useAudioStore();
    const [timeLeft, setTimeLeft] = useState<string>('');

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
            let label = 'Morning';

            if (currentMinutes >= morningMins && currentMinutes < nightMins) {
                nextRitualMins = nightMins;
                label = 'Night';
            } else if (currentMinutes >= nightMins) {
                nextRitualMins = morningMins + 1440; // Next day
                label = 'Morning';
            }

            const diff = nextRitualMins - currentMinutes;
            const h = Math.floor(diff / 60);
            const m = diff % 60;

            if (diff <= 0) {
                setTimeLeft('Ready');
            } else {
                setTimeLeft(`${h}h ${m}m`);
            }
        };

        const interval = setInterval(updateTimer, 60000);
        updateTimer();
        return () => clearInterval(interval);
    }, [morningRitualTime, nightRitualTime]);

    const handleStartRitual = async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const isMorning = currentHour < 12;
        
        const track = isMorning ? ritualTracks.morning : ritualTracks.night;
        
        if (track) {
            await loadTrack(track);
            await play();
        } else {
            console.log('No ritual track generated yet.');
        }
    };

    const getStatusColor = () => {
        if (proximityStatus === 'READY') return '#10B981';
        if (proximityStatus === 'APPROACHING') return '#F59E0B';
        return colors.textMuted;
    };

    const getNextRitualLabel = () => {
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour >= 22 || currentHour < 7) return 'Morning Affirmations';
        return 'Nightly Subliminals';
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
                            <Text style={[styles.title, { color: colors.text }]}>{getNextRitualLabel()}</Text>
                        </View>
                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{timeLeft}</Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.ritualInfo}>
                            <Ionicons 
                                name={getNextRitualLabel().includes('Morning') ? 'sunny-outline' : 'moon-outline'} 
                                size={16} 
                                color={colors.primary} 
                            />
                            <Text style={[styles.ritualTime, { color: colors.text }]}>
                                {getNextRitualLabel().includes('Morning') ? morningRitualTime : nightRitualTime}
                            </Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.startButton, { 
                                backgroundColor: proximityStatus === 'READY' ? colors.primary : 'rgba(0,0,0,0.05)',
                                opacity: proximityStatus === 'READY' ? 1 : 0.6
                            }]}
                            disabled={proximityStatus !== 'READY'}
                            onPress={handleStartRitual}
                        >
                            <Text style={[styles.buttonText, { 
                                color: proximityStatus === 'READY' ? '#fff' : colors.textMuted 
                            }]}>
                                {proximityStatus === 'READY' ? 'BEGIN' : 'LOCKED'}
                            </Text>
                            <Ionicons 
                                name={proximityStatus === 'READY' ? "play-outline" : "lock-closed-outline"} 
                                size={14} 
                                color={proximityStatus === 'READY' ? "#fff" : colors.textMuted} 
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
