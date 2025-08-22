import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

// Screens
import FamilySetupScreen from './src/screens/FamilySetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import ListsScreen from './src/screens/ListsScreen';
import EventsScreen from './src/screens/EventsScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import MealPlansScreen from './src/screens/MealPlansScreen';
import ChatScreen from './src/screens/ChatScreen';
import DevotionalScreen from './src/screens/DevotionalScreen';

import { getFamilyCode } from './src/services/storage';

// Prevent the splash screen from auto hiding while we load assets
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [familyCode, setFamilyCodeState] = useState(null);

  useEffect(() => {
    async function prepare() {
      // Load the family code if it exists
      const code = await getFamilyCode();
      setFamilyCodeState(code);
      setIsReady(true);
      // Hide the splash screen once loaded
      await SplashScreen.hideAsync();
    }
    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* If no family code exists, force user through setup */}
          {!familyCode ? (
            <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Tasks" component={TasksScreen} />
              <Stack.Screen name="Lists" component={ListsScreen} />
              <Stack.Screen name="Events" component={EventsScreen} />
              <Stack.Screen name="Budget" component={BudgetScreen} />
              <Stack.Screen name="MealPlans" component={MealPlansScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Devotional" component={DevotionalScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}