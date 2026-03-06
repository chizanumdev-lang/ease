import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
    return (
        <View style={styles.container}>
            {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index < currentStep ? styles.dotCompleted : styles.dotIncomplete,
                        index === currentStep - 1 && styles.dotActive,
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotCompleted: {
        backgroundColor: '#007AFF',
    },
    dotActive: {
        backgroundColor: '#007AFF',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    dotIncomplete: {
        backgroundColor: '#ddd',
    },
});
