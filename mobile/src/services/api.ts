// Offline API - uses local storage instead of server calls
import { offlineApiClient } from './offlineApi';

// API service functions - now using offline storage
export const tasksApi = {
  getAll: () => offlineApiClient.tasks.getAll(),
  create: (task: any) => offlineApiClient.tasks.create(task),
  update: (id: string, task: any) => offlineApiClient.tasks.update(id, task),
  delete: (id: string) => offlineApiClient.tasks.delete(id),
};

export const listsApi = {
  getAll: () => offlineApiClient.lists.getAll(),
  create: (list: any) => offlineApiClient.lists.create(list),
  getItems: (listId: string) => offlineApiClient.lists.getItems(listId),
  addItem: (listId: string, item: any) => offlineApiClient.lists.addItem(listId, item),
  updateItem: (listId: string, itemId: string, item: any) => 
    offlineApiClient.lists.updateItem(listId, itemId, item),
  deleteItem: (listId: string, itemId: string) => 
    offlineApiClient.lists.deleteItem(listId, itemId),
};

export const budgetApi = {
  getCategories: () => offlineApiClient.budget.getCategories(),
  getTransactions: () => offlineApiClient.budget.getTransactions(),
  createTransaction: (transaction: any) => offlineApiClient.budget.createTransaction(transaction),
};

export const assistantApi = {
  sendMessage: (message: string) => offlineApiClient.assistant.sendMessage(message),
};