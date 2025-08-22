import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFamilyCode, getTasks, setTasks } from '../services/storage';

export default function TasksScreen() {
  const navigation = useNavigation();
  const [familyCode, setFamilyCodeState] = useState(null);
  const [tasks, setTasksState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getTasks(code);
      setTasksState(existing);
      setLoading(false);
    }
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const persistTasks = async (updated) => {
    if (!familyCode) return;
    setTasksState(updated);
    await setTasks(familyCode, updated);
  };

  const addTask = () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: 'pending'
    };
    const updated = [...tasks, newTask];
    persistTasks(updated);
    setNewTitle('');
    setNewDescription('');
    setShowModal(false);
  };

  const toggleStatus = (task) => {
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'complete' ? 'pending' : 'complete' } : t);
    persistTasks(updated);
  };

  const deleteTask = (task) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
            const updated = tasks.filter(t => t.id !== task.id);
            persistTasks(updated);
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}><Text>Loading tasks...</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => toggleStatus(item)} style={styles.statusButton}>
              <Text style={styles.statusButtonText}>{item.status === 'complete' ? '✅' : '⬜️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item)} style={styles.deleteButton}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No tasks yet. Add one!</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>+ Add Task</Text>
      </TouchableOpacity>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Description (optional)"
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalButton, { backgroundColor: '#d1d5db' }] }>
                <Text style={{ color: '#1f2937' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addTask} style={[styles.modalButton, { backgroundColor: '#3b82f6' }] }>
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
  taskCard: {
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  taskDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusButtonText: {
    fontSize: 20,
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