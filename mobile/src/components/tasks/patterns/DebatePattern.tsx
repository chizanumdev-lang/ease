import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    StyleSheet, 
    Text, 
    FlatList, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import { Task, TaskMetadata } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants/config';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DebatePatternProps {
    task: Task;
    onComplete: (metadata: TaskMetadata) => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function DebatePattern({ task, onComplete }: DebatePatternProps) {
    const { colors, fonts, shadows, borderRadius } = useTheme();
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: '1', 
            role: 'assistant', 
            content: `I'm ready for our session on "${task.title}". What's your initial perspective on this topic?` 
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const metadata = task.metadata as any;
    const persona = metadata?.persona || 'Intellectual Sparring Partner';

    const sendMessage = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const response = await axios.post(`${API_BASE_URL}/tasks/chat`, {
                messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                context: task.description || task.title,
                persona: persona
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.content
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Chat failed:', error);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, isTyping]);

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View 
                entering={FadeIn.delay(100)}
                style={[
                    styles.messageRow, 
                    { justifyContent: isUser ? 'flex-end' : 'flex-start' }
                ]}
            >
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
                        <Ionicons name="bulb" size={16} color={colors.white} />
                    </View>
                )}
                <View style={[
                    styles.bubble, 
                    { 
                        backgroundColor: isUser ? colors.primary : colors.surfaceContainerLow,
                        borderBottomRightRadius: isUser ? 4 : 20,
                        borderBottomLeftRadius: isUser ? 20 : 4,
                    }
                ]}>
                    <Text style={[
                        styles.messageText, 
                        { color: isUser ? colors.white : colors.text, fontFamily: fonts.body }
                    ]}>
                        {item.content}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.outline }]}>
                <Text style={[styles.persona, { color: colors.primary, fontFamily: fonts.labelBold }]}>
                    {persona.toUpperCase()}
                </Text>
                <Text style={[styles.taskTitle, { color: colors.textMuted, fontFamily: fonts.body }]} numberOfLines={1}>
                    {task.title}
                </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {isTyping && (
                <View style={styles.typingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.typingText, { color: colors.textMuted, fontFamily: fonts.body }]}>
                        Thinking...
                    </Text>
                </View>
            )}

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <BlurView intensity={80} tint="light" style={styles.inputArea}>
                    <TextInput
                        style={[
                            styles.input, 
                            { 
                                backgroundColor: colors.surfaceContainerLowest, 
                                color: colors.text,
                                fontFamily: fonts.body,
                                borderColor: colors.outline
                            }
                        ]}
                        placeholder="Share your thoughts..."
                        placeholderTextColor={colors.textMuted}
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.surfaceContainerHighest }]}
                        onPress={sendMessage}
                        disabled={!input.trim() || isTyping}
                    >
                        <Ionicons name="arrow-up" size={24} color={colors.white} />
                    </TouchableOpacity>
                </BlurView>
            </KeyboardAvoidingView>

            <TouchableOpacity 
                style={[styles.finishBtn, { backgroundColor: messages.length > 3 ? colors.primaryContainer : 'transparent' }]}
                onPress={() => onComplete({ messagesCount: messages.length })}
                disabled={messages.length <= 3}
            >
                <Text style={[
                    styles.finishBtnText, 
                    { color: messages.length > 3 ? colors.white : colors.textMuted, fontFamily: fonts.labelBold }
                ]}>
                    {messages.length > 3 ? 'FINISH & REFLECT' : 'CONVERSE TO CONTINUE'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    persona: {
        fontSize: 12,
        letterSpacing: 2,
    },
    taskTitle: {
        fontSize: 14,
        marginTop: 4,
    },
    listContent: {
        padding: 24,
        paddingBottom: 100,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-end',
        gap: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        maxWidth: SCREEN_WIDTH * 0.75,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 8,
        marginBottom: 12,
    },
    typingText: {
        fontSize: 13,
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 32,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 1,
        fontSize: 16,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    finishBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    finishBtnText: {
        fontSize: 10,
        letterSpacing: 1,
    }
});
