import React from 'react';
import { ScrollView } from 'react-native';
import { Card, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MoreHomeScreen() {
  const navigation = useNavigation();

  const menuItems = [
    {
      title: 'Budget',
      description: 'Track family finances and expenses',
      icon: 'card',
      screen: 'Budget',
    },
    {
      title: 'Calendar',
      description: 'Family events and scheduling',
      icon: 'calendar',
      screen: 'Calendar',
    },
    {
      title: 'Chat',
      description: 'Real-time family messaging',
      icon: 'chatbubbles',
      screen: 'Chat',
    },
    {
      title: 'Meal Planning',
      description: 'Plan and organize family meals',
      icon: 'restaurant',
      screen: 'MealPlanning',
    },
    {
      title: 'Events',
      description: 'Special occasions and celebrations',
      icon: 'gift',
      screen: 'Events',
    },
    {
      title: 'Devotional',
      description: 'Daily spiritual growth and reflection',
      icon: 'book',
      screen: 'Devotional',
    },
    {
      title: 'Achievements',
      description: 'Family progress and milestones',
      icon: 'trophy',
      screen: 'Achievements',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <List.Section>
              <List.Subheader>More Features</List.Subheader>
              {menuItems.map((item, index) => (
                <List.Item
                  key={index}
                  title={item.title}
                  description={item.description}
                  left={(props) => (
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color="#3b82f6"
                      style={{ marginLeft: 8, marginTop: 8 }}
                    />
                  )}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => navigation.navigate(item.screen as never)}
                />
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}