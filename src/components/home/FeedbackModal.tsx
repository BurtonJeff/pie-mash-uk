import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { submitFeedback } from '../../lib/feedback';

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

const MAX_LENGTH = 1000;

export default function FeedbackModal({ visible, userId, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  function handleClose() {
    if (sending) return;
    setMessage('');
    onClose();
  }

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await submitFeedback(userId, trimmed);
      setMessage('');
      onClose();
      Alert.alert('Thank you!', 'Your feedback has been sent to the team.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const canSend = message.trim().length > 0 && !sending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Share Your Feedback</Text>
          <Text style={styles.subtitle}>
            We'd love to hear your thoughts — what's working well, what could be improved,
            or any bugs you've spotted.
          </Text>

          <Text style={styles.label}>Your message</Text>
          <TextInput
            style={styles.textArea}
            value={message}
            onChangeText={setMessage}
            placeholder="Write your feedback here…"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            autoFocus
          />
          <Text style={styles.charCount}>{message.length}/{MAX_LENGTH}</Text>

          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Feedback</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={sending}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0ede8' },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 32, paddingBottom: 48 },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
    marginBottom: 28,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0ddd8',
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 160,
  },
  charCount: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 28,
  },

  sendButton: {
    backgroundColor: '#2D5016',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  cancelButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0ddd8',
    backgroundColor: '#fff',
  },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
});
