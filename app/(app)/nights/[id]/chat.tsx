import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuthStore } from '@/features/auth/store';
import { useLiveStore } from '@/features/live/store';
import { DecryptedChatMessage } from '@/features/live/types';

export default function ChatScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const consumer = useAuthStore((s) => s.consumer);
  const messages = useLiveStore((s) => s.messages);
  const connectionStatus = useLiveStore((s) => s.connectionStatus);
  const sendMessage = useLiveStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await sendMessage(trimmed);
  }, [text, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: DecryptedChatMessage }) => {
      const isMe = item.senderId === consumer?.id;
      return (
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString('en-AU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    },
    [consumer?.id, styles],
  );

  if (connectionStatus !== 'connected') {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={32} color={colors.textMuted} />
        <Text style={styles.statusText}>
          {connectionStatus === 'connecting'
            ? 'Establishing encrypted connection...'
            : 'Not connected to live night'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      <View style={styles.encryptedBanner}>
        <Ionicons name="shield-checkmark" size={14} color={colors.success} />
        <Text style={styles.encryptedText}>End-to-end encrypted</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Messages are encrypted and only visible to members</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
        >
          <Ionicons name="send" size={20} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    statusText: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    encryptedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      backgroundColor: colors.surfaceAlt,
    },
    encryptedText: {
      ...Typography.label,
      color: colors.success,
      letterSpacing: 0,
    },
    messageList: {
      padding: Spacing.base,
      gap: Spacing.sm,
      flexGrow: 1,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: Spacing.md,
      borderRadius: Radius.lg,
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: Radius.xs,
    },
    theirMessage: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderBottomLeftRadius: Radius.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    senderName: {
      ...Typography.label,
      color: colors.primary,
      marginBottom: Spacing.xs,
      letterSpacing: 0,
    },
    messageText: {
      ...Typography.body,
      color: colors.text,
    },
    myMessageText: {
      color: colors.textOnPrimary,
    },
    messageTime: {
      ...Typography.label,
      color: colors.textMuted,
      marginTop: Spacing.xs,
      alignSelf: 'flex-end',
      letterSpacing: 0,
    },
    myMessageTime: {
      color: colors.textOnPrimary,
      opacity: 0.7,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing['5xl'],
    },
    emptyText: {
      ...Typography.bodyMedium,
      color: colors.textMuted,
    },
    emptySubtext: {
      ...Typography.label,
      color: colors.textMuted,
      textAlign: 'center',
      letterSpacing: 0,
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: Spacing.sm,
      paddingBottom: Spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: Spacing.sm,
    },
    textInput: {
      flex: 1,
      ...Typography.body,
      color: colors.text,
      backgroundColor: colors.background,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });
}
