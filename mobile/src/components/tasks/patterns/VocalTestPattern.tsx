import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { Task, TaskMetadata } from '../../../types';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../services/api';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface VocalTestPatternProps {
    task: Task;
    onComplete: (results: any) => void;
}

export default function VocalTestPattern({ task, onComplete }: VocalTestPatternProps) {
    const { colors, fonts, shadows, isDark } = useTheme();
    const metadata = task.metadata as TaskMetadata;

    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlayingModel, setIsPlayingModel] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [score, setScore] = useState<number | null>(null);

    // Audio permissions
    useEffect(() => {
        (async () => {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
        })();
    }, []);

    const playModel = async () => {
        try {
            console.log('[VocalTest] Playing model audio:', metadata.audioUrl);
            if (!metadata.audioUrl) {
                console.warn('[VocalTest] No audioUrl found in metadata');
                return;
            }

            setIsPlayingModel(true);

            // Ensure audio mode is correct before playing
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: metadata.audioUrl },
                { shouldPlay: true, volume: 1.0 }
            );
            
            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlayingModel(false);
                    newSound.unloadAsync(); // Clean up
                }
            });
        } catch (error) {
            console.error('[VocalTest] Playback error:', error);
            setIsPlayingModel(false);
        }
    };

    const startRecording = async () => {
        try {
            setIsRecording(true);
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        
        // Trigger Analysis
        analyzeAudio(uri);
    };

    const analyzeAudio = async (uri: string | null) => {
        if (!uri) return;
        setIsAnalyzing(true);
        
        try {
            const formData = new FormData();
            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            // @ts-ignore
            formData.append('audio', {
                uri,
                name: `recording.${fileType}`,
                type: `audio/${fileType}`,
            });

            formData.append('targetScript', metadata.script || '');
            formData.append('locale', metadata.locale || 'fr-FR');

            const response = await api.post('/tasks/vocal/grade', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = response.data;
            if (result) {
                // Update score and metadata for display
                setScore(result.score || 0);
                metadata.vocalScore = result.score;
                metadata.mistakes = result.mistakes || [];
                metadata.feedback = result.feedback;
                
                // You could also update the local metrics if needed
                // e.g., setPronunciation(result.metrics.pronunciation);
            }
        } catch (error) {
            console.error('[VocalTest] AI Analysis failed:', error);
            // Don't use a fake fallback if it failed, tell the user the truth
            setScore(null);
            alert('AI Analysis failed. Check the backend logs for details.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (score !== null) {
        const metrics = [
            { label: 'PRONUNCIATION', value: score, color: '#4ADE80' },
            { label: 'PACE', value: Math.max(0, score - 5), color: '#60A5FA' },
            { label: 'TONE', value: Math.max(0, score - 8), color: '#A78BFA' }
        ];

        const mistakes = metadata.mistakes || [];

        return (
            <View style={styles.container}>
                {ScrollView && (
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                    >
                    <View style={[styles.scoreCard, { backgroundColor: colors.surfaceContainerLow }]}>
                        <View style={[styles.levelBadge, { backgroundColor: colors.primaryContainer }]}>
                            <Text style={[styles.levelText, { color: colors.white, fontFamily: fonts.labelBold }]}>
                                {score >= 90 ? 'PROFICIENT' : score >= 80 ? 'FLUENT' : 'CONVERSATIONAL'}
                            </Text>
                        </View>
                        
                        <Text style={[styles.scoreValue, { color: colors.text, fontFamily: fonts.displayBold }]}>{score}%</Text>
                        <Text style={[styles.scoreLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>OVERALL FLUENCY</Text>

                        <View style={styles.metricsGrid}>
                            {metrics.map((m, i) => (
                                <View key={i} style={styles.metricItem}>
                                    <Text style={[styles.metricLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>{m.label}</Text>
                                    <View style={styles.progressTrack}>
                                        <View style={[styles.progressFill, { width: `${m.value}%`, backgroundColor: m.color }]} />
                                    </View>
                                    <Text style={[styles.metricValue, { color: m.color, fontFamily: fonts.labelBold }]}>{m.value}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Mistakes & Corrections */}
                    {mistakes.length > 0 && (
                        <View style={styles.mistakeSection}>
                            <Text style={[styles.sectionTitle, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>MISTAKE ANALYSIS</Text>
                            {mistakes.map((m: any, i: number) => (
                                <View key={i} style={[styles.mistakeCard, { backgroundColor: colors.surfaceContainerLow }]}>
                                    <View style={styles.mistakeHeader}>
                                        <Text style={[styles.mistakeWord, { color: '#EF4444', fontFamily: fonts.displayBold }]}>"{m.word}"</Text>
                                        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                                        <Text style={[styles.correctionWord, { color: '#10B981', fontFamily: fonts.displayBold }]}>{m.correctionLabel || 'Correction'}</Text>
                                    </View>
                                    <Text style={[styles.mistakeDetail, { color: colors.text, fontFamily: fonts.body }]}>{m.feedback}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: colors.primary, ...shadows.ambient }]}
                        onPress={() => onComplete({ vocalScore: score, proficiency: score >= 80 ? 'high' : 'medium' })}
                    >
                        <Text style={[styles.actionBtnText, { fontFamily: fonts.labelBold }]}>FINISH ASSESSMENT</Text>
                        <Ionicons name="checkmark-done" size={20} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.retryBtn}
                        onPress={() => setScore(null)}
                    >
                        <Text style={[styles.retryBtnText, { color: colors.textMuted, fontFamily: fonts.label }]}>RE-TAKE TEST</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Target Display */}
            <View style={[styles.targetCard, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={styles.badge}>
                    <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.label }]}>SAY THIS</Text>
                </View>
                <Text style={[styles.targetText, { color: colors.text, fontFamily: fonts.display }]}>
                    "{metadata.targetScript || 'Practice this phrase'}"
                </Text>
                {metadata.translation && (
                    <Text style={[styles.translationText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        {metadata.translation}
                    </Text>
                )}
            </View>

            {/* Listen Button */}
            <TouchableOpacity 
                style={[styles.listenBtn, { borderColor: colors.primaryContainer }]}
                onPress={playModel}
                disabled={isPlayingModel}
            >
                {isPlayingModel ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <>
                        <Ionicons name="volume-high" size={24} color={colors.primary} />
                        <Text style={[styles.listenBtnText, { color: colors.primary, fontFamily: fonts.label }]}>HEAR MODEL</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Interaction Area */}
            <View style={styles.interactionArea}>
                {isAnalyzing ? (
                    <View style={styles.analyzingState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.analyzingText, { color: colors.textMuted, fontFamily: fonts.label }]}>ANALYZING SPEECH...</Text>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={[
                            styles.recordBtn, 
                            { 
                                backgroundColor: isRecording ? '#EF4444' : colors.primary,
                                ...shadows.ambient 
                            }
                        ]}
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isRecording ? ['#EF4444', '#DC2626'] : [colors.primary, colors.secondary]}
                            style={styles.recordGradient}
                        >
                            <Ionicons name={isRecording ? "stop" : "mic"} size={40} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
                {!isRecording && !isAnalyzing && (
                    <Text style={[styles.instructionText, { color: colors.textMuted, fontFamily: fonts.label }]}>
                        HOLD TO SPEAK
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    targetCard: {
        width: '100%',
        padding: 32,
        borderRadius: 32,
        alignItems: 'center',
        marginBottom: 24,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 12,
        letterSpacing: 1.5,
    },
    targetText: {
        fontSize: 28,
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 8,
    },
    translationText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
    listenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        gap: 10,
        marginBottom: 60,
    },
    listenBtnText: {
        fontSize: 14,
        letterSpacing: 1,
    },
    interactionArea: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    recordBtn: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        overflow: 'hidden',
    },
    recordGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionText: {
        fontSize: 12,
        letterSpacing: 2,
    },
    analyzingState: {
        alignItems: 'center',
        gap: 16,
    },
    analyzingText: {
        fontSize: 12,
        letterSpacing: 1.5,
    },
    scoreCard: {
        width: '100%',
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        marginBottom: 40,
    },
    scoreLabel: {
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 12,
    },
    scoreValue: {
        fontSize: 72,
        marginBottom: 8,
    },
    levelBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    levelText: {
        fontSize: 10,
        letterSpacing: 2,
    },
    metricsGrid: {
        width: '100%',
        marginVertical: 32,
        gap: 16,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metricLabel: {
        width: 100,
        fontSize: 9,
        letterSpacing: 1,
    },
    progressTrack: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    metricValue: {
        width: 40,
        fontSize: 11,
        textAlign: 'right',
    },
    feedbackText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    mistakeSection: {
        width: '100%',
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 10,
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    mistakeCard: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    mistakeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    mistakeWord: {
        fontSize: 18,
    },
    correctionWord: {
        fontSize: 18,
    },
    mistakeDetail: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    actionBtn: {
        width: '100%',
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    actionBtnText: {
        fontSize: 18,
        color: '#fff',
    },
    retryBtn: {
        padding: 12,
    },
    retryBtnText: {
        fontSize: 13,
        letterSpacing: 1,
    }
});
