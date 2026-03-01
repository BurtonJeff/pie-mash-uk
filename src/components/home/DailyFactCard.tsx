import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDailyFact } from '../../utils/facts';

export default function DailyFactCard() {
  const fact = getDailyFact();
  return (
    <View style={styles.card}>
      <Text style={styles.header}>💡 Did you know?</Text>
      <Text style={styles.fact}>{fact}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e8f0e0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  header: { fontSize: 14, fontWeight: '700', color: '#2D5016', marginBottom: 8 },
  fact: { fontSize: 14, color: '#333', lineHeight: 22 },
});
