import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Program } from '../../types';

interface MasteryCardProps {
    program: Program;
}

export const MasteryCard: React.FC<MasteryCardProps> = ({ program }) => {
    const { colors } = useTheme();

    const score = program.masteryScore || 0;
    const level = program.competenceLevel || 'Novice';

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textSecondary }]}>MASTERY LEVEL</Text>
                <Text style={[styles.score, { color: colors.primary }]}>{score}/100</Text>
            </View>
            <View style={styles.content}>
                <Text style={[styles.level, { color: colors.text }]}>{level}</Text>
            </View>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.surfaceHighlight }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${score}%` }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 16,
        marginVertical: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    score: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        marginBottom: 16,
    },
    level: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressBarContainer: {
        width: '100%',
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    }
});
