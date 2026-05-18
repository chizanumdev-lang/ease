import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList, Task, TaskStatus, TaskType } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

// Import all task components
import QuizTaskComponent from '../../components/tasks/QuizTaskComponent';
import VideoTaskComponent from '../../components/tasks/VideoTaskComponent';
import AudioTaskComponent from '../../components/tasks/AudioTaskComponent';
import JournalTaskComponent from '../../components/tasks/JournalTaskComponent';
import ReflectionTaskComponent from '../../components/tasks/ReflectionTaskComponent';
// Consistency is usually a simple toggle, but we can mock it here too.

type Props = NativeStackScreenProps<MainStackParamList, 'TaskPreview'>;

const MOCK_DATA: Record<string, any> = {
    'vocal-practice-template': {
        pattern: 'vocal-test',
        script: 'Le chat curieux regardait le coucher de soleil doré depuis le haut balcon.',
        translation: 'The curious cat watched the golden sunset from the high balcony.',
        locale: 'fr-FR',
        audioUrl: 'https://res.cloudinary.com/drues0qvm/video/upload/v1778936287/ease/audio/speaking_test_french.mp3',
    },
    'speaking-assessment-template': {
        pattern: 'vocal-test',
        script: "Le chat curieux regardait le coucher de soleil doré depuis le haut balcon.",
        translation: "The curious cat watched the golden sunset from the high balcony.",
        locale: 'fr-FR',
        audioUrl: 'https://res.cloudinary.com/drues0qvm/video/upload/v1778936287/ease/audio/speaking_test_french.mp3',
        mistakes: [
            { 
                word: 'curieux', 
                correctionLabel: 'Pronunciation', 
                feedback: 'The "eu" sound was too flat. It should be more rounded, like the "u" in "burn".' 
            },
            { 
                word: 'soleil', 
                correctionLabel: 'Phonetic', 
                feedback: 'The ending "il" is silent. It should sound like a soft "Y" (so-lay).' 
            }
        ]
    },
    'recall-quiz-template': {
        pattern: 'spaced-recall',
        cards: [
            { front: 'Abundance', back: 'A very large quantity of something.' },
            { front: 'Resilience', back: 'The capacity to recover quickly from difficulties.' },
            { front: 'Agile', back: 'Able to move quickly and easily.' },
        ]
    },
    'knowledge-check-template': {
        questions: [
            {
                question: 'Which of these is a core principle of Systems Thinking?',
                options: ['Linear Causality', 'Interconnectedness', 'Isolated Optimization', 'Static State'],
                correctAnswer: 1,
                explanation: 'Systems Thinking focuses on how parts of a system interact and are interconnected.'
            }
        ]
    },
    'problem-solving-template': {
        pattern: 'problem-solving',
        scenario: "You are leading a high-stakes meeting. One stakeholder is constantly interrupting with minor technical details that are derailing the strategic agenda.",
        options: [
            { id: '1', text: "Stop the meeting and explain why they are wrong.", feedback: "Too aggressive. You'll lose their support.", correct: false },
            { id: '2', text: "Acknowledge the detail and offer to discuss it in a follow-up, then pivot back to the agenda.", feedback: "Perfect. This validates them while maintaining control of the room.", correct: true },
            { id: '3', text: "Ignore them and keep talking to the others.", feedback: "Passive-aggressive. They will likely become more disruptive.", correct: false }
        ]
    },
    'tutorial-watch-template': {
        searchQuery: 'productivity techniques for creators',
    },
    'audio-immersion-template': {
        audioUrl: 'https://res.cloudinary.com/duooultxc/video/upload/v1773045822/ease/backgrounds/ambient.mp3',
        script: 'This is an immersion session focused on natural language flow.'
    },
    'reflective-journal-template': {
        prompt: 'What was your biggest win today, no matter how small?',
    }
};

export default function TaskPreviewScreen({ route, navigation }: Props) {
    const { pattern, mobileType, title } = route.params;
    const { colors, fonts } = useTheme();
    const [isComplete, setIsComplete] = useState(false);

    // Construct a mock task object
    const mockTask: Task = {
        id: 'test-task',
        title: title,
        description: `Previewing ${pattern} interaction pattern.`,
        type: mobileType as TaskType,
        status: TaskStatus.PENDING,
        completed: false,
        dayPlanId: 'test-day',
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        videoUrl: mobileType === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : undefined,
        metadata: MOCK_DATA[pattern] || {}
    };

    const handleComplete = (results: any) => {
        console.log('Task Complete Results:', results);
        setIsComplete(true);
    };

    const renderTaskComponent = () => {
        switch (mobileType) {
            case 'quiz':
                return <QuizTaskComponent task={mockTask} onComplete={handleComplete} />;
            case 'video':
                return <VideoTaskComponent task={mockTask} onComplete={handleComplete} />;
            case 'audio':
                return <AudioTaskComponent task={mockTask} onComplete={handleComplete} />;
            case 'journal':
                return <JournalTaskComponent task={mockTask} onComplete={handleComplete} />;
            case 'reflection':
                return <ReflectionTaskComponent task={mockTask} onComplete={handleComplete} />;
            default:
                return (
                    <View style={styles.empty}>
                        <Text style={{ color: colors.textMuted }}>Component for {mobileType} not yet implemented.</Text>
                    </View>
                );
        }
    };

    if (isComplete) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="checkmark-circle" size={80} color="#4ADE80" />
                <Text style={[styles.completeTitle, { color: colors.text, fontFamily: fonts.display }]}>TEST COMPLETE</Text>
                <Text style={[styles.completeSub, { color: colors.textMuted, fontFamily: fonts.body }]}>The component successfully reported completion.</Text>
                <TouchableOpacity 
                    style={[styles.backBtn, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.backBtnText, { fontFamily: fonts.display }]}>BACK TO LAB</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.sandboxHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                    <Text style={[styles.backLabel, { color: colors.primary, fontFamily: fonts.label }]}>BACK TO LAB</Text>
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.sandboxTitle, { color: colors.textMuted, fontFamily: fonts.label }]}>
                        PREVIEWING
                    </Text>
                    <Text style={[styles.patternName, { color: colors.text, fontFamily: fonts.display }]}>
                        {pattern.replace('-template', '').toUpperCase()}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.componentWrapper}>
                {renderTaskComponent()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sandboxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    backLabel: {
        fontSize: 10,
        letterSpacing: 1,
    },
    titleContainer: {
        alignItems: 'center',
    },
    sandboxTitle: {
        fontSize: 8,
        letterSpacing: 2,
        marginBottom: 2,
    },
    patternName: {
        fontSize: 12,
        letterSpacing: 1,
    },
    componentWrapper: {
        flex: 1,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completeTitle: {
        fontSize: 24,
        marginTop: 20,
        marginBottom: 8,
    },
    completeSub: {
        fontSize: 14,
        marginBottom: 40,
    },
    backBtn: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 32,
    },
    backBtnText: {
        color: '#fff',
        fontSize: 16,
    }
});
