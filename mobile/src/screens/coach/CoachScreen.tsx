import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Dimensions,
    StatusBar
} from 'react-native';
import { CoachService, CoachResponse } from '../../services/coach.service';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    suggestedActions?: CoachResponse['suggested_actions'];
}

const { width } = Dimensions.get('window');

import LoadingState from '../../components/LoadingState';

export default function CoachScreen({ navigation }: any) {
    const { colors, spacing, borderRadius, isDark, shadows, fonts } = useTheme();
    const insets = useSafeAreaInsets();
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Good morning! Ready to tackle your morning routine? You have a 20-minute meditation scheduled.",
            sender: 'ai'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async (text?: string) => {
        const messageText = text || inputText;
        if (!messageText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: messageText,
            sender: 'user'
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await CoachService.sendMessage(userMsg.text);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.reply,
                sender: 'ai',
                suggestedActions: response.suggested_actions
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Coach Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
                {!isUser && (
                    <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                        <Ionicons name="sparkles" size={18} color={isDark ? colors.background : "#fff"} />
                    </View>
                )}
                
                <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
                    <Text style={[styles.senderName, { color: colors.textMuted, fontFamily: fonts.label }]}>{isUser ? 'You' : 'Ease Bo'}</Text>
                    <View style={[
                        styles.messageBubble, 
                        isUser ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.aiBubble, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]
                    ]}>
                        <Text style={[
                            styles.messageText, 
                            isUser ? { color: isDark ? colors.background : "#fff" } : { color: colors.text },
                            { fontFamily: fonts.body }
                        ]}>
                            {item.text}
                        </Text>
                    </View>
                    
                    {item.suggestedActions && (
                        <View style={styles.actionsWrapper}>
                            {item.suggestedActions.map((action, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.actionPill, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
                                    onPress={() => sendMessage(action.details)}
                                >
                                    <View style={styles.actionIconContainer}>
                                        <Ionicons 
                                            name={action.type === 'reschedule' ? 'calendar-outline' : 'flash-outline'} 
                                            size={14} 
                                            color={colors.primary} 
                                        />
                                    </View>
                                    <Text style={[styles.actionText, { color: colors.primary, fontFamily: fonts.label }]}>{action.details}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {isUser && (
                    <View style={[styles.userAvatar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                        <Ionicons name="person" size={18} color={colors.textMuted} />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant, paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation?.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.display }]}>Ease AI</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isDark ? '#10b981' : '#22c55e' }]} />
                        <Text style={[styles.statusText, { color: colors.textMuted, fontFamily: fonts.label }]}>Always here for you</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {isLoading && (
                <View style={styles.loadingWrapper}>
                    <LoadingState 
                        variant="compact"
                        title="Ease AI is typing..."
                    />
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={[styles.inputArea, { 
                    borderTopColor: colors.outlineVariant, 
                    backgroundColor: colors.background, 
                    marginBottom: 120,
                }]}
            >
                <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textMuted}
                        returnKeyType="send"
                        onSubmitEditing={() => sendMessage()}
                    />
                    <TouchableOpacity style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={() => sendMessage()} disabled={isLoading}>
                        <Ionicons name="arrow-up" size={18} color={isDark ? colors.background : "#fff"} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingBottom: 120,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 24,
        alignItems: 'flex-end',
        gap: 12,
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    aiRow: {
        justifyContent: 'flex-start',
    },
    botAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    bubbleWrapper: {
        maxWidth: '75%',
    },
    userWrapper: {
        alignItems: 'flex-end',
    },
    aiWrapper: {
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        marginHorizontal: 4,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    actionsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actionIconContainer: {
        marginRight: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    loadingWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    inputArea: {
        padding: 16,
        borderTopWidth: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 28,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
    },
    addButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
