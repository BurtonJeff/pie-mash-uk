import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminStackParamList } from '../../navigation/AdminNavigator';
import { fetchAllSocialLinks, upsertSocialLink, SocialLink } from '../../lib/content';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminSocialLinks'>;

export default function AdminSocialLinksScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['adminSocialLinks'],
    queryFn: () => fetchAllSocialLinks(),
  });

  const toggleActive = useMutation({
    mutationFn: (link: SocialLink) =>
      upsertSocialLink({ ...link, is_active: !link.is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminSocialLinks'] });
      qc.invalidateQueries({ queryKey: ['socialLinks'] });
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('AdminSocialLinkForm', {})} style={{ marginRight: 4 }}>
          <Ionicons name="add" size={26} color="#2D5016" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <FlatList
      data={links}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardBody}
            onPress={() => navigation.navigate('AdminSocialLinkForm', { linkId: item.id })}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconPreview, { backgroundColor: item.icon_color }]}>
                <Ionicons name={item.icon_name as any} size={18} color="#fff" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Switch
            value={item.is_active}
            onValueChange={() => toggleActive.mutate(item)}
            trackColor={{ false: '#ddd', true: '#2D5016' }}
            thumbColor="#fff"
          />
        </View>
      )}
      ListEmptyComponent={
        isLoading
          ? <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
          : <Text style={styles.empty}>No social links yet. Tap + to add one.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconPreview: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  url: { fontSize: 12, color: '#aaa', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
});
