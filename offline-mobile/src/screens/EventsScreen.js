import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { getFamilyCode, getEvents, setEvents } from '../services/storage';

export default function EventsScreen() {
  const [familyCode, setFamilyCodeState] = useState(null);
  const [events, setEventsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getEvents(code);
      setEventsState(existing);
      setLoading(false);
    }
    load();
  }, []);

  const persistEvents = async (updated) => {
    if (!familyCode) return;
    setEventsState(updated);
    await setEvents(familyCode, updated);
  };

  const addEvent = () => {
    const title = newTitle.trim();
    const date = newDate.trim();
    if (!title) {
      Alert.alert('Error', 'Event title is required');
      return;
    }
    const newEvent = { id: Date.now().toString(), title, date: date || null };
    const updated = [...events, newEvent];
    persistEvents(updated);
    setNewTitle('');
    setNewDate('');
    setShowModal(false);
  };

  const deleteEvent = (eventId) => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          const updated = events.filter(e => e.id !== eventId);
          persistEvents(updated);
      }}
    ]);
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading events...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>{item.title}</Text>
              {item.date ? <Text style={styles.dateText}>{item.date}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => deleteEvent(item.id)} style={styles.deleteButton}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => <View style={styles.center}><Text>No events yet.</Text></View>}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>+ Add Event</Text>
      </TouchableOpacity>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Event</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Event title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Date (optional)"
              value={newDate}
              onChangeText={setNewDate}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalButton, { backgroundColor: '#d1d5db' }]}>
                <Text style={{ color: '#1f2937' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addEvent} style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}>
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
  card: {
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
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
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