import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions, 
    StatusBar,
    Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import StitchButton from '../../components/StitchButton';
import PetalBackground from '../../components/PetalBackground';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
    const { colors, fonts, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar 
                barStyle={isDark ? "light-content" : "dark-content"} 
                backgroundColor="transparent"
                translucent 
            />
            
            {/* Background Petals (Full Screen) */}
            <View style={StyleSheet.absoluteFill}>
                <PetalBackground />
            </View>

            {/* Content Overlay */}
            <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                
                {/* Sticky Header Badge */}
                <View style={styles.topBadgeContainer}>
                    <View style={[
                        styles.badge, 
                        { 
                            backgroundColor: isDark ? 'rgba(59, 107, 91, 0.4)' : 'rgba(215, 228, 199, 0.7)',
                            borderColor: colors.secondaryContainer
                        }
                    ]}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={styles.badgeIcon} />
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                            Trusted by 10,000+ learners
                        </Text>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.brandingContainer}>
                        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>EASE</Text>
                        <Text style={[styles.tagline, { color: colors.onSurfaceVariant }]}>
                            Your daily growth, automated
                        </Text>
                    </View>
                </View>

                {/* Action Section */}
                <View style={styles.actionSection}>
                    <View style={styles.buttonGroup}>
                        <StitchButton 
                            title="Create Account"
                            variant="primary"
                            onPress={() => navigation.navigate('Signup')}
                            style={styles.mainButton}
                        />
                        
                        <StitchButton 
                            title="Sign In"
                            variant="outline"
                            onPress={() => navigation.navigate('Login')}
                            style={styles.outlineButton}
                            textStyle={{ color: colors.text }}
                        />
                    </View>
                </View>

                {/* Footer Section */}
                <View style={styles.footerSection}>
                    <View style={styles.iconRow}>
                        <TouchableOpacity style={[styles.footerIconButton, { backgroundColor: colors.surfaceContainerHighest }]}>
                            <Ionicons name="people" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.footerIconButton, { backgroundColor: colors.surfaceContainerHighest }]}>
                            <Ionicons name="shield-checkmark" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.legalLinks}>
                        <TouchableOpacity>
                            <Text style={[styles.legalText, { color: colors.onSurfaceVariant }]}>PRIVACY</Text>
                        </TouchableOpacity>
                        <Text style={[styles.legalSeparator, { color: colors.outlineVariant }]}>•</Text>
                        <TouchableOpacity>
                            <Text style={[styles.legalText, { color: colors.onSurfaceVariant }]}>TERMS</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        zIndex: 10,
    },
    topBadgeContainer: {
        alignItems: 'center',
        paddingTop: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    badgeIcon: {
        marginRight: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    heroSection: {
        flex: 1.2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandingContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 72,
        fontWeight: '900',
        letterSpacing: -4,
        lineHeight: 80,
    },
    tagline: {
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.8,
        maxWidth: 220,
        marginTop: 8,
    },
    actionSection: {
        flex: 0.8,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    buttonGroup: {
        width: '100%',
        gap: 12,
    },
    mainButton: {
        height: 64,
    },
    outlineButton: {
        height: 64,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    footerSection: {
        paddingBottom: 20,
        alignItems: 'center',
        gap: 32,
    },
    iconRow: {
        flexDirection: 'row',
        gap: 32,
    },
    footerIconButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    legalLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    legalText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    legalSeparator: {
        fontSize: 16,
    },
});
