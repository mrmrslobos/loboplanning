import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Modal, 
  TextInput, 
  Alert 
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function RealTasksScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Me');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.getTasks(),
    enabled: !!user,
  });

  const createTaskMutation = useMutation({
    mutationFn: (task) => apiClient.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowAddModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      Alert.alert('Success', 'Task created successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', `Failed to create task: ${error.message}`);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }) => apiClient.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      Alert.alert('Error', `Failed to update task: ${error.message}`);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => apiClient.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      Alert.alert('Error', `Failed to delete task: ${error.message}`);
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    createTaskMutation.mutate({
      title: newTaskTitle,
      description: newTaskDescription,
      assignedTo: newTaskAssignee,
      priority: newTaskPriority,
      status: 'pending',
    });
  };

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'complete' ? 'pending' : 'complete';
    updateTaskMutation.mutate({ 
      id: task.id, 
      updates: { status: newStatus } 
    });
  };

  const deleteTask = (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTaskMutation.mutate(taskId) },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return '#16a34a';
      case 'in-progress': return '#3b82f6';
      case 'on-hold': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const groupedTasks = {
    pending: tasks.filter(task => task.status === 'pending'),
    'in-progress': tasks.filter(task => task.status === 'in-progress'),
    'on-hold': tasks.filter(task => task.status === 'on-hold'),
    complete: tasks.filter(task => task.status === 'complete'),
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Family Tasks</Text>
          <Text style={styles.subtitle}>
            Manage and track family to-dos together
          </Text>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{groupedTasks.pending.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{groupedTasks['in-progress'].length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{groupedTasks.complete.length}</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>

        {/* Task Groups */}
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <View key={status} style={styles.taskGroup}>
            <Text style={styles.groupTitle}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')} ({statusTasks.length})
            </Text>
            
            {statusTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No {status} tasks</Text>
              </View>
            ) : (
              statusTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <TouchableOpacity 
                    style={styles.taskContent}
                    onPress={() => toggleTaskStatus(task)}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.taskInfo}>
                        <Text style={[
                          styles.taskTitle,
                          task.status === 'complete' && styles.completedTask
                        ]}>
                          {task.title}
                        </Text>
                        <Text style={styles.taskAssignee}>
                          Assigned to: {task.assignedTo}
                        </Text>
                      </View>
                      
                      <View style={styles.taskMeta}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(task.status) }
                        ]}>
                          <Text style={styles.statusText}>
                            {task.status === 'in-progress' ? 'In Progress' : 
                             task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Text>
                        </View>
                        
                        {task.priority && (
                          <View style={[
                            styles.priorityBadge,
                            { backgroundColor: getPriorityColor(task.priority) }
                          ]}>
                            <Text style={styles.priorityText}>
                              {task.priority.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {task.description && (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    )}

                    {task.dueDate && (
                      <Text style={styles.dueDate}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteTask(task.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      {/* Add Task Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TouchableOpacity 
              onPress={handleCreateTask}
              disabled={createTaskMutation.isPending}
            >
              <Text style={[
                styles.saveButton,
                createTaskMutation.isPending && styles.disabledButton
              ]}>
                {createTaskMutation.isPending ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Task Title</Text>
            <TextInput
              style={styles.textInput}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Enter task title"
              autoFocus
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              placeholder="Enter task description"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Assigned To</Text>
            <View style={styles.assigneeContainer}>
              {['Me', 'Family'].map((assignee) => (
                <TouchableOpacity
                  key={assignee}
                  style={[
                    styles.assigneeOption,
                    newTaskAssignee === assignee && styles.selectedAssignee
                  ]}
                  onPress={() => setNewTaskAssignee(assignee)}
                >
                  <Text style={[
                    styles.assigneeText,
                    newTaskAssignee === assignee && styles.selectedAssigneeText
                  ]}>
                    {assignee}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    newTaskPriority === priority && styles.selectedPriority,
                    { borderColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => setNewTaskPriority(priority)}
                >
                  <Text style={[
                    styles.priorityText,
                    newTaskPriority === priority && { color: getPriorityColor(priority) }
                  ]}>
                    {priority.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskAssignee: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskMeta: {
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButton: {
    color: '#6b7280',
    fontSize: 16,
  },
  saveButton: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    color: '#9ca3af',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  assigneeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  assigneeOption: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectedAssignee: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  assigneeText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedAssigneeText: {
    color: 'white',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectedPriority: {
    backgroundColor: '#f3f4f6',
  },
};