import React, { useLayoutEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SocialIcon from '../../components/common/SocialIcon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAllSocialLinks, upsertSocialLink, deleteSocialLink } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminSocialLinkForm'>;

export default function AdminSocialLinkFormScreen({ route, navigation }: Props) {
  const { linkId } = route.params;
  const qc = useQueryClient();
  const isNew = !linkId;

  const { data: links = [] } = useQuery({
    queryKey: ['adminSocialLinks'],
    queryFn: () => fetchAllSocialLinks(),
    enabled: !isNew,
  });

  const existing = links.find((l) => l.id === linkId);

  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [iconName, setIconName] = useState('globe-outline');
  const [iconColor, setIconColor] = useState('#2D5016');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [initialised, setInitialised] = useState(false);

  if (existing && !initialised) {
    setLabel(existing.label);
    setUrl(existing.url);
    setIconName(existing.icon_name);
    setIconColor(existing.icon_color);
    setSortOrder(String(existing.sort_order));
    setIsActive(existing.is_active);
    setInitialised(true);
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['adminSocialLinks'] });
    qc.invalidateQueries({ queryKey: ['socialLinks'] });
  };

  const save = useMutation({
    mutationFn: () => upsertSocialLink({
      ...(linkId ? { id: linkId } : {}),
      label: label.trim(),
      url: url.trim(),
      icon_name: iconName.trim() || 'globe-outline',
      icon_color: iconColor.trim() || '#2D5016',
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: isActive,
    } as any),
    onSuccess: () => { invalidate(); navigation.goBack(); },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteSocialLink(linkId!),
    onSuccess: () => { invalidate(); navigation.goBack(); },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: isNew ? 'New Social Link' : 'Edit Social Link' });
  }, [navigation, isNew]);

  function confirmDelete() {
    Alert.alert('Delete Link', 'Are you sure you want to delete this link?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
    ]);
  }

  const busy = save.isPending || remove.isPending;
  const canSave = label.trim().length > 0 && url.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Label</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Facebook Group"
        />

        <Text style={styles.label}>URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://…"
          keyboardType="url"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Icon Name</Text>
        <TextInput
          style={styles.input}
          value={iconName}
          onChangeText={setIconName}
          placeholder="e.g. logo-facebook, logo-instagram, globe-outline"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>Ionicons: logo-facebook, logo-instagram, logo-twitter, logo-youtube, globe-outline{'\n'}MaterialCommunityIcons: prefix with "mci:" e.g. mci:wikipedia</Text>

        <Text style={styles.label}>Icon Colour (hex)</Text>
        <View style={styles.colorRow}>
          <TextInput
            style={[styles.input, styles.colorInput]}
            value={iconColor}
            onChangeText={setIconColor}
            placeholder="#2D5016"
            autoCapitalize="none"
          />
          <View style={[styles.colorSwatch, { backgroundColor: iconColor }]}>
            <SocialIcon name={iconName} size={20} color="#fff" />
          </View>
        </View>

        <Text style={styles.label}>Sort Order</Text>
        <TextInput
          style={styles.input}
          value={sortOrder}
          onChangeText={setSortOrder}
          keyboardType="number-pad"
          placeholder="0"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Active</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#ddd', true: '#2D5016' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!canSave || busy) && styles.buttonDisabled]}
          onPress={() => save.mutate()}
          disabled={!canSave || busy}
        >
          {save.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>{isNew ? 'Add Link' : 'Save Changes'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.discardButton} onPress={() => navigation.goBack()} disabled={busy}>
          <Text style={styles.discardButtonText}>Discard</Text>
        </TouchableOpacity>

        {!isNew && (
          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={busy}>
            <Text style={styles.deleteButtonText}>Delete Link</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 16 },
  hint: { fontSize: 12, color: '#aaa', marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, flex: 1,
  },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorInput: { flex: 1 },
  colorSwatch: {
    width: 46, height: 46, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  saveButton: {
    backgroundColor: '#2D5016', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28,
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  discardButton: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  discardButtonText: { color: '#666', fontSize: 15, fontWeight: '500' },
  deleteButton: {
    borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#fff',
  },
  deleteButtonText: { color: '#c0392b', fontSize: 15, fontWeight: '500' },
});
