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
    const { colors, fonts, shadows, isDark } = useTheme();
    const [entry, setEntry] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const prompts = [
        "What's one thing that went better than expected today?",
        "How did you handle a moment of stress or resistance?",
        "What's your focus for tomorrow to maintain your routine?"
    ];

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            onComplete({ journalEntry: entry });
            setIsSaving(false);
        }, 1200);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.root, { backgroundColor: colors.background }]}
            keyboardVerticalOffset={100}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.promptHeader}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                        <Ionicons name="journal" size={28} color={colors.primary} />
                    </View>
                    <View style={styles.promptMeta}>
                        <Text style={[styles.promptTitle, { color: colors.text, fontFamily: fonts.display }]}>Daily Reflection</Text>
                        <Text style={[styles.promptSubtitle, { color: colors.primary, fontFamily: fonts.label }]}>SECURE • END-TO-END ENCRYPTED</Text>
                    </View>
                </View>

                <View style={styles.promptsContainer}>
                    {prompts.map((p, i) => (
                        <View key={i} style={[styles.promptItem, { backgroundColor: colors.surfaceContainerLow }]}>
                            <Text style={[styles.promptText, { color: colors.text, fontFamily: fonts.body }]}>{p}</Text>
                        </View>
                    ))}
                </View>

                <View style={[
                    styles.inputContainer, 
                    { 
                        backgroundColor: colors.surfaceContainerLow,
                        ...(isDark ? {} : shadows.ambient)
                    }
                ]}>
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
                        <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                        <Text style={[styles.encryptionText, { color: colors.primary, fontFamily: fonts.label }]}>
                            AES-256 Protected
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            { 
                                backgroundColor: (entry.length >= 10 && !isSaving) ? colors.primary : colors.surfaceContainerHighest,
                                ...((entry.length >= 10 && !isSaving) ? shadows.ambient : {})
                            }
                        ]}
                        onPress={handleSave}
                        disabled={entry.length < 10 || isSaving}
                        activeOpacity={0.88}
                    >
                        <Text style={[
                            styles.saveBtnText, 
                            { 
                                fontFamily: fonts.display,
                                color: (entry.length >= 10 && !isSaving) ? colors.white : colors.textMuted
                            }
                        ]}>
                            {isSaving ? "Encrypting..." : "Save Reflection"}
                        </Text>
                        {!isSaving && <Ionicons name="lock-closed" size={18} color={(entry.length >= 10) ? colors.white : colors.textMuted} />}
                    </TouchableOpacity>

                    <View style={styles.minCharContainer}>
                        <Text style={[styles.minCharText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            {entry.length < 10 ? `Need ${10 - entry.length} more characters` : "Entry secured"}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promptMeta: {
        flex: 1,
    },
    promptTitle: {
        fontSize: 24,
        lineHeight: 30,
        marginBottom: 4,
    },
    promptSubtitle: {
        fontSize: 10,
        letterSpacing: 1.2,
    },
    promptsContainer: {
        gap: 12,
        marginBottom: 24,
    },
    promptItem: {
        padding: 16,
        borderRadius: 16,
    },
    promptText: {
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.9,
    },
    inputContainer: {
        borderRadius: 24,
        minHeight: 280,
        padding: 20,
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
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        opacity: 0.8,
    },
    encryptionText: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footer: {
        marginTop: 32,
    },
    saveBtn: {
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    saveBtnText: {
        fontSize: 18,
    },
    minCharContainer: {
        marginTop: 14,
        alignItems: 'center',
    },
    minCharText: {
        fontSize: 12,
    }
});
