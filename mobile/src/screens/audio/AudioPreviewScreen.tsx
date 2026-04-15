import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../constants/config';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';
import LoadingState from '../../components/LoadingState';

export default function AudioPreviewScreen() {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const { showModal } = useModalStore();
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState('Deep Relaxation & Focus');
    const [mood, setMood] = useState('meditation');

    const generatePreview = async () => {
        showModal({
            type: 'loading',
            title: 'Symphony in Progress',
            description: 'Gemini is crafting a personalized 5-minute script, while we mix atmospheric layers for your unique session...'
        });

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

                // Close modal before navigation
                useModalStore.getState().hideModal();

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
                    title: 'Composition Error',
                    description: 'The server completed the request but no audio path was returned. Please try again.'
                });
            }
        } catch (error: any) {
            console.error('[PREVIEW] Failed to generate audio:', error?.response?.data || error.message);
            showModal({
                type: 'error',
                title: 'Generation Failed',
                description: 'The creative void was too deep this time. Please check your connection and try one more time.'
            });
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
                    ]}
                    onPress={generatePreview}
                >
                    <Text style={[styles.buttonText, { color: isDark ? colors.background : "#fff" }]}>Generate 5-Min Preview</Text>
                </TouchableOpacity>
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
