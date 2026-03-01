import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CheckInScreen() {
  return (
    <View style={styles.container}>
      <Text>Check In</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
