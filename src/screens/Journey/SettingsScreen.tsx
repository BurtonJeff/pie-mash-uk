import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../lib/supabase';
import { signOut } from '../../lib/auth';
import { registerForPushNotifications } from '../../lib/notifications';

type Props = NativeStackScreenProps<JourneyStackParamList, 'Settings'>;

const VERSION = Constants.expoConfig?.version ?? '1.0.0';
const PRIVACY_URL = 'https://piemashanduk.com/privacy';
const TERMS_URL = 'https://piemashanduk.com/terms';

export default function SettingsScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const email = user?.email ?? '';
  const qc = useQueryClient();

  const { data: profile } = useProfile(userId);

  const [notifGranted, setNotifGranted] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      const granted = status === 'granted';
      setNotifGranted(granted);
      setNotifEnabled(granted && !!profile?.expo_push_token);
    });
  }, [profile?.expo_push_token]);

  const toggleNotifications = async (value: boolean) => {
    if (!notifGranted) {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in your device Settings to receive updates from Pie & Mash UK.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    setNotifLoading(true);
    try {
      if (value) {
        await registerForPushNotifications(userId);
      } else {
        await supabase
          .from('profiles')
          .update({ expo_push_token: null })
          .eq('id', userId);
      }
      setNotifEnabled(value);
      qc.invalidateQueries({ queryKey: ['profile', userId] });
    } catch {
      Alert.alert('Error', 'Could not update notification settings. Please try again.');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (!email) return;
    Alert.alert(
      'Reset Password',
      `A reset link will be sent to ${email}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            await supabase.auth.resetPasswordForEmail(email);
            Alert.alert('Email sent', 'Check your inbox for the password reset link.');
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data — including your check-ins, badges, and points. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              await signOut();
            } catch (e: any) {
              setDeletingAccount(false);
              Alert.alert('Error', e.message ?? 'Could not delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Account ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <RowLink label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <Separator />
          <RowLink
            label="Change Password"
            onPress={handleChangePassword}
            disabled={!email}
          />
        </View>

        {/* ── Notifications ────────────────────────────── */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Push Notifications</Text>
            <Switch
              value={notifEnabled}
              onValueChange={toggleNotifications}
              disabled={notifLoading}
              trackColor={{ false: '#ddd', true: '#2D5016' }}
              thumbColor="#fff"
            />
          </View>
          {!notifGranted && (
            <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.permissionBanner}>
              <Ionicons name="alert-circle-outline" size={14} color="#b07800" style={{ marginRight: 6 }} />
              <Text style={styles.permissionText}>
                Notifications are blocked by your device. Tap to open Settings.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── About ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <RowLink label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Separator />
          <RowLink label="Terms of Service" onPress={() => Linking.openURL(TERMS_URL)} />
          <Separator />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowMeta}>{VERSION}</Text>
          </View>
        </View>

        {/* ── Admin ────────────────────────────────────── */}
        {profile?.is_admin && (
          <>
            <Text style={styles.sectionLabel}>Admin</Text>
            <View style={styles.group}>
              <RowLink label="Admin Panel" onPress={() => navigation.navigate('Admin')} />
            </View>
          </>
        )}

        {/* ── Sign Out ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Account Actions</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={signOut}>
            <Text style={styles.rowDestructive}>Sign Out</Text>
          </TouchableOpacity>
          <Separator />
          <TouchableOpacity
            style={styles.row}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
          >
            <Text style={[styles.rowDestructive, deletingAccount && styles.rowDisabled]}>
              {deletingAccount ? 'Deleting Account…' : 'Delete Account'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function RowLink({
  label, onPress, disabled = false,
}: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled}>
      <Text style={[styles.rowLabel, disabled && styles.rowDisabled]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0ede8' },
  content: { paddingHorizontal: 20, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 50,
    paddingVertical: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginLeft: 16,
  },

  rowLabel: { fontSize: 15, color: '#1a1a1a' },
  rowMeta: { fontSize: 15, color: '#999' },
  rowDestructive: { fontSize: 15, color: '#c00', fontWeight: '500' },
  rowDisabled: { color: '#bbb' },

  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
  },
  permissionText: { flex: 1, fontSize: 13, color: '#b07800', lineHeight: 18 },
});
