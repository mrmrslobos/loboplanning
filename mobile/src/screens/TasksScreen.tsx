import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
  Checkbox,
  Chip,
  Menu,
  Button,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../services/api';

const taskStatuses = ['pending', 'in-progress', 'on-hold', 'complete'];
const assigneeOptions = ['Me', 'Ana'];

export default function TasksScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Me');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then(res => res.data),
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowAddModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      tasksApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleTaskStatus = (task: any) => {
    const newStatus = task.status === 'complete' ? 'pending' : 'complete';
    updateTaskMutation.mutate({ id: task.id, updates: { status: newStatus } });
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate({
      title: newTaskTitle,
      description: newTaskDescription,
      assignedTo: newTaskAssignee,
      status: 'pending',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return '#16a34a';
      case 'in-progress': return '#3b82f6';
      case 'on-hold': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const groupedTasks = {
    pending: tasks.filter((task: any) => task.status === 'pending'),
    'in-progress': tasks.filter((task: any) => task.status === 'in-progress'),
    'on-hold': tasks.filter((task: any) => task.status === 'on-hold'),
    complete: tasks.filter((task: any) => task.status === 'complete'),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Tasks
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Stay organized with shared family responsibilities
            </Text>
          </Card.Content>
        </Card>

        {/* Task Groups */}
        {Object.entries(groupedTasks).map(([status, statusTasks]) => (
          <Card key={status} style={{ marginBottom: 16 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="titleMedium" style={{ color: '#374151', textTransform: 'capitalize' }}>
                  {status.replace('-', ' ')}
                </Text>
                <Chip mode="outlined" compact style={{ backgroundColor: getStatusColor(status) + '20' }}>
                  {statusTasks.length}
                </Chip>
              </View>

              {statusTasks.length > 0 ? (
                statusTasks.map((task: any, index: number) => (
                  <View
                    key={task.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: index < statusTasks.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                    }}
                  >
                    <Checkbox
                      status={task.status === 'complete' ? 'checked' : 'unchecked'}
                      onPress={() => toggleTaskStatus(task)}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text
                        variant="bodyMedium"
                        style={{
                          textDecorationLine: task.status === 'complete' ? 'line-through' : 'none',
                          color: task.status === 'complete' ? '#9ca3af' : '#374151',
                        }}
                      >
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text variant="bodySmall" style={{ color: '#6b7280', marginTop: 2 }}>
                          {task.description}
                        </Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Chip compact mode="outlined" style={{ marginRight: 8 }}>
                          {task.assignedTo}
                        </Chip>
                        {task.dueDate && (
                          <Text variant="labelSmall" style={{ color: '#6b7280' }}>
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                  No {status.replace('-', ' ')} tasks
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Add Task Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Add New Task
          </Text>

          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Task title"
            mode="outlined"
            style={{ marginBottom: 16 }}
          />

          <TextInput
            value={newTaskDescription}
            onChangeText={setNewTaskDescription}
            placeholder="Description (optional)"
            mode="outlined"
            multiline
            style={{ marginBottom: 16 }}
          />

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {assigneeOptions.map((assignee) => (
              <Chip
                key={assignee}
                selected={newTaskAssignee === assignee}
                onPress={() => setNewTaskAssignee(assignee)}
              >
                {assignee}
              </Chip>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleCreateTask}
              loading={createTaskMutation.isPending}
            >
              Add Task
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
        onPress={() => setShowAddModal(true)}
      />
    </SafeAreaView>
  );
}