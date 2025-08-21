import { localDB } from './localDatabase';

// Offline API that mimics the server API structure
export const offlineApiClient = {
  // Tasks API
  tasks: {
    getAll: async () => {
      const tasks = await localDB.getFamilyData('tasks');
      return { data: tasks };
    },
    create: async (task: any) => {
      const newTask = await localDB.addItem('tasks', task);
      return { data: newTask };
    },
    update: async (id: string, updates: any) => {
      const updatedTask = await localDB.updateItem('tasks', id, updates);
      return { data: updatedTask };
    },
    delete: async (id: string) => {
      await localDB.deleteItem('tasks', id);
      return { data: { success: true } };
    },
  },

  // Lists API
  lists: {
    getAll: async () => {
      const lists = await localDB.getFamilyData('lists');
      return { data: lists };
    },
    create: async (list: any) => {
      const newList = await localDB.addItem('lists', list);
      return { data: newList };
    },
    getItems: async (listId: string) => {
      const items = await localDB.getFamilyData('list_items');
      const listItems = items.filter((item: any) => item.listId === listId);
      return { data: listItems };
    },
    addItem: async (listId: string, item: any) => {
      const newItem = await localDB.addItem('list_items', { ...item, listId });
      return { data: newItem };
    },
    updateItem: async (listId: string, itemId: string, updates: any) => {
      const updatedItem = await localDB.updateItem('list_items', itemId, updates);
      return { data: updatedItem };
    },
    deleteItem: async (listId: string, itemId: string) => {
      await localDB.deleteItem('list_items', itemId);
      return { data: { success: true } };
    },
  },

  // Budget API
  budget: {
    getCategories: async () => {
      const categories = await localDB.getFamilyData('budget_categories');
      return { data: categories };
    },
    getTransactions: async () => {
      const transactions = await localDB.getFamilyData('budget_transactions');
      return { data: transactions };
    },
    createTransaction: async (transaction: any) => {
      const newTransaction = await localDB.addItem('budget_transactions', transaction);
      return { data: newTransaction };
    },
    createCategory: async (category: any) => {
      const newCategory = await localDB.addItem('budget_categories', category);
      return { data: newCategory };
    },
  },

  // Calendar API
  calendar: {
    getEvents: async () => {
      const events = await localDB.getFamilyData('calendar_events');
      return { data: events };
    },
    createEvent: async (event: any) => {
      const newEvent = await localDB.addItem('calendar_events', event);
      return { data: newEvent };
    },
  },

  // Chat API
  chat: {
    getMessages: async () => {
      const messages = await localDB.getFamilyData('chat_messages');
      return { data: messages.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )};
    },
    sendMessage: async (message: any) => {
      const user = await localDB.getCurrentUser();
      const newMessage = await localDB.addItem('chat_messages', {
        ...message,
        userId: user.id,
        username: user.username,
      });
      return { data: newMessage };
    },
  },

  // AI Assistant API (local responses)
  assistant: {
    sendMessage: async (message: string) => {
      // Simple local AI responses - could be enhanced with local AI models
      const responses = [
        "I'm working offline right now, but I can help you with basic family organization tasks!",
        "Try creating a task or adding items to your shopping list. I'll be more helpful when we're connected to AI services.",
        "For full AI assistance including meal planning and devotionals, connect to the internet and I'll use advanced AI to help you.",
        "In offline mode, I can help you organize existing data and provide basic family management tips.",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Add user message and response to chat
      const user = await localDB.getCurrentUser();
      await localDB.addItem('chat_messages', {
        content: message,
        type: 'text',
        userId: user.id,
        username: user.username,
      });
      
      await localDB.addItem('chat_messages', {
        content: randomResponse,
        type: 'text',
        userId: 'assistant',
        username: 'Family Assistant',
      });
      
      return { data: { response: randomResponse } };
    },
  },

  // Meal Planning API
  mealPlanning: {
    getMealPlans: async () => {
      const plans = await localDB.getFamilyData('meal_plans');
      return { data: plans };
    },
    getRecipes: async () => {
      const recipes = await localDB.getFamilyData('recipes');
      return { data: recipes };
    },
    createMealPlan: async (plan: any) => {
      const newPlan = await localDB.addItem('meal_plans', plan);
      return { data: newPlan };
    },
    generateAIPlan: async (preferences: any) => {
      // Offline meal planning with basic suggestions
      const basicMeals = [
        { title: 'Spaghetti with Marinara', mealType: 'Dinner', day: 'Monday' },
        { title: 'Chicken Stir Fry', mealType: 'Dinner', day: 'Tuesday' },
        { title: 'Taco Tuesday', mealType: 'Dinner', day: 'Tuesday' },
        { title: 'Homemade Pizza', mealType: 'Dinner', day: 'Wednesday' },
        { title: 'Grilled Chicken Salad', mealType: 'Lunch', day: 'Thursday' },
      ];
      
      // Create some basic meal plans
      for (const meal of basicMeals.slice(0, 3)) {
        await localDB.addItem('meal_plans', {
          ...meal,
          date: new Date().toISOString(),
          generated: true,
        });
      }
      
      return { data: { message: 'Basic meal plan generated! Connect to internet for AI-powered planning.' } };
    },
  },

  // Events API
  events: {
    getEvents: async () => {
      const events = await localDB.getFamilyData('events');
      return { data: events };
    },
    createEvent: async (event: any) => {
      const newEvent = await localDB.addItem('events', event);
      return { data: newEvent };
    },
    generateEventPlan: async (eventData: any) => {
      // Basic event planning suggestions
      const basicTasks = [
        'Send invitations',
        'Plan decorations',
        'Organize food and drinks',
        'Prepare entertainment',
        'Set up venue',
      ];
      
      for (const taskTitle of basicTasks) {
        await localDB.addItem('tasks', {
          title: `${eventData.title}: ${taskTitle}`,
          description: `Event planning task for ${eventData.title}`,
          status: 'pending',
          assignedTo: 'Family',
          eventId: eventData.eventId,
        });
      }
      
      return { data: { message: 'Basic event plan created! Check your tasks.' } };
    },
  },

  // Devotional API
  devotional: {
    getEntries: async () => {
      const entries = await localDB.getFamilyData('devotional_entries');
      return { data: entries };
    },
    generate: async (preferences: any) => {
      // Basic devotional content for offline use
      const devotionals = [
        {
          title: 'Love in the Family',
          content: 'Today, let us reflect on the love that binds our family together. Love is patient and kind, and it grows stronger when we choose to show it in our daily actions.',
          verse: 'Love is patient, love is kind.',
          reference: '1 Corinthians 13:4',
          prayer: 'Help us to show love to one another in our words and actions today.',
          type: preferences.type || 'Daily Devotional',
        },
        {
          title: 'Family Unity',
          content: 'Families are stronger when they work together. Today, find one way to support each family member and strengthen your bonds.',
          verse: 'Though one may be overpowered, two can defend themselves.',
          reference: 'Ecclesiastes 4:12',
          prayer: 'Unite our hearts as we work together as a family.',
          type: preferences.type || 'Daily Devotional',
        },
      ];
      
      const selectedDevotional = devotionals[Math.floor(Math.random() * devotionals.length)];
      return { data: selectedDevotional };
    },
    saveEntry: async (entry: any) => {
      const newEntry = await localDB.addItem('devotional_entries', entry);
      return { data: newEntry };
    },
  },

  // Achievements API
  achievements: {
    getProgress: async () => {
      const tasks = await localDB.getFamilyData('tasks');
      const completedTasks = tasks.filter((task: any) => task.status === 'complete');
      
      return { 
        data: {
          familyLevel: Math.floor(completedTasks.length / 10) + 1,
          currentPoints: completedTasks.length * 50,
          totalTasksCompleted: completedTasks.length,
          collaborativeActivities: Math.floor(completedTasks.length / 2),
          streakDays: 5, // Could be calculated from actual data
        }
      };
    },
    getBadges: async () => {
      const tasks = await localDB.getFamilyData('tasks');
      const completedTasks = tasks.filter((task: any) => task.status === 'complete');
      
      const badges = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Complete your first task',
          category: 'Task Completion',
          pointsAwarded: 50,
          unlocked: completedTasks.length >= 1,
        },
        {
          id: '2', 
          title: 'Team Player',
          description: 'Complete 5 tasks',
          category: 'Task Completion',
          pointsAwarded: 100,
          unlocked: completedTasks.length >= 5,
        },
        {
          id: '3',
          title: 'Family Organizer',
          description: 'Complete 10 tasks',
          category: 'Task Completion', 
          pointsAwarded: 200,
          unlocked: completedTasks.length >= 10,
        },
        {
          id: '4',
          title: 'Consistency Champion',
          description: 'Use the app for 7 consecutive days',
          category: 'Consistency',
          pointsAwarded: 150,
          unlocked: false, // Would need date tracking
        },
        {
          id: '5',
          title: 'Family Collaboration',
          description: 'Work together on family tasks',
          category: 'Collaboration',
          pointsAwarded: 100,
          unlocked: completedTasks.length >= 3,
        },
      ];
      
      return { data: badges };
    },
  },

  // Authentication API
  auth: {
    login: async (username: string, password: string) => {
      const user = await localDB.loginUser(username, password);
      return { data: { user, token: 'offline_token' } };
    },
    register: async (username: string, password: string) => {
      const user = await localDB.createUser({ username, password });
      return { data: { user, token: 'offline_token' } };
    },
    me: async () => {
      const user = await localDB.getCurrentUser();
      return { data: { user } };
    },
    logout: async () => {
      await localDB.logoutUser();
      return { data: { success: true } };
    },
  },
};

// Family sharing utilities
export const familySharing = {
  generateInvite: async () => {
    const inviteCode = await localDB.shareFamilyInvite();
    return { inviteCode };
  },
  
  joinFamily: async (inviteCode: string) => {
    const success = await localDB.joinFamily(inviteCode);
    return { success };
  },
  
  exportData: async () => {
    const exportData = await localDB.exportFamilyData();
    return { exportData };
  },
  
  importData: async (importJson: string) => {
    const success = await localDB.importFamilyData(importJson);
    return { success };
  },
};