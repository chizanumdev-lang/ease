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
    const { colors, fonts, borderRadius } = useTheme();

    const isLarge = category.span === 3;
    const cardWidth = isLarge ? '100%' : '48%'; // Simple 2-col fallback for small cards

    return (
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={onPress}
            style={[
                styles.card, 
                { 
                    backgroundColor: category.color,
                    width: cardWidth,
                    borderRadius: 32,
                    borderColor: isSelected ? colors.primary : 'transparent',
                    borderWidth: isSelected ? 3 : 0,
                }
            ]}
        >
            <ImageBackground 
                source={category.bgImage} 
                style={styles.bgImage}
                imageStyle={{ opacity: 0.15, borderRadius: 32 }}
            >
                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <View style={[
                            styles.iconCircle, 
                            { backgroundColor: isLarge ? (category.onPrimaryContainer ? category.onPrimaryContainer + '20' : 'rgba(255,255,255,0.4)') : colors.surface + '20' }
                        ]}>
                            <Ionicons 
                                name={category.icon as any} 
                                size={isLarge ? 32 : 24} 
                                color={category.onPrimaryContainer || (isLarge ? '#fff' : colors.text)} 
                            />
                        </View>
                        
                        {isSelected && (
                            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                                <Ionicons name="checkmark" size={16} color={colors.primary} />
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.textContainer}>
                        <Text
                            style={[
                                styles.cardTitle, 
                                { 
                                    color: category.onPrimaryContainer || (isLarge ? '#fff' : colors.text), 
                                    fontFamily: fonts.display, 
                                    fontSize: isLarge ? 28 : 20 
                                }
                            ]}
                        >
                            {category.title}
                        </Text>
                        <Text
                            style={[
                                styles.cardDesc, 
                                { 
                                    color: category.onPrimaryContainer ? category.onPrimaryContainer + 'CC' : (isLarge ? 'rgba(255,255,255,0.8)' : colors.textMuted), 
                                    fontFamily: fonts.body, 
                                    fontSize: isLarge ? 14 : 12 
                                }
                            ]}
                        >
                            {category.description}
                        </Text>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
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
        height: 220,
        overflow: 'hidden',
        marginBottom: 8,
    },
    bgImage: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    selectedBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginTop: 'auto',
    },
    cardTitle: {
        fontWeight: '900',
        marginBottom: 4,
    },
    cardDesc: {
        lineHeight: 18,
    }
});
