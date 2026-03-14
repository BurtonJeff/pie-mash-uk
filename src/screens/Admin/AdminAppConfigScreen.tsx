import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAppConfig, setAppConfig } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminAppConfig'>;

export default function AdminAppConfigScreen(_: Props) {
  const qc = useQueryClient();

  const { data: currentSubtitle, isLoading: subtitleLoading } = useQuery({
    queryKey: ['appConfig', 'home_subtitle'],
    queryFn: () => fetchAppConfig('home_subtitle'),
  });
  const { data: currentLinkUrl, isLoading: linkLoading } = useQuery({
    queryKey: ['appConfig', 'did_you_know_link_url'],
    queryFn: () => fetchAppConfig('did_you_know_link_url'),
  });
  const { data: currentLinkText, isLoading: linkTextLoading } = useQuery({
    queryKey: ['appConfig', 'did_you_know_link_text'],
    queryFn: () => fetchAppConfig('did_you_know_link_text'),
  });
  const { data: currentLinkBold, isLoading: linkBoldLoading } = useQuery({
    queryKey: ['appConfig', 'did_you_know_link_bold'],
    queryFn: () => fetchAppConfig('did_you_know_link_bold'),
  });

  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkBold, setLinkBold] = useState('');
  const [subtitleInit, setSubtitleInit] = useState(false);
  const [linkInit, setLinkInit] = useState(false);

  if (currentSubtitle !== undefined && !subtitleInit) {
    setSubtitle(currentSubtitle ?? '');
    setSubtitleInit(true);
  }
  if (currentLinkUrl !== undefined && currentLinkText !== undefined && currentLinkBold !== undefined && !linkInit) {
    setLinkUrl(currentLinkUrl ?? '');
    setLinkText(currentLinkText ?? 'Learn more from');
    setLinkBold(currentLinkBold ?? "Norman's Conquest");
    setLinkInit(true);
  }

  const saveSubtitle = useMutation({
    mutationFn: () => setAppConfig('home_subtitle', subtitle.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appConfig', 'home_subtitle'] });
      Alert.alert('Saved', 'Home screen subtitle updated.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const saveLink = useMutation({
    mutationFn: async () => {
      await setAppConfig('did_you_know_link_url', linkUrl.trim());
      await setAppConfig('did_you_know_link_text', linkText.trim());
      await setAppConfig('did_you_know_link_bold', linkBold.trim());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['didYouKnowLink'] });
      Alert.alert('Saved', 'Did You Know link updated.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const isLoading = subtitleLoading || linkLoading || linkTextLoading || linkBoldLoading;

  if (isLoading) {
    return <ActivityIndicator size="large" color="#2D5016" style={styles.loader} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Home Subtitle */}
      <Text style={styles.sectionHeader}>Home Screen</Text>
      <Text style={styles.label}>Subtitle</Text>
      <Text style={styles.hint}>Shown below the header on the Home tab.</Text>
      <TextInput
        style={styles.textArea}
        value={subtitle}
        onChangeText={setSubtitle}
        placeholder="e.g. Preserving a Great British Tradition…"
        placeholderTextColor="#bbb"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={200}
      />
      <Text style={styles.charCount}>{subtitle.length}/200</Text>
      <TouchableOpacity
        style={[styles.saveButton, (!subtitle.trim() || saveSubtitle.isPending) && styles.buttonDisabled]}
        onPress={() => saveSubtitle.mutate()}
        disabled={!subtitle.trim() || saveSubtitle.isPending}
      >
        {saveSubtitle.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Subtitle</Text>}
      </TouchableOpacity>

      {/* Did You Know Link */}
      <Text style={[styles.sectionHeader, { marginTop: 32 }]}>Did You Know Link</Text>
      <Text style={styles.label}>Link URL</Text>
      <TextInput style={styles.input} value={linkUrl} onChangeText={setLinkUrl} placeholder="https://..." placeholderTextColor="#bbb" keyboardType="url" autoCapitalize="none" />
      <Text style={styles.label}>Prefix Text</Text>
      <TextInput style={styles.input} value={linkText} onChangeText={setLinkText} placeholder="e.g. Learn more from" placeholderTextColor="#bbb" />
      <Text style={styles.label}>Bold Link Text</Text>
      <TextInput style={styles.input} value={linkBold} onChangeText={setLinkBold} placeholder="e.g. Norman's Conquest" placeholderTextColor="#bbb" />
      <TouchableOpacity
        style={[styles.saveButton, saveLink.isPending && styles.buttonDisabled]}
        onPress={() => saveLink.mutate()}
        disabled={saveLink.isPending}
      >
        {saveLink.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Link</Text>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20, paddingBottom: 48 },
  loader: { flex: 1, marginTop: 80 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  hint: { fontSize: 12, color: '#aaa', marginBottom: 10, lineHeight: 18 },
  textArea: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1a1a', minHeight: 90,
  },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1a1a',
  },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4, marginBottom: 12 },
  saveButton: { backgroundColor: '#2D5016', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
