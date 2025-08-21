import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Portal,
  Modal,
  TextInput,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offlineApiClient } from '../services/offlineApi';

const devotionalTypes = [
  'Daily Devotional',
  'Marriage Focus',
  'Parenting Wisdom',
  'Family Unity',
  'Children\'s Faith',
  'Weekly Journey',
];

const themes = [
  'Love & Relationships',
  'Forgiveness',
  'Patience',
  'Trust in God',
  'Communication',
  'Gratitude',
  'Purpose',
  'Peace',
  'Faith Building',
  'Service',
];

export default function DevotionalScreen() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedType, setSelectedType] = useState('Daily Devotional');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [currentDevotional, setCurrentDevotional] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: devotionals = [] } = useQuery({
    queryKey: ['devotional', 'entries'],
    queryFn: () => offlineApiClient.devotional.getEntries().then(res => res.data),
  });

  const generateMutation = useMutation({
    mutationFn: (preferences: any) => offlineApiClient.devotional.generate(preferences),
    onSuccess: (response) => {
      setCurrentDevotional(response.data);
      setShowGenerateModal(false);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate devotional');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (devotional: any) => offlineApiClient.devotional.saveEntry(devotional),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devotional', 'entries'] });
      setCurrentDevotional(null);
      Alert.alert('Success', 'Devotional saved to your collection!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save devotional');
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      type: selectedType,
      themes: selectedThemes,
      customTopic: customTopic,
    });
  };

  const handleSave = () => {
    if (!currentDevotional) return;
    saveMutation.mutate(currentDevotional);
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const recentDevotionals = devotionals.slice(0, 5);
  const todaysDevotional = devotionals.find((d: any) => 
    new Date(d.createdAt).toDateString() === new Date().toDateString()
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Devotional
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Grow together in faith and spiritual understanding
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowGenerateModal(true)}
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              icon={() => <Ionicons name="sparkles" size={16} color="white" />}
            >
              Generate AI Devotional
            </Button>
          </Card.Content>
        </Card>

        {/* Current/Generated Devotional */}
        {currentDevotional && (
          <Card style={{ marginBottom: 16, backgroundColor: '#fefefe', borderWidth: 1, borderColor: '#3b82f6' }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text variant="titleMedium" style={{ color: '#1f2937', flex: 1 }}>
                  {currentDevotional.title}
                </Text>
                <Chip compact mode="outlined" style={{ backgroundColor: '#3b82f620' }}>
                  New
                </Chip>
              </View>

              {currentDevotional.verse && (
                <Card style={{ backgroundColor: '#f1f5f9', marginBottom: 12 }}>
                  <Card.Content style={{ paddingVertical: 12 }}>
                    <Text variant="bodyMedium" style={{ fontStyle: 'italic', color: '#374151' }}>
                      "{currentDevotional.verse}"
                    </Text>
                    {currentDevotional.reference && (
                      <Text variant="bodySmall" style={{ color: '#6b7280', textAlign: 'right', marginTop: 4 }}>
                        - {currentDevotional.reference}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              )}

              <Text variant="bodyMedium" style={{ color: '#374151', lineHeight: 24 }}>
                {currentDevotional.content}
              </Text>

              {currentDevotional.prayer && (
                <Card style={{ backgroundColor: '#fef3c7', marginTop: 12 }}>
                  <Card.Content style={{ paddingVertical: 12 }}>
                    <Text variant="bodySmall" style={{ color: '#92400e', fontWeight: '600', marginBottom: 4 }}>
                      Prayer:
                    </Text>
                    <Text variant="bodyMedium" style={{ color: '#92400e', fontStyle: 'italic' }}>
                      {currentDevotional.prayer}
                    </Text>
                  </Card.Content>
                </Card>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button mode="outlined" onPress={() => setCurrentDevotional(null)}>
                  Dismiss
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={saveMutation.isPending}
                >
                  Save to Collection
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Today's Devotional */}
        {todaysDevotional && !currentDevotional && (
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="titleMedium" style={{ color: '#374151' }}>
                  Today's Devotional
                </Text>
                <Chip compact mode="outlined">
                  {new Date().toLocaleDateString()}
                </Chip>
              </View>
              <Text variant="titleSmall" style={{ color: '#1f2937', marginBottom: 8 }}>
                {todaysDevotional.title}
              </Text>
              <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
                {todaysDevotional.content.substring(0, 150)}...
              </Text>
              <Button mode="text" style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
                Read Full Devotional
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Recent Devotionals */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Your Devotional Collection
            </Text>
            {recentDevotionals.length > 0 ? (
              recentDevotionals.map((devotional: any, index: number) => (
                <View
                  key={devotional.id || index}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: index < recentDevotionals.length - 1 ? 1 : 0,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <Text variant="titleSmall" style={{ color: '#374151', marginBottom: 4 }}>
                    {devotional.title}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                      {devotional.type} • {new Date(devotional.createdAt).toLocaleDateString()}
                    </Text>
                    <Button mode="text" compact>
                      Read
                    </Button>
                  </View>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                No devotionals saved yet. Generate your first one above!
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Spiritual Growth Insights */}
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              This Month's Growth
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>Devotionals Read:</Text>
              <Text variant="bodySmall" style={{ color: '#16a34a', fontWeight: 'bold' }}>12/31</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>Topics Explored:</Text>
              <Text variant="bodySmall" style={{ color: '#3b82f6', fontWeight: 'bold' }}>6</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>Family Discussions:</Text>
              <Text variant="bodySmall" style={{ color: '#f59e0b', fontWeight: 'bold' }}>8</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Generate Devotional Modal */}
      <Portal>
        <Modal
          visible={showGenerateModal}
          onDismiss={() => setShowGenerateModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8, maxHeight: '80%' }}
        >
          <ScrollView>
            <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
              Generate AI Devotional
            </Text>

            <Text variant="bodyMedium" style={{ marginBottom: 12, color: '#6b7280' }}>
              Devotional Type:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {devotionalTypes.map((type) => (
                <Chip
                  key={type}
                  selected={selectedType === type}
                  onPress={() => setSelectedType(type)}
                >
                  {type}
                </Chip>
              ))}
            </View>

            <Text variant="bodyMedium" style={{ marginBottom: 12, color: '#6b7280' }}>
              Themes (select up to 3):
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {themes.map((theme) => (
                <Chip
                  key={theme}
                  selected={selectedThemes.includes(theme)}
                  onPress={() => toggleTheme(theme)}
                  disabled={!selectedThemes.includes(theme) && selectedThemes.length >= 3}
                >
                  {theme}
                </Chip>
              ))}
            </View>

            <TextInput
              value={customTopic}
              onChangeText={setCustomTopic}
              placeholder="Custom topic or specific prayer request (optional)"
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ marginBottom: 20 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setShowGenerateModal(false)}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleGenerate}
                loading={generateMutation.isPending}
              >
                Generate
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}