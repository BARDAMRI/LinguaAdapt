import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import type { AppNav, AppStackParamList } from '../navigation/types';
import {
  type ChatMessage,
  conversationReply,
} from '../services/aiService';
import { isRTL, t } from '../services/i18n';
import { theme } from '../theme/theme';

const DEFAULT_TOPIC = 'At the Airport';

type Row = { id: string; role: 'user' | 'model'; text: string; offline?: boolean };

export function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNav>();
  const route = useRoute<RouteProp<AppStackParamList, 'Conversation'>>();
  const topic = route.params?.topic ?? DEFAULT_TOPIC;
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { user } = useAuth();

  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);

  const pushRow = useCallback((r: Row) => {
    setRows((prev) => [...prev, r]);
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !user) return;
    setInput('');
    const userRow: Row = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
    };
    pushRow(userRow);
    setLoading(true);

    try {
      const historyBefore: ChatMessage[] = rows.map((row) => ({
        role: row.role,
        text: row.text,
      }));

      const { text: reply, usedFallback } = await conversationReply(
        topic,
        historyBefore,
        text,
      );

      pushRow({
        id: `m-${Date.now()}`,
        role: 'model',
        text: reply,
        offline: usedFallback,
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, pushRow, rows, topic, user]);

  const renderItem = useCallback(
    ({ item }: { item: Row }) => {
      const mine = item.role === 'user';
      const alignStyle = mine
        ? isRTL
          ? styles.bubbleRowRtlMine
          : styles.bubbleRowMine
        : isRTL
          ? styles.bubbleRowRtlTheirs
          : styles.bubbleRowTheirs;
      return (
        <View style={[styles.bubbleWrap, alignStyle]} testID={`conversation_bubble_wrap_${item.id}`}>
          <View
            style={[
              styles.bubble,
              mine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}
            testID={mine ? 'conversation_bubble_user' : 'conversation_bubble_model'}
          >
            <Text
              style={[
                styles.bubbleText,
                mine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                { textAlign: mine ? (isRTL ? 'right' : 'left') : 'left' },
              ]}
              testID={`conversation_text_message_${item.id}`}
            >
              {item.text}
            </Text>
            {item.role === 'model' && item.offline ? (
              <Text style={styles.offlineTag} testID="conversation_badge_offline">{t('conversation.offlineBadge')}</Text>
            ) : null}
          </View>
        </View>
      );
    },
    [isRTL],
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
      testID="conversation_root"
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.sm,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        testID="conversation_header"
      >
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()} hitSlop={12} testID="conversation_btn_home">
          <Text style={styles.iconBtnText}>🏠</Text>
        </Pressable>
        <Text style={styles.headerTitle} testID="conversation_text_title">{t('conversation.title')}</Text>
      </View>

      <View style={[styles.topicBanner, isWide && styles.topicBannerWide]} testID="conversation_banner_topic">
        <Text style={[styles.topicText, { textAlign: 'center' }]} testID="conversation_text_topic">
          {t('conversation.topicLine', { topic })}
        </Text>
        <Text style={[styles.hint, { textAlign: 'center' }]} testID="conversation_text_hint">
          {t('conversation.hint')}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: theme.spacing.lg },
        ]}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { textAlign: 'center' }]} testID="conversation_text_empty">
            {t('conversation.hint')}
          </Text>
        }
        testID="conversation_list_messages"
      />

      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: insets.bottom + theme.spacing.sm,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
        testID="conversation_bar_input"
      >
        <View style={styles.inputGrow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('conversation.inputPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.input,
              {
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              },
            ]}
            multiline
            maxLength={800}
            editable={!loading}
            testID="conversation_input_message"
          />
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && styles.sendBtnPressed,
            (loading || !input.trim()) && styles.sendBtnDisabled,
          ]}
          onPress={() => {
            void send();
          }}
          disabled={loading || !input.trim()}
          testID="conversation_btn_send"
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.text} />
          ) : (
            <Text style={styles.sendIcon}>{isRTL ? '◀' : '▶'}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  topicBanner: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topicBannerWide: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  topicText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hint: {
    marginTop: theme.spacing.xs,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    flexGrow: 1,
  },
  empty: {
    marginTop: theme.spacing.xl,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.lg,
  },
  bubbleWrap: {
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  bubbleRowMine: {
    alignItems: 'flex-end',
  },
  bubbleRowTheirs: {
    alignItems: 'flex-start',
  },
  bubbleRowRtlMine: {
    alignItems: 'flex-start',
  },
  bubbleRowRtlTheirs: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '92%',
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTextMine: {
    color: theme.colors.onPrimary,
  },
  bubbleTextTheirs: {
    color: theme.colors.text,
    writingDirection: 'ltr',
  },
  offlineTag: {
    marginTop: theme.spacing.xs,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.secondary,
    textTransform: 'uppercase',
  },
  inputBar: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inputGrow: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 18,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
});
