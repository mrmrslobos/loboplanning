import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏠 LoboHub Mobile</Text>
        <Text style={styles.subtitle}>Family Management App</Text>
        
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>✅ Self-Contained</Text>
          <Text style={styles.featureText}>Works 100% offline with local storage</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>✅ Family Sharing</Text>
          <Text style={styles.featureText}>Share data via invite codes and file export</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>✅ Complete Features</Text>
          <Text style={styles.featureText}>Tasks, Budget, Calendar, AI Assistant & more</Text>
        </View>
        
        <View style={styles.feature}>
          <Text style={styles.featureTitle}>✅ App Store Ready</Text>
          <Text style={styles.featureText}>No backend servers required</Text>
        </View>
        
        <View style={styles.status}>
          <Text style={styles.statusText}>🎉 Mobile app is working!</Text>
          <Text style={styles.statusSubtext}>Ready for full feature activation</Text>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#6b7280',
  },
  feature: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  status: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0f172a',
  },
  statusSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
  },
});