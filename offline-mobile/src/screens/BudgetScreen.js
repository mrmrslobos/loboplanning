import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { getFamilyCode, getBudget, setBudget } from '../services/storage';

export default function BudgetScreen() {
  const [familyCode, setFamilyCodeState] = useState(null);
  const [budget, setBudgetState] = useState({ categories: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryBudget, setCategoryBudget] = useState('');
  const [transactionCategoryId, setTransactionCategoryId] = useState(null);
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');

  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getBudget(code);
      setBudgetState(existing);
      setLoading(false);
    }
    load();
  }, []);

  const persistBudget = async (updated) => {
    if (!familyCode) return;
    setBudgetState(updated);
    await setBudget(familyCode, updated);
  };

  const addCategory = () => {
    const name = categoryName.trim();
    const budgeted = parseFloat(categoryBudget) || 0;
    if (!name) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    const newCategory = { id: Date.now().toString(), name, budgeted };
    const updated = { ...budget, categories: [...budget.categories, newCategory] };
    persistBudget(updated);
    setCategoryName('');
    setCategoryBudget('');
    setShowCategoryModal(false);
  };

  const addTransaction = () => {
    if (!transactionCategoryId) {
      Alert.alert('Error', 'Select a category');
      return;
    }
    const description = transactionDescription.trim();
    const amount = parseFloat(transactionAmount) || 0;
    const newTx = { id: Date.now().toString(), categoryId: transactionCategoryId, description, amount };
    const updated = { ...budget, transactions: [...budget.transactions, newTx] };
    persistBudget(updated);
    setTransactionCategoryId(null);
    setTransactionDescription('');
    setTransactionAmount('');
    setShowTransactionModal(false);
  };

  const getCategoryName = (categoryId) => {
    const category = budget.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading budget...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={budget.categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.titleText}>{item.name}</Text>
            <Text style={styles.secondaryText}>Budgeted: ${item.budgeted.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={() => <Text>No categories yet.</Text>}
      />
      <TouchableOpacity style={styles.addButtonSmall} onPress={() => setShowCategoryModal(true)}>
        <Text style={styles.addButtonText}>+ Add Category</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Transactions</Text>
      <FlatList
        data={budget.transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>{getCategoryName(item.categoryId)}</Text>
              <Text style={styles.secondaryText}>{item.description || 'No description'}</Text>
            </View>
            <Text style={styles.amountText}>-${item.amount.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={() => <Text>No transactions yet.</Text>}
      />
      <TouchableOpacity style={styles.addButtonSmall} onPress={() => setShowTransactionModal(true)}>
        <Text style={styles.addButtonText}>+ Add Transaction</Text>
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Category name"
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Budgeted amount (optional)"
              value={categoryBudget}
              onChangeText={setCategoryBudget}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={[styles.modalButton, { backgroundColor: '#d1d5db' }]}>
                <Text style={{ color: '#1f2937' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addCategory} style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}>
                <Text style={{ color: '#ffffff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transaction Modal */}
      <Modal visible={showTransactionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Transaction</Text>
            <Text style={{ marginBottom: 8 }}>Select Category:</Text>
            {budget.categories.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.categoryChoice, transactionCategoryId === cat.id && { backgroundColor: '#dbeafe' }]} onPress={() => setTransactionCategoryId(cat.id)}>
                <Text>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.modalInput}
              placeholder="Description (optional)"
              value={transactionDescription}
              onChangeText={setTransactionDescription}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              value={transactionAmount}
              onChangeText={setTransactionAmount}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowTransactionModal(false)} style={[styles.modalButton, { backgroundColor: '#d1d5db' }]}>
                <Text style={{ color: '#1f2937' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addTransaction} style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
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
  secondaryText: {
    fontSize: 14,
    color: '#6b7280',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  addButtonSmall: {
    marginTop: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#ffffff',
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
  categoryChoice: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
});