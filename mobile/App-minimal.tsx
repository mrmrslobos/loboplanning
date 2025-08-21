import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LoboHub Mobile</Text>
      <Text style={styles.subtitle}>Family Management App</Text>
      <Text style={styles.status}>✅ Basic React Native is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#6b7280',
  },
  status: {
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
  },
});