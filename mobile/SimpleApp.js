import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SimpleApp() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🏠 LoboHub Mobile</Text>
          <Text style={styles.subtitle}>
            Family Hub - Mobile App
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ App is Working!</Text>
          <Text style={styles.cardText}>
            The React Native app is now running successfully. 
            The Metro bundler error has been resolved.
          </Text>
        </View>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📋</Text>
            <Text style={styles.featureTitle}>Tasks</Text>
            <Text style={styles.featureDesc}>Coming soon</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureTitle}>Budget</Text>
            <Text style={styles.featureDesc}>Coming soon</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Chat</Text>
            <Text style={styles.featureDesc}>Coming soon</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureTitle}>Calendar</Text>
            <Text style={styles.featureDesc}>Coming soon</Text>
          </View>
        </View>

        <View style={styles.status}>
          <Text style={styles.statusText}>🎉 Metro Bundle Fixed!</Text>
          <Text style={styles.statusSubtext}>
            Ready to add full LoboHub functionality
          </Text>
        </View>
      </ScrollView>
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  status: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statusText: {
    fontSize: 16,
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