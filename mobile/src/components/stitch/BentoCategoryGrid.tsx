import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ImageBackground, 
    Dimensions,
    ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';

const { width } = Dimensions.get('window');

interface Category {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    onPrimaryContainer?: string;
    bgImage?: any;
    span?: number;
}

interface BentoCategoryGridProps {
    categories: Category[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export default function BentoCategoryGrid({ categories, selectedId, onSelect }: BentoCategoryGridProps) {
    const { spacing } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {categories.map((cat) => (
                    <CategoryCard 
                        key={cat.id} 
                        category={cat} 
                        isSelected={selectedId === cat.id}
                        onPress={() => onSelect(cat.id)}
                    />
                ))}
            </View>
        </View>
    );
}

function CategoryCard({ category, isSelected, onPress }: { category: Category, isSelected: boolean, onPress: () => void }) {
    const { colors, fonts, borderRadius, shadows } = useTheme();
    
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const imageOpacity = React.useRef(new Animated.Value(isSelected ? 0.6 : 0.4)).current;
    const shiftAnim = React.useRef(new Animated.Value(isSelected ? 0 : 5)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: isSelected ? 1.05 : 1,
                useNativeDriver: true,
                tension: 40,
                friction: 7
            }),
            Animated.timing(imageOpacity, {
                toValue: isSelected ? 0.6 : 0.4,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.spring(shiftAnim, {
                toValue: isSelected ? -10 : 0,
                useNativeDriver: true
            })
        ]).start();
    }, [isSelected]);

    const isLarge = category.span === 3;
    const cardWidth = isLarge ? '100%' : '48%';

    return (
        <Animated.View style={[
            { 
                width: cardWidth,
                transform: [{ scale: scaleAnim }]
            },
            isSelected && shadows.premium
        ]}>
            <TouchableOpacity 
                activeOpacity={1}
                onPress={onPress}
                style={[
                    styles.card, 
                    { 
                        backgroundColor: category.color,
                        borderRadius: 32,
                        borderWidth: 2,
                        borderColor: isSelected ? '#fff' : 'transparent',
                    }
                ]}
            >
                <Animated.Image 
                    source={category.bgImage} 
                    style={[
                        styles.bgImage,
                        {
                            transform: [{ translateY: shiftAnim }, { scale: 1.2 }],
                            opacity: imageOpacity
                        }
                    ]}
                    resizeMode="cover"
                />
                
                <LinearGradient
                    colors={isSelected ? 
                        [`${category.color}10`, `${category.color}FF`] : 
                        [`${category.color}30`, `${category.color}99`]
                    }
                    style={styles.gradientOverlay}
                >
                    <View style={styles.content}>
                        <View style={styles.topRow}>
                            <View style={[
                                styles.iconCircle, 
                                { backgroundColor: isSelected ? (category.onPrimaryContainer || '#fff') : 'rgba(255,255,255,0.2)' }
                            ]}>
                                <Ionicons 
                                    name={category.icon as any} 
                                    size={isLarge ? 32 : 24} 
                                    color={isSelected ? category.color : (category.onPrimaryContainer || "#fff")}
                                />
                            </View>
                            
                            {isSelected && (
                                <View style={[styles.activeTag, { backgroundColor: category.onPrimaryContainer || '#fff' }]}>
                                    <Text style={[styles.activeTagText, { color: category.color, fontFamily: fonts.label }]}>SELECTED</Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.textContainer}>
                            <Text
                                style={[
                                    styles.cardTitle, 
                                    { 
                                        color: category.onPrimaryContainer || '#fff', 
                                        fontFamily: fonts.display, 
                                        fontSize: isLarge ? 36 : 24 
                                    }
                                ]}
                            >
                                {category.title}
                            </Text>
                            <Text
                                numberOfLines={2}
                                style={[
                                    styles.cardDesc, 
                                    { 
                                        color: category.onPrimaryContainer ? `${category.onPrimaryContainer}CC` : 'rgba(255,255,255,0.9)', 
                                        fontFamily: fonts.body, 
                                        fontSize: isLarge ? 16 : 14 
                                    }
                                ]}
                            >
                                {category.description}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    card: {
        height: 240,
        overflow: 'hidden',
        marginBottom: 8,
    },
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activeTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    activeTagText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginTop: 'auto',
    },
    cardTitle: {
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    cardDesc: {
        lineHeight: 20,
    }
});
