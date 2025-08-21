import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Portal,
  Modal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineApiClient } from '../services/offlineApi';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealPlanningScreen() {
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPreferences, setAiPreferences] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(getWeekDates());
  const queryClient = useQueryClient();

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['meal-planning', 'plans'],
    queryFn: () => offlineApiClient.mealPlanning.getMealPlans().then(res => res.data),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['meal-planning', 'recipes'],
    queryFn: () => offlineApiClient.mealPlanning.getRecipes().then(res => res.data),
  });

  const generateAIPlanMutation = useMutation({
    mutationFn: (preferences: any) => offlineApiClient.mealPlanning.generateAIPlan(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-planning'] });
      setShowAIModal(false);
      setAiPreferences('');
      Alert.alert('Success', 'AI meal plan generated successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate meal plan');
    },
  });

  function getWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  }

  const handleGenerateAIPlan = () => {
    generateAIPlanMutation.mutate({
      preferences: aiPreferences,
      weekStart: selectedWeek[0].toISOString(),
      familySize: 4, // Could be dynamic
    });
  };

  const currentWeekPlans = mealPlans.filter((plan: any) => {
    const planDate = new Date(plan.date);
    return selectedWeek.some(date => 
      date.toDateString() === planDate.toDateString()
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Meal Planning
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Plan delicious and nutritious family meals
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button
                mode="contained"
                onPress={() => setShowAIModal(true)}
                icon={() => <Ionicons name="sparkles" size={16} color="white" />}
              >
                AI Meal Plan
              </Button>
              <Button mode="outlined">
                Shopping List
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Week View */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 16, color: '#374151' }}>
              This Week's Meals
            </Text>

            {daysOfWeek.map((day, dayIndex) => {
              const date = selectedWeek[dayIndex];
              const dayPlans = currentWeekPlans.filter((plan: any) => 
                new Date(plan.date).toDateString() === date.toDateString()
              );

              return (
                <View key={day} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text variant="titleSmall" style={{ color: '#374151' }}>
                      {day}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#6b7280', marginLeft: 8 }}>
                      {date.toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={{ paddingLeft: 16 }}>
                    {mealTypes.map(mealType => {
                      const meal = dayPlans.find((plan: any) => plan.mealType === mealType);
                      return (
                        <View
                          key={`${day}-${mealType}`}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 4,
                          }}
                        >
                          <Text variant="bodySmall" style={{ color: '#6b7280', minWidth: 80 }}>
                            {mealType}:
                          </Text>
                          {meal ? (
                            <Text variant="bodySmall" style={{ flex: 1, marginLeft: 8 }}>
                              {meal.title}
                            </Text>
                          ) : (
                            <Text variant="bodySmall" style={{ flex: 1, marginLeft: 8, color: '#9ca3af' }}>
                              Not planned
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {currentWeekPlans.length === 0 && (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 20 }}>
                No meals planned for this week. Use AI to generate a meal plan!
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Recipe Collection */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Recipe Collection
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {recipes.slice(0, 6).map((recipe: any, index: number) => (
                <Chip key={recipe.id || index} mode="outlined">
                  {recipe.title}
                </Chip>
              ))}
            </View>
            {recipes.length === 0 && (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                No recipes in your collection yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Nutritional Insights */}
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Nutritional Goals
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>Weekly Vegetables:</Text>
              <Text variant="bodySmall" style={{ color: '#16a34a' }}>15/21 servings</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>Protein Variety:</Text>
              <Text variant="bodySmall" style={{ color: '#3b82f6' }}>4/7 sources</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>Home Cooked:</Text>
              <Text variant="bodySmall" style={{ color: '#16a34a' }}>5/7 days</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* AI Meal Planning Modal */}
      <Portal>
        <Modal
          visible={showAIModal}
          onDismiss={() => setShowAIModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            AI Meal Planning
          </Text>

          <Text variant="bodyMedium" style={{ marginBottom: 12, color: '#6b7280' }}>
            Tell me about your family's preferences, dietary restrictions, or goals:
          </Text>

          <TextInput
            value={aiPreferences}
            onChangeText={setAiPreferences}
            placeholder="e.g., vegetarian options, quick weeknight meals, budget-friendly, kids love pasta..."
            mode="outlined"
            multiline
            numberOfLines={4}
            style={{ marginBottom: 20 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowAIModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleGenerateAIPlan}
              loading={generateAIPlanMutation.isPending}
              disabled={!aiPreferences.trim()}
            >
              Generate Plan
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}