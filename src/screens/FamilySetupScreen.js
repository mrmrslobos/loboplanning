import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { setFamilyCode } from '../services/storage';

// Generate a random alphanumeric code for a family
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function FamilySetupScreen() {
  const navigation = useNavigation();
  const [codeInput, setCodeInput] = useState('');

  const handleJoinFamily = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a family code');
      return;
    }
    await setFamilyCode(trimmed);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleCreateFamily = async () => {
    const newCode = generateCode();
    await setFamilyCode(newCode);
    Alert.alert('Family Created', `Your family code is ${newCode}. Share this code with your partner to join the same family on their device.`);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to LoboHub</Text>
      <Text style={styles.subtitle}>Set up your family hub</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter family code"
        value={codeInput}
        onChangeText={setCodeInput}
        autoCapitalize="characters"
      />
      <TouchableOpacity style={styles.button} onPress={handleJoinFamily}>
        <Text style={styles.buttonText}>Join Family</Text>
      </TouchableOpacity>
      <Text style={styles.or}>OR</Text>
      <TouchableOpacity style={styles.button} onPress={handleCreateFamily}>
        <Text style={styles.buttonText}>Create New Family</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#6b7280',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  or: {
    marginVertical: 8,
    color: '#6b7280',
  },
});