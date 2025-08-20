import axios from 'axios';

// Use your Replit app URL for production
const BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-replit-app-url.replit.app/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API service functions - same as web version
export const tasksApi = {
  getAll: () => apiClient.get('/tasks'),
  create: (task: any) => apiClient.post('/tasks', task),
  update: (id: string, task: any) => apiClient.patch(`/tasks/${id}`, task),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};

export const listsApi = {
  getAll: () => apiClient.get('/lists'),
  create: (list: any) => apiClient.post('/lists', list),
  getItems: (listId: string) => apiClient.get(`/lists/${listId}/items`),
  addItem: (listId: string, item: any) => apiClient.post(`/lists/${listId}/items`, item),
  updateItem: (listId: string, itemId: string, item: any) => 
    apiClient.patch(`/lists/${listId}/items/${itemId}`, item),
  deleteItem: (listId: string, itemId: string) => 
    apiClient.delete(`/lists/${listId}/items/${itemId}`),
};

export const budgetApi = {
  getCategories: () => apiClient.get('/budget/categories'),
  getTransactions: () => apiClient.get('/budget/transactions'),
  createTransaction: (transaction: any) => apiClient.post('/budget/transactions', transaction),
};

export const assistantApi = {
  sendMessage: (message: string) => apiClient.post('/assistant/chat', { message }),
};