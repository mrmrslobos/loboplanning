import React, { useState } from 'react';
import { View, ScrollView, Alert, Share } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Portal,
  Modal,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { familySharing } from '../services/offlineApi';
import { useQueryClient } from '@tanstack/react-query';

export default function FamilySharingScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState('');
  const queryClient = useQueryClient();

  const handleGenerateInvite = async () => {
    try {
      const { inviteCode } = await familySharing.generateInvite();
      setGeneratedInvite(inviteCode);
      setShowInviteModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate invite code');
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join our family on LoboHub! Use invite code: ${generatedInvite}`,
        title: 'LoboHub Family Invite',
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      const { success } = await familySharing.joinFamily(joinCode.toUpperCase());
      if (success) {
        Alert.alert('Success', 'Successfully joined family!');
        queryClient.invalidateQueries();
        setShowJoinModal(false);
        setJoinCode('');
      } else {
        Alert.alert('Error', 'Invalid invite code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join family');
    }
  };

  const handleExportData = async () => {
    try {
      const { exportData } = await familySharing.exportData();
      
      // Save to file
      const fileName = `lobohub_family_data_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, exportData);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      
      Alert.alert('Success', 'Family data exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const { success } = await familySharing.importData(fileContent);
        
        if (success) {
          Alert.alert('Success', 'Family data imported successfully!');
          queryClient.invalidateQueries();
          setShowDataModal(false);
        } else {
          Alert.alert('Error', 'Invalid data file');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import data');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <Card style={{ marginBottom: 20 }}>
          <Card.Content>
            <Text variant="headlineSmall" style={{ color: '#1f2937' }}>
              Family Sharing
            </Text>
            <Text variant="bodyMedium" style={{ color: '#6b7280' }}>
              Connect with your family and share your LoboHub data
            </Text>
          </Card.Content>
        </Card>

        {/* Invite Family */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text variant="titleMedium" style={{ marginLeft: 8, color: '#374151' }}>
                Invite Family Members
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: '#6b7280', marginBottom: 12 }}>
              Generate an invite code to share with your family members
            </Text>
            <Button
              mode="contained"
              onPress={handleGenerateInvite}
              icon={() => <Ionicons name="share" size={16} color="white" />}
            >
              Generate Invite Code
            </Button>
          </Card.Content>
        </Card>

        {/* Join Family */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="enter" size={20} color="#10b981" />
              <Text variant="titleMedium" style={{ marginLeft: 8, color: '#374151' }}>
                Join an Existing Family
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: '#6b7280', marginBottom: 12 }}>
              Enter an invite code to join another family's LoboHub
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowJoinModal(true)}
              icon={() => <Ionicons name="add" size={16} />}
            >
              Enter Invite Code
            </Button>
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="cloud" size={20} color="#8b5cf6" />
              <Text variant="titleMedium" style={{ marginLeft: 8, color: '#374151' }}>
                Data Backup & Sync
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: '#6b7280', marginBottom: 12 }}>
              Export your family data to share with other devices or as a backup
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                mode="outlined"
                onPress={handleExportData}
                style={{ flex: 1 }}
                icon={() => <Ionicons name="download" size={16} />}
              >
                Export Data
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowDataModal(true)}
                style={{ flex: 1 }}
                icon={() => <Ionicons name="cloud-upload" size={16} />}
              >
                Import Data
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* How It Works */}
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12, color: '#374151' }}>
              How Family Sharing Works
            </Text>
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Chip compact mode="outlined" style={{ marginRight: 12, marginTop: 2 }}>1</Chip>
                <Text variant="bodySmall" style={{ flex: 1, color: '#6b7280' }}>
                  Generate an invite code and share it with family members
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Chip compact mode="outlined" style={{ marginRight: 12, marginTop: 2 }}>2</Chip>
                <Text variant="bodySmall" style={{ flex: 1, color: '#6b7280' }}>
                  Family members enter the code to join your family group
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Chip compact mode="outlined" style={{ marginRight: 12, marginTop: 2 }}>3</Chip>
                <Text variant="bodySmall" style={{ flex: 1, color: '#6b7280' }}>
                  Share data files to sync tasks, lists, and other information
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Chip compact mode="outlined" style={{ marginRight: 12, marginTop: 2 }}>4</Chip>
                <Text variant="bodySmall" style={{ flex: 1, color: '#6b7280' }}>
                  Each family member sees shared content in their app
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Invite Code Modal */}
      <Portal>
        <Modal
          visible={showInviteModal}
          onDismiss={() => setShowInviteModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16, textAlign: 'center' }}>
            Family Invite Code
          </Text>
          
          <Card style={{ backgroundColor: '#f1f5f9', marginBottom: 16 }}>
            <Card.Content style={{ alignItems: 'center' }}>
              <Text variant="headlineLarge" style={{ color: '#3b82f6', fontFamily: 'monospace' }}>
                {generatedInvite}
              </Text>
            </Card.Content>
          </Card>

          <Text variant="bodyMedium" style={{ color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>
            Share this code with your family members so they can join your LoboHub family
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowInviteModal(false)}>Close</Button>
            <Button
              mode="contained"
              onPress={handleShareInvite}
              icon={() => <Ionicons name="share" size={16} color="white" />}
            >
              Share Code
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Join Family Modal */}
      <Portal>
        <Modal
          visible={showJoinModal}
          onDismiss={() => setShowJoinModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Join Family
          </Text>

          <Text variant="bodyMedium" style={{ color: '#6b7280', marginBottom: 16 }}>
            Enter the invite code shared by your family member:
          </Text>

          <TextInput
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="Enter invite code (e.g. ABC123DE)"
            mode="outlined"
            style={{ marginBottom: 20 }}
            autoCapitalize="characters"
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowJoinModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleJoinFamily}
              disabled={!joinCode.trim()}
            >
              Join Family
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Data Import Modal */}
      <Portal>
        <Modal
          visible={showDataModal}
          onDismiss={() => setShowDataModal(false)}
          contentContainerStyle={{ backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 }}
        >
          <Text variant="headlineSmall" style={{ marginBottom: 16 }}>
            Import Family Data
          </Text>

          <Text variant="bodyMedium" style={{ color: '#6b7280', marginBottom: 16 }}>
            Select a LoboHub data file to import family tasks, lists, and other information:
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setShowDataModal(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleImportData}
              icon={() => <Ionicons name="folder-open" size={16} color="white" />}
            >
              Select File
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}