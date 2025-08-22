import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import {
  getFamilyCode,
  getDevotionals,
  setDevotionals,
} from '../services/storage';

/**
 * Screen for storing devotional entries.
 *
 * Each devotional entry contains a title, optional scripture reference or note,
 * a detailed body text and a timestamp. Users can add and remove entries.
 */
export default function DevotionalScreen() {
  const [familyCode, setFamilyCodeState] = useState(null);
  const [entries, setEntriesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [scripture, setScripture] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getDevotionals(code);
      // sort by createdAt descending
      existing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEntriesState(existing);
      setLoading(false);
    }
    load();
  }, []);

  const persistEntries = async (updated) => {
    if (!familyCode) return;
    setEntriesState(updated);
    await setDevotionals(familyCode, updated);
  };

  const addEntry = () => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      title: t,
      scripture: scripture.trim() || null,
      body: b,
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    persistEntries(updated);
    // Reset inputs
    setTitle('');
    setScripture('');
    setBody('');
    setShowModal(false);
  };

  const deleteEntry = (entryId) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this devotional entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = entries.filter((e) => e.id !== entryId);
          persistEntries(updated);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading devotionals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryTitle}>{item.title}</Text>
              {item.scripture ? (
                <Text style={styles.scriptureText}>{item.scripture}</Text>
              ) : null}
              <Text style={styles.bodyPreview} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteEntry(item.id)} style={styles.deleteButton}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No devotional entries yet.</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>+ Add Devotional</Text>
      </TouchableOpacity>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>New Devotional</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Scripture (optional)"
                value={scripture}
                onChangeText={setScripture}
              />
              <TextInput
                style={[styles.modalInput, { height: 120 }]}
                placeholder="Body"
                value={body}
                onChangeText={setBody}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setTitle('');
                    setScripture('');
                    setBody('');
                  }}
                  style={[styles.modalButton, { backgroundColor: '#d1d5db' }]}
                >
                  <Text style={{ color: '#1f2937' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addEntry} style={[styles.modalButton, { backgroundColor: '#3b82f6' }] }>
                  <Text style={{ color: '#ffffff' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  scriptureText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6b7280',
    marginBottom: 4,
  },
  bodyPreview: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 8,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
});