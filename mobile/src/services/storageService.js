// Local Storage Service for Offline Functionality
import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.prefix = '@LoboHub:';
  }

  async get(key) {
    try {
      const value = await AsyncStorage.getItem(this.prefix + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async set(key, value) {
    try {
      await AsyncStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  async remove(key) {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(appKeys);
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // Auth specific methods
  async getAuthToken() {
    return this.get('auth_token');
  }

  async setAuthToken(token) {
    return this.set('auth_token', token);
  }

  async removeAuthToken() {
    return this.remove('auth_token');
  }

  async getUser() {
    return this.get('user');
  }

  async setUser(user) {
    return this.set('user', user);
  }

  async removeUser() {
    return this.remove('user');
  }

  // Data caching methods
  async getTasks() {
    return this.get('tasks') || [];
  }

  async setTasks(tasks) {
    return this.set('tasks', tasks);
  }

  async getLists() {
    return this.get('lists') || [];
  }

  async setLists(lists) {
    return this.set('lists', lists);
  }

  async getBudgetData() {
    return this.get('budget_data') || { categories: [], transactions: [] };
  }

  async setBudgetData(data) {
    return this.set('budget_data', data);
  }

  async getCalendarEvents() {
    return this.get('calendar_events') || [];
  }

  async setCalendarEvents(events) {
    return this.set('calendar_events', events);
  }

  async getChatMessages() {
    return this.get('chat_messages') || [];
  }

  async setChatMessages(messages) {
    return this.set('chat_messages', messages);
  }

  async getMealPlans() {
    return this.get('meal_plans') || [];
  }

  async setMealPlans(plans) {
    return this.set('meal_plans', plans);
  }

  async getRecipes() {
    return this.get('recipes') || [];
  }

  async setRecipes(recipes) {
    return this.set('recipes', recipes);
  }

  async getAchievements() {
    return this.get('achievements') || { badges: [], familyLevel: { level: 1, points: 0 } };
  }

  async setAchievements(achievements) {
    return this.set('achievements', achievements);
  }

  // Sync status
  async getLastSyncTime() {
    return this.get('last_sync_time');
  }

  async setLastSyncTime(time) {
    return this.set('last_sync_time', time);
  }

  // Export/Import for family sharing
  async exportAllData() {
    try {
      const keys = ['tasks', 'lists', 'budget_data', 'calendar_events', 'meal_plans', 'recipes'];
      const data = {};
      
      for (const key of keys) {
        data[key] = await this.get(key);
      }
      
      return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data,
      };
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  async importAllData(importData) {
    try {
      if (!importData.data) {
        throw new Error('Invalid import data format');
      }

      for (const [key, value] of Object.entries(importData.data)) {
        if (value) {
          await this.set(key, value);
        }
      }
      
      await this.setLastSyncTime(new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }
}

export const storage = new StorageService();
export default storage;