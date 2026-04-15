import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ViewStyle, 
    TextStyle, 
    Dimensions 
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

interface EditorialCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    glass?: boolean;
}

export default function EditorialCard({ children, style, glass = false }: EditorialCardProps) {
    const { colors, borderRadius, shadows } = useTheme();

    return (
        <View style={[
            styles.card,
            { 
                borderRadius: 40,
                backgroundColor: glass ? 'rgba(255, 255, 255, 0.4)' : colors.surface,
                borderColor: colors.outlineVariant,
            },
            !glass && shadows.ambient,
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        padding: 32,
        borderWidth: 1,
        marginBottom: 24,
    }
});
