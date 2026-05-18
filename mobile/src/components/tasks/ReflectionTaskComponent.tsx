import React, { useState } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Dimensions, 
    Image,
    StatusBar 
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata } from '../../types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import PetalBackground from '../PetalBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_OVERLAP = 24;

interface ReflectionTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function ReflectionTaskComponent({ task, onComplete }: ReflectionTaskProps) {
    const { colors, fonts, shadows, isDark, borderRadius, spacing } = useTheme();
    const [rating, setRating] = useState<number | null>(null);
    const [mood, setMood] = useState<string | null>(null);

    const moods = [
        { icon: 'emoticon-excited-outline', label: 'Energized' },
        { icon: 'leaf-outline', label: 'Calm' },
        { icon: 'brain', label: 'Focused' },
        { icon: 'weather-night', label: 'Tired' },
        { icon: 'weather-lightning', label: 'Stressed' }
    ];

    const handleComplete = () => {
        onComplete({ 
            reflectionRating: rating || 0,
            reflectionMood: mood || 'neutral'
        });
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Header */}
                <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop' }} 
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                    />
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <Text style={[styles.heroTitle, { color: colors.white, fontFamily: fonts.displayBold }]}>Reflection</Text>
                    </View>
                </View>

                {/* Content Card */}
                <View style={[
                    styles.contentArea, 
                    { 
                        backgroundColor: colors.surfaceContainerLowest,
                        borderTopLeftRadius: borderRadius.xxxl,
                        borderTopRightRadius: borderRadius.xxxl,
                        marginTop: -CARD_OVERLAP,
                    }
                ]}>
                    <View style={styles.dragHandle} />

                    <View style={styles.headerBlock}>
                        <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.label }]}>DAILY CHECK-IN</Text>
                        <Text style={[styles.title, { color: colors.primary, fontFamily: fonts.displayBold }]}>How are you feeling?</Text>
                        <View style={[styles.divider, { backgroundColor: colors.primaryContainer }]} />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted, fontFamily: fonts.label }]}>FOCUS LEVEL</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((num) => {
                                const isSelected = rating === num;
                                return (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            styles.ratingButton,
                                            { 
                                                backgroundColor: isSelected ? colors.primary : colors.surfaceContainerLow,
                                            }
                                        ]}
                                        onPress={() => setRating(num)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[
                                            styles.ratingText, 
                                            { 
                                                color: isSelected ? colors.white : colors.primary, 
                                                fontFamily: fonts.displayBold 
                                            }
                                        ]}>
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={styles.labelRow}>
                            <Text style={[styles.labelText, { color: colors.textMuted, fontFamily: fonts.label }]}>Subtle</Text>
                            <Text style={[styles.labelText, { color: colors.textMuted, fontFamily: fonts.label }]}>Intense</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted, fontFamily: fonts.label }]}>PRIMARY MOOD</Text>
                        <View style={styles.moodGrid}>
                            {moods.map((m) => {
                                const isSelected = mood === m.label;
                                return (
                                    <TouchableOpacity
                                        key={m.label}
                                        style={[
                                            styles.moodCard,
                                            { 
                                                backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceContainerLow,
                                                borderRadius: borderRadius.xl,
                                            }
                                        ]}
                                        onPress={() => setMood(m.label)}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons 
                                            name={m.icon as any} 
                                            size={28} 
                                            color={isSelected ? colors.primary : colors.textMuted} 
                                        />
                                        <Text style={[
                                            styles.moodLabel, 
                                            { color: isSelected ? colors.primary : colors.textMuted, fontFamily: fonts.label }
                                        ]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            {/* Floating Footer */}
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <View style={styles.footerContent}>
                    <View style={styles.statusPill}>
                        <View style={[styles.stepIndicator, { backgroundColor: colors.surfaceContainerHigh }]}>
                            <Ionicons name="sparkles" size={14} color={colors.primaryLight} />
                            <Text style={[styles.stepText, { color: colors.primary, fontFamily: fonts.label }]}>
                                {rating && mood ? 'READY TO COMPLETE' : 'CHECK-IN REQUIRED'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.nextBtn,
                            { 
                                backgroundColor: (rating && mood) ? colors.primary : colors.surfaceContainerHighest,
                            }
                        ]}
                        onPress={handleComplete}
                        disabled={!rating || !mood}
                        activeOpacity={0.88}
                    >
                        <Text style={[
                            styles.nextBtnText, 
                            { 
                                fontFamily: fonts.label,
                                color: (rating && mood) ? colors.white : colors.textMuted
                            }
                        ]}>
                            Complete
                        </Text>
                        <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={(rating && mood) ? colors.white : colors.textMuted} 
                        />
                    </TouchableOpacity>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroContent: {
        zIndex: 10,
    },
    heroTitle: {
        fontSize: 48,
        letterSpacing: -1,
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.65,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignSelf: 'center',
        marginBottom: 24,
    },
    headerBlock: {
        alignItems: 'center',
        marginBottom: 40,
    },
    label: {
        fontSize: 12,
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        lineHeight: 36,
        textAlign: 'center',
        marginBottom: 16,
    },
    divider: {
        width: 48,
        height: 4,
        borderRadius: 2,
    },
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 11,
        letterSpacing: 1.5,
        marginBottom: 20,
        textAlign: 'center',
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    ratingButton: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 20,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    labelText: {
        fontSize: 11,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    moodCard: {
        width: '30%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    moodLabel: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        paddingBottom: 20,
        justifyContent: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 8,
    },
    stepText: {
        fontSize: 10,
        fontWeight: '800',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 32,
        gap: 8,
    },
    nextBtnText: {
        fontSize: 16,
    },
});

