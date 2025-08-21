import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LoboHub Mobile</Text>
      <Text style={styles.subtitle}>Family Management App</Text>
      <Text style={styles.success}>✅ Mobile app is working!</Text>
      <Text style={styles.description}>
        Self-contained family hub with offline functionality
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#6b7280',
    textAlign: 'center',
  },
  success: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#9ca3af',
    lineHeight: 20,
  },
});