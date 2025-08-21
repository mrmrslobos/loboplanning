import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Local database interface - replaces server API calls
class LocalDatabase {
  private async getStorageKey(collection: string): Promise<string> {
    const userId = await this.getCurrentUserId();
    return `${userId}_${collection}`;
  }

  private async getCurrentUserId(): Promise<string> {
    const user = await AsyncStorage.getItem('current_user');
    return user ? JSON.parse(user).id : 'default_user';
  }

  // Generic CRUD operations
  async getCollection<T>(collection: string): Promise<T[]> {
    try {
      const key = await this.getStorageKey(collection);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${collection}:`, error);
      return [];
    }
  }

  async saveCollection<T>(collection: string, data: T[]): Promise<void> {
    try {
      const key = await this.getStorageKey(collection);
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${collection}:`, error);
    }
  }

  async addItem<T extends { id?: string }>(collection: string, item: T): Promise<T> {
    const items = await this.getCollection<T>(collection);
    const newItem = { ...item, id: item.id || uuidv4(), createdAt: new Date().toISOString() };
    items.push(newItem as T);
    await this.saveCollection(collection, items);
    return newItem as T;
  }

  async updateItem<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.getCollection<T>(collection);
    const index = items.findIndex((item: any) => item.id === id);
    if (index === -1) return null;

    const updatedItem = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    items[index] = updatedItem;
    await this.saveCollection(collection, items);
    return updatedItem;
  }

  async deleteItem(collection: string, id: string): Promise<boolean> {
    const items = await this.getCollection(collection);
    const filteredItems = items.filter((item: any) => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    await this.saveCollection(collection, filteredItems);
    return true;
  }

  // User management
  async createUser(userData: any): Promise<any> {
    const users = await AsyncStorage.getItem('all_users');
    const allUsers = users ? JSON.parse(users) : [];
    
    const newUser = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date().toISOString(),
      familyId: userData.familyId || uuidv4(), // Create new family if none provided
    };

    allUsers.push(newUser);
    await AsyncStorage.setItem('all_users', JSON.stringify(allUsers));
    await AsyncStorage.setItem('current_user', JSON.stringify(newUser));
    
    return newUser;
  }

  async loginUser(username: string, password: string): Promise<any> {
    const users = await AsyncStorage.getItem('all_users');
    const allUsers = users ? JSON.parse(users) : [];
    
    const user = allUsers.find((u: any) => 
      u.username === username && u.password === password
    );
    
    if (!user) throw new Error('Invalid credentials');
    
    await AsyncStorage.setItem('current_user', JSON.stringify(user));
    return user;
  }

  async getCurrentUser(): Promise<any> {
    const user = await AsyncStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }

  async logoutUser(): Promise<void> {
    await AsyncStorage.removeItem('current_user');
  }

  // Family sharing - returns data for current user's family
  async getFamilyData<T>(collection: string): Promise<T[]> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser?.familyId) return [];

      const allUsers = await AsyncStorage.getItem('all_users');
      const users = allUsers ? JSON.parse(allUsers) : [];
      const familyUsers = users.filter((u: any) => u.familyId === currentUser.familyId);

      // Aggregate data from all family members
      const allFamilyData: T[] = [];
      
      for (const user of familyUsers) {
        const userData = await AsyncStorage.getItem(`${user.id}_${collection}`);
        if (userData) {
          const userItems = JSON.parse(userData);
          allFamilyData.push(...userItems);
        }
      }

      return allFamilyData;
    } catch (error) {
      console.error(`Error getting family ${collection}:`, error);
      return [];
    }
  }

  // Share data with family (could be enhanced with peer-to-peer sharing)
  async shareFamilyInvite(): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser?.familyId) throw new Error('No family to share');

    // Generate shareable family code
    const inviteCode = currentUser.familyId.substring(0, 8).toUpperCase();
    
    // Store invite for joining
    await AsyncStorage.setItem(`invite_${inviteCode}`, JSON.stringify({
      familyId: currentUser.familyId,
      inviterName: currentUser.username,
      createdAt: new Date().toISOString(),
    }));

    return inviteCode;
  }

  async joinFamily(inviteCode: string): Promise<boolean> {
    try {
      const inviteData = await AsyncStorage.getItem(`invite_${inviteCode}`);
      if (!inviteData) return false;

      const invite = JSON.parse(inviteData);
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      // Update user's family
      const users = await AsyncStorage.getItem('all_users');
      const allUsers = users ? JSON.parse(users) : [];
      const userIndex = allUsers.findIndex((u: any) => u.id === currentUser.id);
      
      if (userIndex >= 0) {
        allUsers[userIndex].familyId = invite.familyId;
        await AsyncStorage.setItem('all_users', JSON.stringify(allUsers));
        
        // Update current user
        const updatedUser = { ...currentUser, familyId: invite.familyId };
        await AsyncStorage.setItem('current_user', JSON.stringify(updatedUser));
      }

      return true;
    } catch (error) {
      console.error('Error joining family:', error);
      return false;
    }
  }

  // Data export/import for manual sharing
  async exportFamilyData(): Promise<string> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('No user logged in');

    const collections = ['tasks', 'lists', 'list_items', 'budget_transactions', 'budget_categories', 
                        'calendar_events', 'chat_messages', 'meal_plans', 'recipes', 'events', 
                        'devotional_entries', 'achievements'];
    
    const exportData: any = {
      familyId: currentUser.familyId,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.username,
      data: {},
    };

    for (const collection of collections) {
      exportData.data[collection] = await this.getFamilyData(collection);
    }

    return JSON.stringify(exportData, null, 2);
  }

  async importFamilyData(importJson: string): Promise<boolean> {
    try {
      const importData = JSON.parse(importJson);
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return false;

      // Import each collection
      for (const [collection, data] of Object.entries(importData.data)) {
        if (Array.isArray(data)) {
          await this.saveCollection(collection, data as any[]);
        }
      }

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const localDB = new LocalDatabase();