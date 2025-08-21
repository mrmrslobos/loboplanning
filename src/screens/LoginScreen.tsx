import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Something went wrong'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', padding: 16 }}
      >
        <Card style={{ padding: 8 }}>
          <Card.Content>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text variant="headlineLarge" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                LoboHub
              </Text>
              <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', marginTop: 8 }}>
                Your comprehensive family hub for communication, organization, and shared experiences
              </Text>
            </View>

            {/* Form */}
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              mode="outlined"
              style={{ marginBottom: 16 }}
              autoCapitalize="none"
              disabled={isLoading}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              mode="outlined"
              secureTextEntry
              style={{ marginBottom: 24 }}
              disabled={isLoading}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={{ marginBottom: 16 }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            <Divider style={{ marginVertical: 16 }} />

            <Button
              mode="text"
              onPress={() => setIsLogin(!isLogin)}
              disabled={isLoading}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </Button>
          </Card.Content>
        </Card>

        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Text variant="bodySmall" style={{ color: '#9ca3af', textAlign: 'center' }}>
            Manage tasks, lists, budget, calendar, and more{'\n'}
            with AI-powered family assistance
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}