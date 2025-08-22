// Offline storage service for LoboHub mobile app.
//
// This module wraps AsyncStorage to provide a simple API for
// persisting data on device.  Each family has its own namespace
// based off of a family code.  All data (tasks, lists, events,
// budgets, meal plans, chat messages, etc.) are stored under
// keys prefixed with the family code so that multiple families
// can coexist on one device if needed.

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@LoboHubOffline:';

/**
 * Get the current family code from storage.
 * Returns null if no code has been set.
 */
export async function getFamilyCode() {
  try {
    const code = await AsyncStorage.getItem(`${PREFIX}familyCode`);
    return code || null;
  } catch (err) {
    console.error('Error getting family code', err);
    return null;
  }
}

/**
 * Persist a family code for future lookups.
 */
export async function setFamilyCode(code) {
  try {
    await AsyncStorage.setItem(`${PREFIX}familyCode`, code);
    return true;
  } catch (err) {
    console.error('Error setting family code', err);
    return false;
  }
}

/**
 * Build a storage key namespaced by family code.
 */
function keyFor(familyCode, resource) {
  return `${PREFIX}family:${familyCode}:${resource}`;
}

/**
 * Generic getter for a resource.
 */
async function get(familyCode, resource, defaultValue) {
  try {
    const value = await AsyncStorage.getItem(keyFor(familyCode, resource));
    return value ? JSON.parse(value) : defaultValue;
  } catch (err) {
    console.error('Error reading', resource, err);
    return defaultValue;
  }
}

/**
 * Generic setter for a resource.
 */
async function set(familyCode, resource, value) {
  try {
    await AsyncStorage.setItem(keyFor(familyCode, resource), JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Error saving', resource, err);
    return false;
  }
}

// Tasks
export async function getTasks(familyCode) {
  return get(familyCode, 'tasks', []);
}
export async function setTasks(familyCode, tasks) {
  return set(familyCode, 'tasks', tasks);
}

// Lists
export async function getLists(familyCode) {
  return get(familyCode, 'lists', []);
}
export async function setLists(familyCode, lists) {
  return set(familyCode, 'lists', lists);
}

// Events
export async function getEvents(familyCode) {
  return get(familyCode, 'events', []);
}
export async function setEvents(familyCode, events) {
  return set(familyCode, 'events', events);
}

// Budget data (categories and transactions)
export async function getBudget(familyCode) {
  return get(familyCode, 'budget', { categories: [], transactions: [] });
}
export async function setBudget(familyCode, budget) {
  return set(familyCode, 'budget', budget);
}

// Meal plans
export async function getMealPlans(familyCode) {
  return get(familyCode, 'mealPlans', []);
}
export async function setMealPlans(familyCode, plans) {
  return set(familyCode, 'mealPlans', plans);
}

// Chat messages
export async function getChatMessages(familyCode) {
  return get(familyCode, 'chatMessages', []);
}
export async function setChatMessages(familyCode, messages) {
  return set(familyCode, 'chatMessages', messages);
}

// Devotional entries
export async function getDevotionals(familyCode) {
  return get(familyCode, 'devotionals', []);
}
export async function setDevotionals(familyCode, entries) {
  return set(familyCode, 'devotionals', entries);
}

/**
 * Export all data for a family into a single object.  Useful for sharing
 * across devices.  Includes a version and timestamp.
 */
export async function exportFamilyData(familyCode) {
  const tasks = await getTasks(familyCode);
  const lists = await getLists(familyCode);
  const events = await getEvents(familyCode);
  const budget = await getBudget(familyCode);
  const mealPlans = await getMealPlans(familyCode);
  const chatMessages = await getChatMessages(familyCode);
  const devotionals = await getDevotionals(familyCode);
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      tasks,
      lists,
      events,
      budget,
      mealPlans,
      chatMessages,
      devotionals
    }
  };
}

/**
 * Import data into the current family.  Overwrites any existing data.
 */
export async function importFamilyData(familyCode, exported) {
  const { data } = exported || {};
  if (!data) return false;
  await setTasks(familyCode, data.tasks || []);
  await setLists(familyCode, data.lists || []);
  await setEvents(familyCode, data.events || []);
  await setBudget(familyCode, data.budget || { categories: [], transactions: [] });
  await setMealPlans(familyCode, data.mealPlans || []);
  await setChatMessages(familyCode, data.chatMessages || []);
  await setDevotionals(familyCode, data.devotionals || []);
  return true;
}