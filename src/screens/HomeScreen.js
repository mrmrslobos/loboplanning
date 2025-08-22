import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>LoboHub</Text>
      <Text style={styles.subtitle}>Family Command Center</Text>
      <View style={styles.menu}>
        <MenuButton label="Tasks" onPress={() => navigation.navigate('Tasks')} />
        <MenuButton label="Lists" onPress={() => navigation.navigate('Lists')} />
        <MenuButton label="Events" onPress={() => navigation.navigate('Events')} />
        <MenuButton label="Budget" onPress={() => navigation.navigate('Budget')} />
        <MenuButton label="Meal Plans" onPress={() => navigation.navigate('MealPlans')} />
        <MenuButton label="Chat" onPress={() => navigation.navigate('Chat')} />
        <MenuButton label="Devotional" onPress={() => navigation.navigate('Devotional')} />
      </View>
    </ScrollView>
  );
}

function MenuButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    color: '#6b7280',
  },
  menu: {
    width: '80%',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});