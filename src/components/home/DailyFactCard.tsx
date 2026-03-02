import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { getDailyFact } from '../../utils/facts';

const NORMANS_CONQUEST_URL = 'https://www.amazon.co.uk/Normans-Conquest-invasion-Englands-traditional/dp/B0G6VF3NRL';

export default function DailyFactCard() {
  const fact = getDailyFact();
  return (
    <View style={styles.card}>
      <Text style={styles.header}>💡 Did you know?</Text>
      <Text style={styles.fact}>{fact}</Text>
      <TouchableOpacity onPress={() => Linking.openURL(NORMANS_CONQUEST_URL)} style={styles.linkWrap}>
        <Text style={styles.linkText}>Learn more from <Text style={styles.linkBold}>Norman's Conquest</Text></Text>
      </TouchableOpacity>
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
  linkWrap: { marginTop: 12 },
  linkText: { fontSize: 13, color: '#2D5016' },
  linkBold: { fontWeight: '700' },
});
