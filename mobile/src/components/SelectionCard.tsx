import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

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
    return (
        <TouchableOpacity
            style={[styles.container, selected && styles.selectedContainer]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, selected && styles.selectedText]}>
                        {title}
                    </Text>
                    {description && (
                        <Text style={[styles.description, selected && styles.selectedText]}>
                            {description}
                        </Text>
                    )}
                </View>
            </View>
            <View style={[styles.radio, selected && styles.selectedRadio]}>
                {selected && <View style={styles.radioInner} />}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedContainer: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F8FF',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
    },
    selectedText: {
        color: '#007AFF',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    selectedRadio: {
        borderColor: '#007AFF',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#007AFF',
    },
});
