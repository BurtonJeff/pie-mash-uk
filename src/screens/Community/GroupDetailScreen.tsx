import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, Alert, Share, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunityStackParamList } from '../../navigation/CommunityNavigator';
import { useAuthStore } from '../../store/authStore';
import { useGroupMessages, useSendMessage, useGroupLeaderboard, useGroupFeed, useGroupMembers, useRemoveGroupMember, useUpdateMemberRole, useDeleteGroupChat, usePendingMembers, useApproveGroupMember, useRejectGroupMember, useSetGroupRequiresConfirmation, useGroupMeetups, useProposeMeetup, useUpdateMeetup, useCancelMeetup, useRsvpMeetup, useUnrsvpMeetup } from '../../hooks/useCommunity';
import MeetupCard from '../../components/community/MeetupCard';
import ProposeMeetupModal from '../../components/community/ProposeMeetupModal';
import AttendeesModal from '../../components/community/AttendeesModal';
import * as Calendar from 'expo-calendar';
import { GroupMember } from '../../lib/groups';
import LeaderboardRow from '../../components/community/LeaderboardRow';
import FeedItemComponent from '../../components/community/FeedItem';
import MemberDetailModal from '../../components/community/MemberDetailModal';
import { supabase } from '../../lib/supabase';
import { GroupMessage } from '../../lib/groups';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<CommunityStackParamList, 'GroupDetail'>;
type SubTab = 'chat' | 'meetups' | 'leaderboard' | 'members';

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
  const { groupId, groupName, inviteCode, createdBy, requiresConfirmation: initialRequiresConfirmation, initialTab } = route.params;
  const [requiresConfirmation, setRequiresConfirmation] = useState(initialRequiresConfirmation ?? false);
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const [subTab, setSubTab] = useState<SubTab>(initialTab ?? 'members');
  const [draft, setDraft] = useState('');
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [showProposeMeetup, setShowProposeMeetup] = useState(false);
  const [editingMeetup, setEditingMeetup] = useState<import('../../lib/meetups').Meetup | null>(null);
  const [attendeesMeetupId, setAttendeesMeetupId] = useState<string | null>(null);
  const [attendeesShopName, setAttendeesShopName] = useState('');
  const listRef = useRef<FlatList>(null);

  const { data: messages = [], refetch: refetchMessages } = useGroupMessages(groupId);
  const sendMutation = useSendMessage(groupId, userId);
  const deleteChat = useDeleteGroupChat(groupId);
  const leaderboard = useGroupLeaderboard(groupId);
  const feed = useGroupFeed(groupId);
  const members = useGroupMembers(groupId);
  const removeMember = useRemoveGroupMember(groupId);
  const updateRole = useUpdateMemberRole(groupId);
  const pendingMembers = usePendingMembers(groupId);
  const approveGroupMember = useApproveGroupMember(groupId);
  const rejectGroupMember = useRejectGroupMember(groupId);
  const setConfirmation = useSetGroupRequiresConfirmation(groupId, userId);
  const isAdmin = (members.data ?? []).some((m) => m.userId === userId && m.role === 'admin');
  const pendingCount = (pendingMembers.data ?? []).length;

  const meetups = useGroupMeetups(groupId, userId);
  const proposeMeetupMutation = useProposeMeetup(groupId);
  const updateMeetupMutation = useUpdateMeetup(groupId);
  const cancelMeetupMutation = useCancelMeetup(groupId);
  const rsvpMutation = useRsvpMeetup(groupId);
  const unrsvpMutation = useUnrsvpMeetup(groupId);

  async function addMeetupToCalendar(meetup: import('../../lib/meetups').Meetup) {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow calendar access in your device Settings to add meatups.');
        return;
      }
      let calendarId: string;
      if (Platform.OS === 'ios') {
        const defaultCal = await Calendar.getDefaultCalendarAsync();
        calendarId = defaultCal.id;
      } else {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const writable = calendars.find((c) => c.allowsModifications) ?? calendars[0];
        if (!writable) { Alert.alert('No calendar found', 'Could not find a writable calendar on this device.'); return; }
        calendarId = writable.id;
      }
      const [y, mo, d] = meetup.meetupDate.split('-').map(Number);
      const [h, mi] = meetup.meetupTime.split(':').map(Number);
      const start = new Date(y, mo - 1, d, h, mi, 0);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      await Calendar.createEventAsync(calendarId, {
        title: `Meatup at ${meetup.shopName}`,
        location: `${meetup.shopName}, ${meetup.shopCity}`,
        startDate: start,
        endDate: end,
        notes: meetup.description ?? '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      Alert.alert('Added to calendar!', `The meatup at ${meetup.shopName} has been added to your calendar.`);
    } catch (e: any) {
      Alert.alert('Calendar error', e?.message ?? 'Could not add event to calendar.');
    }
  }

  async function handleRsvp(meetup: import('../../lib/meetups').Meetup) {
    rsvpMutation.mutate({ meetupId: meetup.id, userId }, {
      onSuccess: () => {
        Alert.alert(
          'You\'re going! 🥧',
          'Would you like to add this meatup to your calendar?',
          [
            { text: 'No thanks', style: 'cancel' },
            { text: 'Add to Calendar', onPress: () => addMeetupToCalendar(meetup) },
          ],
        );
      },
    });
  }

  function confirmDeleteChat() {
    Alert.alert(
      'Delete Chat',
      'This will permanently delete all messages in this group. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Messages',
          style: 'destructive',
          onPress: () => deleteChat.mutate(),
        },
      ],
    );
  }

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
    { key: 'meetups', label: 'Meatups' },
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
            <View style={styles.subTabInner}>
              <Text style={[styles.subTabText, subTab === key && styles.subTabTextActive]}>{label}</Text>
              {key === 'members' && isAdmin && pendingCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
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
          {isAdmin && messages.length > 0 && (
            <TouchableOpacity style={styles.deleteChatBar} onPress={confirmDeleteChat}>
              <Ionicons name="trash-outline" size={15} color="#c0392b" />
              <Text style={styles.deleteChatText}>Delete chat history</Text>
            </TouchableOpacity>
          )}
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

      {/* ── Meatups ──────────────────────────────────── */}
      {subTab === 'meetups' && (
        meetups.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#2D5016" />
        ) : (
          <>
            <FlatList
              data={meetups.data ?? []}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <TouchableOpacity style={styles.proposeMeatupBtn} onPress={() => setShowProposeMeetup(true)}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.proposeMeatupText}>Propose a Meatup</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <MeetupCard
                  meetup={item}
                  userId={userId}
                  isAdmin={isAdmin}
                  onRsvp={() => handleRsvp(item)}
                  onUnrsvp={() => unrsvpMutation.mutate({ meetupId: item.id, userId })}
                  onCancel={() => cancelMeetupMutation.mutate({ meetupId: item.id, cancelledBy: userId })}
                  onEdit={() => setEditingMeetup(item)}
                  onShowAttendees={() => {
                    setAttendeesMeetupId(item.id);
                    setAttendeesShopName(item.shopName);
                  }}
                />
              )}
              ListEmptyComponent={
                <View style={styles.meatupEmpty}>
                  <Text style={styles.meatupEmptyEmoji}>🥧</Text>
                  <Text style={styles.empty}>No meatups yet.</Text>
                  <Text style={styles.meatupEmptySub}>Be the first to propose one!</Text>
                </View>
              }
            />

            {/* Propose new meetup */}
            <ProposeMeetupModal
              visible={showProposeMeetup}
              onClose={() => setShowProposeMeetup(false)}
              onSubmit={async (params) => {
                await proposeMeetupMutation.mutateAsync({ ...params, proposedBy: userId });
              }}
            />

            {/* Edit existing meetup */}
            <ProposeMeetupModal
              visible={!!editingMeetup}
              editingMeetup={editingMeetup ?? undefined}
              onClose={() => setEditingMeetup(null)}
              onSubmit={async (params) => {
                if (!editingMeetup) return;
                await updateMeetupMutation.mutateAsync({
                  meetupId: editingMeetup.id,
                  meetupDate: params.meetupDate,
                  meetupTime: params.meetupTime,
                  description: params.description,
                  maxAttendees: params.maxAttendees ?? null,
                });
              }}
            />

            {/* Attendees list */}
            <AttendeesModal
              meetupId={attendeesMeetupId}
              shopName={attendeesShopName}
              onClose={() => setAttendeesMeetupId(null)}
            />
          </>
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
            ListHeaderComponent={
              <>
                {inviteCode && (
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
                )}
                {isAdmin && (
                  <View style={styles.confirmationRow}>
                    <View style={styles.confirmationText}>
                      <Text style={styles.confirmationLabel}>Require approval to join</Text>
                      <Text style={styles.confirmationSub}>New members must be approved before joining</Text>
                    </View>
                    <Switch
                      value={requiresConfirmation}
                      onValueChange={(val) => {
                        setRequiresConfirmation(val);
                        setConfirmation.mutate(val);
                      }}
                      trackColor={{ false: '#ddd', true: '#2D5016' }}
                      thumbColor="#fff"
                    />
                  </View>
                )}
                {isAdmin && (pendingMembers.data ?? []).length > 0 && (
                  <View style={styles.pendingSection}>
                    <Text style={styles.pendingSectionTitle}>Pending Requests ({pendingCount})</Text>
                    {(pendingMembers.data ?? []).map((pm) => (
                      <View key={pm.userId} style={styles.pendingRow}>
                        <View style={styles.memberAvatarPlaceholder}>
                          <Text style={styles.memberInitials}>
                            {pm.displayName.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.pendingName}>{pm.displayName}</Text>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => approveGroupMember.mutate(pm.userId)}
                        >
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => {
                            Alert.alert('Reject Request', `Reject ${pm.displayName}'s request to join?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Reject', style: 'destructive', onPress: () => rejectGroupMember.mutate(pm.userId) },
                            ]);
                          }}
                        >
                          <Ionicons name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.pendingDivider} />
                  </View>
                )}
              </>
            }
            renderItem={({ item }) => (
              <MemberRow
                member={item}
                isCurrentUser={item.userId === userId}
                canRemove={isAdmin && item.userId !== userId && item.userId !== createdBy}
                canPromote={isAdmin && item.userId !== userId && item.role === 'member'}
                canDemote={isAdmin && item.userId !== userId && item.role === 'admin' && item.userId !== createdBy}
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
                onPromote={() => {
                  Alert.alert(
                    'Make Admin',
                    `Make ${item.displayName} a group admin?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Make Admin', onPress: () => updateRole.mutate({ targetUserId: item.userId, role: 'admin' }) },
                    ],
                  );
                }}
                onDemote={() => {
                  Alert.alert(
                    'Remove Admin',
                    `Remove admin rights from ${item.displayName}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove Admin', style: 'destructive', onPress: () => updateRole.mutate({ targetUserId: item.userId, role: 'member' }) },
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

function MemberRow({ member, isCurrentUser, canRemove, canPromote, canDemote, onPress, onRemove, onPromote, onDemote }: {
  member: GroupMember;
  isCurrentUser: boolean;
  canRemove: boolean;
  canPromote: boolean;
  canDemote: boolean;
  onPress: () => void;
  onRemove: () => void;
  onPromote: () => void;
  onDemote: () => void;
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
      {canPromote && (
        <TouchableOpacity onPress={onPromote} style={styles.roleButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="shield-outline" size={18} color="#b45309" />
        </TouchableOpacity>
      )}
      {canDemote && (
        <TouchableOpacity onPress={onDemote} style={styles.roleButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="shield-half-outline" size={18} color="#b45309" />
        </TouchableOpacity>
      )}
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
  subTabInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subTabText: { fontSize: 13, color: '#999' },
  subTabTextActive: { color: '#2D5016', fontWeight: '700' },
  pendingBadge: {
    backgroundColor: '#c0392b', borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Chat
  deleteChatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#fff5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#fdd',
  },
  deleteChatText: { fontSize: 13, color: '#c0392b', fontWeight: '600' },
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
  empty: { textAlign: 'center', color: '#aaa', fontSize: 14, marginTop: 8 },

  // Meatups
  proposeMeatupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2D5016', borderRadius: 12,
    paddingVertical: 12, marginBottom: 16,
  },
  proposeMeatupText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  meatupEmpty: { alignItems: 'center', marginTop: 40 },
  meatupEmptyEmoji: { fontSize: 40, marginBottom: 8 },
  meatupEmptySub: { fontSize: 13, color: '#bbb', marginTop: 4 },

  // Confirmation toggle
  confirmationRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 12, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  confirmationText: { flex: 1 },
  confirmationLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  confirmationSub: { fontSize: 12, color: '#999', marginTop: 2 },

  // Pending requests
  pendingSection: { marginBottom: 12 },
  pendingSectionTitle: { fontSize: 13, fontWeight: '700', color: '#c0392b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', borderRadius: 10, padding: 10, marginBottom: 6, gap: 10 },
  pendingName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  approveBtn: { backgroundColor: '#2D5016', borderRadius: 8, padding: 6 },
  rejectBtn: { backgroundColor: '#c0392b', borderRadius: 8, padding: 6 },
  pendingDivider: { height: 1, backgroundColor: '#eee', marginTop: 8, marginBottom: 4 },

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
  roleButton: { marginLeft: 10 },
  removeButton: { marginLeft: 10 },
});
