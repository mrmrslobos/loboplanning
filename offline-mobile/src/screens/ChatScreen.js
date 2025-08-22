import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  getFamilyCode,
  getChatMessages,
  setChatMessages,
} from '../services/storage';

/**
 * Simple offline chat screen.
 *
 * Messages are stored locally in AsyncStorage. Each message contains
 * an id, sender, content and timestamp. Since this is offline only,
 * messages will not sync in real time across devices; users can
 * manually export/import data using the export functions if needed.
 */
export default function ChatScreen() {
  const [familyCode, setFamilyCodeState] = useState(null);
  const [messages, setMessagesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getChatMessages(code);
      // Sort by timestamp ascending
      existing.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessagesState(existing);
      setLoading(false);
    }
    load();
  }, []);

  const persistMessages = async (updated) => {
    if (!familyCode) return;
    setMessagesState(updated);
    await setChatMessages(familyCode, updated);
  };

  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      content,
      timestamp: new Date().toISOString(),
    };
    const updated = [...messages, newMsg];
    persistMessages(updated);
    setInput('');
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.sender === 'me'
                ? styles.messageMe
                : styles.messageOther,
            ]}
          >
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.timestampText}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No messages yet. Start chatting!</Text>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    maxWidth: '80%',
  },
  messageMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#dbeafe',
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    color: '#1f2937',
  },
  timestampText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});