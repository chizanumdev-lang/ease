import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../constants/theme';

interface StitchInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    error?: string;
}

export default function StitchInput({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    containerStyle,
    inputStyle,
    error,
}: StitchInputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                <TextInput
                    style={[styles.input, inputStyle]}
                    placeholder={placeholder}
                    placeholderTextColor={Theme.colors.slate[400]}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Theme.spacing.md,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Theme.colors.slate[700],
        marginBottom: Theme.spacing.xs,
        paddingHorizontal: 4,
    },
    inputContainer: {
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: Theme.colors.slate[200],
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: Theme.spacing.md,
    },
    input: {
        fontSize: 16,
        color: Theme.colors.slate[900],
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        fontSize: 12,
        color: '#ff4444',
        marginTop: 4,
        paddingHorizontal: 4,
    },
});
