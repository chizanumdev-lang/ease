import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../../types';

type Props = NativeStackScreenProps<MainStackParamList, 'VideoLesson'>;

const { width } = Dimensions.get('window');

export default function VideoLessonScreen({ route, navigation }: Props) {
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
                Alert.alert('Video Complete', 'Great job!');
            }
        }
    }, [task, navigation]);

    const onReady = useCallback(() => {
        setLoading(false);
        setPlaying(true);
    }, []);

    if (!videoId) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={64} color="#ef4444" />
                <Text style={styles.errorText}>Invalid video URL</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Top Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Lesson</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="share-outline" size={24} color="#f1f5f9" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Video Player */}
                <View style={styles.playerWrapper}>
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#13ecec" />
                        </View>
                    )}
                    <YoutubePlayer
                        height={(width - 32) * (9 / 16)}
                        play={playing}
                        videoId={videoId}
                        onChangeState={onStateChange}
                        onReady={onReady}
                        onError={() => Alert.alert('Error', 'Player error')}
                    />
                </View>

                {/* Lesson Info */}
                <View style={styles.lessonInfo}>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.lessonLabel}>MORNING ROUTINE • PART 4</Text>
                        <Text style={styles.lessonTitle}>{task.title}</Text>
                        <Text style={styles.lessonDescription}>{task.description || 'Learn to eliminate distractions in your first hour.'}</Text>
                    </View>
                    <TouchableOpacity style={styles.bookmarkBtn}>
                        <Ionicons name="bookmark-outline" size={20} color="#f1f5f9" />
                    </TouchableOpacity>
                </View>

                {/* Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Lesson Progress</Text>
                        <Text style={styles.progressValue}>65% Complete</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: '65%' }]} />
                    </View>
                </View>

                {/* Key Takeaways */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bulb-outline" size={20} color="#13ecec" />
                        <Text style={styles.sectionTitle}>Key Takeaways</Text>
                    </View>
                    <View style={styles.takeawaysList}>
                        <View style={styles.takeawayItem}>
                            <View style={styles.checkCircle}>
                                <Ionicons name="checkmark" size={12} color="#13ecec" />
                            </View>
                            <Text style={styles.takeawayText}>Identify your "Deep Work" window immediately after waking up.</Text>
                        </View>
                        <View style={styles.takeawayItem}>
                            <View style={styles.checkCircle}>
                                <Ionicons name="checkmark" size={12} color="#13ecec" />
                            </View>
                            <Text style={styles.takeawayText}>The 'No-Phone Zone': Why physical distance from devices matters.</Text>
                        </View>
                        <View style={styles.takeawayItem}>
                            <View style={styles.checkCircle}>
                                <Ionicons name="checkmark" size={12} color="#13ecec" />
                            </View>
                            <Text style={styles.takeawayText}>Hydration and light exposure as biological focus triggers.</Text>
                        </View>
                    </View>
                </View>

                {/* Resources */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text-outline" size={20} color="#13ecec" />
                        <Text style={styles.sectionTitle}>Resources</Text>
                    </View>
                    <View style={styles.resourceList}>
                        <TouchableOpacity style={styles.resourceItem}>
                            <View style={styles.resourceIconBox}>
                                <Ionicons name="document-outline" size={20} color="#ef4444" />
                            </View>
                            <View style={styles.resourceMeta}>
                                <Text style={styles.resourceName}>Focus Worksheet.pdf</Text>
                                <Text style={styles.resourceSize}>2.4 MB</Text>
                            </View>
                            <Ionicons name="download-outline" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.completeBtn} onPress={() => onStateChange('ended')}>
                    <Text style={styles.completeBtnText}>Mark as Complete</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#102222" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#102222',
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
        color: '#f1f5f9',
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
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#000',
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
        color: '#13ecec',
        letterSpacing: 2,
        marginBottom: 8,
    },
    lessonTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#f1f5f9',
        marginBottom: 8,
    },
    lessonDescription: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    bookmarkBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    progressCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
    progressValue: {
        fontSize: 14,
        color: '#13ecec',
        fontWeight: '700',
    },
    progressTrack: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#13ecec',
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
        color: '#f1f5f9',
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
        backgroundColor: 'rgba(19, 236, 236, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    takeawayText: {
        flex: 1,
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 20,
    },
    resourceList: {
        gap: 12,
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    resourceIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
        color: '#f1f5f9',
    },
    resourceSize: {
        fontSize: 12,
        color: '#64748b',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'rgba(16, 34, 34, 0.95)',
    },
    completeBtn: {
        height: 56,
        backgroundColor: '#13ecec',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#13ecec',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    completeBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#102222',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#102222',
        padding: 32,
    },
    errorText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f1f5f9',
        marginTop: 16,
        marginBottom: 24,
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
    },
    backBtnText: {
        color: '#13ecec',
        fontWeight: '700',
    }
});
