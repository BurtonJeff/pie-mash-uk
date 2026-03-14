import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Props {
  onComplete: () => void;
}

export default function ResetPasswordScreen({ onComplete }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (password.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Password updated', 'Your password has been changed.', [
        { text: 'OK', onPress: onComplete },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = password.length >= 8 && confirm.length > 0;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set new password</Text>
        <Text style={styles.subtitle}>Enter a new password for your account.</Text>

        <TextInput
          style={styles.input}
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="newPassword"
        />

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !canSubmit}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Update password</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 14, marginBottom: 16, fontSize: 16,
  },
  button: {
    backgroundColor: '#2D5016', borderRadius: 8,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
