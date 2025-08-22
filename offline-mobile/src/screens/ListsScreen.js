import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { getFamilyCode, getLists, setLists } from '../services/storage';

export default function ListsScreen() {
  const [familyCode, setFamilyCodeState] = useState(null);
  const [lists, setListsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getLists(code);
      setListsState(existing);
      setLoading(false);
    }
    load();
  }, []);

  const persistLists = async (updated) => {
    if (!familyCode) return;
    setListsState(updated);
    await setLists(familyCode, updated);
  };

  const addList = () => {
    const name = newListName.trim();
    if (!name) {
      Alert.alert('Error', 'List name is required');
      return;
    }
    const newList = { id: Date.now().toString(), name, items: [] };
    const updated = [...lists, newList];
    persistLists(updated);
    setNewListName('');
    setShowModal(false);
  };

  const deleteList = (listId) => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
            const updated = lists.filter(l => l.id !== listId);
            persistLists(updated);
        }}
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}><Text>Loading lists...</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listCard}>
            <Text style={styles.listName}>{item.name}</Text>
            <TouchableOpacity onPress={() => deleteList(item.id)} style={styles.deleteButton}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}><Text>No lists yet. Add one!</Text></View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>+ Add List</Text>
      </TouchableOpacity>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="List name"
              value={newListName}
              onChangeText={setNewListName}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalButton, { backgroundColor: '#d1d5db' }]}>
                <Text style={{ color: '#1f2937' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addList} style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}>
                <Text style={{ color: '#ffffff' }}>Save</Text>
              </TouchableOpacity>
            </View>
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
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
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
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
});