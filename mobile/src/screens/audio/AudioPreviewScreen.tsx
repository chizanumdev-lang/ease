import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../constants/config';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';

export default function AudioPreviewScreen() {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { showModal } = useModalStore();
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState('Deep Relaxation & Focus');
    const [mood, setMood] = useState('meditation');

    const generatePreview = async () => {
        setLoading(true);
        try {
            console.log(`[PREVIEW] Requesting audio preview: ${theme}, ${mood}`);
            const response = await axios.post(`${API_BASE_URL}/audio/preview`, {
                theme,
                mood
            });

            if (response.data?.url) {
                const audioUrl = response.data.url.startsWith('http')
                    ? response.data.url
                    : `${API_BASE_URL.replace('/api', '')}${response.data.url}`;

                console.log(`[PREVIEW] Audio generated: ${audioUrl}`);

                // Navigate to the existing AudioPlayerScreen
                navigation.navigate('AudioPlayer', {
                    track: {
                        id: 'preview',
                        title: `Preview: ${theme}`,
                        url: audioUrl,
                        type: mood,
                        dayPlanId: 'preview'
                    }
                });
            } else {
                showModal({
                    type: 'error',
                    title: 'Error',
                    description: 'No audio URL returned from server.'
                });
            }
        } catch (error: any) {
            console.error('[PREVIEW] Failed to generate audio:', error?.response?.data || error.message);
            showModal({
                type: 'error',
                title: 'Generation Failed',
                description: 'Please check your internet connection or try again later.'
            });
        } finally {
            setLoading(false);
        }
    };

    const moods = ['meditation', 'focus', 'ambient'];

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background, padding: spacing.lg }]}>
            <View style={[styles.header, { marginBottom: spacing.xl }]}>
                <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Audio Generation Preview</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>Test our 5-minute AI narration before starting your program.</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>NARRATION THEME</Text>
                <View style={[styles.inputPlaceholder, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, borderRadius: borderRadius.md }]}>
                    <Text style={[styles.inputText, { color: colors.text }]}>{theme}</Text>
                </View>

                <Text style={[styles.label, { marginTop: spacing.lg, color: colors.textMuted }]}>ATMOSPHERE</Text>
                <View style={[styles.moodContainer, { marginBottom: spacing.xl }]}>
                    {moods.map(m => (
                        <TouchableOpacity
                            key={m}
                            style={[
                                styles.moodButton, 
                                { backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, paddingVertical: spacing.md },
                                mood === m && { backgroundColor: colors.primary }
                            ]}
                            onPress={() => setMood(m)}
                        >
                            <Text style={[
                                styles.moodText, 
                                { color: colors.textMuted },
                                mood === m && { color: isDark ? colors.background : "#fff" }
                            ]}>
                                {m.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        styles.button, 
                        { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: spacing.lg },
                        loading && { backgroundColor: colors.textMuted }
                    ]}
                    onPress={generatePreview}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={isDark ? colors.background : "#fff"} style={{ marginRight: spacing.sm }} />
                            <Text style={[styles.buttonText, { color: isDark ? colors.background : "#fff" }]}>Generating (Estimated 45s)...</Text>
                        </View>
                    ) : (
                        <Text style={[styles.buttonText, { color: isDark ? colors.background : "#fff" }]}>Generate 5-Min Preview</Text>
                    )}
                </TouchableOpacity>

                {loading && (
                    <Text style={[styles.infoText, { color: colors.textMuted, marginTop: spacing.md }]}>
                        Gemini is crafting an 800-word script and mixing it with local background layers. This takes a moment.
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    header: {
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    inputPlaceholder: {
        padding: 16,
        borderWidth: 1,
    },
    inputText: {
        fontSize: 16,
        fontWeight: '500',
    },
    moodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    moodButton: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    moodText: {
        fontSize: 12,
        fontWeight: '700',
    },
    button: {
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    }
});
