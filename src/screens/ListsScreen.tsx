import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
  Checkbox,
  Chip,
  Button,
  Portal,
  Modal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi } from '../services/api';

const shoppingCategories = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Pantry & Canned Goods',
  'Frozen Foods',
  'Beverages',
  'Other',
];

export default function ListsScreen() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const queryClient = useQueryClient();

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: () => listsApi.getAll().then(res => res.data),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['lists', selectedListId, 'items'],
    queryFn: () =>
      selectedListId ? listsApi.getItems(selectedListId).then(res => res.data) : [],
    enabled: !!selectedListId,
  });

  const addItemMutation = useMutation({
    mutationFn: ({ listId, item }: { listId: string; item: any }) =>
      listsApi.addItem(listId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', selectedListId, 'items'] });
      setShowAddItemModal(false);
      setNewItemTitle('');
      setNewItemQuantity('');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ listId, itemId, updates }: { listId: string; itemId: string; updates: any }) =>
      listsApi.updateItem(listId, itemId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists', selectedListId, 'items'] });
    },
  });

  const shoppingLists = lists.filter((list: any) => list.template === 'shopping');
  const selectedList = lists.find((list: any) => list.id === selectedListId);

  const toggleItemCompleted = (item: any) => {
    if (!selectedListId) return;
    updateItemMutation.mutate({
      listId: selectedListId,
      itemId: item.id,
      updates: { completed: !item.completed },
    });
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim() || !selectedListId) return;

    // Auto-categorize based on item name
    const itemTitle = newItemTitle.toLowerCase();
    let category = 'Other';
    
    if (['milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg'].some(item => itemTitle.includes(item))) {
      category = 'Dairy & Eggs';
    } else if (['bread', 'pasta', 'rice', 'cereal', 'flour', 'sauce', 'pesto'].some(item => itemTitle.includes(item))) {
      category = 'Pantry & Canned Goods';
    } else if (['apple', 'banana', 'orange', 'berry', 'grape', 'lemon', 'carrot', 'potato', 'onion', 'tomato', 'lettuce', 'spinach'].some(item => itemTitle.includes(item))) {
      category = 'Produce';
    } else if (['chicken', 'beef', 'pork', 'fish', 'meat'].some(item => itemTitle.includes(item))) {
      category = 'Meat & Seafood';
    }

    addItemMutation.mutate({
      listId: selectedListId,
      item: {
        title: newItemTitle,
        quantity: newItemQuantity || null,
        category,
        completed: false,
      },
    });
  };

  // Group items by category
  const groupedItems = items.reduce((acc: any, item: any) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const relevantCategories = shoppingCategories.filter(cat => 
    groupedItems[cat] && groupedItems[cat].length > 0
  );

  if (!selectedListId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Card style={{ marginBottom: 20 }}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
                Shopping Lists
              </Text>
              <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
                Organize your family shopping with smart categories
              </Text>
            </Card.Content>
          </Card>

          {shoppingLists.length > 0 ? (
            shoppingLists.map((list: any) => (
              <Card key={list.id} style={{ marginBottom: 12 }}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium">{list.title}</Text>
                      {list.description && (
                        <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                          {list.description}
                        </Text>
                      )}
                    </View>
                    <Button
                      mode="contained"
                      onPress={() => setSelectedListId(list.id)}
                    >
                      Open
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card>
              <Card.Content>
                <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#6b7280', paddingVertical: 20 }}>
                  No shopping lists yet. Create one using the AI Assistant!
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
                  {selectedList?.title}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
                  {items.length} items • {items.filter((item: any) => item.completed).length} completed
                </Text>
              </View>
              <Button onPress={() => setSelectedListId(null)}>
                Back
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Items by Category */}
        {relevantCategories.map(category => (
          <Card key={category} style={{ marginBottom: 16 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#3b82f6' + '30' }} />
                <Text variant="titleMedium" style={{ marginLeft: 8, color: '#3b82f6' }}>
                  {category}
                </Text>
              </View>

              {groupedItems[category].map((item: any, index: number) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderBottomWidth: index < groupedItems[category].length - 1 ? 1 : 0,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <Checkbox
                    status={item.completed ? 'checked' : 'unchecked'}
                    onPress={() => toggleItemCompleted(item)}
                  />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        textDecorationLine: item.completed ? 'line-through' : 'none',
                        color: item.completed ? '#9ca3af' : '#374151',
                      }}
                    >
                      {item.title}
                      {item.quantity && (
                        <Text style={{ color: '#6b7280', fontSize: 12 }}> • {item.quantity}</Text>
                      )}
                    </Text>
                    {item.notes && (
                      <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                        {item.notes}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        ))}

        {items.length === 0 && (
          <Card>
            <Card.Content>
              <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#6b7280', paddingVertical: 20 }}>
                No items in this list yet. Add some using the + button!
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={showAddItemModal}
          onDismiss={() => setShowAddItemModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Add Item
          </Text>

          <TextInput
            value={newItemTitle}
            onChangeText={setNewItemTitle}
            placeholder="Item name"
            mode="outlined"
            style={{ marginBottom: 16 }}
          />

          <TextInput
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
            placeholder="Quantity (optional)"
            mode="outlined"
            style={{ marginBottom: 20 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowAddItemModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleAddItem}
              loading={addItemMutation.isPending}
            >
              Add Item
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
        onPress={() => setShowAddItemModal(true)}
      />
    </SafeAreaView>
  );
}