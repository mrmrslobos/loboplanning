import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { tasksApi, budgetApi, listsApi } from '../services/api';

export default function DashboardScreen() {
  const navigation = useNavigation();

  // Fetch dashboard data
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll().then(res => res.data),
  });

  const { data: budgetTransactions } = useQuery({
    queryKey: ['budget', 'transactions'],
    queryFn: () => budgetApi.getTransactions().then(res => res.data),
  });

  const { data: lists } = useQuery({
    queryKey: ['lists'],
    queryFn: () => listsApi.getAll().then(res => res.data),
  });

  const pendingTasks = tasks?.filter((task: any) => task.status === 'pending') || [];
  const recentTransactions = budgetTransactions?.slice(0, 3) || [];
  const activeLists = lists?.filter((list: any) => list.template === 'shopping') || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Welcome Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineMedium" style={{ color: '#1f2937', marginBottom: 4 }}>
              Welcome to LoboHub! 👋
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Your family hub for staying organized and connected
            </Text>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Quick Actions
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button
                mode="contained-tonal"
                onPress={() => navigation.navigate('Assistant' as never)}
                icon={() => <Ionicons name="chatbubbles" size={16} />}
                style={{ marginBottom: 8 }}
              >
                AI Assistant
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => navigation.navigate('Tasks' as never)}
                icon={() => <Ionicons name="checkbox" size={16} />}
                style={{ marginBottom: 8 }}
              >
                Add Task
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => navigation.navigate('Lists' as never)}
                icon={() => <Ionicons name="list" size={16} />}
                style={{ marginBottom: 8 }}
              >
                Shopping List
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Tasks */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="titleMedium" style={{ color: '#374151' }}>
                Pending Tasks
              </Text>
              <Chip mode="outlined" compact>
                {pendingTasks.length}
              </Chip>
            </View>
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 3).map((task: any, index: number) => (
                <View key={task.id || index} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 8,
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <Ionicons name="checkbox-outline" size={16} color="#6b7280" />
                  <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1 }}>
                    {task.title}
                  </Text>
                  <Text variant="labelSmall" style={{ color: '#9ca3af' }}>
                    {task.assignedTo}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 16 }}>
                No pending tasks. Great job! 🎉
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Shopping Lists */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="titleMedium" style={{ color: '#374151' }}>
                Shopping Lists
              </Text>
              <Chip mode="outlined" compact>
                {activeLists.length}
              </Chip>
            </View>
            {activeLists.length > 0 ? (
              activeLists.slice(0, 2).map((list: any, index: number) => (
                <View key={list.id || index} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 8,
                  borderBottomWidth: index < 1 ? 1 : 0,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <Ionicons name="list" size={16} color="#6b7280" />
                  <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1 }}>
                    {list.title}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 16 }}>
                No active shopping lists
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Budget Overview */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Recent Transactions
            </Text>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction: any, index: number) => (
                <View key={transaction.id || index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  paddingVertical: 8,
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{transaction.description}</Text>
                    <Text variant="labelSmall" style={{ color: '#6b7280' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ 
                    color: transaction.amount > 0 ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold'
                  }}>
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 16 }}>
                No recent transactions
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}