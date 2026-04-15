import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions
} from 'react-native';
import LoadingState from '../../components/LoadingState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { useModalStore } from '../../store/modalStore';

type Props = NativeStackScreenProps<MainStackParamList, 'VideoLesson'>;

const { width } = Dimensions.get('window');

export default function VideoLessonScreen({ route, navigation }: Props) {
    const { colors, spacing, borderRadius, isDark, shadows } = useTheme();
    const { showModal } = useModalStore();
    const { task } = route.params;
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);

    // Extract YouTube video ID from URL
    const getVideoId = (url: string): string | null => {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
            /youtube\.com\/embed\/([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
    };

    const videoId = task.videoUrl ? getVideoId(task.videoUrl) : null;

    const onStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            if (task.quizId) {
                navigation.replace('Quiz', { quizId: task.quizId, taskId: task.id });
            } else {
                showModal({
                    type: 'success',
                    title: 'Video Complete',
                    description: 'Great job!'
                });
            }
        }
    }, [task, navigation]);

    const onReady = useCallback(() => {
        setLoading(false);
        setPlaying(true);
    }, []);

    if (!videoId) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={64} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>Invalid video URL</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Top Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Lesson</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="share-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Video Player */}
                <View style={[styles.playerWrapper, { borderColor: colors.outlineVariant, backgroundColor: '#000' }]}>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <LoadingState variant="compact" title="Preparing cinematic lesson..." />
                        </View>
                    )}
                    <YoutubePlayer
                        height={(width - 32) * (9 / 16)}
                        play={playing}
                        videoId={videoId}
                        onChangeState={onStateChange}
                        onReady={onReady}
                        onError={() => showModal({
                            type: 'error',
                            title: 'Error',
                            description: 'Player error'
                        })}
                    />
                </View>

                {/* Lesson Info */}
                <View style={styles.lessonInfo}>
                    <View style={styles.infoTextContainer}>
                        <Text style={[styles.lessonLabel, { color: colors.primary }]}>MORNING ROUTINE • PART 4</Text>
                        <Text style={[styles.lessonTitle, { color: colors.text }]}>{task.title}</Text>
                        <Text style={[styles.lessonDescription, { color: colors.textMuted }]}>{task.description || 'Learn to eliminate distractions in your first hour.'}</Text>
                    </View>
                    <TouchableOpacity style={[styles.bookmarkBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        <Ionicons name="bookmark-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Progress Card */}
                <View style={[styles.progressCard, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Lesson Progress</Text>
                        <Text style={[styles.progressValue, { color: colors.primary }]}>65% Complete</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.outlineVariant }]}>
                        <View style={[styles.progressFill, { width: '65%', backgroundColor: colors.primary }]} />
                    </View>
                </View>

                {/* Key Takeaways */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Takeaways</Text>
                    </View>
                    <View style={styles.takeawaysList}>
                        <View style={styles.takeawayItem}>
                            <View style={[styles.checkCircle, { backgroundColor: `${colors.primary}15` }]}>
                                <Ionicons name="checkmark" size={12} color={colors.primary} />
                            </View>
                            <Text style={[styles.takeawayText, { color: colors.text }]}>Identify your "Deep Work" window immediately after waking up.</Text>
                        </View>
                        <View style={styles.takeawayItem}>
                            <View style={[styles.checkCircle, { backgroundColor: `${colors.primary}15` }]}>
                                <Ionicons name="checkmark" size={12} color={colors.primary} />
                            </View>
                            <Text style={[styles.takeawayText, { color: colors.text }]}>The 'No-Phone Zone': Why physical distance from devices matters.</Text>
                        </View>
                        <View style={styles.takeawayItem}>
                            <View style={[styles.checkCircle, { backgroundColor: `${colors.primary}15` }]}>
                                <Ionicons name="checkmark" size={12} color={colors.primary} />
                            </View>
                            <Text style={[styles.takeawayText, { color: colors.text }]}>Hydration and light exposure as biological focus triggers.</Text>
                        </View>
                    </View>
                </View>

                {/* Resources */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resources</Text>
                    </View>
                    <View style={styles.resourceList}>
                        <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                            <View style={[styles.resourceIconBox, { backgroundColor: `${colors.error}15` }]}>
                                <Ionicons name="document-outline" size={20} color={colors.error} />
                            </View>
                            <View style={styles.resourceMeta}>
                                <Text style={[styles.resourceName, { color: colors.text }]}>Focus Worksheet.pdf</Text>
                                <Text style={[styles.resourceSize, { color: colors.textMuted }]}>2.4 MB</Text>
                            </View>
                            <Ionicons name="download-outline" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.footer, { backgroundColor: `${colors.background}F2` }]}>
                <TouchableOpacity 
                    style={[
                        styles.completeBtn, 
                        { 
                            backgroundColor: colors.primary,
                            shadowColor: colors.primary 
                        }
                    ]} 
                    onPress={() => onStateChange('ended')}
                >
                    <Text style={[styles.completeBtnText, { color: isDark ? colors.background : '#fff' }]}>Mark as Complete</Text>
                    <Ionicons name="checkmark-circle" size={20} color={isDark ? colors.background : '#fff'} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    playerWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    lessonInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    infoTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    lessonLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 8,
    },
    lessonTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    lessonDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    bookmarkBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    progressCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    takeawaysList: {
        gap: 16,
    },
    takeawayItem: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    takeawayText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    resourceList: {
        gap: 12,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    resourceIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resourceMeta: {
        flex: 1,
    },
    resourceName: {
        fontSize: 14,
        fontWeight: '600',
    },
    resourceSize: {
        fontSize: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
    },
    completeBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    completeBtnText: {
        fontSize: 18,
        fontWeight: '700',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorText: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 24,
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backBtnText: {
        fontWeight: '700',
    }
});
