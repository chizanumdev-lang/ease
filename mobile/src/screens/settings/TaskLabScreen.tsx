import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<MainStackParamList, 'TaskLab'>;

const TASK_CATEGORIES = [
    {
        title: 'Quiz & Testing',
        icon: 'checkmark-circle-outline',
        patterns: [
            { id: 'recall-quiz-template', name: 'Spaced Recall Quiz', type: 'quiz', desc: '3D Flip cards for high-frequency memory retention' },
            { id: 'knowledge-check-template', name: 'Knowledge Check', type: 'quiz', desc: 'Standard assessment for conceptual understanding' },
            { id: 'problem-solving-template', name: 'Problem Solving', type: 'quiz', desc: 'Case studies and decision-making simulations' },
            { id: 'speaking-assessment-template', name: 'Speaking Assessment', type: 'quiz', desc: 'Verbal output and fluency scoring' },
        ]
    },
    {
        title: 'Video & Visuals',
        icon: 'play-circle-outline',
        patterns: [
            { id: 'tutorial-watch-template', name: 'Tutorial Watch', type: 'video', desc: 'Watch and learn with key takeaway tracking' },
            { id: 'guided-session-template', name: 'Guided Session', type: 'video', desc: 'Interactive checklist following video timestamps' },
            { id: 'lecture-analysis-template', name: 'Lecture Analysis', type: 'video', desc: 'Deep-dive study with split-screen note taking' },
            { id: 'observational-skill-template', name: 'Observational Skill', type: 'video', desc: 'Moment-catching for behavior observation' },
            { id: 'technique-demo-template', name: 'Technique Demo', type: 'video', desc: 'Form check with loopable video and mirror mode' },
        ]
    },
    {
        title: 'Audio Experiences',
        icon: 'headset-outline',
        patterns: [
            { id: 'audio-immersion-template', name: 'Audio Immersion', type: 'audio', desc: 'Passive listening for familiarity building' },
            { id: 'guided-audio-template', name: 'Guided Audio', type: 'audio', desc: 'Active listening for mental/emotional states' },
            { id: 'vocal-practice-template', name: 'Vocal Practice', type: 'audio', desc: 'Mimicry sandbox with waveform visualizer' },
        ]
    },
    {
        title: 'Writing & Journaling',
        icon: 'book-outline',
        patterns: [
            { id: 'reflective-journal-template', name: 'Reflective Journal', type: 'journal', desc: 'Emotional and introspective writing prompts' },
            { id: 'deep-work-journal-template', name: 'Deep Work Journal', type: 'journal', desc: 'Objective analysis and knowledge synthesis' },
            { id: 'action-planning-template', name: 'Action Planning', type: 'journal', desc: 'Structured planning and calendar integration' },
            { id: 'creative-practice-template', name: 'Creative Practice', type: 'journal', desc: 'Craft-specific drafting and free-writing' },
        ]
    },
    {
        title: 'Consistency & Rituals',
        icon: 'flash-outline',
        patterns: [
            { id: 'habit-tracker-template', name: 'Habit Tracker', type: 'consistency', desc: 'Quantitative logging of daily progress' },
            { id: 'daily-ritual-template', name: 'Daily Ritual', type: 'consistency', desc: 'Step-by-step recurring routine maintenance' },
            { id: 'micro-practice-template', name: 'Micro Practice', type: 'consistency', desc: 'Short, daily bursts for muscle memory' },
        ]
    }
];

export default function TaskLabScreen({ navigation }: Props) {
    const { colors, fonts, spacing } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>ENGINE LAB</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.label }]}>TEST ALL INTERACTION PATTERNS</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {TASK_CATEGORIES.map((category, idx) => (
                    <View key={idx} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name={category.icon as any} size={20} color={colors.primary} />
                            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>{category.title}</Text>
                        </View>

                        <View style={styles.patternGrid}>
                            {category.patterns.map((pattern) => (
                                <TouchableOpacity 
                                    key={pattern.id}
                                    style={[styles.patternCard, { backgroundColor: colors.surfaceContainerLow }]}
                                    onPress={() => navigation.navigate('TaskPreview', { 
                                        pattern: pattern.id, 
                                        mobileType: pattern.type,
                                        title: pattern.name
                                    })}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.patternName, { color: colors.text, fontFamily: fonts.display }]}>{pattern.name}</Text>
                                        <View style={[styles.typeBadge, { backgroundColor: colors.primary + '1A' }]}>
                                            <Text style={[styles.typeText, { color: colors.primary, fontFamily: fonts.label }]}>{pattern.type.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.patternDesc, { color: colors.textMuted, fontFamily: fonts.body }]}>{pattern.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        gap: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 10,
        letterSpacing: 1,
        marginTop: 2,
    },
    scroll: {
        paddingHorizontal: 20,
        paddingBottom: 60,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    patternGrid: {
        gap: 12,
    },
    patternCard: {
        padding: 20,
        borderRadius: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    patternName: {
        fontSize: 17,
        flex: 1,
        marginRight: 10,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        fontSize: 10,
        letterSpacing: 0.5,
    },
    patternDesc: {
        fontSize: 13,
        lineHeight: 18,
    }
});
