import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, Chip, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

const achievementsApi = {
  getProgress: () => apiClient.get('/achievements/progress'),
  getBadges: () => apiClient.get('/achievements/badges'),
};

const achievementCategories = [
  { name: 'Task Completion', color: '#3b82f6', icon: 'checkmark-circle' },
  { name: 'Collaboration', color: '#10b981', icon: 'people' },
  { name: 'Consistency', color: '#f59e0b', icon: 'flame' },
  { name: 'Milestones', color: '#8b5cf6', icon: 'trophy' },
  { name: 'Special', color: '#ec4899', icon: 'star' },
];

export default function AchievementsScreen() {
  const { data: progress } = useQuery({
    queryKey: ['achievements', 'progress'],
    queryFn: () => achievementsApi.getProgress().then(res => res.data),
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['achievements', 'badges'],
    queryFn: () => achievementsApi.getBadges().then(res => res.data),
  });

  const unlockedBadges = badges.filter((badge: any) => badge.unlocked);
  const lockedBadges = badges.filter((badge: any) => !badge.unlocked);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Achievements
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Celebrate your family's progress and milestones
            </Text>
          </Card.Content>
        </Card>

        {/* Family Level Progress */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="titleMedium" style={{ color: '#374151' }}>
                Family Level
              </Text>
              <Chip mode="outlined" style={{ backgroundColor: '#3b82f620' }}>
                Level {progress?.familyLevel || 1}
              </Chip>
            </View>
            
            <ProgressBar 
              progress={(progress?.currentPoints % 1000) / 1000 || 0} 
              color="#3b82f6" 
              style={{ marginBottom: 8 }}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                {progress?.currentPoints || 0} XP
              </Text>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                {Math.ceil(((progress?.currentPoints || 0) / 1000)) * 1000} XP
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ color: '#16a34a' }}>
                  {progress?.totalTasksCompleted || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                  Tasks Done
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ color: '#3b82f6' }}>
                  {progress?.collaborativeActivities || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                  Team Work
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text variant="titleMedium" style={{ color: '#f59e0b' }}>
                  {progress?.streakDays || 0}
                </Text>
                <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                  Day Streak
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Unlocked Achievements */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Achievements Unlocked ({unlockedBadges.length})
            </Text>
            
            {unlockedBadges.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {unlockedBadges.map((badge: any, index: number) => {
                  const category = achievementCategories.find(c => c.name === badge.category) || achievementCategories[0];
                  return (
                    <Card key={badge.id || index} style={{ width: '45%', backgroundColor: category.color + '10' }}>
                      <Card.Content style={{ alignItems: 'center', paddingVertical: 16 }}>
                        <View style={{ 
                          backgroundColor: category.color + '20', 
                          padding: 12, 
                          borderRadius: 50, 
                          marginBottom: 8 
                        }}>
                          <Ionicons 
                            name={category.icon as keyof typeof Ionicons.glyphMap} 
                            size={24} 
                            color={category.color} 
                          />
                        </View>
                        <Text variant="titleSmall" style={{ textAlign: 'center', color: '#374151', marginBottom: 4 }}>
                          {badge.title}
                        </Text>
                        <Text variant="bodySmall" style={{ textAlign: 'center', color: '#6b7280' }}>
                          {badge.description}
                        </Text>
                        <Chip compact mode="outlined" style={{ marginTop: 8, backgroundColor: category.color + '20' }}>
                          {badge.pointsAwarded} XP
                        </Chip>
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            ) : (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                Complete tasks and work together to unlock achievements!
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Available Achievements */}
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Available Achievements
            </Text>
            
            {lockedBadges.slice(0, 6).map((badge: any, index: number) => {
              const category = achievementCategories.find(c => c.name === badge.category) || achievementCategories[0];
              return (
                <View
                  key={badge.id || index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < Math.min(lockedBadges.length, 6) - 1 ? 1 : 0,
                    borderBottomColor: '#f3f4f6',
                    opacity: 0.6,
                  }}
                >
                  <View style={{ 
                    backgroundColor: '#f3f4f6', 
                    padding: 8, 
                    borderRadius: 50, 
                    marginRight: 12 
                  }}>
                    <Ionicons 
                      name={category.icon as keyof typeof Ionicons.glyphMap} 
                      size={20} 
                      color="#9ca3af" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ color: '#6b7280', marginBottom: 2 }}>
                      {badge.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#9ca3af' }}>
                      {badge.description}
                    </Text>
                  </View>
                  <Chip compact mode="outlined" style={{ opacity: 0.5 }}>
                    {badge.pointsAwarded} XP
                  </Chip>
                </View>
              );
            })}

            {lockedBadges.length === 0 && (
              <Text variant="bodyMedium" style={{ color: '#16a34a', textAlign: 'center', paddingVertical: 16 }}>
                Congratulations! You've unlocked all available achievements! 🎉
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}