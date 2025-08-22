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
  getMealPlans,
  setMealPlans,
} from '../services/storage';

/**
 * Screen for managing meal plans.
 *
 * A meal plan consists of a date and a set of meals (breakfast, lunch, dinner, etc.).
 * Users can add new plans with meals for each time of day and remove existing plans.
 */
export default function MealPlansScreen() {
  const [familyCode, setFamilyCodeState] = useState(null);
  const [plans, setPlansState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');

  // Load existing meal plans from storage
  useEffect(() => {
    async function load() {
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      const existing = await getMealPlans(code);
      setPlansState(existing);
      setLoading(false);
    }
    load();
  }, []);

  const persistPlans = async (updated) => {
    if (!familyCode) return;
    setPlansState(updated);
    await setMealPlans(familyCode, updated);
  };

  const addPlan = () => {
    const date = newDate.trim();
    if (!date) {
      Alert.alert('Error', 'Date is required');
      return;
    }
    const meals = [];
    if (breakfast.trim()) {
      meals.push({ id: Date.now().toString() + '-b', type: 'Breakfast', name: breakfast.trim() });
    }
    if (lunch.trim()) {
      meals.push({ id: Date.now().toString() + '-l', type: 'Lunch', name: lunch.trim() });
    }
    if (dinner.trim()) {
      meals.push({ id: Date.now().toString() + '-d', type: 'Dinner', name: dinner.trim() });
    }
    const newPlan = {
      id: Date.now().toString(),
      date,
      meals,
    };
    const updated = [...plans, newPlan];
    persistPlans(updated);
    // Reset inputs
    setNewDate('');
    setBreakfast('');
    setLunch('');
    setDinner('');
    setShowModal(false);
  };

  const deletePlan = (planId) => {
    Alert.alert('Delete Meal Plan', 'Are you sure you want to delete this meal plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = plans.filter((p) => p.id !== planId);
          persistPlans(updated);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading meal plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.planCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planDate}>{item.date}</Text>
              {item.meals && item.meals.length > 0 ? (
                <View style={{ marginTop: 4 }}>
                  {item.meals.map((meal) => (
                    <Text key={meal.id} style={styles.mealText}>
                      {meal.type}: {meal.name}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.mealText}>No meals planned.</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => deletePlan(item.id)} style={styles.deleteButton}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text>No meal plans yet. Add one!</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Text style={styles.addButtonText}>+ Add Meal Plan</Text>
      </TouchableOpacity>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>New Meal Plan</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Date (e.g. 2025-08-15)"
                value={newDate}
                onChangeText={setNewDate}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Breakfast (optional)"
                value={breakfast}
                onChangeText={setBreakfast}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Lunch (optional)"
                value={lunch}
                onChangeText={setLunch}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Dinner (optional)"
                value={dinner}
                onChangeText={setDinner}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    // reset fields
                    setNewDate('');
                    setBreakfast('');
                    setLunch('');
                    setDinner('');
                  }}
                  style={[styles.modalButton, { backgroundColor: '#d1d5db' }]}
                >
                  <Text style={{ color: '#1f2937' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addPlan} style={[styles.modalButton, { backgroundColor: '#3b82f6' }]}>
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
  planCard: {
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
  planDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  mealText: {
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