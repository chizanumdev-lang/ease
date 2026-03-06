import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../constants/config';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export default function AudioPreviewScreen() {
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
                Alert.alert('Error', 'No audio URL returned from server.');
            }
        } catch (error: any) {
            console.error('[PREVIEW] Failed to generate audio:', error?.response?.data || error.message);
            Alert.alert('Generation Failed', 'Please check your internet connection or try again later.');
        } finally {
            setLoading(false);
        }
    };

    const moods = ['meditation', 'focus', 'ambient'];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Audio Generation Preview</Text>
                <Text style={styles.subtitle}>Test our 5-minute AI narration before starting your program.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>NARRATION THEME</Text>
                <View style={styles.inputPlaceholder}>
                    <Text style={styles.inputText}>{theme}</Text>
                </View>

                <Text style={[styles.label, { marginTop: 20 }]}>ATMOSPHERE</Text>
                <View style={styles.moodContainer}>
                    {moods.map(m => (
                        <TouchableOpacity
                            key={m}
                            style={[styles.moodButton, mood === m && styles.moodButtonActive]}
                            onPress={() => setMood(m)}
                        >
                            <Text style={[styles.moodText, mood === m && styles.moodTextActive]}>
                                {m.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={generatePreview}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.buttonText}>Generating (Estimated 45s)...</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonText}>Generate 5-Min Preview</Text>
                    )}
                </TouchableOpacity>

                {loading && (
                    <Text style={styles.infoText}>
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
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    inputPlaceholder: {
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    inputText: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    moodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    moodButton: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    moodButtonActive: {
        backgroundColor: '#007AFF',
    },
    moodText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
    },
    moodTextActive: {
        color: '#FFFFFF',
    },
    button: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A1A1A1',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginTop: 15,
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 18,
    }
});
