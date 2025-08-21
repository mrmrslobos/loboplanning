// API Service for LoboHub Mobile App
// Connects to the same Express.js backend as the web app

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth Methods
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async register(name, email, password) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async me() {
    return this.request('/api/auth/me');
  }

  async logout() {
    this.token = null;
    return { success: true };
  }

  // Family Methods
  async createFamily(name) {
    return this.request('/api/families', {
      method: 'POST',
      body: { name },
    });
  }

  async joinFamily(inviteCode) {
    return this.request('/api/families/join', {
      method: 'POST',
      body: { inviteCode },
    });
  }

  async getFamilyMembers(familyId) {
    return this.request(`/api/families/${familyId}/members`);
  }

  // Task Methods
  async getTasks() {
    return this.request('/api/tasks');
  }

  async createTask(task) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: task,
    });
  }

  async updateTask(id, updates) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // List Methods
  async getLists() {
    return this.request('/api/lists');
  }

  async createList(list) {
    return this.request('/api/lists', {
      method: 'POST',
      body: list,
    });
  }

  async updateList(id, updates) {
    return this.request(`/api/lists/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteList(id) {
    return this.request(`/api/lists/${id}`, {
      method: 'DELETE',
    });
  }

  async getListItems(listId) {
    return this.request(`/api/lists/${listId}/items`);
  }

  async addListItem(listId, item) {
    return this.request(`/api/lists/${listId}/items`, {
      method: 'POST',
      body: item,
    });
  }

  async updateListItem(listId, itemId, updates) {
    return this.request(`/api/lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteListItem(listId, itemId) {
    return this.request(`/api/lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Budget Methods
  async getBudgetCategories() {
    return this.request('/api/budget/categories');
  }

  async createBudgetCategory(category) {
    return this.request('/api/budget/categories', {
      method: 'POST',
      body: category,
    });
  }

  async getBudgetTransactions() {
    return this.request('/api/budget/transactions');
  }

  async createBudgetTransaction(transaction) {
    return this.request('/api/budget/transactions', {
      method: 'POST',
      body: transaction,
    });
  }

  async updateBudgetTransaction(id, updates) {
    return this.request(`/api/budget/transactions/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteBudgetTransaction(id) {
    return this.request(`/api/budget/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Calendar Methods
  async getCalendarEvents() {
    return this.request('/api/calendar/events');
  }

  async createCalendarEvent(event) {
    return this.request('/api/calendar/events', {
      method: 'POST',
      body: event,
    });
  }

  async updateCalendarEvent(id, updates) {
    return this.request(`/api/calendar/events/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteCalendarEvent(id) {
    return this.request(`/api/calendar/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Chat Methods
  async getChatMessages() {
    return this.request('/api/chat/messages');
  }

  async sendChatMessage(message) {
    return this.request('/api/chat/messages', {
      method: 'POST',
      body: message,
    });
  }

  // Event Management Methods
  async getEvents() {
    return this.request('/api/events');
  }

  async createEvent(event) {
    return this.request('/api/events', {
      method: 'POST',
      body: event,
    });
  }

  async updateEvent(id, updates) {
    return this.request(`/api/events/${id}`, {
      method: 'PATCH',
      body: updates,
    });
  }

  async deleteEvent(id) {
    return this.request(`/api/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Meal Planning Methods
  async getRecipes() {
    return this.request('/api/meal-planning/recipes');
  }

  async createRecipe(recipe) {
    return this.request('/api/meal-planning/recipes', {
      method: 'POST',
      body: recipe,
    });
  }

  async getMealPlans() {
    return this.request('/api/meal-planning/plans');
  }

  async createMealPlan(plan) {
    return this.request('/api/meal-planning/plans', {
      method: 'POST',
      body: plan,
    });
  }

  // Devotional Methods
  async getDevotionalPosts() {
    return this.request('/api/devotional/posts');
  }

  async createDevotionalPost(post) {
    return this.request('/api/devotional/posts', {
      method: 'POST',
      body: post,
    });
  }

  // Achievement Methods
  async getAchievementBadges() {
    return this.request('/api/achievements/badges');
  }

  async getFamilyLevel() {
    return this.request('/api/achievements/family-level');
  }

  async getFamilyAchievements() {
    return this.request('/api/achievements/family-achievements');
  }

  // AI Assistant Methods
  async getTaskRecommendations() {
    return this.request('/api/ai/task-recommendations');
  }

  async getProductivityInsights() {
    return this.request('/api/ai/productivity-insights');
  }

  async generateMealPlan(preferences) {
    return this.request('/api/ai/meal-plan', {
      method: 'POST',
      body: preferences,
    });
  }

  async generateDevotional(type, preferences) {
    return this.request('/api/ai/devotional', {
      method: 'POST',
      body: { type, preferences },
    });
  }

  async getBudgetInsights() {
    return this.request('/api/ai/budget-insights');
  }

  async getCalendarInsights() {
    return this.request('/api/ai/calendar-insights');
  }
}

export const apiClient = new ApiClient();
export default apiClient;