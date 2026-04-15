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
    const { colors, spacing, borderRadius, isDark } = useTheme();

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
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isDark ? 0.3 : 0.05,
                            shadowRadius: 12,
                        },
                        android: {
                            elevation: 4,
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
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
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
