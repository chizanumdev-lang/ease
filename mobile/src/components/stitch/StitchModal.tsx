import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../StitchButton';

interface StitchModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    description: string;
    type?: 'success' | 'confirmation' | 'error';
    primaryAction?: {
        label: string;
        onPress: () => void;
    };
    secondaryAction?: {
        label: string;
        onPress: () => void;
    };
}

const { width } = Dimensions.get('window');

export default function StitchModal({
    visible,
    onClose,
    title,
    description,
    type = 'success',
    primaryAction,
    secondaryAction,
}: StitchModalProps) {
    const { colors, fonts, spacing, borderRadius, isDark } = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'confirmation': return 'help-circle';
            case 'error': return 'alert-circle';
            default: return 'information-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success': return colors.primary;
            case 'confirmation': return colors.textMuted;
            case 'error': return colors.error;
            default: return colors.primary;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View 
                    style={[
                        styles.content, 
                        { 
                            backgroundColor: colors.surface, 
                            borderRadius: borderRadius.xxl,
                            padding: spacing.xl,
                        }
                    ]}
                >
                    <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '15' }]}>
                        <Ionicons name={getIcon()} size={48} color={getIconColor()} />
                    </View>

                    <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
                        {title}
                    </Text>

                    <Text style={[styles.description, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        {description}
                    </Text>

                    <View style={styles.actions}>
                        {primaryAction && (
                            <StitchButton 
                                title={primaryAction.label} 
                                onPress={primaryAction.onPress}
                                style={styles.button}
                                variant={type === 'error' ? 'primary' : 'primary'} // Might add destructive variant later
                            />
                        )}
                        {secondaryAction && (
                            <StitchButton 
                                title={secondaryAction.label} 
                                onPress={secondaryAction.onPress}
                                variant="tonal"
                                style={styles.button}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        width: width * 0.85,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
    },
});
