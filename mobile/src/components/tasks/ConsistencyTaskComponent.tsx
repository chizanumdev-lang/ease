import React, { useState } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity, ScrollView, Dimensions, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Task, TaskMetadata } from '../../types';
import PetalBackground from '../PetalBackground';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const CARD_OVERLAP = 24;

interface ConsistencyTaskProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

export default function ConsistencyTaskComponent({ task, onComplete }: ConsistencyTaskProps) {
    const { colors, fonts, borderRadius, isDark } = useTheme();
    const [confirmed, setConfirmed] = useState(false);

    const handleComplete = () => {
        onComplete({ consistencyConfirmed: true });
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            <PetalBackground />

            <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={[styles.heroSection, { height: HERO_HEIGHT }]}>
                    <View style={styles.heroContent}>
                        <View style={[styles.halo, { backgroundColor: colors.primaryContainer + '40' }]}>
                            <View style={[styles.innerHalo, { backgroundColor: colors.primary }]}>
                                <Ionicons name="flame" size={56} color={colors.white} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Overlapping Content Card */}
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
                        <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.labelBold }]}>COMMITMENT</Text>
                        <Text style={[styles.title, { color: colors.primary, fontFamily: fonts.displayBold }]}>Commit to Growth</Text>
                        <View style={[styles.divider, { backgroundColor: colors.primaryContainer }]} />
                        <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: fonts.body }]}>
                            Consistency is the bridge between goals and achievement. Your journey continues tomorrow.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <View style={[
                            styles.commitmentCard, 
                            { backgroundColor: colors.surfaceContainerLow }
                        ]}>
                            <Text style={[styles.commitmentTitle, { color: colors.primary, fontFamily: fonts.labelBold, textTransform: 'uppercase', letterSpacing: 1.5 }]}>Daily Commitment</Text>
                            
                            <View style={styles.commitmentItem}>
                                <View style={[styles.iconDot, { backgroundColor: colors.primaryContainer }]}>
                                    <Ionicons name="time" size={18} color={colors.white} />
                                </View>
                                <Text style={[styles.commitmentText, { color: colors.text, fontFamily: fonts.body }]}>
                                    I will honor my scheduled routine tomorrow.
                                </Text>
                            </View>
                            
                            <View style={styles.commitmentItem}>
                                <View style={[styles.iconDot, { backgroundColor: colors.primaryContainer }]}>
                                    <Ionicons name="shield-checkmark" size={18} color={colors.white} />
                                </View>
                                <Text style={[styles.commitmentText, { color: colors.text, fontFamily: fonts.body }]}>
                                    I will prioritize my focus over distractions.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 140 }} />
                </View>
            </ScrollView>

            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.footer} pointerEvents="box-none">
                <View style={styles.footerContent}>
                    {!confirmed ? (
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setConfirmed(true)}
                        >
                            <Text style={[styles.primaryBtnText, { color: colors.white, fontFamily: fonts.labelBold }]}>Register Commitment</Text>
                            <Ionicons name="hand-left" size={20} color={colors.white} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.successSection}>
                            <View style={[styles.statusIndicator, { backgroundColor: colors.primaryContainer }]}>
                                <Ionicons name="sparkles" size={14} color={colors.white} />
                                <Text style={[styles.statusText, { color: colors.white, fontFamily: fonts.labelBold }]}>COMMITMENT ACTIVE</Text>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                                onPress={handleComplete}
                            >
                                <Text style={[styles.primaryBtnText, { color: colors.white, fontFamily: fonts.labelBold }]}>Finish Session</Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    halo: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerHalo: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingTop: 12,
        zIndex: 5,
        minHeight: SCREEN_HEIGHT * 0.6,
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
        marginBottom: 32,
    },
    label: {
        fontSize: 11,
        letterSpacing: 2,
        marginBottom: 12,
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
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
        opacity: 0.8,
        paddingHorizontal: 16,
    },
    section: {
        gap: 24,
    },
    commitmentCard: {
        padding: 24,
        borderRadius: 24,
    },
    commitmentTitle: {
        fontSize: 12,
        marginBottom: 20,
    },
    commitmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    iconDot: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    commitmentText: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        paddingBottom: 20,
        justifyContent: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    footerContent: {
        paddingHorizontal: 24,
    },
    primaryBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    primaryBtnText: {
        fontSize: 16,
    },
    successSection: {
        gap: 12,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
    }
});
