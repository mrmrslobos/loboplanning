import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
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

export default function CalendarScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: () => offlineApiClient.calendar.getEvents().then(res => res.data),
  });

  const createEventMutation = useMutation({
    mutationFn: offlineApiClient.calendar.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      setShowAddModal(false);
      setNewEventTitle('');
      setNewEventDescription('');
      setNewEventLocation('');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create event');
    },
  });

  const handleCreateEvent = () => {
    if (!newEventTitle.trim()) return;

    createEventMutation.mutate({
      title: newEventTitle,
      description: newEventDescription,
      location: newEventLocation,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
    });
  };

  const upcomingEvents = events
    .filter((event: any) => new Date(event.startTime) >= new Date())
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Calendar
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Stay coordinated with family events and schedules
            </Text>
          </Card.Content>
        </Card>

        {/* Today's Events */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Today's Events
            </Text>
            {upcomingEvents.filter((event: any) => 
              new Date(event.startTime).toDateString() === new Date().toDateString()
            ).length > 0 ? (
              upcomingEvents
                .filter((event: any) => 
                  new Date(event.startTime).toDateString() === new Date().toDateString()
                )
                .map((event: any, index: number) => (
                  <View
                    key={event.id}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: index < upcomingEvents.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                    }}
                  >
                    <Text variant="bodyMedium" style={{ color: '#374151' }}>
                      {event.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                      {new Date(event.startTime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.location && ` • ${event.location}`}
                    </Text>
                    {event.description && (
                      <Text variant="bodySmall" style={{ color: '#6b7280', marginTop: 4 }}>
                        {event.description}
                      </Text>
                    )}
                  </View>
                ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                No events scheduled for today
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Events */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              Upcoming Events
            </Text>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 5).map((event: any, index: number) => (
                <View
                  key={event.id}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: index < Math.min(upcomingEvents.length, 5) - 1 ? 1 : 0,
                    borderBottomColor: '#f3f4f6',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" style={{ color: '#374151' }}>
                        {event.title}
                      </Text>
                      <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                        {new Date(event.startTime).toLocaleDateString()} at{' '}
                        {new Date(event.startTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                      {event.location && (
                        <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                          📍 {event.location}
                        </Text>
                      )}
                    </View>
                    <Chip compact mode="outlined" style={{ backgroundColor: event.color + '20' }}>
                      {Math.ceil((new Date(event.startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </Chip>
                  </View>
                </View>
              ))
            ) : (
              <Text variant="bodyMedium" style={{ color: '#9ca3af', textAlign: 'center', paddingVertical: 16 }}>
                No upcoming events scheduled
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Add Event Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Add New Event
          </Text>

          <TextInput
            value={newEventTitle}
            onChangeText={setNewEventTitle}
            placeholder="Event title"
            mode="outlined"
            style={{ marginBottom: 16 }}
          />

          <TextInput
            value={newEventDescription}
            onChangeText={setNewEventDescription}
            placeholder="Description (optional)"
            mode="outlined"
            multiline
            style={{ marginBottom: 16 }}
          />

          <TextInput
            value={newEventLocation}
            onChangeText={setNewEventLocation}
            placeholder="Location (optional)"
            mode="outlined"
            style={{ marginBottom: 20 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleCreateEvent}
              loading={createEventMutation.isPending}
            >
              Add Event
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
        onPress={() => setShowAddModal(true)}
      />
    </SafeAreaView>
  );
}