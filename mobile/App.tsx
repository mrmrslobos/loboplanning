import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import TasksScreen from './src/screens/TasksScreen';
import ListsScreen from './src/screens/ListsScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import LoginScreen from './src/screens/LoginScreen';

// Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Icons
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

function AuthenticatedTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'checkbox' : 'checkbox-outline';
          } else if (route.name === 'Lists') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Assistant') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Budget') {
            iconName = focused ? 'card' : 'card-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Lists" component={ListsScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Add loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={AuthenticatedTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  // Customize theme colors to match web version
  const customTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: '#3b82f6',
      primaryContainer: '#dbeafe',
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={customTheme}>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}