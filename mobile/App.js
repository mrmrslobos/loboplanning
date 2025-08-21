import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { QueryProvider } from './src/components/QueryProvider';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import RealTasksScreen from './src/screens/RealTasksScreen';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './src/services/api';

// Simple navigation state management
const SCREENS = {
  DASHBOARD: 'Dashboard',
  TASKS: 'Tasks', 
  LISTS: 'Lists',
  CHAT: 'Chat',
  BUDGET: 'Budget',
  CALENDAR: 'Calendar',
  MEAL_PLANNING: 'MealPlanning',
  ACHIEVEMENTS: 'Achievements',
  FAMILY_SHARING: 'FamilySharing',
  MORE: 'More'
};

// Login Screen
function LoginScreen({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isRegistering && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const result = isRegistering 
        ? await register(name, email, password)
        : await login(email, password);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.loginContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🏠 LoboHub</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Create your family account' : 'Welcome back to your family hub'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {isRegistering && (
            <>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                autoCapitalize="words"
              />
            </>
          )}

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading 
                ? 'Please wait...' 
                : isRegistering 
                  ? 'Create Account' 
                  : 'Sign In'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setIsRegistering(!isRegistering)}
          >
            <Text style={styles.secondaryButtonText}>
              {isRegistering 
                ? 'Already have an account? Sign In' 
                : 'Need an account? Register'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Family Setup Screen
function FamilySetupScreen() {
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createFamily, joinFamily } = useAuth();

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createFamily(familyName);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create family');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinFamily(inviteCode.toUpperCase());
      if (result.success) {
        setShowJoinModal(false);
        setInviteCode('');
      } else {
        Alert.alert('Error', result.error || 'Failed to join family');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.familySetupContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>👨‍👩‍👧‍👦 Family Setup</Text>
          <Text style={styles.subtitle}>
            Create a new family or join an existing one
          </Text>
        </View>

        <View style={styles.familyOptions}>
          <View style={styles.optionCard}>
            <Text style={styles.optionTitle}>Create New Family</Text>
            <Text style={styles.optionDescription}>
              Start a new family hub and invite your members
            </Text>
            
            <Text style={styles.inputLabel}>Family Name</Text>
            <TextInput
              style={styles.textInput}
              value={familyName}
              onChangeText={setFamilyName}
              placeholder="Enter family name"
            />

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleCreateFamily}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Creating...' : 'Create Family'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.secondaryButtonText}>
              Join Existing Family
            </Text>
          </TouchableOpacity>
        </View>

        {/* Join Family Modal */}
        <Modal
          visible={showJoinModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowJoinModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Join Family</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Family Invite Code</Text>
              <TextInput
                style={styles.textInput}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter invite code (e.g., BLUE-OCEAN-42)"
                autoCapitalize="characters"
                autoFocus
              />

              <TouchableOpacity 
                style={[styles.primaryButton, isLoading && styles.disabledButton]}
                onPress={handleJoinFamily}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Joining...' : 'Join Family'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main Dashboard Screen
function DashboardScreen({ onNavigate }) {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.getTasks(),
    enabled: !!user,
  });

  const { data: budgetTransactions = [] } = useQuery({
    queryKey: ['budget-transactions'],
    queryFn: () => apiClient.getBudgetTransactions(),
    enabled: !!user,
  });

  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedTasks = tasks.filter(task => task.status === 'complete').length;
  const totalExpenses = budgetTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🏠 Welcome back, {user?.name}!</Text>
          <Text style={styles.subtitle}>Your Family Command Center</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pending Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${totalExpenses.toFixed(0)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => onNavigate(SCREENS.TASKS)}
            >
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={styles.actionTitle}>Tasks</Text>
              <Text style={styles.actionDesc}>Family to-dos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onNavigate(SCREENS.LISTS)}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionTitle}>Lists</Text>
              <Text style={styles.actionDesc}>Shopping & more</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onNavigate(SCREENS.CHAT)}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionTitle}>Chat</Text>
              <Text style={styles.actionDesc}>Family messages</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onNavigate(SCREENS.BUDGET)}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionTitle}>Budget</Text>
              <Text style={styles.actionDesc}>Family finances</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onNavigate(SCREENS.CALENDAR)}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionTitle}>Calendar</Text>
              <Text style={styles.actionDesc}>Events & plans</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => onNavigate(SCREENS.MORE)}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionTitle}>More</Text>
              <Text style={styles.actionDesc}>All features</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.status}>
          <Text style={styles.statusText}>🎉 All Features Active!</Text>
          <Text style={styles.statusSubtext}>Connected to your family data</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// More Features Screen (unchanged)
