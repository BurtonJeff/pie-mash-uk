import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { useAuthStore } from '../../store/authStore';
import { useGroupMessages, useSendMessage, useGroupLeaderboard, useGroupFeed, useGroupMembers, useRemoveGroupMember } from '../../hooks/useCommunity';
import { GroupMember } from '../../lib/groups';
import LeaderboardRow from '../../components/community/LeaderboardRow';
import FeedItemComponent from '../../components/community/FeedItem';
import MemberDetailModal from '../../components/community/MemberDetailModal';
import { supabase } from '../../lib/supabase';
import { GroupMessage } from '../../lib/groups';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CommunityStackParamList, 'GroupDetail'>;
type SubTab = 'chat' | 'activity' | 'leaderboard' | 'members';

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
  const { groupId, groupName, inviteCode } = route.params;
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const [subTab, setSubTab] = useState<SubTab>('members');
  const [draft, setDraft] = useState('');
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const listRef = useRef<FlatList>(null);

  const { data: messages = [], refetch: refetchMessages } = useGroupMessages(groupId);
  const sendMutation = useSendMessage(groupId, userId);
  const leaderboard = useGroupLeaderboard(groupId);
  const feed = useGroupFeed(groupId);
  const members = useGroupMembers(groupId);
  const removeMember = useRemoveGroupMember(groupId);
  const isAdmin = (members.data ?? []).some((m) => m.userId === userId && m.role === 'admin');

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
    { key: 'members', label: 'Members' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'activity', label: 'Activity' },
    { key: 'chat', label: 'Chat' },
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
              <LeaderboardRow
                entry={item}
                isCurrentUser={item.userId === userId}
                onPress={() => {
                  const member = (members.data ?? []).find((m) => m.userId === item.userId);
                  if (member) setSelectedMember(member);
                }}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No members yet.</Text>}
          />
        )
      )}

      {/* ── Members ──────────────────────────────────── */}
      {subTab === 'members' && (
        members.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#2D5016" />
        ) : (
          <FlatList
            data={members.data ?? []}
            keyExtractor={(m) => m.userId}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={inviteCode ? (
              <View style={styles.inviteBox}>
                <View style={styles.inviteLeft}>
                  <Text style={styles.inviteLabel}>Invite Code</Text>
                  <Text style={styles.inviteCode}>{inviteCode}</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => Share.share({ message: `Join my Pie & Mash group with code: ${inviteCode}` })}
                >
                  <Ionicons name="share-outline" size={18} color="#2D5016" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            renderItem={({ item }) => (
              <MemberRow
                member={item}
                isCurrentUser={item.userId === userId}
                canRemove={isAdmin && item.userId !== userId}
                onPress={() => setSelectedMember(item)}
                onRemove={() => {
                  Alert.alert(
                    'Remove Member',
                    `Remove ${item.displayName} from this group?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeMember.mutate(item.userId) },
                    ],
                  );
                }}
              />
            )}
            ListEmptyComponent={<Text style={styles.empty}>No members yet.</Text>}
          />
        )
      )}

      <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </SafeAreaView>
  );
}

function MemberRow({ member, isCurrentUser, canRemove, onPress, onRemove }: {
  member: GroupMember;
  isCurrentUser: boolean;
  canRemove: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const initials = (() => {
    const parts = member.displayName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : member.displayName.slice(0, 2).toUpperCase();
  })();

  return (
    <TouchableOpacity style={styles.memberRow} onPress={onPress} activeOpacity={0.7}>
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberAvatarPlaceholder}>
          <Text style={styles.memberInitials}>{initials}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{member.displayName}</Text>
          {member.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.memberStats}>
        <Text style={styles.memberStatValue}>{member.totalPoints}</Text>
        <Text style={styles.memberStatLabel}>pts</Text>
      </View>
      {canRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="person-remove-outline" size={18} color="#c0392b" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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

  // Invite code
  inviteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef4e8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  inviteLeft: { flex: 1 },
  inviteLabel: { fontSize: 11, fontWeight: '600', color: '#2D5016', textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteCode: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', letterSpacing: 4, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: '#2D5016' },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 22 },
  memberAvatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2D5016', alignItems: 'center', justifyContent: 'center',
  },
  memberInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  adminBadge: {
    backgroundColor: '#fff3e0', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  adminBadgeText: { fontSize: 10, fontWeight: '700', color: '#b45309' },
  youBadge: {
    backgroundColor: '#eef4e8', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: '#2D5016' },
  memberStats: { alignItems: 'center' },
  memberStatValue: { fontSize: 16, fontWeight: '800', color: '#2D5016' },
  memberStatLabel: { fontSize: 10, color: '#888' },
  removeButton: { marginLeft: 10 },
});
