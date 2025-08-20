import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '../services/api';

export default function BudgetScreen() {
  const { data: categories = [] } = useQuery({
    queryKey: ['budget', 'categories'],
    queryFn: () => budgetApi.getCategories().then(res => res.data),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['budget', 'transactions'],
    queryFn: () => budgetApi.getTransactions().then(res => res.data),
  });

  const totalExpenses = transactions
    .filter((t: any) => t.amount < 0)
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  const totalIncome = transactions
    .filter((t: any) => t.amount > 0)
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const recentTransactions = transactions.slice(0, 10);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Budget
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Track your family's financial health
            </Text>
          </Card.Content>
        </Card>

        {/* Summary Cards */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <Card style={{ flex: 1 }}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#16a34a' }}>
                Income
              </Text>
              <Text variant="headlineSmall" style={{ color: '#16a34a' }}>
                ${totalIncome.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={{ flex: 1 }}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: '#dc2626' }}>
                Expenses
              </Text>
              <Text variant="headlineSmall" style={{ color: '#dc2626' }}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Net Balance */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: '#374151' }}>
              Net Balance
            </Text>
            <Text
              variant="headlineMedium"
              style={{
                color: totalIncome - totalExpenses >= 0 ? '#16a34a' : '#dc2626',
                fontWeight: 'bold',
              }}
            >
              ${(totalIncome - totalExpenses).toFixed(2)}
            </Text>
          </Card.Content>
        </Card>

        {/* Categories */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Budget Categories
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((category: any) => (
                <Chip key={category.id} mode="outlined">
                  {category.name}
                </Chip>
              ))}
            </View>
            {categories.length === 0 && (
              <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 16 }}>
                No categories set up yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Recent Transactions
            </Text>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction: any, index: number) => (
                <View
                  key={transaction.id || index}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < recentTransactions.length - 1 ? 1 : 0,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: '#374151' }}>
                      {transaction.description}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    variant="bodyLarge"
                    style={{
                      color: transaction.amount >= 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 'bold',
                    }}
                  >
                    {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 20 }}>
                No transactions yet
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}