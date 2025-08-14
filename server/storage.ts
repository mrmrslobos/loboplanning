import { 
  type User, type InsertUser, type Family, type InsertFamily,
  type Task, type InsertTask, type List, type InsertList,
  type ListItem, type InsertListItem, type CalendarEvent, type InsertCalendarEvent,
  type BudgetCategory, type InsertBudgetCategory, type BudgetTransaction, type InsertBudgetTransaction,
  type ChatMessage, type InsertChatMessage, type DevotionalPost, type InsertDevotionalPost,
  type DevotionalComment, type InsertDevotionalComment, type Event, type InsertEvent,
  type EventGuest, type InsertEventGuest, type EventTask, type InsertEventTask,
  type EventBudget, type InsertEventBudget, type MealieSettings, type InsertMealieSettings,
  type Recipe, type InsertRecipe, type MealPlan, type InsertMealPlan,
  users, families, tasks, lists, listItems, calendarEvents, 
  budgetCategories, budgetTransactions, chatMessages, devotionalPosts, 
  devotionalComments, events, eventGuests, eventTasks, eventBudget, mealieSettings,
  recipes, mealPlans
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

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
  
  // Event task methods
  getEventTasks(eventId: string): Promise<EventTask[]>;
  createEventTask(task: InsertEventTask): Promise<EventTask>;
  updateEventTask(id: string, task: Partial<EventTask>): Promise<EventTask | undefined>;
  deleteEventTask(id: string): Promise<boolean>;
  
  // Event budget methods
  getEventBudget(eventId: string): Promise<EventBudget[]>;
  createEventBudget(budget: InsertEventBudget): Promise<EventBudget>;
  updateEventBudget(id: string, budget: Partial<EventBudget>): Promise<EventBudget | undefined>;
  
  // Recipe methods
  getRecipes(userId: string, familyId?: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, recipe: Partial<Recipe>, userId: string): Promise<Recipe | undefined>;
  deleteRecipe(id: string, userId: string): Promise<boolean>;
  
  // Meal plan methods
  getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: string, mealPlan: Partial<MealPlan>, userId: string): Promise<MealPlan | undefined>;
  deleteMealPlan(id: string, userId: string): Promise<boolean>;

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
  private eventTasks: Map<string, EventTask> = new Map();
  private eventBudget: Map<string, EventBudget> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private mealPlans: Map<string, MealPlan> = new Map();
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

  // Event task methods
  async getEventTasks(eventId: string): Promise<EventTask[]> {
    return Array.from(this.eventTasks.values()).filter(task => task.eventId === eventId);
  }

  async createEventTask(insertTask: InsertEventTask): Promise<EventTask> {
    const id = randomUUID();
    const task: EventTask = { 
      ...insertTask, 
      id, 
      createdAt: new Date() 
    };
    this.eventTasks.set(id, task);
    return task;
  }

  async updateEventTask(id: string, taskData: Partial<EventTask>): Promise<EventTask | undefined> {
    const task = this.eventTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.eventTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteEventTask(id: string): Promise<boolean> {
    return this.eventTasks.delete(id);
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



export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const passwordHash = await bcrypt.hash(insertUser.passwordHash, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, passwordHash })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Family methods
  async getFamily(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }

  async getFamilyByInviteCode(inviteCode: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.inviteCode, inviteCode));
    return family || undefined;
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const inviteCode = generateInviteCode();
    const [family] = await db
      .insert(families)
      .values({ ...insertFamily, inviteCode })
      .returning();
    return family;
  }

  async getFamilyMembers(familyId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.familyId, familyId));
  }

  // Task methods
  async getTasks(userId: string, familyId?: string): Promise<Task[]> {
    if (familyId) {
      return await db.select().from(tasks).where(
        or(eq(tasks.userId, userId), eq(tasks.familyId, familyId))
      );
    }
    return await db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // List methods
  async getLists(userId: string, familyId?: string): Promise<List[]> {
    if (familyId) {
      return await db.select().from(lists).where(
        or(eq(lists.userId, userId), eq(lists.familyId, familyId))
      );
    }
    return await db.select().from(lists).where(eq(lists.userId, userId));
  }

  async getList(id: string): Promise<List | undefined> {
    const [list] = await db.select().from(lists).where(eq(lists.id, id));
    return list || undefined;
  }

  async createList(insertList: InsertList): Promise<List> {
    const [list] = await db
      .insert(lists)
      .values(insertList)
      .returning();
    return list;
  }

  async updateList(id: string, listData: Partial<List>): Promise<List | undefined> {
    const [list] = await db
      .update(lists)
      .set(listData)
      .where(eq(lists.id, id))
      .returning();
    return list || undefined;
  }

  async deleteList(id: string): Promise<boolean> {
    const result = await db.delete(lists).where(eq(lists.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // List item methods
  async getListItems(listId: string): Promise<ListItem[]> {
    return await db.select().from(listItems).where(eq(listItems.listId, listId));
  }

  async createListItem(insertItem: InsertListItem): Promise<ListItem> {
    const [item] = await db
      .insert(listItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateListItem(id: string, itemData: Partial<ListItem>): Promise<ListItem | undefined> {
    const [item] = await db
      .update(listItems)
      .set(itemData)
      .where(eq(listItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteListItem(id: string): Promise<boolean> {
    const result = await db.delete(listItems).where(eq(listItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Calendar event methods
  async getCalendarEvents(userId: string, familyId?: string): Promise<CalendarEvent[]> {
    if (familyId) {
      return await db.select().from(calendarEvents).where(
        or(eq(calendarEvents.userId, userId), eq(calendarEvents.familyId, familyId))
      );
    }
    return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db
      .insert(calendarEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateCalendarEvent(id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .update(calendarEvents)
      .set(eventData)
      .where(eq(calendarEvents.id, id))
      .returning();
    return event || undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Budget methods
  async getBudgetCategories(userId: string, familyId?: string): Promise<BudgetCategory[]> {
    if (familyId) {
      return await db.select().from(budgetCategories).where(
        or(eq(budgetCategories.userId, userId), eq(budgetCategories.familyId, familyId))
      );
    }
    return await db.select().from(budgetCategories).where(eq(budgetCategories.userId, userId));
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const [category] = await db
      .insert(budgetCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateBudgetCategory(id: string, categoryData: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    const [category] = await db
      .update(budgetCategories)
      .set(categoryData)
      .where(eq(budgetCategories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    const result = await db.delete(budgetCategories).where(eq(budgetCategories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getBudgetTransactions(userId: string, familyId?: string): Promise<BudgetTransaction[]> {
    if (familyId) {
      return await db.select().from(budgetTransactions).where(
        or(eq(budgetTransactions.userId, userId), eq(budgetTransactions.familyId, familyId))
      );
    }
    return await db.select().from(budgetTransactions).where(eq(budgetTransactions.userId, userId));
  }

  async createBudgetTransaction(insertTransaction: InsertBudgetTransaction): Promise<BudgetTransaction> {
    const [transaction] = await db
      .insert(budgetTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateBudgetTransaction(id: string, transactionData: Partial<BudgetTransaction>): Promise<BudgetTransaction | undefined> {
    const [transaction] = await db
      .update(budgetTransactions)
      .set(transactionData)
      .where(eq(budgetTransactions.id, id))
      .returning();
    return transaction || undefined;
  }

  async deleteBudgetTransaction(id: string): Promise<boolean> {
    const result = await db.delete(budgetTransactions).where(eq(budgetTransactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Chat methods
  async getChatMessages(familyId: string, limit = 50): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.familyId, familyId))
      .orderBy(chatMessages.createdAt)
      .limit(limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Devotional methods
  async getDevotionalPosts(userId: string, familyId?: string): Promise<DevotionalPost[]> {
    if (familyId) {
      return await db.select().from(devotionalPosts).where(
        or(eq(devotionalPosts.userId, userId), eq(devotionalPosts.familyId, familyId))
      );
    }
    return await db.select().from(devotionalPosts).where(eq(devotionalPosts.userId, userId));
  }

  async createDevotionalPost(insertPost: InsertDevotionalPost): Promise<DevotionalPost> {
    const [post] = await db
      .insert(devotionalPosts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updateDevotionalPost(id: string, postData: Partial<DevotionalPost>): Promise<DevotionalPost | undefined> {
    const [post] = await db
      .update(devotionalPosts)
      .set(postData)
      .where(eq(devotionalPosts.id, id))
      .returning();
    return post || undefined;
  }

  async deleteDevotionalPost(id: string): Promise<boolean> {
    const result = await db.delete(devotionalPosts).where(eq(devotionalPosts.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDevotionalComments(postId: string): Promise<DevotionalComment[]> {
    return await db.select().from(devotionalComments).where(eq(devotionalComments.postId, postId));
  }

  async createDevotionalComment(insertComment: InsertDevotionalComment): Promise<DevotionalComment> {
    const [comment] = await db
      .insert(devotionalComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // Event methods
  async getEvents(userId: string, familyId?: string): Promise<Event[]> {
    if (familyId) {
      return await db.select().from(events).where(
        or(eq(events.userId, userId), eq(events.familyId, familyId))
      );
    }
    return await db.select().from(events).where(eq(events.userId, userId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event task methods
  async getEventTasks(eventId: string): Promise<EventTask[]> {
    return await db.select().from(eventTasks).where(eq(eventTasks.eventId, eventId));
  }

  async createEventTask(insertTask: InsertEventTask): Promise<EventTask> {
    const [task] = await db
      .insert(eventTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateEventTask(id: string, taskData: Partial<EventTask>): Promise<EventTask | undefined> {
    const [task] = await db
      .update(eventTasks)
      .set(taskData)
      .where(eq(eventTasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteEventTask(id: string): Promise<boolean> {
    const result = await db.delete(eventTasks).where(eq(eventTasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event guest methods
  async getEventGuests(eventId: string): Promise<EventGuest[]> {
    return await db.select().from(eventGuests).where(eq(eventGuests.eventId, eventId));
  }

  async createEventGuest(insertGuest: InsertEventGuest): Promise<EventGuest> {
    const [guest] = await db
      .insert(eventGuests)
      .values(insertGuest)
      .returning();
    return guest;
  }

  async updateEventGuest(id: string, guestData: Partial<EventGuest>): Promise<EventGuest | undefined> {
    const [guest] = await db
      .update(eventGuests)
      .set(guestData)
      .where(eq(eventGuests.id, id))
      .returning();
    return guest || undefined;
  }

  // Event task methods
  async getEventTasks(eventId: string): Promise<EventTask[]> {
    return await db.select().from(eventTasks).where(eq(eventTasks.eventId, eventId));
  }

  async createEventTask(insertTask: InsertEventTask): Promise<EventTask> {
    const [task] = await db
      .insert(eventTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateEventTask(id: string, taskData: Partial<EventTask>): Promise<EventTask | undefined> {
    const [task] = await db
      .update(eventTasks)
      .set(taskData)
      .where(eq(eventTasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteEventTask(id: string): Promise<boolean> {
    const result = await db.delete(eventTasks).where(eq(eventTasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Event budget methods
  async getEventBudget(eventId: string): Promise<EventBudget[]> {
    return await db.select().from(eventBudget).where(eq(eventBudget.eventId, eventId));
  }

  async createEventBudget(insertBudget: InsertEventBudget): Promise<EventBudget> {
    const [budget] = await db
      .insert(eventBudget)
      .values(insertBudget)
      .returning();
    return budget;
  }

  async updateEventBudget(id: string, budgetData: Partial<EventBudget>): Promise<EventBudget | undefined> {
    const [budget] = await db
      .update(eventBudget)
      .set(budgetData)
      .where(eq(eventBudget.id, id))
      .returning();
    return budget || undefined;
  }

  // Recipe methods
  async getRecipes(userId: string, familyId?: string): Promise<Recipe[]> {
    if (familyId) {
      return await db.select().from(recipes).where(
        or(eq(recipes.userId, userId), eq(recipes.familyId, familyId))
      );
    }
    return await db.select().from(recipes).where(eq(recipes.userId, userId));
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db
      .insert(recipes)
      .values(insertRecipe)
      .returning();
    return recipe;
  }

  async updateRecipe(id: string, recipeData: Partial<Recipe>, userId: string): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set(recipeData)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return recipe || undefined;
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Meal plan methods
  async getMealPlans(userId: string, familyId?: string): Promise<MealPlan[]> {
    if (familyId) {
      return await db.select().from(mealPlans).where(
        or(eq(mealPlans.userId, userId), eq(mealPlans.familyId, familyId))
      );
    }
    return await db.select().from(mealPlans).where(eq(mealPlans.userId, userId));
  }

  async createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan> {
    const [mealPlan] = await db
      .insert(mealPlans)
      .values(insertMealPlan)
      .returning();
    return mealPlan;
  }

  async updateMealPlan(id: string, mealPlanData: Partial<MealPlan>, userId: string): Promise<MealPlan | undefined> {
    const [mealPlan] = await db
      .update(mealPlans)
      .set(mealPlanData)
      .where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)))
      .returning();
    return mealPlan || undefined;
  }

  async deleteMealPlan(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(mealPlans).where(and(eq(mealPlans.id, id), eq(mealPlans.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Mealie settings methods
  async getMealieSettings(userId: string): Promise<MealieSettings | undefined> {
    const [settings] = await db.select().from(mealieSettings).where(eq(mealieSettings.userId, userId));
    return settings || undefined;
  }

  async createMealieSettings(insertSettings: InsertMealieSettings): Promise<MealieSettings> {
    const [settings] = await db
      .insert(mealieSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateMealieSettings(userId: string, settingsData: Partial<MealieSettings>): Promise<MealieSettings | undefined> {
    const [settings] = await db
      .update(mealieSettings)
      .set(settingsData)
      .where(eq(mealieSettings.userId, userId))
      .returning();
    return settings || undefined;
  }
}

export const storage = new DatabaseStorage();
