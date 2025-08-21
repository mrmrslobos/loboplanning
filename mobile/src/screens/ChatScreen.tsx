import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Card,
  Text,
  TextInput,
  Button,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineApiClient } from '../services/offlineApi';
import { useAuth } from '../contexts/AuthContext';

export default function ChatScreen() {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['chat', 'messages'],
    queryFn: () => offlineApiClient.chat.getMessages().then(res => res.data),
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: offlineApiClient.chat.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
      setNewMessage('');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    sendMessageMutation.mutate({
      content: newMessage,
      type: 'text',
    });
  };

  const groupedMessages = messages.reduce((groups: any, message: any) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const quickMessages = [
    "👍 Sounds good!",
    "🏃‍♂️ On my way",
    "✅ Task completed",
    "❓ Need help",
    "🍽️ Dinner ready",
    "📱 Call me",
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <Card style={{ margin: 16, marginBottom: 8 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Chat
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Stay connected with real-time messaging
            </Text>
          </Card.Content>
        </Card>

        {/* Messages */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <View key={date}>
              {/* Date Header */}
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <Chip mode="outlined" compact>
                  {new Date(date).toLocaleDateString([], { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Chip>
              </View>

              {/* Messages for this date */}
              {(dayMessages as any[]).map((message, index) => {
                const isOwnMessage = message.userId === user?.id;
                return (
                  <View
                    key={message.id || index}
                    style={{
                      flexDirection: 'row',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <Card
                      style={{
                        maxWidth: '80%',
                        backgroundColor: isOwnMessage ? '#3b82f6' : '#ffffff',
                      }}
                    >
                      <Card.Content style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                        {!isOwnMessage && (
                          <Text
                            variant="labelSmall"
                            style={{
                              color: '#6b7280',
                              marginBottom: 4,
                            }}
                          >
                            {message.username}
                          </Text>
                        )}
                        <Text
                          variant="bodyMedium"
                          style={{
                            color: isOwnMessage ? 'white' : '#374151',
                          }}
                        >
                          {message.content}
                        </Text>
                        <Text
                          variant="labelSmall"
                          style={{
                            color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                            marginTop: 4,
                            textAlign: 'right',
                          }}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Card.Content>
                    </Card>
                  </View>
                );
              })}
            </View>
          ))}

          {messages.length === 0 && (
            <Card style={{ marginVertical: 20 }}>
              <Card.Content>
                <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 20 }}>
                  No messages yet. Start the conversation!
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        {/* Quick Messages */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {quickMessages.map((msg, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onPress={() => setNewMessage(msg)}
                  style={{ marginRight: 4 }}
                >
                  {msg}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Message Input */}
        <View style={{ padding: 16, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              style={{ flex: 1 }}
              mode="outlined"
              multiline
              onSubmitEditing={handleSendMessage}
            />
            <Button
              mode="contained"
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              loading={sendMessageMutation.isPending}
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