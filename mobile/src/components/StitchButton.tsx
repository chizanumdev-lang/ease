import React from 'react';
import { 
    TextStyle,
    Animated,
    Pressable,
    StyleSheet,
    ViewStyle,
    View,
    Text,
    StyleProp
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import LoadingState from './LoadingState';

interface StitchButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'tonal' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    showArrow?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
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
    leftIcon,
    rightIcon,
}: StitchButtonProps) {
    const { colors, spacing, borderRadius, fonts, isDark, shadows } = useTheme();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 50,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
        }).start();
    };

    const getButtonStyle = () => {
        const baseStyle: StyleProp<ViewStyle>[] = [styles.button];
        
        // Dynamic borderRadius
        baseStyle.push({ borderRadius: borderRadius.xxxl });

        if (size === 'sm') baseStyle.push({ height: 44, paddingHorizontal: 20, borderRadius: borderRadius.xl });
        if (size === 'lg') baseStyle.push({ height: 72, paddingHorizontal: 36, borderRadius: borderRadius.xxxl });

        if (variant === 'destructive') {
            baseStyle.push({ backgroundColor: colors.error });
        }
        if (variant === 'secondary' || variant === 'tonal') {
            baseStyle.push({ backgroundColor: colors.secondaryContainer });
        }
        if (variant === 'outline') {
            baseStyle.push({ 
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: colors.outlineVariant
            });
        }
        if (variant === 'ghost') baseStyle.push(styles.ghost);

        if (disabled || isLoading) baseStyle.push(styles.disabled);
        if (style) baseStyle.push(style);

        return baseStyle;
    };

    const getTextStyle = () => {
        const baseStyle: StyleProp<TextStyle>[] = [
            styles.text,
            { fontFamily: fonts.display }
        ];

        if (size === 'sm') baseStyle.push(styles.textSm);
        if (size === 'lg') baseStyle.push(styles.textLg);

        if (variant === 'primary' || variant === 'destructive') {
            baseStyle.push({ color: '#ffffff' }); // Always white for primary gradient and destructive
        } else if (variant === 'secondary' || variant === 'tonal') {
            baseStyle.push({ color: colors.onSurface });
        } else if (variant === 'ghost') {
            baseStyle.push({ 
                color: colors.primary,
                textDecorationLine: 'underline',
                textDecorationColor: colors.primary,
                textDecorationStyle: 'solid'
            });
        } else {
            baseStyle.push({ color: colors.primary });
        }

        if (textStyle) baseStyle.push(textStyle);

        return baseStyle;
    };

    const renderIcon = (icon: React.ReactNode, type: 'left' | 'right') => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return (
                <View style={type === 'left' ? styles.leftIcon : styles.rightIcon}>
                    <Ionicons 
                        name={icon as any} 
                        size={size === 'sm' ? 16 : 20} 
                        color={variant === 'primary' ? '#ffffff' : colors.primary} 
                    />
                </View>
            );
        }
        return <View style={type === 'left' ? styles.leftIcon : styles.rightIcon}>{icon}</View>;
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <LoadingState variant="compact" title="" />
            );
        }

        return (
            <View style={styles.contentWrapper}>
                {renderIcon(leftIcon, 'left')}
                <Text style={getTextStyle()}>{title}</Text>
                {showArrow && (
                    <Text style={[getTextStyle(), { marginLeft: 8 }]}>→</Text>
                )}
                {renderIcon(rightIcon, 'right')}
            </View>
        );
    };

    if (variant === 'primary') {
        return (
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, shadows.ambient, style]}>
                <Pressable
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || isLoading}
                >
                    <LinearGradient
                        colors={colors.gradients.primary as unknown as readonly [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={getButtonStyle()}
                    >
                        {renderContent()}
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isLoading}
                style={getButtonStyle()}
            >
                {renderContent()}
            </Pressable>
        </Animated.View>
    );
}

// Internal text/layout styles

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        height: 60,
    },
    sm: {
        height: 40,
        paddingHorizontal: 16,
    },
    lg: {
        height: 64,
        paddingHorizontal: 32,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    textSm: {
        fontSize: 14,
    },
    textLg: {
        fontSize: 18,
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftIcon: {
        marginRight: 10,
    },
    rightIcon: {
        marginLeft: 10,
    },
});

