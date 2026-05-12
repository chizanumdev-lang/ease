import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    TextInput, 
    Text, 
    StyleSheet, 
    Animated, 
    Pressable,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface StitchInputProps extends TextInputProps {
    label: string;
    error?: string;
    success?: boolean;
    helperText?: string;
    prefixIcon?: keyof typeof Ionicons.glyphMap;
    isPassword?: boolean;
    containerStyle?: ViewStyle;
}

export default function StitchInput({
    label,
    error,
    success,
    helperText,
    prefixIcon,
    isPassword,
    containerStyle,
    value,
    onFocus,
    onBlur,
    ...props
}: StitchInputProps) {
    const { colors, spacing, borderRadius, fonts, isDark } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Animation for floating label
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(labelAnim, {
            toValue: (isFocused || value) ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value, labelAnim]);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const labelStyle = {
        position: 'absolute' as const,
        left: prefixIcon ? 48 : 20,
        top: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [22, 8],
        }),
        fontSize: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
                isDark ? 'rgba(255,255,255,0.4)' : colors.textMuted, 
                error ? colors.error : (isFocused ? colors.primary : colors.textMuted)
            ],
        }),
        fontFamily: fonts.bodyMedium,
        zIndex: 1,
    };

    return (
        <View style={[styles.outerContainer, containerStyle]}>
            <Pressable 
                style={[
                    styles.inputWrapper,
                    { 
                        backgroundColor: isDark ? colors.surfaceContainerLow : colors.surfaceContainerHighest,
                        borderRadius: borderRadius.xl,
                        borderColor: error ? colors.error : (isFocused ? colors.primary : colors.outlineVariant),
                        borderWidth: 1.5,
                    }
                ]}
            >
                <Animated.Text style={labelStyle}>{label}</Animated.Text>
                
                <View style={styles.inputRow}>
                    {prefixIcon && (
                        <View style={styles.iconContainer}>
                            <Ionicons 
                                name={prefixIcon} 
                                size={20} 
                                color={isFocused ? colors.primary : colors.textMuted} 
                            />
                        </View>
                    )}
                    
                    <TextInput
                        style={[
                            styles.input,
                            { 
                                color: colors.text,
                                fontFamily: fonts.body,
                                paddingLeft: prefixIcon ? 48 : 20,
                                paddingTop: 18,
                            }
                        ]}
                        value={value}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        secureTextEntry={isPassword && !showPassword}
                        selectionColor={colors.primary}
                        placeholderTextColor="transparent"
                        {...props}
                    />

                    {isPassword && (
                        <Pressable 
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.rightIconContainer}
                        >
                            <Ionicons 
                                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color={colors.textMuted} 
                            />
                        </Pressable>
                    )}

                    {success && !isPassword && (
                        <View style={styles.rightIconContainer}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        </View>
                    )}
                </View>
            </Pressable>

            {(error || helperText) && (
                <View style={styles.feedbackContainer}>
                    {error ? (
                        <>
                            <Ionicons name="alert-circle" size={14} color={colors.error} />
                            <Text style={[styles.errorText, { color: colors.error, fontFamily: fonts.body }]}>{error}</Text>
                        </>
                    ) : (
                        <Text style={[styles.helperText, { color: colors.textMuted, fontFamily: fonts.body }]}>{helperText}</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        marginBottom: 16,
    },
    inputWrapper: {
        height: 64,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        textAlignVertical: 'center',
    },
    iconContainer: {
        position: 'absolute',
        left: 16,
        zIndex: 2,
    },
    rightIconContainer: {
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    feedbackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 4,
    },
    errorText: {
        fontSize: 12,
        marginLeft: 4,
    },
    helperText: {
        fontSize: 12,
    },
});
