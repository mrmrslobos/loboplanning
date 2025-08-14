import { 
  type User, type InsertUser, type Family, type InsertFamily,
  type Task, type InsertTask, type List, type InsertList,
  type ListItem, type InsertListItem, type CalendarEvent, type InsertCalendarEvent,
  type BudgetCategory, type InsertBudgetCategory, type BudgetTransaction, type InsertBudgetTransaction,
  type ChatMessage, type InsertChatMessage, type DevotionalPost, type InsertDevotionalPost,
  type DevotionalComment, type InsertDevotionalComment, type Event, type InsertEvent,
  type EventGuest, type InsertEventGuest, type EventChecklist, type InsertEventChecklist,
  type EventBudget, type InsertEventBudget, type MealieSettings, type InsertMealieSettings
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

function generateInviteCode(): string {
  const adjectives = ["BLUE", "RED", "GREEN", "GOLDEN", "SILVER", "PURPLE", "ORANGE", "PINK"];
  const nouns = ["OCEAN", "MOUNTAIN", "FOREST", "RIVER", "VALLEY", "CLOUD", "STAR", "MOON"];
  const number = Math.floor(Math.random() * 100);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}-${noun}-${number.toString().padStart(2, '0')}`;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Family methods
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined>;
  createFamily(family: InsertFamily): Promise<Family>;
  getFamilyMembers(familyId: string): Promise<User[]>;
  
  // Task methods
  getTasks(userId: string, familyId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // List methods
  getLists(userId: string, familyId?: string): Promise<List[]>;
  getList(id: string): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  updateList(id: string, list: Partial<List>): Promise<List | undefined>;
  deleteList(id: string): Promise<boolean>;
  
  // List item methods
  getListItems(listId: string): Promise<ListItem[]>;
  createListItem(item: InsertListItem): Promise<ListItem>;
  updateListItem(id: string, item: Partial<ListItem>): Promise<ListItem | undefined>;
  deleteListItem(id: string): Promise<boolean>;
  
  // Calendar event methods
  getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
  
  // Budget methods
  getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, category: Partial<BudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<boolean>;
  
  getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]>;
  createBudgetTransaction(transaction: InsertBudgetTransaction): Promise<BudgetTransaction>;
  updateBudgetTransaction(id: string, transaction: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined>;
  deleteBudgetTransaction(id: string): Promise<boolean>;
  
  // Chat methods
  getChatMessages(familyId: string, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Devotional methods
  getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]>;
  createDevotionalPost(post: InsertDevotionalPost): Promise<DevotionalPost>;
  updateDevotionalPost(id: string, post: Partial<DevotionalPost>): Promise<DevotionalPost | undefined>;
  deleteDevotionalPost(id: string): Promise<boolean>;
  
  getDevotionalComments(postId: string): Promise<DevotionalComment[]>;
  createDevotionalComment(comment: InsertDevotionalComment): Promise<DevotionalComment>;
  
  // Event methods
  getEvents(userId: string, familyId?: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Event guest methods
  getEventGuests(eventId: string): Promise<EventGuest[]>;
  createEventGuest(guest: InsertEventGuest): Promise<EventGuest>;
  updateEventGuest(id: string, guest: Partial<EventGuest>): Promise<EventGuest | undefined>;
  
  // Event checklist methods
  getEventChecklists(eventId: string): Promise<EventChecklist[]>;
  createEventChecklist(checklist: InsertEventChecklist): Promise<EventChecklist>;
  updateEventChecklist(id: string, checklist: Partial<EventChecklist>): Promise<EventChecklist | undefined>;
  
  // Event budget methods
  getEventBudget(eventId: string): Promise<EventBudget[]>;
  createEventBudget(budget: InsertEventBudget): Promise<EventBudget>;
  updateEventBudget(id: string, budget: Partial<EventBudget>): Promise<EventBudget | undefined>;
  
  // Mealie settings methods
  getMealieSettings(userId: string): Promise<MealieSettings | undefined>;
  createMealieSettings(settings: InsertMealieSettings): Promise<MealieSettings>;
  updateMealieSettings(userId: string, settings: Partial<MealieSettings>): Promise<MealieSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private families: Map<string, Family> = new Map();
  private tasks: Map<string, Task> = new Map();
  private lists: Map<string, List> = new Map();
  private listItems: Map<string, ListItem> = new Map();
  private calendarEvents: Map<string, CalendarEvent> = new Map();
  private budgetCategories: Map<string, BudgetCategory> = new Map();
  private budgetTransactions: Map<string, BudgetTransaction> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private devotionalPosts: Map<string, DevotionalPost> = new Map();
  private devotionalComments: Map<string, DevotionalComment> = new Map();
  private events: Map<string, Event> = new Map();
  private eventGuests: Map<string, EventGuest> = new Map();
  private eventChecklists: Map<string, EventChecklist> = new Map();
  private eventBudget: Map<string, EventBudget> = new Map();
  private mealieSettings: Map<string, MealieSettings> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(insertUser.passwordHash, 10);
    const user: User = { 
      ...insertUser, 
      id, 
      passwordHash,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Family methods
  async getFamily(id: string): Promise<Family | undefined> {
    return this.families.get(id);
  }

  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    return Array.from(this.families.values()).find(family => family.inviteCode === inviteCode);
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const id = randomUUID();
    const inviteCode = generateInviteCode();
    const family: Family = { 
      ...insertFamily, 
      id, 
      inviteCode,
      createdAt: new Date() 
    };
    this.families.set(id, family);
    return family;
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.familyId === familyId);
  }

  // Task methods
  async getTasks(userId: string, familyId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.userId === userId || (familyId && task.familyId === familyId)
    );
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date() 
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // List methods
  async getLists(userId: string, familyId?: string): Promise<List[]> {
    return Array.from(this.lists.values()).filter(list => 
      list.userId === userId || (familyId && list.familyId === familyId)
    );
  }

  async getList(id: string): Promise<List | undefined> {
    return this.lists.get(id);
  }

  async createList(insertList: InsertList): Promise<List> {
    const id = randomUUID();
    const list: List = { 
      ...insertList, 
      id, 
      createdAt: new Date() 
    };
    this.lists.set(id, list);
    return list;
  }

  async updateList(id: string, listData: Partial<List>): Promise<List | undefined> {
    const list = this.lists.get(id);
    if (!list) return undefined;
    
    const updatedList = { ...list, ...listData };
    this.lists.set(id, updatedList);
    return updatedList;
  }

  async deleteList(id: string): Promise<boolean> {
    return this.lists.delete(id);
  }

  // List item methods
  async getListItems(listId: string): Promise<ListItem[]> {
    return Array.from(this.listItems.values()).filter(item => item.listId === listId);
  }

  async createListItem(insertItem: InsertListItem): Promise<ListItem> {
    const id = randomUUID();
    const item: ListItem = { 
      ...insertItem, 
      id, 
      createdAt: new Date() 
    };
    this.listItems.set(id, item);
    return item;
  }

  async updateListItem(id: string, itemData: Partial<ListItem>): Promise<ListItem | undefined> {
    const item = this.listItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.listItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteListItem(id: string): Promise<boolean> {
    return this.listItems.delete(id);
  }

  // Calendar event methods
  async getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).filter(event => 
      event.userId === userId || (familyId && event.familyId === familyId)
    );
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const event: CalendarEvent = { 
      ...insertEvent, 
      id, 
      createdAt: new Date() 
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const event = this.calendarEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  // Budget methods
  async getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values()).filter(category => 
      category.userId === userId || (familyId && category.familyId === familyId)
    );
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = randomUUID();
    const category: BudgetCategory = { 
      ...insertCategory, 
      id, 
      createdAt: new Date() 
    };
    this.budgetCategories.set(id, category);
    return category;
  }

  async updateBudgetCategory(id: string, categoryData: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    const category = this.budgetCategories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.budgetCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    return this.budgetCategories.delete(id);
  }

  async getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]> {
    return Array.from(this.budgetTransactions.values()).filter(transaction => 
      transaction.userId === userId || (familyId && transaction.familyId === familyId)
    );
  }

  async createBudgetTransaction(insertTransaction: InsertBudgetTransaction): Promise<BudgetTransaction> {
    const id = randomUUID();
    const transaction: BudgetTransaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date() 
    };
    this.budgetTransactions.set(id, transaction);
    return transaction;
  }

  async updateBudgetTransaction(id: string, transactionData: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined> {
    const transaction = this.budgetTransactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionData };
    this.budgetTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteBudgetTransaction(id: string): Promise<boolean> {
    return this.budgetTransactions.delete(id);
  }

  // Chat methods
  async getChatMessages(familyId: string, limit = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.familyId === familyId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0))
      .slice(-limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.chatMessages.set(id, message);
    return message;
  }

  // Devotional methods
  async getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]> {
    return Array.from(this.devotionalPosts.values()).filter(post => 
      post.userId === userId || (familyId && post.familyId === familyId)
    );
  }

  async createDevotionalPost(insertPost: InsertDevotionalPost): Promise<DevotionalPost> {
    const id = randomUUID();
    const post: DevotionalPost = { 
      ...insertPost, 
      id, 
      createdAt: new Date() 
    };
    this.devotionalPosts.set(id, post);
    return post;
  }

  async updateDevotionalPost(id: string, postData: Partial<DevotionalPost>): Promise<DevotionalPost | undefined> {
    const post = this.devotionalPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...postData };
    this.devotionalPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteDevotionalPost(id: string): Promise<boolean> {
    return this.devotionalPosts.delete(id);
  }

  async getDevotionalComments(postId: string): Promise<DevotionalComment[]> {
    return Array.from(this.devotionalComments.values()).filter(comment => comment.postId === postId);
  }

  async createDevotionalComment(insertComment: InsertDevotionalComment): Promise<DevotionalComment> {
    const id = randomUUID();
    const comment: DevotionalComment = { 
      ...insertComment, 
      id, 
      createdAt: new Date() 
    };
    this.devotionalComments.set(id, comment);
    return comment;
  }

  // Event methods
  async getEvents(userId: string, familyId?: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => 
      event.userId === userId || (familyId && event.familyId === familyId)
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { 
      ...insertEvent, 
      id, 
      createdAt: new Date() 
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Event guest methods
  async getEventGuests(eventId: string): Promise<EventGuest[]> {
    return Array.from(this.eventGuests.values()).filter(guest => guest.eventId === eventId);
  }

  async createEventGuest(insertGuest: InsertEventGuest): Promise<EventGuest> {
    const id = randomUUID();
    const guest: EventGuest = { 
      ...insertGuest, 
      id, 
      createdAt: new Date() 
    };
    this.eventGuests.set(id, guest);
    return guest;
  }

  async updateEventGuest(id: string, guestData: Partial<EventGuest>): Promise<EventGuest | undefined> {
    const guest = this.eventGuests.get(id);
    if (!guest) return undefined;
    
    const updatedGuest = { ...guest, ...guestData };
    this.eventGuests.set(id, updatedGuest);
    return updatedGuest;
  }

  // Event checklist methods
  async getEventChecklists(eventId: string): Promise<EventChecklist[]> {
    return Array.from(this.eventChecklists.values()).filter(checklist => checklist.eventId === eventId);
  }

  async createEventChecklist(insertChecklist: InsertEventChecklist): Promise<EventChecklist> {
    const id = randomUUID();
    const checklist: EventChecklist = { 
      ...insertChecklist, 
      id, 
      createdAt: new Date() 
    };
    this.eventChecklists.set(id, checklist);
    return checklist;
  }

  async updateEventChecklist(id: string, checklistData: Partial<EventChecklist>): Promise<EventChecklist | undefined> {
    const checklist = this.eventChecklists.get(id);
    if (!checklist) return undefined;
    
    const updatedChecklist = { ...checklist, ...checklistData };
    this.eventChecklists.set(id, updatedChecklist);
    return updatedChecklist;
  }

  // Event budget methods
  async getEventBudget(eventId: string): Promise<EventBudget[]> {
    return Array.from(this.eventBudget.values()).filter(budget => budget.eventId === eventId);
  }

  async createEventBudget(insertBudget: InsertEventBudget): Promise<EventBudget> {
    const id = randomUUID();
    const budget: EventBudget = { 
      ...insertBudget, 
      id, 
      createdAt: new Date() 
    };
    this.eventBudget.set(id, budget);
    return budget;
  }

  async updateEventBudget(id: string, budgetData: Partial<EventBudget>): Promise<EventBudget | undefined> {
    const budget = this.eventBudget.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { ...budget, ...budgetData };
    this.eventBudget.set(id, updatedBudget);
    return updatedBudget;
  }

  // Mealie settings methods
  async getMealieSettings(userId: string): Promise<MealieSettings | undefined> {
    return Array.from(this.mealieSettings.values()).find(settings => settings.userId === userId);
  }

  async createMealieSettings(insertSettings: InsertMealieSettings): Promise<MealieSettings> {
    const id = randomUUID();
    const settings: MealieSettings = { 
      ...insertSettings, 
      id, 
      createdAt: new Date() 
    };
    this.mealieSettings.set(id, settings);
    return settings;
  }

  async updateMealieSettings(userId: string, settingsData: Partial<MealieSettings>): Promise<MealieSettings | undefined> {
    const settings = Array.from(this.mealieSettings.values()).find(s => s.userId === userId);
    if (!settings) return undefined;
    
    const updatedSettings = { ...settings, ...settingsData };
    this.mealieSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
