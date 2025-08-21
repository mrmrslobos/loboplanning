import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PaperProvider, Button, Card, Title, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="auto" />
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="family-restroom" size={48} color="#1f2937" />
              <Text style={styles.title}>LoboHub Mobile</Text>
              <Text style={styles.subtitle}>Family Management App</Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresContainer}>
              <Card style={styles.card}>
                <Card.Content>
                  <Title>✓ Complete Self-Contained App</Title>
                  <Paragraph>Works 100% offline with local data storage</Paragraph>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Title>✓ Family Sharing</Title>
                  <Paragraph>Share data via invite codes and export/import files</Paragraph>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Title>✓ Full Feature Set</Title>
                  <Paragraph>Tasks, Lists, Budget, Calendar, Chat, AI Assistant, and more</Paragraph>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Title>✓ App Store Ready</Title>
                  <Paragraph>No backend servers required - completely independent</Paragraph>
                </Card.Content>
              </Card>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                style={styles.button}
                onPress={() => console.log('Get Started pressed')}
              >
                Get Started
              </Button>
              
              <Button 
                mode="outlined" 
                style={styles.button}
                onPress={() => console.log('Learn More pressed')}
              >
                Learn More
              </Button>
            </View>

            {/* Status */}
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                🎉 Mobile app is working! This proves Expo and React Native are properly configured.
              </Text>
              <Text style={styles.statusSubtext}>
                Next step: Enable full featured app with all screens and AI integration
              </Text>
            </View>

          </ScrollView>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 30,
  },
  card: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    marginBottom: 10,
  },
  statusContainer: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});