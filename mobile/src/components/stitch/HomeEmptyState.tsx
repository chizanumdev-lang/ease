import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions 
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

interface HomeEmptyStateProps {
    onStartPress: () => void;
}

export default function HomeEmptyState({ onStartPress }: HomeEmptyStateProps) {
    const { colors, fonts, spacing, borderRadius } = useTheme();
    const { user } = useAuthStore();
    const firstName = user?.name?.split(' ')[0] || 'Alex';

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Header section (replaces top header logic in empty state) */}
            <View style={styles.editorialHeader}>
                <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.display }]}>
                    Timeline of Potential
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
            </View>

            <View style={styles.tactileStack}>
                {/* Genesis Card */}
                <View style={[styles.card, styles.genesisCard, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={styles.lottieContainer}>
                        <LottieView 
                            source={{ uri: 'https://assets10.lottiefiles.com/packages/lf20_m6cuL6.json' }} 
                            autoPlay 
                            loop 
                            style={styles.lottie}
                        />
                    </View>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                            <Ionicons name="compass-outline" size={18} color="#fff" />
                        </View>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>GENESIS</Text>
                    </View>
                    <Text style={[styles.quoteText, { color: colors.text, fontFamily: fonts.body }]}>
                        "Welcome to your unfolding story, {firstName}. Everything you see here is a whisper of what's to come."
                    </Text>
                </View>

                {/* Canvas Card */}
                <View style={[styles.card, styles.canvasCard, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800' }} 
                        style={styles.canvasImage}
                        resizeMode="cover"
                    />
                    <View style={styles.canvasContent}>
                        <Text style={[styles.canvasText, { color: colors.text, fontFamily: fonts.display }]}>
                            "{firstName}, your path is a blank canvas. Shall we sketch the first milestone?"
                        </Text>
                    </View>
                </View>

                {/* Action Card */}
                <TouchableOpacity 
                    style={[styles.card, styles.actionCard, { backgroundColor: colors.primary }]}
                    onPress={onStartPress}
                    activeOpacity={0.9}
                >
                    <View style={styles.actionHeader}>
                        <View style={styles.actionIconBox}>
                            <Ionicons name="create-outline" size={28} color="#fff" />
                        </View>
                        <Ionicons name="arrow-forward-outline" size={18} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View>
                        <Text style={[styles.actionTitle, { color: '#fff', fontFamily: fonts.display }]}>Begin My Story</Text>
                        <Text style={[styles.actionSubtitle, { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.label }]}>
                            AWAITING YOUR FIRST DECISION...
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    tactileStack: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 10,
    },
    card: {
        borderRadius: 40,
        padding: 28,
        width: width * 0.9,
        marginBottom: 16, // Removed negative overlap to prevent text cutoff
        shadowColor: '#225344',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 5,
    },
    genesisCard: {
        zIndex: 1,
        transform: [{ rotate: '-2deg' }, { translateX: -8 }],
    },
    canvasCard: {
        zIndex: 2,
        padding: 12,
        width: width * 0.94,
        transform: [{ rotate: '1.5deg' }, { translateY: -10 }, { translateX: 8 }],
    },
    actionCard: {
        zIndex: 3,
        padding: 28,
        width: width * 0.88,
        transform: [{ rotate: '-1deg' }, { translateY: -20 }, { translateX: -4 }],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
    },
    lottieContainer: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    lottie: {
        width: 150,
        height: 150,
    },
    quoteText: {
        fontSize: 15,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    canvasImage: {
        width: '100%',
        height: 240,
        borderRadius: 32,
        marginBottom: 16,
    },
    canvasContent: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    canvasText: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 24,
    },
    actionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    actionIconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    actionSubtitle: {
        fontSize: 10,
        letterSpacing: 1.5,
        marginTop: 4,
    },
});
