import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../constants/theme';

interface StitchButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    showArrow?: boolean;
}

export default function StitchButton({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    style,
    textStyle,
    showArrow = false,
}: StitchButtonProps) {
    const getButtonStyle = () => {
        const baseStyle: ViewStyle[] = [styles.button];

        if (size === 'sm') baseStyle.push(styles.sm);
        if (size === 'lg') baseStyle.push(styles.lg);

        if (variant === 'primary') baseStyle.push(styles.primary);
        if (variant === 'secondary') baseStyle.push(styles.secondary);
        if (variant === 'outline') baseStyle.push(styles.outline);
        if (variant === 'ghost') baseStyle.push(styles.ghost);

        if (disabled || isLoading) baseStyle.push(styles.disabled);
        if (style) baseStyle.push(style);

        return baseStyle;
    };

    const getTextStyle = () => {
        const baseStyle: TextStyle[] = [styles.text];

        if (size === 'sm') baseStyle.push(styles.textSm);
        if (size === 'lg') baseStyle.push(styles.textLg);

        if (variant === 'outline' || variant === 'ghost') {
            baseStyle.push({ color: Theme.colors.primary });
        } else if (variant === 'secondary') {
            baseStyle.push({ color: Theme.colors.slate[900] });
        } else {
            baseStyle.push({ color: Theme.colors.white });
        }

        if (textStyle) baseStyle.push(textStyle);

        return baseStyle;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            style={getButtonStyle()}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Theme.colors.primary : Theme.colors.white} />
            ) : (
                <>
                    <Text style={getTextStyle()}>{title}</Text>
                    {showArrow && (
                        <Text style={[getTextStyle(), { marginLeft: 8 }]}>→</Text>
                    )}
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: Theme.borderRadius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Theme.spacing.lg,
        height: 56,
    },
    sm: {
        height: 40,
        paddingHorizontal: Theme.spacing.md,
    },
    lg: {
        height: 64,
        paddingHorizontal: Theme.spacing.xl,
    },
    primary: {
        backgroundColor: Theme.colors.primary,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    secondary: {
        backgroundColor: Theme.colors.accent,
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Theme.colors.slate[200],
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 18,
        fontWeight: '700',
    },
    textSm: {
        fontSize: 14,
    },
    textLg: {
        fontSize: 20,
    },
});
