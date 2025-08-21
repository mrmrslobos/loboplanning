import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  AppRegistry
} from 'react-native';

// Minimal app to test if basic React Native works
function MinimalApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 LoboHub Mobile</Text>
      <Text style={styles.subtitle}>React Native app is working!</Text>
      <Text style={styles.status}>✅ Connected to server</Text>
      <Text style={styles.info}>Backend: 192.168.1.169:5000</Text>
    </View>
  );
}

// Register the component
AppRegistry.registerComponent('main', () => MinimalApp);

export default MinimalApp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#3b82f6',
    marginBottom: 24,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: '#059669',
    marginBottom: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});