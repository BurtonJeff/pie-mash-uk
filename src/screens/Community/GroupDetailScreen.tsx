import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { useAuthStore } from '../../store/authStore';
import { useGroupMessages, useSendMessage, useGroupLeaderboard, useGroupFeed } from '../../hooks/useCommunity';
import LeaderboardRow from '../../components/community/LeaderboardRow';
import FeedItemComponent from '../../components/community/FeedItem';
import { supabase } from '../../lib/supabase';
import { GroupMessage } from '../../lib/groups';
import { timeAgo } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CommunityStackParamList, 'GroupDetail'>;
type SubTab = 'chat' | 'activity' | 'leaderboard';

function ChatBubble({ msg, isOwn }: { msg: GroupMessage; isOwn: boolean }) {
  return (
    <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
      {!isOwn && (
        <Text style={styles.bubbleSender}>{msg.displayName || msg.username}</Text>
      )}
      <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>{msg.body}</Text>
      <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>{timeAgo(msg.createdAt)}</Text>
    </View>
  );
}

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId, groupName } = route.params;
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const [subTab, setSubTab] = useState<SubTab>('chat');
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: messages = [], refetch: refetchMessages } = useGroupMessages(groupId);
  const sendMutation = useSendMessage(groupId, userId);
  const leaderboard = useGroupLeaderboard(groupId);
  const feed = useGroupFeed(groupId);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: groupName });
  }, [navigation, groupName]);

  // Real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        () => { refetchMessages(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    try {
      await sendMutation.mutateAsync(body);
    } catch (e: any) {
      Alert.alert('Failed to send', e.message);
    }
  }

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: 'chat', label: 'Chat' },
    { key: 'activity', label: 'Activity' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Sub-tab bar */}
      <View style={styles.subTabBar}>
        {SUB_TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.subTab, subTab === key && styles.subTabActive]}
            onPress={() => setSubTab(key)}
          >
            <Text style={[styles.subTabText, subTab === key && styles.subTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chat ───────────────────────────────────────── */}
      {subTab === 'chat' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.chatList}
            renderItem={({ item }) => (
              <ChatBubble msg={item} isOwn={item.userId === userId} />
            )}
            ListEmptyComponent={
              <Text style={styles.chatEmpty}>No messages yet. Say hello!</Text>
            }
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Message…"
              multiline
              maxLength={500}
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
              onPress={send}
              disabled={!draft.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.sendText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Activity ─────────────────────────────────── */}
      {subTab === 'activity' && (
        feed.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#2D5016" />
        ) : (
          <FlatList
            data={feed.data ?? []}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <FeedItemComponent item={item} />}
            ListEmptyComponent={<Text style={styles.empty}>No check-ins from group members yet.</Text>}
          />
        )
      )}

      {/* ── Leaderboard ─────────────────────────────── */}
      {subTab === 'leaderboard' && (
        leaderboard.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#2D5016" />
        ) : (
          <FlatList
            data={leaderboard.data ?? []}
            keyExtractor={(e) => e.userId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <LeaderboardRow entry={item} isCurrentUser={item.userId === userId} />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No members yet.</Text>}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f5f0' },
  flex: { flex: 1 },

  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subTabActive: { borderBottomWidth: 2, borderBottomColor: '#2D5016' },
  subTabText: { fontSize: 13, color: '#999' },
  subTabTextActive: { color: '#2D5016', fontWeight: '700' },

  // Chat
  chatList: { padding: 16, paddingBottom: 8 },
  chatEmpty: { textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 14 },
  bubble: { maxWidth: '78%', marginBottom: 10, padding: 10, borderRadius: 14 },
  bubbleOwn: { alignSelf: 'flex-end', backgroundColor: '#2D5016', borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: '#2D5016', marginBottom: 3 },
  bubbleText: { fontSize: 14, color: '#222', lineHeight: 20 },
  bubbleTextOwn: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'right' },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.6)' },

  inputRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2D5016',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  listContent: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 60 },
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 40 },
});
