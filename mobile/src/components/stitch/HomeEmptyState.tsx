import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions,
    ImageBackground 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface HomeEmptyStateProps {
    onStartPress: () => void;
}

export default function HomeEmptyState({ onStartPress }: HomeEmptyStateProps) {
    const { colors, fonts, spacing, borderRadius } = useTheme();
    const { user } = useAuthStore();
    const firstName = user?.name?.split(' ')[0] || 'Alex';

    return (
        <ImageBackground 
            source={require('../../../assets/images/wizard_bg.png')}
            style={styles.container}
            imageStyle={{ opacity: 0.3 }}
        >
            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
            <View style={styles.editorialHeader}>
                {/* Decorative background elements */}
                <View style={[styles.floatingCircle, { top: -20, right: -30, width: 140, height: 140, backgroundColor: colors.primary + '15' }]} />
                <View style={[styles.floatingCircle, { top: 120, left: -40, width: 100, height: 100, backgroundColor: colors.secondary + '15' }]} />
                <View style={[styles.floatingCircle, { top: 280, right: 20, width: 60, height: 60, backgroundColor: colors.primary + '08' }]} />
                
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    Your Sacred Space
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
                </Text>
            </View>

            <View style={styles.tactileStack}>
                {/* Intro Card */}
                <View style={[styles.card, styles.introCard, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: colors.secondaryContainer }]}>
                            <Ionicons name="sparkles-outline" size={20} color={colors.secondary} />
                        </View>
                        <Text style={[styles.cardLabel, { color: colors.textMuted, fontFamily: fonts.label }]}>MANIFESTO</Text>
                    </View>
                    <Text style={[styles.quoteText, { color: colors.text, fontFamily: fonts.display }]}>
                        "A journey of a thousand miles begins with a single intention."
                    </Text>
                    <Text style={[styles.bodyText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        Welcome, {firstName}. Ease is your sanctuary for deep focus and intentional living. Your journey hasn't started yet, but your potential is infinite.
                    </Text>
                </View>

                {/* Visual Card */}
                <View style={[styles.card, styles.visualCard, { backgroundColor: colors.surfaceContainerLow, padding: 0 }]}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000' }} 
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.imageOverlay}
                    />
                    <View style={styles.imageContent}>
                        <Text style={[styles.imageTag, { fontFamily: fonts.label }]}>GUIDANCE</Text>
                        <Text style={[styles.imageText, { color: '#fff', fontFamily: fonts.display }]}>
                            Define your horizon. We'll build the path.
                        </Text>
                    </View>
                </View>

                {/* CTA Card */}
                <TouchableOpacity 
                    onPress={onStartPress}
                    activeOpacity={0.9}
                    style={styles.ctaWrapper}
                >
                    <LinearGradient
                        colors={colors.gradients.primary as unknown as readonly [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.card, styles.ctaCard]}
                    >
                        <View style={styles.ctaTop}>
                            <View style={styles.ctaIconBox}>
                                <Ionicons name="leaf-outline" size={32} color="#fff" />
                            </View>
                            <View style={styles.arrowBox}>
                                <Ionicons name="arrow-forward" size={24} color="#fff" />
                            </View>
                        </View>
                        <View>
                            <Text style={[styles.ctaTitle, { color: '#fff', fontFamily: fonts.display }]}>
                                Plant Your First Seed
                            </Text>
                            <Text style={[styles.ctaSubtitle, { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.label }]}>
                                START YOUR JOURNEY TODAY
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 120,
        alignItems: 'center',
    },
    editorialHeader: {
        width: '100%',
        paddingHorizontal: 28,
        paddingTop: 40,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
        lineHeight: 40,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 1.5,
    },
    tactileStack: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        borderRadius: 40,
        width: width * 0.92,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    introCard: {
        padding: 32,
        transform: [{ rotate: '-1.5deg' }],
    },
    visualCard: {
        height: 320,
        overflow: 'hidden',
        transform: [{ rotate: '1deg' }],
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    imageContent: {
        position: 'absolute',
        bottom: 28,
        left: 28,
        right: 28,
    },
    imageTag: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 8,
    },
    imageText: {
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 30,
    },
    ctaWrapper: {
        width: width * 0.92,
        marginTop: 10,
        transform: [{ rotate: '-0.5deg' }],
    },
    ctaCard: {
        width: '100%',
        padding: 32,
        marginBottom: 0,
    },
    ctaTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    ctaIconBox: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 32,
        fontWeight: '900',
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    ctaSubtitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
    quoteText: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 28,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 24,
        opacity: 0.8,
    },
    floatingCircle: {
        position: 'absolute',
        borderRadius: 100,
        zIndex: -1,
    },
});
