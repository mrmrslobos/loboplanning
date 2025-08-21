import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { assistantApi } from '../services/api';

export default function AssistantScreen() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const quickSuggestions = [
    "What tasks should I focus on today?",
    "Help me plan dinner for this week",
    "Add groceries to my shopping list",
    "Schedule family time this weekend",
    "How are we doing with our budget?",
    "Generate a devotional for our family"
  ];

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const result = await assistantApi.sendMessage(message);
      setResponse(result.data.response);
      
      // Optional: Speak the response
      if (result.data.response) {
        Speech.speak(result.data.response.substring(0, 200), {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
        });
      }
    } catch (error) {
      console.error('Assistant error:', error);
      setResponse("Sorry, I'm having trouble connecting right now. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  const startVoiceRecording = () => {
    Alert.alert(
      'Voice Input',
      'Voice recognition not yet implemented in this demo. Please type your message.',
      [{ text: 'OK' }]
    );
    // TODO: Implement speech-to-text
    // For now, showing alert. In full implementation:
    // 1. Use expo-speech or react-native-voice
    // 2. Request microphone permissions
    // 3. Convert speech to text
    // 4. Set the text to message state
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Header */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
              <Text variant="headlineSmall" style={{ marginLeft: 8, color: '#3b82f6' }}>
                AI Family Assistant
              </Text>
            </Card.Content>
          </Card>

          {/* Quick Suggestions */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="bulb" size={16} color="#eab308" />
                <Text variant="labelMedium" style={{ marginLeft: 8 }}>
                  Quick Suggestions:
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {quickSuggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    mode="outlined"
                    onPress={() => setMessage(suggestion)}
                    style={{ marginBottom: 4 }}
                    compact
                  >
                    {suggestion}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Response */}
          {response ? (
            <Card style={{ marginBottom: 16, backgroundColor: '#f1f5f9' }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="chatbubbles" size={16} color="#3b82f6" style={{ marginTop: 2 }} />
                  <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1 }}>
                    {response}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ) : null}

          {/* Loading */}
          {isLoading && (
            <Card style={{ marginBottom: 16 }}>
              <Card.Content style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                  Thinking...
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ padding: 16, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={isListening ? "Listening..." : "Ask me anything about managing your family..."}
              style={{ flex: 1 }}
              mode="outlined"
              disabled={isLoading}
              multiline
              onSubmitEditing={handleSend}
            />
            <Button
              mode="outlined"
              onPress={startVoiceRecording}
              disabled={isLoading}
              style={{ minWidth: 48 }}
            >
              <Ionicons name="mic" size={20} />
            </Button>
            <Button
              mode="contained"
              onPress={handleSend}
              disabled={!message.trim() || isLoading}
              style={{ minWidth: 48 }}
            >
              <Ionicons name="send" size={16} color="white" />
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}