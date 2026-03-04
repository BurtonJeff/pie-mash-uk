import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { JourneyStackParamList } from '../../navigation/JourneyNavigator';
import { fetchLegalContent } from '../../lib/content';

type Props = NativeStackScreenProps<JourneyStackParamList, 'LegalContent'>;

export default function LegalScreen({ route }: Props) {
  const { type } = route.params;

  const { data: content, isLoading } = useQuery({
    queryKey: ['legalContent', type],
    queryFn: () => fetchLegalContent(type),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2D5016" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.body}>{content ?? ''}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0ede8' },
  content: { padding: 20 },
  body: { fontSize: 14, color: '#444', lineHeight: 22 },
});
