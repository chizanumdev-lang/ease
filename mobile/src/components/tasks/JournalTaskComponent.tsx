import React, { useState } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    TextInput, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform, 
    TouchableOpacity, 
    Image, 
    Dimensions,
    StatusBar
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata } from '../../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import PetalBackground from '../PetalBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_OVERLAP = 24;

interface JournalTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function JournalTaskComponent({ task, onComplete }: JournalTaskProps) {
    const { colors, fonts, shadows, isDark, borderRadius } = useTheme();
    const [entry, setEntry] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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
            keyboardVerticalOffset={0}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Hero Header */}
                <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2560&auto=format&fit=crop' }} 
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <Text style={[styles.heroTitle, { color: colors.white, fontFamily: fonts.displayBold }]}>Journal</Text>
                    </View>
                </View>

                {/* Content Card */}
                <View style={[
                    styles.contentArea, 
                    { 
                        backgroundColor: colors.surfaceContainerLowest,
                        borderTopLeftRadius: borderRadius.xxxl,
                        borderTopRightRadius: borderRadius.xxxl,
                        marginTop: -CARD_OVERLAP,
                    }
                ]}>
                    <View style={styles.dragHandle} />

                    <View style={styles.headerBlock}>
                        <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.label }]}>EVENING REFLECTION</Text>
                        <Text style={[styles.title, { color: colors.primary, fontFamily: fonts.displayBold }]}>Evening Journal</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.label }]}>Capture the essence of your day before resting.</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={[styles.inputLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>THOUGHTS & REFLECTIONS</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                            <TextInput
                                style={[styles.input, { color: colors.primary, fontFamily: fonts.body }]}
                                placeholder="What made you feel grounded today?"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                value={entry}
                                onChangeText={setEntry}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerLow }]}>
                            <MaterialCommunityIcons name="spa" size={20} color={colors.primary} />
                            <View>
                                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>INTENTION</Text>
                                <Text style={[styles.statValue, { color: colors.primary, fontFamily: fonts.labelBold }]}>Clarity</Text>
                            </View>
                        </View>
                        <View style={[styles.statItem, { backgroundColor: colors.surfaceContainerLow }]}>
                            <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={colors.primary} />
                            <View>
                                <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>PHASE</Text>
                                <Text style={[styles.statValue, { color: colors.primary, fontFamily: fonts.labelBold }]}>Waning Moon</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            {/* Floating Footer */}
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <View style={styles.footerContent}>
                    <View style={styles.statusPill}>
                        <View style={[styles.stepIndicator, { backgroundColor: colors.primaryContainer }]}>
                            <MaterialCommunityIcons name="book-edit" size={16} color={colors.white} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={[styles.statusSub, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>MOOD</Text>
                            <Text style={[styles.statusMain, { color: colors.primary, fontFamily: fonts.labelBold }]}>Peaceful</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            { 
                                backgroundColor: (entry.length >= 10 && !isSaving) ? colors.primary : colors.surfaceContainerHighest,
                            }
                        ]}
                        onPress={handleSave}
                        disabled={entry.length < 10 || isSaving}
                        activeOpacity={0.88}
                    >
                        <Text style={[
                            styles.saveBtnText, 
                            { 
                                fontFamily: fonts.labelBold,
                                color: (entry.length >= 10 && !isSaving) ? colors.white : colors.textMuted
                            }
                        ]}>
                            {isSaving ? "Saving..." : "Save"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroContent: {
        zIndex: 10,
    },
    heroTitle: {
        fontSize: 48,
        letterSpacing: -1,
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.65,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
        marginBottom: 24,
    },
    headerBlock: {
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        lineHeight: 36,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputWrapper: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 11,
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    inputContainer: {
        borderRadius: 16,
        minHeight: 240,
        padding: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    statLabel: {
        fontSize: 10,
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 13,
    },
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    footerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        justifyContent: 'space-between',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        gap: 12,
    },
    statusTextContainer: {
        justifyContent: 'center',
    },
    statusSub: {
        fontSize: 9,
        opacity: 0.6,
    },
    statusMain: {
        fontSize: 13,
    },
    stepIndicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        fontSize: 15,
    },
});

