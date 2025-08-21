import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <View style={styles.container}>
          <Text style={styles.title}>LoboHub Mobile</Text>
          <Text style={styles.subtitle}>Family Hub App</Text>
          <Text style={styles.description}>
            Self-contained family management app with offline functionality
          </Text>
          <StatusBar style="auto" />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#6b7280',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9ca3af',
    lineHeight: 24,
  },
});