function MoreScreen({ onNavigate }) {
  const features = [
    { icon: '🍽️', title: 'Meal Planning', desc: 'Weekly meal organization', screen: SCREENS.MEAL_PLANNING },
    { icon: '🏆', title: 'Achievements', desc: 'Family milestones & badges', screen: SCREENS.ACHIEVEMENTS },
    { icon: '👨‍👩‍👧‍👦', title: 'Family Sharing', desc: 'Connect & sync data', screen: SCREENS.FAMILY_SHARING },
    { icon: '📖', title: 'Devotional', desc: 'Daily spiritual growth', screen: 'Devotional' },
    { icon: '🎉', title: 'Events', desc: 'Special occasions', screen: 'Events' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Smart family helper', screen: 'Assistant' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate(SCREENS.DASHBOARD)}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>More Features</Text>
          <Text style={styles.subtitle}>Explore all LoboHub capabilities</Text>
        </View>

        <View style={styles.featureList}>
          {features.map((feature, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.featureCard}
              onPress={() => onNavigate(feature.screen)}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Generic Feature Screen (for features not yet implemented)
function FeatureScreen({ screenName, onNavigate }) {
  const getScreenInfo = (name) => {
    const screens = {
      [SCREENS.LISTS]: { icon: '📋', title: 'Smart Lists', desc: 'Shopping lists with auto-categorization' },
      [SCREENS.CHAT]: { icon: '💬', title: 'Family Chat', desc: 'Real-time messaging and quick responses' },
      [SCREENS.BUDGET]: { icon: '💰', title: 'Family Budget', desc: 'Track income, expenses, and financial goals' },
      [SCREENS.CALENDAR]: { icon: '📅', title: 'Family Calendar', desc: 'Coordinate schedules and events' },
      [SCREENS.MEAL_PLANNING]: { icon: '🍽️', title: 'Meal Planning', desc: 'Weekly meal organization with AI suggestions' },
      [SCREENS.ACHIEVEMENTS]: { icon: '🏆', title: 'Achievements', desc: 'Family progress tracking and rewards' },
      [SCREENS.FAMILY_SHARING]: { icon: '👨‍👩‍👧‍👦', title: 'Family Sharing', desc: 'Connect families and sync data' },
      'Devotional': { icon: '📖', title: 'Daily Devotional', desc: 'Spiritual growth and reflection' },
      'Events': { icon: '🎉', title: 'Special Events', desc: 'Celebrations and occasions' },
      'Assistant': { icon: '🤖', title: 'AI Assistant', desc: 'Smart family helper and automation' },
    };
    return screens[name] || { icon: '⚙️', title: name, desc: 'Feature coming soon' };
  };

  const screen = getScreenInfo(screenName);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate(SCREENS.DASHBOARD)}
          >
            <Text style={styles.backText}>← Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.largeIcon}>{screen.icon}</Text>
          <Text style={styles.title}>{screen.title}</Text>
          <Text style={styles.subtitle}>{screen.desc}</Text>
        </View>

        <View style={styles.featureContent}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>🚀 Coming Soon!</Text>
            <Text style={styles.statusDesc}>
              This feature is being migrated from the web app to mobile. 
              All the functionality exists and will be available shortly!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main App Component with Authentication Flow
function AppContent() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.DASHBOARD);
  const { user, isLoading, isAuthenticated } = useAuth();

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading LoboHub...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onNavigate={handleNavigate} />;
  }

  if (!user?.familyId) {
    return <FamilySetupScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.DASHBOARD:
        return <DashboardScreen onNavigate={handleNavigate} />;
      case SCREENS.TASKS:
        return <RealTasksScreen />;
      case SCREENS.MORE:
        return <MoreScreen onNavigate={handleNavigate} />;
      default:
        return <FeatureScreen screenName={currentScreen} onNavigate={handleNavigate} />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {renderScreen()}
      <StatusBar style="auto" />
    </View>
  );
}

// Root App Component
export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  loginContainer: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  familySetupContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  backText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  largeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  familyOptions: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  featureList: {
    padding: 20,
  },
  featureCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  chevron: {
    fontSize: 18,
    color: '#9ca3af',
  },
  featureContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  statusDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  status: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0f172a',
  },
  statusSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  cancelButton: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    width: 60,
  },
});