import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata, TaskStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../StitchButton';
import StitchCard from '../stitch/StitchCard';

interface JournalTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function JournalTaskComponent({ task, onComplete }: JournalTaskProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [entry, setEntry] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const prompts = [
        "What's one thing that went better than expected today?",
        "How did you handle a moment of stress or resistance?",
        "What's your focus for tomorrow to maintain your routine?"
    ];

    const handleSave = () => {
        setIsSaving(true);
        // Simulate encryption delay
        setTimeout(() => {
            onComplete({ journalEntry: entry });
            setIsSaving(false);
        }, 1000);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
            keyboardVerticalOffset={100}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.promptHeader}>
                    <View style={[styles.iconBox, { backgroundColor: colors.secondaryContainer }]}>
                        <Ionicons name="journal" size={32} color={colors.primary} />
                    </View>
                    <View style={styles.promptMeta}>
                        <Text style={[styles.promptTitle, { color: colors.text, fontFamily: fonts.display }]}>Daily Reflection</Text>
                        <Text style={[styles.promptSubtitle, { color: colors.textMuted }]}>SECURE • END-TO-END ENCRYPTED</Text>
                    </View>
                </View>

                {prompts.map((p, i) => (
                    <View key={i} style={styles.promptItem}>
                        <Text style={[styles.promptText, { color: colors.text, fontFamily: fonts.body }]}>{p}</Text>
                    </View>
                ))}

                <StitchCard variant="elevated" style={[styles.inputCard, { borderColor: colors.outlineVariant }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text, fontFamily: fonts.body }]}
                        placeholder="Start typing your thoughts here..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        value={entry}
                        onChangeText={setEntry}
                        autoFocus
                    />
                    
                    <View style={styles.encryptionIndicator}>
                        <Ionicons name="lock-closed" size={14} color={colors.primary} />
                        <Text style={[styles.encryptionText, { color: colors.primary }]}>
                            Encrypted with AES-256
                        </Text>
                    </View>
                </StitchCard>

                <View style={styles.footer}>
                    <StitchButton 
                        title={isSaving ? "Encrypting & Saving..." : "Save Entry"}
                        variant="primary"
                        onPress={handleSave}
                        disabled={entry.length < 10 || isSaving}
                        isLoading={isSaving}
                        rightIcon="shield-checkmark"
                    />
                    <View style={styles.minCharContainer}>
                        <Text style={[styles.minCharText, { color: colors.textMuted }]}>
                            {entry.length < 10 ? `Minimum 10 characters (${10 - entry.length} more)` : "Perfect length"}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promptMeta: {
        flex: 1,
    },
    promptTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    promptSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    promptItem: {
        marginBottom: 12,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(0,0,0,0.1)',
    },
    promptText: {
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.8,
    },
    inputCard: {
        marginTop: 12,
        minHeight: 250,
        padding: 20,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        textAlignVertical: 'top',
    },
    encryptionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    encryptionText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footer: {
        marginTop: 32,
    },
    minCharContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
    minCharText: {
        fontSize: 12,
        fontWeight: '600',
    }
});
