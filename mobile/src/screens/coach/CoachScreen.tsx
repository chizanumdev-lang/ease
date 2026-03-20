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
    ActivityIndicator,
    SafeAreaView,
    Dimensions
} from 'react-native';
import { CoachService, CoachResponse } from '../../services/coach.service';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    suggestedActions?: CoachResponse['suggested_actions'];
}

const { width } = Dimensions.get('window');

export default function CoachScreen({ navigation }: any) {
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
                    <View style={styles.botAvatar}>
                        <Ionicons name="sparkles" size={18} color="#fff" />
                    </View>
                )}
                
                <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
                    <Text style={styles.senderName}>{isUser ? 'You' : 'Ease Bot'}</Text>
                    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                            {item.text}
                        </Text>
                    </View>
                    
                    {item.suggestedActions && (
                        <View style={styles.actionsWrapper}>
                            {item.suggestedActions.map((action, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.actionPill}
                                    onPress={() => sendMessage(action.details)}
                                >
                                    <View style={styles.actionIconContainer}>
                                        <Ionicons 
                                            name={action.type === 'reschedule' ? 'calendar-outline' : 'flash-outline'} 
                                            size={14} 
                                            color={Theme.colors.primary} 
                                        />
                                    </View>
                                    <Text style={styles.actionText}>{action.details}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {isUser && (
                    <View style={styles.userAvatar}>
                        <Ionicons name="person" size={18} color="#cbd5e1" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background Glows */}
            <View style={[styles.glow, styles.glowTopLeft]} />
            <View style={[styles.glow, styles.glowMidRight]} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation?.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Ease Bot</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Always here for you</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="information-circle-outline" size={24} color={Theme.colors.primary} />
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
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                    <Text style={styles.loadingText}>Ease AI is typing...</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.inputArea}
            >
                <View style={styles.inputWrapper}>
                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add-circle-outline" size={24} color="#94a3b8" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#64748b"
                        returnKeyType="send"
                        onSubmitEditing={() => sendMessage()}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage()} disabled={isLoading}>
                        <Ionicons name="arrow-up" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#151022', // background-dark
    },
    glow: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
    },
    glowTopLeft: {
        width: 256,
        height: 256,
        backgroundColor: Theme.colors.primary,
        top: -100,
        left: -100,
    },
    glowMidRight: {
        width: 320,
        height: 320,
        backgroundColor: '#9333ea', // purple-600
        top: '40%',
        right: -150,
        opacity: 0.05,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(66, 17, 212, 0.1)',
        backgroundColor: 'rgba(21, 16, 34, 0.8)',
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: '700',
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
        backgroundColor: '#22c55e', // green-500
    },
    statusText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    },
    listContent: {
        padding: 16,
        paddingBottom: 180,
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
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#334155',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.2)',
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
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        marginLeft: 4,
        marginRight: 4,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: Theme.colors.primary,
        borderBottomRightRadius: 4,
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    aiBubble: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.1)',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
    },
    aiText: {
        color: '#f1f5f9',
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
        backgroundColor: 'rgba(66, 17, 212, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actionIconContainer: {
        marginRight: 6,
    },
    actionText: {
        color: Theme.colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    loadingText: {
        marginLeft: 10,
        color: '#64748b',
        fontSize: 14,
    },
    inputArea: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 16,
        backgroundColor: '#151022',
        borderTopWidth: 1,
        borderTopColor: 'rgba(66, 17, 212, 0.1)',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 28,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(66, 17, 212, 0.2)',
    },
    addButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        color: '#f1f5f9',
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sendButton: {
        backgroundColor: Theme.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
