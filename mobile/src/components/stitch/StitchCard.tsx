import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface StitchCardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'tonal' | 'outlined' | 'glass';
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    style?: StyleProp<ViewStyle>;
    borderRadius?: number;
}

export default function StitchCard({
    children,
    variant = 'elevated',
    padding = 'md',
    style,
    borderRadius: customRadius,
}: StitchCardProps) {
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();

    const getPadding = () => {
        if (padding === 'none') return 0;
        return spacing[padding];
    };

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: colors.surface,
                    ...Platform.select({
                        ios: {
                            ...shadows.ambient
                        },
                        android: {
                            elevation: 8,
                        },
                    }),
                };
            case 'tonal':
                return {
                    backgroundColor: colors.surfaceContainerLow,
                };
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.outlineVariant,
                };
            case 'glass':
                return {
                    backgroundColor: isDark ? colors.glass.dark : colors.glass.light,
                    borderWidth: 1,
                    borderColor: colors.glass.border,
                };
            default:
                return {};
        }
    };

    return (
        <View 
            style={[
                styles.base, 
                getVariantStyle(),
                { 
                    padding: getPadding(), 
                    borderRadius: customRadius || borderRadius.xxl 
                },
                style
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    },
});
