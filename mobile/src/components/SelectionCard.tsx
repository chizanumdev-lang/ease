import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SelectionCardProps {
    title: string;
    description?: string;
    selected: boolean;
    onPress: () => void;
    icon?: React.ReactNode;
}

export default function SelectionCard({
    title,
    description,
    selected,
    onPress,
    icon,
}: SelectionCardProps) {
    const { colors, spacing, borderRadius, fonts } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.container, 
                { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.outlineVariant,
                    padding: spacing.md,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.sm
                },
                selected && { borderColor: colors.primary, backgroundColor: colors.surfaceContainerLow }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {icon && <View style={[styles.iconContainer, { marginRight: spacing.md }]}>{icon}</View>}
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.title, 
                        { color: colors.text, fontFamily: fonts.display },
                        selected && { color: colors.primary }
                    ]}>
                        {title}
                    </Text>
                    {description && (
                        <Text style={[
                            styles.description, 
                            { color: colors.textMuted, fontFamily: fonts.body },
                            selected && { color: colors.primary, opacity: 0.8 }
                        ]}>
                            {description}
                        </Text>
                    )}
                </View>
            </View>
            <View style={[
                styles.radio, 
                { borderColor: colors.outlineVariant, marginLeft: spacing.md },
                selected && { borderColor: colors.primary }
            ]}>
                {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
