import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';

const eventsApi = {
  getEvents: () => apiClient.get('/events'),
  createEvent: (event: any) => apiClient.post('/events', event),
  generateEventPlan: (eventData: any) => apiClient.post('/events/generate-plan', eventData),
};

const eventTypes = [
  { label: 'Birthday Party', icon: 'gift', color: '#f59e0b' },
  { label: 'Anniversary', icon: 'heart', color: '#ec4899' },
  { label: 'Holiday Celebration', icon: 'star', color: '#10b981' },
  { label: 'Family Gathering', icon: 'people', color: '#3b82f6' },
  { label: 'Vacation', icon: 'airplane', color: '#8b5cf6' },
  { label: 'Special Occasion', icon: 'sparkles', color: '#f97316' },
];

export default function EventsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getEvents().then(res => res.data),
  });

  const createEventMutation = useMutation({
    mutationFn: eventsApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create event');
    },
  });

  const generatePlanMutation = useMutation({
    mutationFn: eventsApi.generateEventPlan,
    onSuccess: () => {
      Alert.alert('Success', 'AI has generated a comprehensive plan for your event!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to generate event plan');
    },
  });

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventType('');
    setNewEventDate('');
    setNewEventDescription('');
  };

  const handleCreateEvent = () => {
    if (!newEventTitle.trim() || !newEventType) return;

    createEventMutation.mutate({
      title: newEventTitle,
      type: newEventType,
      date: newEventDate || new Date().toISOString(),
      description: newEventDescription,
    });
  };

  const handleGeneratePlan = (event: any) => {
    generatePlanMutation.mutate({
      eventId: event.id,
      eventType: event.type,
      title: event.title,
      date: event.date,
    });
  };

  const upcomingEvents = events
    .filter((event: any) => new Date(event.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastEvents = events
    .filter((event: any) => new Date(event.date) < new Date())
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Events
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Celebrate special moments and create lasting memories
            </Text>
          </Card.Content>
        </Card>

        {/* Upcoming Events */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Upcoming Events
            </Text>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event: any, index: number) => {
                const eventTypeInfo = eventTypes.find(t => t.label === event.type) || eventTypes[0];
                const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <Card key={event.id} style={{ marginBottom: 12, backgroundColor: '#fefefe' }}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Ionicons 
                              name={eventTypeInfo.icon as keyof typeof Ionicons.glyphMap} 
                              size={16} 
                              color={eventTypeInfo.color} 
                            />
                            <Text variant="titleSmall" style={{ marginLeft: 8, color: '#374151' }}>
                              {event.title}
                            </Text>
                          </View>
                          <Text variant="bodySmall" style={{ color: '#6b7280', marginBottom: 4 }}>
                            {event.type} • {new Date(event.date).toLocaleDateString()}
                          </Text>
                          {event.description && (
                            <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                              {event.description}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                            <Button
                              mode="contained-tonal"
                              compact
                              onPress={() => handleGeneratePlan(event)}
                              loading={generatePlanMutation.isPending}
                            >
                              AI Plan
                            </Button>
                          </View>
                        </View>
                        <Chip 
                          compact 
                          mode="outlined" 
                          style={{ backgroundColor: eventTypeInfo.color + '20' }}
                        >
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })
            ) : (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                No upcoming events scheduled
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Event Types */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Quick Create
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {eventTypes.map((type, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  icon={() => <Ionicons name={type.icon as keyof typeof Ionicons.glyphMap} size={16} color={type.color} />}
                  onPress={() => {
                    setNewEventType(type.label);
                    setShowCreateModal(true);
                  }}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <Card>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
                Past Events
              </Text>
              {pastEvents.slice(0, 3).map((event: any) => {
                const eventTypeInfo = eventTypes.find(t => t.label === event.type) || eventTypes[0];
                return (
                  <View
                    key={event.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      opacity: 0.7,
                    }}
                  >
                    <Ionicons 
                      name={eventTypeInfo.icon as keyof typeof Ionicons.glyphMap} 
                      size={16} 
                      color={eventTypeInfo.color} 
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
                        {event.title}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#9ca3af' }}>
                        {new Date(event.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Create New Event
          </Text>

          <TextInput
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            placeholder="Event title"
            mode="outlined"
            style={{ marginBottom: 16 }}
          />

          <View style={{ marginBottom: 16 }}>
            <Text variant="bodyMedium" style={{ marginBottom: 8, color: '#6b7280' }}>
              Event Type:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {eventTypes.map((type) => (
                <Chip
                  key={type.label}
                  selected={newEventType === type.label}
                  onPress={() => setNewEventType(type.label)}
                >
                  {type.label}
                </Chip>
              ))}
            </View>
          </View>

          <TextInput
            value={newEventDescription}
            onChangeText={setNewEventDescription}
            placeholder="Description (optional)"
            mode="outlined"
            multiline
            style={{ marginBottom: 20 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleCreateEvent}
              loading={createEventMutation.isPending}
              disabled={!newEventTitle.trim() || !newEventType}
            >
              Create Event
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
        onPress={() => setShowCreateModal(true)}
      />
    </SafeAreaView>
  );
}