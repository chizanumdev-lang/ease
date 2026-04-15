import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    useWindowDimensions,
    Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import StitchButton from '../StitchButton';
import LoadingState from '../LoadingState';

interface StitchModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    description: string;
    type?: 'success' | 'confirmation' | 'error' | 'info' | 'loading';
    primaryAction?: {
        label: string;
        onPress: () => void;
    };
    secondaryAction?: {
        label: string;
        onPress: () => void;
    };
}



export default function StitchModal({
    visible,
    onClose,
    title,
    description,
    type = 'success',
    primaryAction,
    secondaryAction,
}: StitchModalProps) {
    const { width } = useWindowDimensions();
    const { colors, fonts, spacing, borderRadius, isDark } = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'confirmation': return 'help-circle';
            case 'error': return 'alert-circle';
            case 'info': return 'information-circle';
            default: return 'information-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success': return colors.primary;
            case 'confirmation': return colors.secondary;
            case 'error': return colors.error;
            case 'info': return colors.primary;
            default: return colors.primary;
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'success': return colors.primaryContainer + '40';
            case 'confirmation': return colors.secondaryContainer;
            case 'error': return colors.error + '15';
            case 'info': return colors.primaryContainer + '20';
            default: return colors.primaryContainer + '20';
        }
    };

    const isLoading = type === 'loading';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={isLoading ? undefined : onClose}
        >
            <View style={styles.overlay}>
                <BlurView 
                    tint={isDark ? "dark" : "light"} 
                    intensity={20} 
                    style={StyleSheet.absoluteFill} 
                >
                    <Pressable 
                        style={styles.backdrop} 
                        onPress={isLoading ? undefined : onClose} 
                    />
                </BlurView>
                
                <View 
                    style={[
                        styles.content, 
                        { 
                            backgroundColor: colors.surface, 
                            borderRadius: 32,
                            padding: spacing.xl,
                            width: width * 0.85,
                        }
                    ]}
                >
                    {isLoading ? (
                        <View style={styles.loadingWrapper}>
                            <LoadingState 
                                variant="component" 
                                title={title}
                                subtitle={description}
                            />
                        </View>
                    ) : (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
                                <Ionicons name={getIcon()} size={42} color={getIconColor()} />
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
                                        variant={type === 'error' || (type === 'confirmation' && primaryAction.label.toLowerCase().includes('delete')) ? 'destructive' : 'primary'}
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
                        </>
                    )}
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
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    content: {
        alignItems: 'center',
        shadowColor: '#225344',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    loadingWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
    },
});

