const GeneratingSkeleton = () => {
    const { colors, fonts } = useTheme();
    const pulseAnim = React.useRef(new Animated.Value(0.5)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const SkeletonBox = ({ width, height, borderRadius = 8, style }: any) => (
        <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.surfaceContainerHigh, opacity: pulseAnim }, style]} />
    );

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <SkeletonBox width={120} height={24} borderRadius={12} style={{ marginBottom: 16 }} />
                    <SkeletonBox width={240} height={32} style={{ marginBottom: 12 }} />
                    <SkeletonBox width={200} height={16} style={{ marginBottom: 8 }} />
                    <SkeletonBox width={180} height={16} style={{ marginBottom: 32 }} />
                </View>

                {/* Chart Skeleton */}
                <View style={styles.section}>
                    <SkeletonBox width={100} height={24} style={{ marginBottom: 20 }} />
                    <SkeletonBox width="100%" height={140} borderRadius={32} style={{ marginBottom: 24 }} />
                </View>

                {/* Task Chain / Timeline Skeleton */}
                <View style={styles.section}>
                    <SkeletonBox width={140} height={24} style={{ marginBottom: 20 }} />
                    
                    {/* Main Day Card */}
                    <SkeletonBox width="100%" height={120} borderRadius={32} style={{ marginBottom: 24 }} />

                    {/* Timeline items */}
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.timelineItem, { opacity: 1 - (i * 0.2) }]}>
                            <View style={styles.timelineLeft}>
                                <View style={[styles.timelineDot, { backgroundColor: colors.surfaceContainerHigh }]} />
                                <View style={[styles.timelineLine, { backgroundColor: colors.surfaceContainerHigh }]} />
                            </View>
                            <View style={styles.timelineRight}>
                                <SkeletonBox width={50} height={12} style={{ marginBottom: 8 }} />
                                <SkeletonBox width={160} height={20} style={{ marginBottom: 8 }} />
                                <SkeletonBox width={220} height={14} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};
